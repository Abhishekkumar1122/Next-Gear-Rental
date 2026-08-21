import os
import numpy as np  # type: ignore
from PIL import Image  # type: ignore

def make_full_transparent_hero_emblem():
    input_path = "public/next-gear-transparent-hero.png"
    if not os.path.exists(input_path):
        input_path = "public/Logo1.png"
    if not os.path.exists(input_path):
        print("[WARN] No source logo file found.")
        return
    
    img = Image.open(input_path).convert("RGBA")
    data = np.array(img, dtype=np.float32)

    r, g, b, a = data[:, :, 0], data[:, :, 1], data[:, :, 2], data[:, :, 3]

    # Calculate brightness across RGB
    max_rgb = np.maximum(r, np.maximum(g, b))

    # All black background pixels become 100% transparent
    # Smooth alpha feathering between 16 and 42 for ultra-smooth anti-aliased edges
    alpha = np.clip((max_rgb - 16.0) / (42.0 - 16.0), 0.0, 1.0) * 255.0
    data[:, :, 3] = alpha.astype(np.uint8)

    result = Image.fromarray(data.astype(np.uint8))

    # Auto-trim transparent borders around the complete emblem including RENT. RIDE. REPEAT.
    bbox = result.getbbox()
    if bbox:
        result = result.crop(bbox)

    targets = [
        "public/next-gear-transparent-hero.png",
        "public/Logo1.png",
        "public/logo2.png",
        "public/logo.png",
        "public/next-gear-login-logo.png",
    ]

    for t in targets:
        result.save(t, "PNG")
        print(f"[OK] Saved full transparent logo (with RENT. RIDE. REPEAT.) to: {t}")

    print("Full emblem with RENT. RIDE. REPEAT. processed successfully!")

if __name__ == "__main__":
    make_full_transparent_hero_emblem()
