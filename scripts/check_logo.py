from PIL import Image  # type: ignore
import numpy as np  # type: ignore

img = Image.open('public/Logo1.png')
arr = np.array(img)
print("Shape:", arr.shape)
print("Alpha min/max:", arr[:,:,3].min(), arr[:,:,3].max())

# Count opaque dark pixels
opaque_dark = (arr[:,:,0] < 45) & (arr[:,:,1] < 45) & (arr[:,:,2] < 45) & (arr[:,:,3] > 10)
print("Opaque dark pixels count:", np.sum(opaque_dark))
