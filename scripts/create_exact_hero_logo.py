import os
import numpy as np  # type: ignore
from PIL import Image  # type: ignore

def generate_exact_transparent_hero():
    input_path = "public/next-gear-transparent-hero.png"
    if not os.path.exists(input_path):
        input_path = "public/Logo1.png"
    if not os.path.exists(input_path):
        print(f"[WARN] No source logo file found for processing.")
        return
    
    img = Image.open(input_path).convert("RGBA")
    data = np.array(img, dtype=np.float32)

    r, g, b, a = data[:, :, 0], data[:, :, 1], data[:, :, 2], data[:, :, 3]

    # Calculate max brightness
    max_rgb = np.maximum(r, np.maximum(g, b))

    # All black/dark background pixels (both inside the car area, behind gear, and outside) become 100% transparent
    # Smooth threshold from 16 to 40 for crisp anti-aliased edges
    alpha = np.clip((max_rgb - 16.0) / (40.0 - 16.0), 0.0, 1.0) * 255.0
    data[:, :, 3] = alpha.astype(np.uint8)

    result = Image.fromarray(data.astype(np.uint8))

    # Crop tightly to the logo
    bbox = result.getbbox()
    if bbox:
        result = result.crop(bbox)

    # Save to dedicated new file and existing paths
    files_to_save = [
        "public/next-gear-transparent-hero.png",
        "public/Logo1.png",
        "public/logo2.png",
        "public/logo.png",
        "public/next-gear-login-logo.png",
    ]

    for f in files_to_save:
        result.save(f, "PNG")
        print(f"[SAVED] {f}")

    print("Exact transparent hero logo generated successfully!")

if __name__ == "__main__":
    generate_exact_transparent_hero()
