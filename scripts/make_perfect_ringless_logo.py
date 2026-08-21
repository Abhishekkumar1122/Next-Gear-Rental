from PIL import Image  # type: ignore
import numpy as np  # type: ignore

def make_perfect_ringless_logo():
    input_path = r"C:\Users\abhis\.gemini\antigravity-ide\brain\bd854cc3-17ce-4ee4-b5d1-ed57c889c5b9\media__1786128554263.png"
    
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    data = np.array(img, dtype=np.float32)

    r, g, b, a = data[:, :, 0], data[:, :, 1], data[:, :, 2], data[:, :, 3]

    # Calculate distance from center
    cx, cy = w / 2.0, h / 2.0
    y_coords, x_coords = np.ogrid[:h, :w]
    dist_from_center = np.sqrt((x_coords - cx)**2 + (y_coords - cy)**2)

    # 1. Remove the outer red circular ring (dist > 410 pixels from center)
    outer_circle_mask = dist_from_center > (w * 0.40)
    
    # 2. Remove all dark background pixels (both inside and outside the circle)
    # Background pixels have low values across R, G, B
    max_rgb = np.maximum(r, np.maximum(g, b))
    dark_mask = max_rgb < 42.0

    # Apply transparency
    data[outer_circle_mask, 3] = 0
    data[dark_mask, 3] = 0

    # Smooth alpha feathering on dark edges
    feather_mask = (max_rgb >= 42.0) & (max_rgb < 75.0) & (~outer_circle_mask)
    data[feather_mask, 3] = np.clip((max_rgb[feather_mask] - 42.0) / (75.0 - 42.0), 0.0, 1.0) * 255.0

    result = Image.fromarray(data.astype(np.uint8))
    
    # Auto-trim transparent borders
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
        print(f"[PERFECT] Saved clean ringless transparent logo to: {t}")

    # Generate icons
    iw, ih = result.size
    icon512 = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    scale = min(480 / iw, 480 / ih)
    nw, nh = int(iw * scale), int(ih * scale)
    res_icon = result.resize((nw, nh), Image.Resampling.LANCZOS)
    icon512.paste(res_icon, ((512 - nw) // 2, (512 - nh) // 2), res_icon)

    icon512.save("src/app/icon.png", "PNG")
    icon512.save("public/icon.png", "PNG")
    icon512.save("src/app/apple-icon.png", "PNG")
    icon512.save("public/apple-icon.png", "PNG")
    
    res_32 = result.resize((32, 32), Image.Resampling.LANCZOS)
    res_32.save("public/favicon.ico", "ICO")
    res_32.save("src/app/favicon.ico", "ICO")
    print("[PERFECT] All site icons updated with pure transparent background!")

if __name__ == "__main__":
    make_perfect_ringless_logo()
