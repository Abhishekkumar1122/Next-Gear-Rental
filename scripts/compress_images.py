import os
from PIL import Image  # type: ignore

def get_size(path):
    return os.path.getsize(path)

def compress_png(path):
    orig_size = get_size(path)
    try:
        with Image.open(path) as img:
            has_alpha = img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info)
            temp_path = path + ".tmp"
            
            if has_alpha:
                try:
                    q_img = img.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
                    q_img.save(temp_path, format="PNG", optimize=True, compress_level=9)
                except Exception:
                    img.save(temp_path, format="PNG", optimize=True, compress_level=9)
            else:
                try:
                    q_img = img.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
                    q_img.save(temp_path, format="PNG", optimize=True, compress_level=9)
                except Exception:
                    img.save(temp_path, format="PNG", optimize=True, compress_level=9)
                    
            new_size = get_size(temp_path)
            
            if new_size < orig_size:
                os.replace(temp_path, path)
                saved_kb = (orig_size - new_size) / 1024
                saved_pct = ((orig_size - new_size) / orig_size) * 100
                print(f"Compressed {os.path.basename(path)}: {orig_size/1024:.1f}KB -> {new_size/1024:.1f}KB (Saved {saved_pct:.1f}% / -{saved_kb:.1f}KB)")
            else:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                print(f"Already optimal {os.path.basename(path)}: ({orig_size/1024:.1f}KB)")
    except Exception as e:
        print(f"Error compressing {path}: {e}")

def main():
    public_dir = os.path.abspath("public")
    print("Optimizing remaining PNG assets...\n")
    
    for root, dirs, files in os.walk(public_dir):
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            full_path = os.path.join(root, file)
            if ext in ['.mp4', '.webm', '.mov', '.avi', '.mkv']:
                continue
            if ext == '.png':
                compress_png(full_path)

if __name__ == "__main__":
    main()
