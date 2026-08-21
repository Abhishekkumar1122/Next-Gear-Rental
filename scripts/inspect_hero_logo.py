from PIL import Image  # type: ignore
img = Image.open("public/next-gear-transparent-hero.png")
print("Image format:", img.format)
print("Image size:", img.size)
# Save a copy as temp inspect file to be 100% sure what it is
img.save("public/inspect-hero-logo.png")
print("Saved public/inspect-hero-logo.png")
