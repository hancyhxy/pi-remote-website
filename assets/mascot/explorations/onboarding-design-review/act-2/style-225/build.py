"""Build the Act 2 stickers and local animation loops."""
from pathlib import Path
import math

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent
SOURCE = next(ROOT.glob('*/*.png'))
sheet = Image.open(SOURCE).convert('RGBA')


def clean(box, name):
    image = sheet.crop(box)
    pixels = np.array(image)
    solid = (pixels[:, :, 3] > 180).astype('uint8') * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    solid = cv2.morphologyEx(solid, cv2.MORPH_OPEN, kernel)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(solid)
    largest = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
    solid = (labels == largest).astype('uint8') * 255
    distance = cv2.distanceTransform(solid, cv2.DIST_L2, 5)
    pixels[(distance < 5), :3] = 255
    pixels[:, :, 3] = np.array(Image.fromarray(solid).filter(ImageFilter.GaussianBlur(.8)))
    image = Image.fromarray(pixels)
    image.save(ROOT / name)
    return image


person = clean((20, 0, 652, 1254), 'person.png')
dog = clean((665, 235, 1220, 818), 'dog.png')
# The card has a simple silhouette, so exclude all exterior source fragments.
card = sheet.crop((657, 838, 1229, 1200))
mask = Image.new('L', card.size)
ImageDraw.Draw(mask).rounded_rectangle((8, 8, 559, 352), radius=43, fill=255)
inner = Image.new('L', card.size)
ImageDraw.Draw(inner).rounded_rectangle((27, 27, 538, 328), radius=28, fill=255)
backing = Image.new('RGBA', card.size, (250, 248, 239, 255))
backing.paste(card, mask=inner.filter(ImageFilter.GaussianBlur(1)))
card = backing
card.putalpha(mask.filter(ImageFilter.GaussianBlur(.8)))
card.save(ROOT / 'session.png')


def save_loop(frames, name, duration):
    frames[0].save(ROOT / f'{name}.webp', save_all=True, append_images=frames[1:], duration=duration, loop=0, lossless=True)
    # Use one common palette for stable paper colours across all GIF frames.
    palette = frames[0].convert('RGB').quantize(colors=255)
    gifs = []
    for frame in frames:
        indexed = frame.convert('RGB').quantize(palette=palette, dither=Image.Dither.NONE)
        indexed.paste(255, mask=frame.getchannel('A').point(lambda a: 255 if a < 128 else 0))
        indexed.info['transparency'] = 255
        gifs.append(indexed)
    gifs[0].save(ROOT / f'{name}.gif', save_all=True, append_images=gifs[1:], duration=duration, loop=0, transparency=255, disposal=2, optimize=False)


# A local displacement affects only the raised tail, above its root.
rgba = np.array(dog).astype('float32') / 255
rgba[:, :, :3] *= rgba[:, :, 3:4]
y, x = np.mgrid[:dog.height, :dog.width].astype('float32')
weight = np.clip((275 - y) / 230, 0, 1) ** 1.5
weight *= np.clip((x - 390) / 35, 0, 1)
dog_frames = []
for i in range(24):
    shift = 13 * math.sin(2 * math.pi * i / 24)
    warped = cv2.remap(rgba, x - shift * weight, y, cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT)
    warped = np.clip(warped, 0, 1)
    warped[:, :, :3] /= np.maximum(warped[:, :, 3:4], .0001)
    dog_frames.append(Image.fromarray((np.clip(warped, 0, 1) * 255).astype('uint8')))
save_loop(dog_frames, 'dog-loop', 100)

# Replace the partial progress bar with an indeterminate moving paper segment.
card_frames = []
for i in range(30):
    frame = card.copy()
    draw = ImageDraw.Draw(frame)
    draw.rounded_rectangle((56, 260, 514, 298), radius=19, fill=(177, 196, 205, 255))
    left = 58 + round(316 * (.5 - .5 * math.cos(2 * math.pi * i / 30)))
    draw.rounded_rectangle((left, 263, left + 136, 295), radius=16, fill=(65, 135, 176, 255))
    card_frames.append(frame)
card_frames[0].save(ROOT / 'session.png')
save_loop(card_frames, 'session-loop', 100)
