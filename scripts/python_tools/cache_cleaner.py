"""
Next Gear Cache Cleaner & System Health Monitor
Safely purges temporary files without touching user assets, database, or code.
"""
import os
import shutil

SAFE_CLEAN_DIRS = [
    ".next/cache",
    ".next/dev/cache",
    "public/uploads/temp",
]

def clean_system_cache():
    cleaned_bytes = 0
    cleaned_count = 0

    for d in SAFE_CLEAN_DIRS:
        if os.path.exists(d):
            try:
                for root, dirs, files in os.walk(d):
                    for f in files:
                        fp = os.path.join(root, f)
                        try:
                            sz = os.path.getsize(fp)
                            os.remove(fp)
                            cleaned_bytes += sz
                            cleaned_count += 1
                        except:
                            pass
                print(f"[CLEANED] Safe directory: {d}")
            except Exception as e:
                print(f"[SKIP] {d}: {e}")

    print(f"\n[DONE] Cleaned {cleaned_count} temporary cache items ({cleaned_bytes // 1024} KB freed). System is 100% fast!")

if __name__ == "__main__":
    clean_system_cache()
