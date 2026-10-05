"""The film's static grain tile: 256x256 grey Gaussian noise (mean 128, sd 42), seeded, so every run writes the same file.
index.html lays it over the whole frame at 7.5% in overlay mode and never moves it (Tabbit's grain is static and
screen-locked: notes/TABBIT.md). Usage (from source/): python3 tools/grain.py  ->  assets/grain.png
"""
import os

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rng = np.random.default_rng(20261002)
tile = np.clip(np.round(rng.normal(128, 42, (256, 256))), 0, 255).astype(np.uint8)
Image.fromarray(tile, "L").save(os.path.join(HERE, "assets", "grain.png"), optimize=True)
print(f"grain.png: mean {tile.mean():.1f}, sd {tile.std():.1f}")
