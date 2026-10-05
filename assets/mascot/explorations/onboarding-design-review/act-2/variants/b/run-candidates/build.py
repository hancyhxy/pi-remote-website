"""Build three generated GIF candidates with identical extraction and timing."""
from pathlib import Path
import json
import cv2
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent
metrics = {}
for name in ['c1', 'c2', 'c3']:
    folder = ROOT / name
    source = Image.open(next(folder.glob('*/*.png'))).convert('RGBA')
    assert source.size == (1536, 1024)
    (folder / 'frames').mkdir(exist_ok=True)
    frames = []
    for index in range(24):
        x, y = index % 6 * 256, index // 6 * 256
        image = source.crop((x, y, x + 256, y + 256))
        pixels = np.array(image)
        rgb = pixels[:, :, :3].astype(int)
        backdrop = (rgb[:, :, 0] - rgb[:, :, 1] > 60) & (rgb[:, :, 2] - rgb[:, :, 1] > 60)
        solid = (~backdrop & (pixels[:, :, 3] > 127)).astype('uint8') * 255
        solid = cv2.morphologyEx(solid, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
        _, labels, stats, _ = cv2.connectedComponentsWithStats(solid)
        solid = (labels == 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])).astype('uint8') * 255
        distance = cv2.distanceTransform(solid, cv2.DIST_L2, 5)
        pixels[distance < 2.2, :3] = (252, 249, 236)
        pixels[:, :, 3] = np.array(Image.fromarray(solid).filter(ImageFilter.GaussianBlur(.45)))
        image = Image.fromarray(pixels)
        image.save(folder / 'frames' / f'{index + 1:02d}.png')
        frames.append(image)
    frames[0].save(folder / 'still.png')
    frames[0].save(folder / 'run.webp', save_all=True, append_images=frames[1:], duration=80, loop=0, lossless=True)
    palette = frames[0].convert('RGB').quantize(colors=255)
    gifs = []
    for frame in frames:
        image = frame.convert('RGB').quantize(palette=palette, dither=Image.Dither.NONE)
        image.paste(255, mask=frame.getchannel('A').point(lambda a: 255 if a < 128 else 0))
        image.info['transparency'] = 255
        gifs.append(image)
    gifs[0].save(folder / 'run.gif', save_all=True, append_images=gifs[1:], duration=80, loop=0, transparency=255, disposal=2, optimize=False)
    masks = np.array([np.array(frame.getchannel('A')) > 127 for frame in frames])
    changes = np.mean(masks != np.roll(masks, 1, axis=0), axis=(1,2))
    metrics[name] = {'frames':24,'durationMs':1920,'size':[256,256],
                     'meanSilhouetteChange':float(changes.mean()),
                     'seamSilhouetteChange':float(changes[0]),
                     'maxSilhouetteChange':float(changes.max())}
(ROOT / 'metrics.json').write_text(json.dumps(metrics, indent=2), encoding='utf-8')
