"""Extract three static sticker groups without changing the interior paper art."""
from pathlib import Path
import json
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent
for candidate in ['a', 'b', 'c']:
    folder = ROOT / candidate
    source = next((folder / 'source').glob('*/*.png'))
    original = Image.open(source).convert('RGBA')
    if candidate == 'c':
        revised = Image.open(next((folder / 'pad-back').glob('*/*.png'))).convert('RGBA')
        assert revised.size == original.size
        # Replace only the visible panel. Keep the original hands, knee and frame.
        panel = Image.new('L', original.size)
        ImageDraw.Draw(panel).polygon([
            (849,428),(1022,429),(1026,433),(1002,545),(974,545),
            (966,541),(955,536),(940,532),(920,531),(902,532),
            (885,534),(865,537),(843,541),(831,543),(831,514),(846,435),
        ], fill=255)
        mask = np.array(panel)
        before = np.array(original).astype(int)
        yy, xx = np.indices(mask.shape)
        hands = (yy > 497) & ((xx < 850) | (xx > 986)) & (before[:,:,0] - before[:,:,1] > 45) & (before[:,:,1] - before[:,:,2] > 25)
        mask[hands] = 0
        panel = Image.fromarray(mask).filter(ImageFilter.GaussianBlur(.4))
        original = Image.composite(revised, original, panel)
        original.save(folder / 'pad-back/composite-source.png')
        panel.save(folder / 'pad-back/panel-mask.png')
    pixels = np.array(original)
    rgb = pixels[:, :, :3].astype(int)
    magenta = (rgb[:, :, 0] - rgb[:, :, 1] > 65) & (rgb[:, :, 2] - rgb[:, :, 1] > 65)
    mask = (~magenta).astype('uint8') * 255
    count, labels, stats, centres = cv2.connectedComponentsWithStats(mask)
    groups = sorted(range(1, count), key=lambda i: stats[i, cv2.CC_STAT_AREA], reverse=True)[:3]
    assert len(groups) == 3 and min(stats[i, cv2.CC_STAT_AREA] for i in groups) > 20000
    sofa = groups[0]
    lamp, dog = sorted(groups[1:], key=lambda i: centres[i, 0])
    combined = Image.new('RGBA', (pixels.shape[1], pixels.shape[0]))
    metadata = {}
    for name, label in [('lamp', lamp), ('sofa', sofa), ('dog-mat', dog)]:
        solid = (labels == label).astype('uint8') * 255
        distance = cv2.distanceTransform(solid, cv2.DIST_L2, 5)
        cleaned = pixels.copy()
        cleaned[distance < 2.2, :3] = (252, 249, 236)
        cleaned[:, :, 3] = np.array(Image.fromarray(solid).filter(ImageFilter.GaussianBlur(.45)))
        image = Image.fromarray(cleaned)
        combined.alpha_composite(image)
        left, top, right, bottom = image.getbbox()
        box = [max(0,left-12), max(0,top-12), min(image.width,right+12), min(image.height,bottom+12)]
        image.crop(box).save(folder / f'{name}.png')
        metadata[name] = {'box':box,'sourcePixels':int(stats[label,cv2.CC_STAT_AREA])}
    combined.save(folder / 'scene.png')
    (folder / 'parts.json').write_text(json.dumps(metadata,indent=2),encoding='utf-8')
    print(candidate, {name: value['box'] for name,value in metadata.items()})
