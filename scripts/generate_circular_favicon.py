import os
from PIL import Image, ImageDraw  # type: ignore

def create_circular_favicon():
    src_path = os.path.abspath("public/next-gear-full-transparent-badge-v2.png")
    if not os.path.exists(src_path):
        src_path = os.path.abspath("public/Logo1.png")

    print(f"Opening emblem source: {src_path}")
    with Image.open(src_path) as orig_img:
        orig_img = orig_img.convert("RGBA")
        
        # Crop tight bounding box around visible logo emblem pixels
        bbox = orig_img.getbbox()
        if bbox:
            emblem = orig_img.crop(bbox)
        else:
            emblem = orig_img

        # Canvas size 512x512 for high clarity
        size = 512
        # Create a transparent background canvas
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        
        # Create a high-res mask for antialiased pure black circle
        circle_mask = Image.new("L", (size * 2, size * 2), 0)
        draw = ImageDraw.Draw(circle_mask)
        draw.ellipse((0, 0, size * 2 - 1, size * 2 - 1), fill=255)
        circle_mask = circle_mask.resize((size, size), Image.Resampling.LANCZOS)

        # Pure solid black circle image
        black_circle = Image.new("RGBA", (size, size), (0, 0, 0, 255))
        
        # Apply circle mask onto transparent canvas
        canvas.paste(black_circle, (0, 0), circle_mask)

        # Scale emblem to fit nicely inside the black circle (~72% of circle diameter)
        target_size = int(size * 0.72)
        emb_w, emb_h = emblem.size
        scale_ratio = min(target_size / emb_w, target_size / emb_h)
        new_w = int(emb_w * scale_ratio)
        new_h = int(emb_h * scale_ratio)
        
        resized_emblem = emblem.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Center the emblem inside the black circle
        offset_x = (size - new_w) // 2
        offset_y = (size - new_h) // 2
        
        canvas.paste(resized_emblem, (offset_x, offset_y), resized_emblem)

        # Save outputs in app and public directories
        targets = [
            "src/app/icon.png",
            "src/app/apple-icon.png",
            "public/icon.png",
            "public/apple-icon.png"
        ]

        for rel_target in targets:
            full_target = os.path.abspath(rel_target)
            os.makedirs(os.path.dirname(full_target), exist_ok=True)
            if "apple-icon" in rel_target:
                apple_img = canvas.resize((180, 180), Image.Resampling.LANCZOS)
                apple_img.save(full_target, format="PNG", optimize=True)
            else:
                canvas.save(full_target, format="PNG", optimize=True)
            print(f"Generated: {rel_target}")

        # Save multi-size favicon.ico
        ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
        ico_targets = ["src/app/favicon.ico", "public/favicon.ico"]
        
        for ico_rel in ico_targets:
            full_ico = os.path.abspath(ico_rel)
            os.makedirs(os.path.dirname(full_ico), exist_ok=True)
            canvas.save(full_ico, format="ICO", sizes=ico_sizes)
            print(f"Generated ICO: {ico_rel}")

if __name__ == "__main__":
    create_circular_favicon()
