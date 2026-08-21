import PIL  # type: ignore
import requests  # type: ignore
import sys

print(f"[OK] Python {sys.version.split()[0]} is fully configured!")
print(f"[OK] Pillow (PIL) {PIL.__version__} is active!")
print(f"[OK] Requests {requests.__version__} is active!")
