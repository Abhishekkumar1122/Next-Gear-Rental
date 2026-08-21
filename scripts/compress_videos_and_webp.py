import os
import subprocess
import imageio_ffmpeg  # type: ignore
from PIL import Image  # type: ignore

def get_size(path):
    return os.path.getsize(path)

def compress_videos():
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    public_dir = os.path.abspath("public")
    
    print("Starting Video Compression with FFmpeg via Python...\n")
    
    video_files = []
    for root, dirs, files in os.walk(public_dir):
        for file in files:
            if file.lower().endswith(('.mp4', '.mov', '.webm')):
                video_files.append(os.path.join(root, file))
                
    for v_path in video_files:
        orig_s = get_size(v_path)
        tmp_path = v_path + ".tmp.mp4"
        
        # FFmpeg command: H.264 CRF 25, preset slow, remove unused audio track (-an) for background video
        cmd = [
            ffmpeg_exe,
            "-y",
            "-i", v_path,
            "-vcodec", "libx264",
            "-crf", "25",
            "-preset", "slow",
            "-an",
            tmp_path
        ]
        
        print(f"Compressing video: {os.path.basename(v_path)} ({orig_s/(1024*1024):.2f} MB)...")
        try:
            subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
            new_s = get_size(tmp_path)
            
            if new_s < orig_s:
                bak_path = v_path + ".bak"
                if not os.path.exists(bak_path):
                    os.rename(v_path, bak_path)
                else:
                    os.remove(v_path)
                    
                os.rename(tmp_path, v_path)
                saved_mb = (orig_s - new_s) / (1024 * 1024)
                saved_pct = ((orig_s - new_s) / orig_s) * 100
                print(f"  Success {os.path.basename(v_path)}: {orig_s/(1024*1024):.2f}MB -> {new_s/(1024*1024):.2f}MB (Saved {saved_pct:.1f}% / -{saved_mb:.2f}MB)")
            else:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
                print(f"  Already optimal: {os.path.basename(v_path)}")
        except Exception as e:
            print(f"  Error compressing {v_path}: {e}")
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

def generate_webp_images():
    public_dir = os.path.abspath("public")
    print("\nGenerating Next-Gen WebP Images for All Graphic Assets...\n")
    
    for root, dirs, files in os.walk(public_dir):
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in ['.png', '.jpg', '.jpeg']:
                img_path = os.path.join(root, file)
                webp_path = os.path.splitext(img_path)[0] + ".webp"
                
                try:
                    with Image.open(img_path) as img:
                        img.save(webp_path, format="WEBP", quality=85, method=6)
                        orig_s = get_size(img_path)
                        webp_s = get_size(webp_path)
                        print(f"Generated {os.path.basename(webp_path)}: PNG/JPG {orig_s/1024:.1f}KB -> WebP {webp_s/1024:.1f}KB")
                except Exception as e:
                    print(f"  Error converting {file} to WebP: {e}")

if __name__ == "__main__":
    compress_videos()
    generate_webp_images()
