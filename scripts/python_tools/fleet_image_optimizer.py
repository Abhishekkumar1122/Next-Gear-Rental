import os
import glob
from PIL import Image  # type: ignore

def optimize_fleet_images(directory="public/uploads", max_dimension=1200, quality=82):
    """
    Optimizes all fleet vehicle images in the given directory to lightweight WebP format.
    Preserves original files while generating fast loading .webp alternatives.
    """
    if not os.path.exists(directory):
        os.makedirs(directory, exist_ok=True)
        print(f"[INFO] Directory {directory} created.")

    extensions = ('*.jpg', '*.jpeg', '*.png')
    image_files = []
    for ext in extensions:
        image_files.extend(glob.glob(os.path.join(directory, ext)))
        image_files.extend(glob.glob(os.path.join(directory, "**", ext), recursive=True))

    print(f"[FOUND] {len(image_files)} fleet images to inspect...")

    savings_total = 0
    optimized_count = 0

    for img_path in image_files:
        try:
            filename, _ = os.path.splitext(img_path)
            webp_path = f"{filename}.webp"

            # Check if webp already exists and is newer
            if os.path.exists(webp_path) and os.path.getmtime(webp_path) >= os.path.getmtime(img_path):
                continue

            orig_size = os.path.getsize(img_path)
            with Image.open(img_path) as im:
                # Convert RGBA to RGB if saving with solid background or keep RGBA for transparency
                if im.mode in ("RGBA", "P") and im.format == "PNG":
                    format_to_save = "WEBP"
                else:
                    im = im.convert("RGB")
                    format_to_save = "WEBP"

                # Resize if excessively large
                if max(im.size) > max_dimension:
                    im.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)

                im.save(webp_path, format_to_save, quality=quality, method=6)

            new_size = os.path.getsize(webp_path)
            savings = orig_size - new_size
            savings_total += max(0, savings)
            optimized_count += 1

            pct = ((orig_size - new_size) / orig_size) * 100 if orig_size > 0 else 0
            print(f"[OK] {os.path.basename(img_path)}: {orig_size//1024}KB -> {new_size//1024}KB ({pct:.1f}% saved)")
        except Exception as e:
            print(f"[ERROR] Failed {img_path}: {e}")

    print(f"\n[DONE] Optimized {optimized_count} images. Total bandwidth saved: {savings_total // 1024} KB!")

if __name__ == "__main__":
    optimize_fleet_images("public")
