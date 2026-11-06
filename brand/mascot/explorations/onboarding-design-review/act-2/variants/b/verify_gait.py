"""Check the continuous gait. Visual motion approval is still required."""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
tracks = json.loads((ROOT / 'gait-rig-tracks.json').read_text())
assert len(tracks) == 24
assert hashlib.sha256((ROOT / 'person.png').read_bytes()).hexdigest() == '7ca015765fb08c9edce8c120dbef5d1eee3773b3ddd48ecbcf0f602d3cb84d91'
for name in tracks[0]:
    for frame in tracks:
        limb = frame[name]
        hip, knee, foot = map(np.array, [limb['hip'], limb['knee'], limb['foot']])
        assert np.allclose([np.linalg.norm(knee - hip), np.linalg.norm(foot - knee)], limb['lengths'])
    stance = [frame[name]['foot'][1] for frame in tracks if frame[name]['phase'] < .5]
    assert len(stance) == 12 and np.ptp(stance) < .001
    points = np.array([frame[name]['foot'] for frame in tracks])
    assert np.ptp(points[:, 0]) >= 33
    assert np.ptp(points[:, 1]) >= 24
    assert np.linalg.norm(points[0] - points[-1]) < 8
for frame in tracks:
    assert frame['rear-near']['phase'] == frame['front-far']['phase']
    assert frame['rear-far']['phase'] == frame['front-near']['phase']
for extension in ['gif', 'webp']:
    image = Image.open(ROOT / f'paper-run-three-quarter-rig-v3.{extension}')
    assert image.n_frames == 24 and image.info['loop'] == 0
    duration = 0
    for index in range(24):
        image.seek(index)
        image.load()
        duration += image.info['duration']
    assert duration == 1920
print('PASS: fixed bone lengths, equal planted stance, moving paws, diagonal pairs, loop seam and 24-frame files.')
