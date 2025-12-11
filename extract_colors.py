from PIL import Image
from collections import Counter
import sys

def get_dominant_colors(image_path, num_colors=5):
    try:
        # Open image
        image = Image.open(image_path)
        image = image.convert('RGB')
        
        # Resize to speed up processing
        image = image.resize((100, 100))
        
        pixels = list(image.getdata())
        
        # Simple Counter
        counts = Counter(pixels)
        most_common = counts.most_common(num_colors)
        
        colors = []
        for (r, g, b), count in most_common:
            colors.append(f"#{r:02x}{g:02x}{b:02x}")
            
        return colors
    except Exception as e:
        return str(e)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        print(get_dominant_colors(sys.argv[1]))
    else:
        print("Usage: python extract_colors.py <image_path>")
