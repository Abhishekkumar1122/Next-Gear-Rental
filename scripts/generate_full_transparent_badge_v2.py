import os
import numpy as np  # type: ignore
from PIL import Image  # type: ignore

def generate_full_transparent_badge_v2():
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

    # Auto-trim transparent borders around the complete emblem including tagline and circular outer ring
    bbox = result.getbbox()
    if bbox:
        result = result.crop(bbox)

    target_path = "public/next-gear-full-transparent-badge-v2.png"
    result.save(target_path, "PNG")
    
    # Also save to Logo1.png for fallback
    result.save("public/Logo1.png", "PNG")
    
    print(f"[SUCCESS] Saved full transparent badge to: {target_path}")

if __name__ == "__main__":
    generate_full_transparent_badge_v2()
