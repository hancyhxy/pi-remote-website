#!/bin/sh
# App Store screenshots v2: screens -> device frames -> 7 slices of one panorama (out/).
# Usage: ./build.sh [--open A|B|C|D|E|F]   (default F, the final opening)
#        ./build.sh --3d [...]           also renders the 3D phones again (needs a GPU, about a minute)
set -e
cd "$(dirname "$0")"
if [ "$1" = "--3d" ]; then shift; RENDER3D=1; fi
pyx render_screens.py
[ -n "$RENDER3D" ] && pyx render_phone3d.py --glb p1-drawer p1-chat p2-chat-mirror
pyx bezels.py
pyx compose_c.py "$@"
