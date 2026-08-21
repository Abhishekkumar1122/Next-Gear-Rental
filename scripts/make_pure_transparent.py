import numpy as np  # type: ignore
from PIL import Image  # type: ignore

def make_pure_transparent_png(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = np.array(img)

    r, g, b, a = data[:, :, 0], data[:, :, 1], data[:, :, 2], data[:, :, 3]

    # If background is black or very dark (r < 30, g < 30, b < 30) -> Alpha = 0
    black_mask = (r < 32) & (g < 32) & (b < 32)
    # If background is pure white (r > 240, g > 240, b > 240) -> Alpha = 0
    white_mask = (r > 245) & (g > 245) & (b > 245)

    # Let's inspect the corner pixel color to detect what the background was
    corner_r, corner_g, corner_b, corner_a = data[0, 0]
    print(f"[CORNER PIXEL] R={corner_r}, G={corner_g}, B={corner_b}, A={corner_a}")

    if corner_r < 40 and corner_g < 40 and corner_b < 40:
        print("[DETECTED] Dark/Black background -> stripping black to pure transparent alpha")
        data[black_mask, 3] = 0
    elif corner_r > 230 and corner_g > 230 and corner_b > 230:
        print("[DETECTED] White background -> stripping white to pure transparent alpha")
        data[white_mask, 3] = 0

    result_img = Image.fromarray(data)
    # Auto-crop bounding box around logo
    bbox = result_img.getbbox()
    if bbox:
        result_img = result_img.crop(bbox)

    result_img.save(output_path, "PNG")
    print(f"[SAVED] Pure transparent PNG to: {output_path}")

if __name__ == "__main__":
    make_pure_transparent_png("public/Picsart_26-02-28_15-00-18-140.png", "public/Logo1.png")
    make_pure_transparent_png("public/Picsart_26-02-28_15-00-18-140.png", "public/logo2.png")
    make_pure_transparent_png("public/Picsart_26-02-28_15-00-18-140.png", "public/logo.png")
    make_pure_transparent_png("public/Picsart_26-02-28_15-00-18-140.png", "public/next-gear-login-logo.png")
