"""Render a continuous diagonal-pair gait with fixed paper textures and bone lengths."""
from pathlib import Path
import math
import cv2
import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent


def build_frames():
    source = Image.open(ROOT / 'paper-run-frames/three-quarter-gait-v2/01.png').convert('RGBA')
    # Keep the existing head, torso, markings and tail. Replace the lower limbs.
    body_mask = Image.new('L', source.size)
    ImageDraw.Draw(body_mask).polygon([(0,0),(256,0),(256,144),(198,144),(192,160),(178,175),(161,175),(145,167),(125,174),(105,166),(92,160),(78,163),(57,165),(0,165)], fill=255)
    body = source.copy()
    body.putalpha(ImageChops.multiply(source.getchannel('A'), body_mask))
    master = Image.open(next((ROOT / 'jack-russell-paper/master').glob('*/*.png'))).convert('RGB')
    # Use actual paper fibres from the character master, not a smooth solid fill.
    texture = master.crop((430, 820, 610, 990)).resize((256, 256), Image.Resampling.LANCZOS)
    grain = np.array(texture).astype('float32')
    grain = grain - cv2.GaussianBlur(grain, (0, 0), 8)
    texture = Image.fromarray(np.clip(grain * .8 + [239,225,196], 0, 255).astype('uint8')).convert('RGBA')
    definitions = [
        ('rear-far', (103,158), 34., 34., .5, -1, 219, 8),
        ('front-far', (153,152), 37., 36., 0, 1, 220, 8),
        ('rear-near', (69,153), 35., 34., 0, -1, 216, 10),
        ('front-near', (174,149), 44., 42., .5, 1, 229, 10),
    ]
    frames, tracks = [], []
    for i in range(24):
        t = i / 24
        bob = -1.5 * math.cos(4 * math.pi * t)
        canvas = Image.new('RGBA', source.size)
        track = {}
        for name, hip, l1, l2, phase, bend, ground, width in definitions:
            p = (t + phase) % 1
            if p < .5:
                stride, lift = 17 - 68 * p, 0
            else:
                s = (p - .5) * 2
                stride = -17 + 34 * (s * s * (3 - 2 * s))
                lift = 25 * math.sin(math.pi * s)
            h = np.array(hip, dtype=float) + [0, bob]
            foot = np.array([hip[0] + stride, ground - lift])
            delta = foot - h
            distance = np.linalg.norm(delta)
            direction = delta / distance
            distance = np.clip(distance, abs(l1 - l2) + .1, l1 + l2 - .1)
            foot = h + direction * distance
            along = (l1*l1 - l2*l2 + distance*distance) / (2*distance)
            height = math.sqrt(max(0, l1*l1 - along*along))
            knee = h + direction * along + bend * np.array([-direction[1], direction[0]]) * height
            # A textured silhouette joins both bones without a cut seam at the knee.
            mask = Image.new('L', (1024,1024))
            draw = ImageDraw.Draw(mask)
            pts = [tuple(point * 4) for point in (h,knee,foot)]
            draw.line(pts[:2], fill=255, width=width*8, joint='curve')
            draw.line(pts[1:], fill=255, width=(width-2)*8, joint='curve')
            for point, radius in [(h,width+2),(knee,width-1),(foot,width+1)]:
                x,y = point*4; r=radius*4
                draw.ellipse((x-r,y-r,x+r,y+r), fill=255)
            mask = mask.resize(source.size, Image.Resampling.LANCZOS)
            border = mask.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(.3))
            limb = Image.new('RGBA', source.size, (251,248,235,255)); limb.putalpha(border)
            paper = texture.copy(); paper.putalpha(mask)
            limb.alpha_composite(paper)
            toes = ImageDraw.Draw(limb)
            # The toe marks rotate slightly during recovery, not independently.
            for dx in [-4,0,4]:
                x,y = foot+[dx,4]
                toes.line((x,y-1,x+1,y+3),fill=(100,78,53,235),width=1)
            canvas.alpha_composite(limb)
            track[name] = {'hip':h.tolist(),'knee':knee.tolist(),'foot':foot.tolist(),'phase':p,'lengths':[l1,l2]}
        canvas.alpha_composite(body, (0, round(bob)))
        frames.append(canvas); tracks.append(track)
    return frames, tracks
