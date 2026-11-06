"""Add a small local breathing displacement to the approved paper body."""
from pathlib import Path
import json
import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent / 'c'
dog = Image.open(ROOT / 'dog-mat.png').convert('RGBA')
scene = Image.open(ROOT / 'scene.png').convert('RGBA')
x0,y0,_,_ = json.loads((ROOT / 'parts.json').read_text())['dog-mat']['box']
pixels = np.array(dog)
y,x = np.indices(pixels.shape[:2],dtype=np.float32)
# Restrict breathing to the upper back. The face and paws stay fixed.
wx = np.where((x > 70) & (x < 248), np.sin(np.pi * np.clip((x-70)/178,0,1))**2, 0)
wy = np.where(y <= 75,1,np.where(y < 122,.5+.5*np.cos(np.pi*(y-75)/47),0))
weight = (wx * wy).astype(np.float32)
# Move the original tail paper, not the mat texture below it.
outline = [(83,139),(91,143),(105,148),(122,152),(146,156),
           (165,153),(181,150),(195,146),(212,151),(227,159),
           (235,171),(234,177),(217,175),(202,179),(188,182),
           (168,184),(147,184),(128,181),(110,176),(95,167),(85,154)]
mask_image = Image.new('L',(dog.width*4,dog.height*4))
ImageDraw.Draw(mask_image).polygon([(a*4,b*4) for a,b in outline],fill=255)
mask = np.array(mask_image.resize(dog.size,Image.Resampling.LANCZOS),dtype=np.float32)/255
mask[x < 132] *= np.clip((x[x < 132]-120)/12,0,1)
underlay = cv2.inpaint(pixels[:,:,:3],(mask>0).astype('uint8')*255,5,cv2.INPAINT_TELEA).astype(np.float32)
tail = pixels[:,:,:3].astype(np.float32)*mask[:,:,None]
travel = np.clip((x-132)/90,0,1).astype(np.float32)
tail_region = cv2.dilate((mask>0).astype('uint8'),np.ones((11,11),dtype='uint8')) > 0
background = np.array(scene)
region = background[y0:y0+dog.height,x0:x0+dog.width]
region[pixels[:,:,3]>0] = 0
background = Image.fromarray(background)
dogs, scenes = [], []
for index in range(48):
    phase = index / 48
    amount = (.5-.5*np.cos(np.pi*phase/.375)) if phase <= .375 else (.5+.5*np.cos(np.pi*(phase-.375)/.625))
    frame = cv2.remap(pixels,x,(y + 4*amount*weight).astype(np.float32),cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT)
    # One small left-right cycle per breath; the tail root stays anchored.
    shift = 3.5*np.sin(2*np.pi*phase)
    map_x = (x-shift*travel).astype(np.float32)
    moved_mask = cv2.remap(mask,map_x,y,cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
    moved_tail = cv2.remap(tail,map_x,y,cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
    delta = moved_tail-tail+underlay*(mask-moved_mask)[:,:,None]
    frame[:,:,:3] = np.clip(np.rint(frame[:,:,:3].astype(np.float32)+delta),0,255).astype('uint8')
    fixed = (weight == 0) & ~tail_region
    assert np.array_equal(frame[fixed],pixels[fixed])
    image = Image.fromarray(frame)
    full = background.copy(); full.alpha_composite(image,(x0,y0))
    dogs.append(image); scenes.append(full)
assert np.array_equal(np.array(scenes[0]),np.array(scene))
for name,frames in [('dog-rest-v2',dogs),('scene-rest-v2',scenes)]:
    frames[0].save(ROOT/f'{name}.webp',save_all=True,append_images=frames[1:],duration=80,loop=0,lossless=True)
palette = dogs[0].convert('RGB').quantize(colors=255)
gifs = []
for frame in dogs:
    image = frame.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE)
    image.paste(255,mask=frame.getchannel('A').point(lambda a: 255 if a < 128 else 0))
    gifs.append(image)
gifs[0].save(ROOT/'dog-rest-v2.gif',save_all=True,append_images=gifs[1:],duration=80,loop=0,transparency=255,disposal=2,optimize=False)
print('PASS: 48 samples, 3.84 s loop, 4 px back lift and ±3.5 px tail-tip travel; pixels outside both regions stay fixed.')
