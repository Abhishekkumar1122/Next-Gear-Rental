import os
import subprocess
import glob
import shutil

FFMPEG_PATH = r"C:\Users\abhis\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0-full_build\bin\ffmpeg.exe"

def compress_video(input_path, output_path=None, crf=28):
    if not os.path.exists(FFMPEG_PATH):
        print(f"[ERROR] FFmpeg not found at {FFMPEG_PATH}")
        return False

    if not os.path.exists(input_path):
        print(f"[ERROR] Video {input_path} not found.")
        return False

    backup_dir = "public/backups_original_video"
    os.makedirs(backup_dir, exist_ok=True)
    
    orig_name = os.path.basename(input_path)
    backup_file = os.path.join(backup_dir, orig_name)
    if not os.path.exists(backup_file):
        shutil.copy2(input_path, backup_file)
        print(f"[BACKUP] Saved original to {backup_file}")

    temp_output = input_path.replace(".mp4", "_compressed_tmp.mp4")

    # High-efficiency Web H.264 compression with -movflags +faststart for instant mobile streaming
    cmd = [
        FFMPEG_PATH,
        "-y",
        "-i", input_path,
        "-vcodec", "libx264",
        "-crf", str(crf),
        "-preset", "slow",
        "-movflags", "+faststart",
        "-an", # Remove audio track for silent background video (saves 20% data)
        "-pix_fmt", "yuv420p",
        temp_output
    ]

    print(f"[COMPRESSING] {orig_name}...")
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    if result.returncode == 0 and os.path.exists(temp_output):
        orig_sz = os.path.getsize(input_path)
        new_sz = os.path.getsize(temp_output)
        
        # Replace original with compressed version
        shutil.move(temp_output, input_path)
        
        pct = ((orig_sz - new_sz) / orig_sz) * 100
        print(f"[OK] {orig_name}: {orig_sz // 1024} KB -> {new_sz // 1024} KB ({pct:.1f}% bandwidth saved!)")
        return True
    else:
        print(f"[FAIL] Compression failed: {result.stderr.decode('utf-8', errors='ignore')[:300]}")
        if os.path.exists(temp_output):
            os.remove(temp_output)
        return False

def optimize_all_website_videos():
    videos = ["public/login-video.mp4", "public/using-logo-video.mp4"]
    for v in videos:
        if os.path.exists(v):
            compress_video(v, crf=27)

if __name__ == "__main__":
    optimize_all_website_videos()
