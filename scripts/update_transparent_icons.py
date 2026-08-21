from PIL import Image  # type: ignore
import os

def update_clean_transparent_icons():
    logo = Image.open("public/Logo1.png").convert("RGBA")
    
    # 512x512 with transparent padding
    icon512 = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    logo_w, logo_h = logo.size
    ratio = min(480 / logo_w, 480 / logo_h)
    new_w, new_h = int(logo_w * ratio), int(logo_h * ratio)
    resized = logo.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    offset_x = (512 - new_w) // 2
    offset_y = (512 - new_h) // 2
    icon512.paste(resized, (offset_x, offset_y), resized)

    # 32x32 for favicon
    icon32 = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    r32 = min(30 / logo_w, 30 / logo_h)
    w32, h32 = int(logo_w * r32), int(logo_h * r32)
    resized32 = logo.resize((w32, h32), Image.Resampling.LANCZOS)
    icon32.paste(resized32, ((32 - w32) // 2, (32 - h32) // 2), resized32)

    icon512.save("src/app/icon.png", "PNG")
    icon512.save("public/icon.png", "PNG")
    icon512.save("src/app/apple-icon.png", "PNG")
    icon512.save("public/apple-icon.png", "PNG")
    icon32.save("public/favicon.ico", "ICO")
    icon32.save("src/app/favicon.ico", "ICO")
    print("[OK] All icons generated with pure transparent background!")

if __name__ == "__main__":
    update_clean_transparent_icons()
