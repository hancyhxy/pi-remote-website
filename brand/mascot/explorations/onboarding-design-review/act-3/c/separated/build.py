"""Build independent paper layers on one shared coordinate system."""
from pathlib import Path
import json
import cv2
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent
RUNTIME = ROOT.parents[3] / 'story/act-3'
scene = Image.new('RGBA',(1536,1024))
metadata = {}
for part in ['sofa','person-left','person-right']:
    pixels = np.array(Image.open(next((ROOT/part/'source').glob('*/*.png'))).convert('RGBA'))
    rgb = pixels[:,:,:3].astype(int)
    key = (rgb[:,:,0]-rgb[:,:,1]>65)&(rgb[:,:,2]-rgb[:,:,1]>65)
    _,labels,stats,_ = cv2.connectedComponentsWithStats((~key).astype('uint8'))
    label = 1 + np.argmax(stats[1:,cv2.CC_STAT_AREA])
    mask = (labels==label).astype('uint8')*255
    distance = cv2.distanceTransform(mask,cv2.DIST_L2,5)
    pixels[distance<2.2,:3] = (252,249,236)
    pixels[:,:,3] = np.array(Image.fromarray(mask).filter(ImageFilter.GaussianBlur(.45)))
    image = Image.fromarray(pixels)
    image.save(ROOT/part/'layer.png')
    image.crop(image.getbbox()).save(ROOT/part/'cropped.png')
    image.save(RUNTIME/('sofa-only.png' if part=='sofa' else f'{part}.png'))
    scene.alpha_composite(image)
    metadata[part] = image.getbbox()
scene.save(ROOT/'assembled.png')
(ROOT/'parts.json').write_text(json.dumps(metadata,indent=2),encoding='utf-8')
print('Independent layers:',metadata)
