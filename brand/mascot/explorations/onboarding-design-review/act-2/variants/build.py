"""Build both frontal compositions and their shared paper orb card."""
from pathlib import Path
import json
import math

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent


def save_loop(frames, folder, name, duration):
    frames[0].save(folder / f'{name}.png')
    frames[0].save(folder / f'{name}.webp', save_all=True, append_images=frames[1:], duration=duration, loop=0, lossless=True)
    palette = frames[0].convert('RGB').quantize(colors=255)
    gifs = []
    for frame in frames:
        image = frame.convert('RGB').quantize(palette=palette, dither=Image.Dither.NONE)
        image.paste(255, mask=frame.getchannel('A').point(lambda a: 255 if a < 128 else 0))
        image.info['transparency'] = 255
        gifs.append(image)
    gifs[0].save(folder / f'{name}.gif', save_all=True, append_images=gifs[1:], duration=duration, loop=0, transparency=255, disposal=2, optimize=False)


def clean(image):
    pixels = np.array(image.convert('RGBA'))
    solid = (pixels[:, :, 3] > 160).astype('uint8') * 255
    solid = cv2.morphologyEx(solid, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    _, labels, stats, _ = cv2.connectedComponentsWithStats(solid)
    largest = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
    solid = (labels == largest).astype('uint8') * 255
    distance = cv2.distanceTransform(solid, cv2.DIST_L2, 5)
    pixels[distance < 5, :3] = (252, 250, 240)
    pixels[:, :, 3] = np.array(Image.fromarray(solid).filter(ImageFilter.GaussianBlur(.8)))
    image = Image.fromarray(pixels)
    box = image.getchannel('A').point(lambda a: 255 if a > 10 else 0).getbbox()
    image = image.crop(box)
    padded = Image.new('RGBA', (image.width + 40, image.height + 40))
    padded.alpha_composite(image, (20, 20))
    return padded


for variant in ['a', 'b']:
    folder = ROOT / variant
    source = Image.open(next(folder.glob('*/*.png')))
    if source.mode == 'RGB':
        rgb = np.array(source)
        grey = (np.ptp(rgb.astype(int), axis=2) < 14) & (rgb[:, :, 0] > 75) & (rgb[:, :, 0] < 230)
        _, labels, stats, _ = cv2.connectedComponentsWithStats(grey.astype('uint8'))
        backdrop = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
        source = source.convert('RGBA')
        source.putalpha(Image.fromarray(np.where(labels == backdrop, 0, 255).astype('uint8')))
    person = clean(source.crop((70, 0, 645, 1254)))
    dog = clean(source.crop((650, 630, 1235, 1245)))
    person.save(folder / 'person.png')
    dog.save(folder / 'dog.png')
    rgba = np.array(dog).astype('float32') / 255
    rgba[:, :, :3] *= rgba[:, :, 3:4]
    y, x = np.mgrid[:dog.height, :dog.width].astype('float32')
    if variant == 'a':
        # The raised tail is at the left of the right-facing dog.
        weight = np.clip((205 - y) / 165, 0, 1) ** 1.5 * np.clip((150 - x) / 35, 0, 1)
    else:
        # Keep the frontal dog's ears and face outside the moving region.
        boundary = 265 + np.clip(y - 110, 0, 120) * .5
        weight = np.clip((230 - y) / 200, 0, 1) ** 1.5 * np.clip((x - boundary) / 25, 0, 1)
    frames = []
    for i in range(30):
        shift = 13 * math.sin(i / 30 * math.pi * 2)
        warped = cv2.remap(rgba, x - shift * weight, y, cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT)
        warped = np.clip(warped, 0, 1)
        warped[:, :, :3] /= np.maximum(warped[:, :, 3:4], .0001)
        frames.append(Image.fromarray((np.clip(warped, 0, 1) * 255).astype('uint8')))
    save_loop(frames, folder, 'dog-loop', 100)

# Reuse the paper texture, but discard the earlier generic progress UI.
old = Image.open(ROOT.parent / 'style-225/session.png').convert('RGB')
texture = old.crop((430, 130, 520, 240))
card = Image.new('RGBA', (640, 280), (250, 248, 239, 255))
for y in range(0, 280, texture.height):
    for x in range(0, 640, texture.width):
        card.paste(texture, (x, y))
outer = Image.new('L', card.size)
ImageDraw.Draw(outer).rounded_rectangle((6, 6, 633, 273), radius=32, fill=255)
card.putalpha(outer.filter(ImageFilter.GaussianBlur(.8)))
# Keep a smooth ivory die-cut outline outside the textured paper.
outline = ImageDraw.Draw(card)
outline.rounded_rectangle((12, 12, 627, 267), radius=27, outline=(250, 248, 239, 255), width=10)
font = '/System/Library/Fonts/Menlo.ttc'
outline.text((38, 37), 'Update the homepage', font=ImageFont.truetype(font, 29), fill=(49, 45, 40, 255))
outline.text((201, 152), 'Working…', font=ImageFont.truetype(font, 36), fill=(49, 45, 40, 255))
geometry = json.loads((ROOT / 'orb-frames.json').read_text())
frames = []
# Paper nodes keep stable fibres as the product geometry moves.
rng = np.random.default_rng(225)
grains = rng.uniform(-1, 1, (120, 3))
for frame in geometry:
    image = card.copy()
    overlay = Image.new('RGBA', card.size)
    draw = ImageDraw.Draw(overlay)
    ox, oy = 47, 104
    for line in frame['lines']:
        draw.line((ox + line['x1'], oy + line['y1'], ox + line['x2'], oy + line['y2']), fill=(105, 95, 81, min(150, round(65 + line['a'] * 210))), width=2)
    for i, dot in enumerate(frame['dots']):
        x, y = ox + dot['x'], oy + dot['y']
        radius = max(3.2, dot['r'] * 1.12)
        shade = round(53 + dot['white'] * 120)
        points = [(x + math.cos(j / 9 * math.tau) * radius * (1 + .07 * math.sin(i + j * 7)), y + math.sin(j / 9 * math.tau) * radius * (1 + .07 * math.sin(i + j * 7))) for j in range(9)]
        draw.polygon(points, fill=(shade + 9, shade + 4, shade, 255))
        for gx, gy, tone in grains[i % len(grains):i % len(grains) + 3]:
            draw.line((x + gx * radius * .5, y + gy * radius * .5, x + gx * radius * .5 + 1, y + gy * radius * .5), fill=(min(230, shade + 38), min(226, shade + 32), min(220, shade + 23), 180), width=1)
    image.alpha_composite(overlay)
    frames.append(image)
save_loop(frames, ROOT, 'session-loop', 100)
