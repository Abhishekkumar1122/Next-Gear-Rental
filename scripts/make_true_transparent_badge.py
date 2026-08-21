import numpy as np  # type: ignore
from PIL import Image  # type: ignore

def make_true_transparent_badge():
    input_path = r"C:\Users\abhis\.gemini\antigravity-ide\brain\bd854cc3-17ce-4ee4-b5d1-ed57c889c5b9\media__1786128554263.png"
    
    img = Image.open(input_path).convert("RGBA")
    data = np.array(img, dtype=np.float32)

    r, g, b, a = data[:, :, 0], data[:, :, 1], data[:, :, 2], data[:, :, 3]

    # Calculate brightness and color saturation
    # Black/Dark background has very low brightness across all R, G, B channels
    max_channel = np.maximum(r, np.maximum(g, b))

    # All black background (both inside the circle and outside the circle) will be made 100% transparent
    # Smooth alpha ramp between brightness 15 and 45 to eliminate black halo without losing white/silver/red details
    alpha_mask = np.clip((max_channel - 18.0) / (48.0 - 18.0), 0.0, 1.0) * 255.0
    data[:, :, 3] = alpha_mask.astype(np.uint8)

    result = Image.fromarray(data.astype(np.uint8))

    # Auto-trim transparent edges
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
        print(f"[OK] Pure transparent logo saved to: {t}")

    # Generate transparent favicon & app icons
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
    print("[OK] All icons updated with pure transparent background!")

if __name__ == "__main__":
    make_true_transparent_badge()
