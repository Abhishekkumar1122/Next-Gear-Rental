import os
import numpy as np  # type: ignore
from PIL import Image  # type: ignore

def extract_clean_floating_logo():
    input_path = "public/next-gear-transparent-hero.png"
    if not os.path.exists(input_path):
        input_path = "public/Logo1.png"
    if not os.path.exists(input_path):
        print(f"[WARN] No source logo file found for extraction.")
        return
    
    img = Image.open(input_path).convert("RGBA")
    data = np.array(img, dtype=np.float32)

    r, g, b, a = data[:, :, 0], data[:, :, 1], data[:, :, 2], data[:, :, 3]

    # Calculate max RGB brightness for each pixel
    max_val = np.maximum(r, np.maximum(g, b))

    # All black background pixels become 100% transparent
    # Smooth alpha transition between 18 and 42 for perfect smooth anti-aliased edges
    alpha = np.clip((max_val - 18.0) / (42.0 - 18.0), 0.0, 1.0) * 255.0
    data[:, :, 3] = alpha.astype(np.uint8)

    result = Image.fromarray(data.astype(np.uint8))

    # Crop tightly to the logo content
    bbox = result.getbbox()
    if bbox:
        result = result.crop(bbox)

    targets = [
        "public/Logo1.png",
        "public/logo2.png",
        "public/logo.png",
        "public/next-gear-login-logo.png",
    ]

    for t in targets:
        result.save(t, "PNG")
        print(f"[SUCCESS] Saved exact transparent logo to: {t}")

    # Also update favicon and site icons
    w, h = result.size
    icon512 = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    scale = min(480 / w, 480 / h)
    nw, nh = int(w * scale), int(h * scale)
    res_icon = result.resize((nw, nh), Image.Resampling.LANCZOS)
    icon512.paste(res_icon, ((512 - nw) // 2, (512 - nh) // 2), res_icon)

    icon512.save("src/app/icon.png", "PNG")
    icon512.save("public/icon.png", "PNG")
    icon512.save("src/app/apple-icon.png", "PNG")
    icon512.save("public/apple-icon.png", "PNG")

    res_32 = result.resize((32, 32), Image.Resampling.LANCZOS)
    res_32.save("public/favicon.ico", "ICO")
    res_32.save("src/app/favicon.ico", "ICO")
    print("[SUCCESS] All icons and favicons generated!")

if __name__ == "__main__":
    extract_clean_floating_logo()
