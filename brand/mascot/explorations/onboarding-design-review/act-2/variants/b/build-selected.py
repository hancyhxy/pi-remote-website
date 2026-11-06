"""Build two paper run loops and replace the original stack's top card content."""
from pathlib import Path
import json
import math

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent


def save_loop(frames, name, duration):
    frames[0].save(ROOT / f'{name}.png')
    frames[0].save(ROOT / f'{name}.webp', save_all=True, append_images=frames[1:], duration=duration, loop=0, lossless=True)
    palette = frames[0].convert('RGB').quantize(colors=255)
    output = []
    for frame in frames:
        image = frame.convert('RGB').quantize(palette=palette, dither=Image.Dither.NONE)
        image.paste(255, mask=frame.getchannel('A').point(lambda a: 255 if a < 128 else 0))
        image.info['transparency'] = 255
        output.append(image)
    output[0].save(ROOT / f'{name}.gif', save_all=True, append_images=output[1:], duration=duration, loop=0, transparency=255, disposal=2, optimize=False)


for angle in ['front', 'three-quarter-gait-v2']:
    source = Image.open(next((ROOT / 'jack-russell-paper' / angle).glob('*/*.png'))).convert('RGBA')
    frames = []
    frames_dir = ROOT / 'paper-run-frames' / angle
    frames_dir.mkdir(parents=True, exist_ok=True)
    for i in range(24):
        x, y = i % 6, i // 6
        image = source.crop((round(x * source.width / 6), round(y * source.height / 4), round((x + 1) * source.width / 6), round((y + 1) * source.height / 4)))
        pixels = np.array(image)
        rgb = pixels[:, :, :3].astype(int)
        magenta = (rgb[:, :, 0] - rgb[:, :, 1] > 60) & (rgb[:, :, 2] - rgb[:, :, 1] > 60)
        solid = (~magenta & (pixels[:, :, 3] > 127)).astype('uint8') * 255
        solid = cv2.morphologyEx(solid, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
        _, labels, stats, _ = cv2.connectedComponentsWithStats(solid)
        solid = (labels == 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])).astype('uint8') * 255
        distance = cv2.distanceTransform(solid, cv2.DIST_L2, 5)
        pixels[distance < 2.2, :3] = (252, 249, 236)
        pixels[:, :, 3] = np.array(Image.fromarray(solid).filter(ImageFilter.GaussianBlur(.45)))
        image = Image.fromarray(pixels)
        image.save(frames_dir / f'{i + 1:02d}.png')
        frames.append(image)
    save_loop(frames, f'paper-run-{angle}', 80)

# The selected generated run is built separately by run-candidates/build.py.

# Keep the original curved silhouettes, card angles and all lower-card pixels.
assets = ROOT.parents[3]
original = Image.open(assets / 'story/stickers/225-clean/06-session-cards.png').convert('RGBA')
pixels = np.array(original)
remove = Image.new('L', original.size)
draw = ImageDraw.Draw(remove)
for polygon in [
    [(52, 74), (116, 66), (129, 136), (57, 148)],
    [(128, 65), (284, 44), (297, 122), (137, 145)],
    [(299, 27), (387, 16), (402, 100), (309, 134)],
]:
    draw.polygon(polygon, fill=255)
mask = np.array(remove)
# Inpainting removes only the three printed areas; the paper edge is unchanged.
patched = cv2.inpaint(pixels[:, :, :3], mask, 8, cv2.INPAINT_TELEA).astype('float32')
# Restore paper fibres in the cleared print areas, without a smooth fill patch.
patch = pixels[100:128, 247:295, :3].astype('float32')
fibres = patch - cv2.GaussianBlur(patch, (0, 0), 3)
tiled = np.tile(fibres, (math.ceil(original.height / patch.shape[0]), math.ceil(original.width / patch.shape[1]), 1))[:original.height, :original.width]
patched += tiled * (mask[:, :, None] / 255)
pixels[:, :, :3] = np.clip(patched, 0, 255).astype('uint8')
base = Image.fromarray(pixels)
base.save(ROOT / 'stack-blank-top.png')

# Fit the content to the existing top card instead of adding another rectangle.
quad = np.float32([[31, 58], [390, 6], [407, 126], [44, 168]])
projection = cv2.getPerspectiveTransform(np.float32([[0, 0], [380, 0], [380, 132], [0, 132]]), quad)
font = '/System/Library/Fonts/Menlo.ttc'
content = Image.new('RGBA', (380, 132))
draw = ImageDraw.Draw(content)
draw.text((110, 29), 'Update the homepage', font=ImageFont.truetype(font, 19), fill=(64, 66, 53, 255))
draw.text((110, 66), 'Working…', font=ImageFont.truetype(font, 25), fill=(64, 66, 53, 255))
geometry = json.loads((ROOT.parent / 'orb-frames.json').read_text())
stack_frames = []
for geometry_frame in geometry:
    frame = content.copy()
    orb = Image.new('RGBA', (120, 120))
    draw = ImageDraw.Draw(orb)
    for line in geometry_frame['lines']:
        draw.line((line['x1'], line['y1'], line['x2'], line['y2']), fill=(105, 95, 81, min(175, round(80 + line['a'] * 210))), width=2)
    for i, dot in enumerate(geometry_frame['dots']):
        radius = max(3.2, dot['r'] * 1.12)
        shade = round(53 + dot['white'] * 120)
        points = [(dot['x'] + math.cos(j / 9 * math.tau) * radius * (1 + .07 * math.sin(i + j * 7)), dot['y'] + math.sin(j / 9 * math.tau) * radius * (1 + .07 * math.sin(i + j * 7))) for j in range(9)]
        draw.polygon(points, fill=(shade + 9, shade + 4, shade, 255))
        draw.line((dot['x'] - 1, dot['y'], dot['x'] + 1, dot['y'] + 1), fill=(shade + 30, shade + 23, shade + 15, 210), width=1)
    frame.alpha_composite(orb.resize((88, 88), Image.Resampling.LANCZOS), (16, 23))
    rgba = np.array(frame).astype('float32') / 255
    rgba[:, :, :3] *= rgba[:, :, 3:4]
    warped = cv2.warpPerspective(rgba, projection, original.size, flags=cv2.INTER_CUBIC)
    warped = np.clip(warped, 0, 1)
    warped[:, :, :3] /= np.maximum(warped[:, :, 3:4], .0001)
    overlay = Image.fromarray((np.clip(warped, 0, 1) * 255).astype('uint8'))
    stack = base.copy()
    stack.alpha_composite(overlay)
    stack_frames.append(stack)
save_loop(stack_frames, 'session-stack-top', 100)
