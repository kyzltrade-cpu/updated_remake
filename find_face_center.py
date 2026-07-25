from PIL import Image

image_path = "/Users/kyzl/updated_remake/assets/images/user-silhouette.png"
img = Image.open(image_path)
width, height = img.size

# Find the bounding box of all non-transparent pixels (alpha > 50)
left = width
right = 0
top = height
bottom = 0

for y in range(height):
    for x in range(width):
        r, g, b, a = img.getpixel((x, y))
        if a > 50:
            if x < left: left = x
            if x > right: right = x
            if y < top: top = y
            if y > bottom: bottom = y

print(f"Image actual size: {width}x{height}")
print(f"Silhouette non-transparent bounding box: left={left}, right={right}, top={top}, bottom={bottom}")
print(f"Horizontal center of silhouette: {(left + right) / 2} (image midpoint is {width/2})")
print(f"Vertical midpoint of silhouette: {(top + bottom) / 2}")
