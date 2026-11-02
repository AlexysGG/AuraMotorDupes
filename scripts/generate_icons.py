import zlib
import struct
import math
import os

def create_png(width, height, is_maskable=False):
    # Generates a PNG with dark luxury background, gold perfume bottle silhouette and sparkles
    raw_rows = []
    
    # Colors (R, G, B, A)
    bg_color = (24, 24, 27, 255) # Zinc-900
    gold_light = (254, 240, 138, 255) # Amber-100
    gold_main = (245, 158, 11, 255) # Amber-500
    gold_dark = (217, 119, 6, 255) # Amber-600
    bottle_glass = (39, 39, 42, 255) # Zinc-800
    
    cx, cy = width / 2.0, height / 2.0
    scale = width / 512.0
    
    for y in range(height):
        row = bytearray()
        row.append(0) # Filter type 0 (None)
        
        for x in range(width):
            # Coordinates normalized to 512 scale
            nx = x / scale
            ny = y / scale
            
            # Distance from center
            dist = math.sqrt((nx - 256)**2 + (ny - 270)**2)
            
            # Default pixel
            r, g, b, a = bg_color
            
            # Subtle radial amber glow
            if dist < 180:
                factor = (1.0 - dist / 180.0) * 0.35
                r = int(r * (1 - factor) + 245 * factor)
                g = int(g * (1 - factor) + 158 * factor)
                b = int(b * (1 - factor) + 11 * factor)
                
            # Cap (ny 100 to 155, nx 220 to 292)
            if 100 <= ny <= 155 and 220 <= nx <= 292:
                r, g, b, a = gold_main
                if nx < 230 or ny < 110:
                    r, g, b, a = gold_light
            
            # Bottle neck
            if 155 <= ny <= 180 and 244 <= nx <= 268:
                r, g, b, a = gold_dark
                
            # Bottle Body (180 <= ny <= 420, 150 <= nx <= 362)
            if 180 <= ny <= 420 and 150 <= nx <= 362:
                # Bottle border
                if (nx <= 156 or nx >= 356 or ny <= 186 or ny >= 414):
                    r, g, b, a = gold_main
                else:
                    # Inner liquid (250 <= ny <= 405, 165 <= nx <= 347)
                    if 250 <= ny <= 405 and 165 <= nx <= 347:
                        r, g, b, a = gold_main
                        if (nx + ny) % 18 == 0:
                            r, g, b, a = gold_light
                    else:
                        r, g, b, a = bottle_glass
            
            # Sparkle 1 (nx around 380, ny around 130)
            if (abs(nx - 380) + abs(ny - 130)) < 16:
                r, g, b, a = gold_light
            # Sparkle 2 (nx around 135, ny around 145)
            if (abs(nx - 135) + abs(ny - 145)) < 12:
                r, g, b, a = gold_light
                
            row.extend((r, g, b, a))
        raw_rows.append(bytes(row))
        
    raw_data = b"".join(raw_rows)
    compressed = zlib.compress(raw_data)
    
    # PNG Structure
    png = bytearray(b"\x89PNG\r\n\x1a\n")
    
    # IHDR
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b"IHDR" + ihdr_data)
    png.extend(struct.pack(">I", len(ihdr_data)))
    png.extend(b"IHDR")
    png.extend(ihdr_data)
    png.extend(struct.pack(">I", ihdr_crc))
    
    # IDAT
    idat_crc = zlib.crc32(b"IDAT" + compressed)
    png.extend(struct.pack(">I", len(compressed)))
    png.extend(b"IDAT")
    png.extend(compressed)
    png.extend(struct.pack(">I", idat_crc))
    
    # IEND
    iend_crc = zlib.crc32(b"IEND")
    png.extend(struct.pack(">I", 0))
    png.extend(b"IEND")
    png.extend(struct.pack(">I", iend_crc))
    
    return bytes(png)

output_dir = "public/icons"
os.makedirs(output_dir, exist_ok=True)

targets = [
    ("icon-192x192.png", 192, 192, False),
    ("icon-512x512.png", 512, 512, False),
    ("icon-maskable-192x192.png", 192, 192, True),
    ("icon-maskable-512x512.png", 512, 512, True),
    ("apple-touch-icon.png", 180, 180, False),
    ("favicon-32x32.png", 32, 32, False),
]

for filename, w, h, maskable in targets:
    filepath = os.path.join(output_dir, filename)
    with open(filepath, "wb") as f:
        f.write(create_png(w, h, maskable))
    print(f"Generated {filepath} ({w}x{h})")

print("All PNG icons created successfully.")
