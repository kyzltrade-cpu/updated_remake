import os
from PIL import Image

image_path = "/Users/kyzl/.hermes/image_cache/img_eadf43bd73d6.jpg"
output_path = "/Users/kyzl/updated_remake/assets/images/user-silhouette.png"

# Ensure output directory exists
os.makedirs(os.path.dirname(output_path), exist_ok=True)

img = Image.open(image_path).convert("RGBA")
datas = img.getdata()

new_data = []
for item in datas:
    # If the pixel is close to white (background), make it transparent
    if item[0] > 220 and item[1] > 220 and item[2] > 220:
        new_data.append((255, 255, 255, 0))
    else:
        # Replace the black silhouette with our exact brand Slate/Charcoal guideline color
        # rgba(138, 149, 165, 0.45)
        new_data.append((138, 149, 165, 115)) # 115 is ~45% opacity

img.putdata(new_data)
img.save(output_path, "PNG")
print("Faint transparent PNG silhouette created successfully!")

# Also let's create the active high-contrast highlighted version in rose-gold (#D98A96)
output_active_path = "/Users/kyzl/updated_remake/assets/images/user-silhouette-active.png"
active_data = []
for item in datas:
    if item[0] > 220 and item[1] > 220 and item[2] > 220:
        active_data.append((255, 255, 255, 0))
    else:
        # Rose gold #D98A96 -> rgb(217, 138, 150) with 85% opacity (217)
        active_data.append((217, 138, 150, 217))

img.putdata(active_data)
img.save(output_active_path, "PNG")
print("Active transparent PNG silhouette created successfully!")
