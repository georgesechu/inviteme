#!/usr/bin/env python3
"""
Generate a sample wedding invitation card
"""
import sys
import os

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError as e:
    print(f"Missing required library: {e}")
    print("Please install: pip install Pillow")
    sys.exit(1)

# Try to import qrcode, create placeholder if not available
try:
    import qrcode
    QR_AVAILABLE = True
except ImportError:
    QR_AVAILABLE = False
    print("Warning: qrcode not available. Will create placeholder QR code.")
    print("Install with: pip install qrcode[pil]")

# Try to read ODS file
try:
    import pandas as pd
    df = pd.read_excel('wedding_invites.ods', engine='odf')
    # Find row with longest name "Mr & Mrs Eng. Ngwisa Mpembe"
    target_name = "Mr & Mrs Eng. Ngwisa Mpembe"
    mask = df.iloc[:, 0].astype(str).str.contains("Ngwisa Mpembe", case=False, na=False)
    if mask.any():
        sample = df[mask].iloc[0]
    else:
        # Use first row if not found
        sample = df.iloc[0]
    name = sample.iloc[0]  # Column A - Name
    single_double = sample.iloc[1]  # Column B - Single or Double
    code = sample.iloc[3]  # Column D - Unique code
    print(f"Sample data: Name={name}, Type={single_double}, Code={code}")
except ImportError:
    # Try to parse ODS XML directly
    try:
        import xml.etree.ElementTree as ET
        import zipfile
        with zipfile.ZipFile('wedding_invites.ods', 'r') as z:
            content = z.read('content.xml')
        root = ET.fromstring(content)
        # Find namespace
        ns = {'table': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
              'text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0'}
        # Get first data row (skip header if exists)
        rows = root.findall('.//table:table-row', ns)
        # Find row with "Mr & Mrs Eng. Ngwisa Mpembe" (longest name) for sample
        target_name = "Mr & Mrs Eng. Ngwisa Mpembe"
        found = False
        for row in rows:
            cells = row.findall('.//table:table-cell', ns)
            if len(cells) >= 4:
                # Extract text from cells
                name_elem = cells[0].find('.//text:p', ns)
                if name_elem is not None and name_elem.text:
                    extracted_name = name_elem.text.replace('&amp;', '&')
                    if target_name in extracted_name or extracted_name in target_name:
                        type_elem = cells[1].find('.//text:p', ns)
                        code_elem = cells[3].find('.//text:p', ns)
                        name = extracted_name
                        single_double = type_elem.text if type_elem is not None and type_elem.text else "Double"
                        code = code_elem.text if code_elem is not None and code_elem.text else "52822"
                        print(f"Extracted from ODS: Name={name}, Type={single_double}, Code={code}")
                        found = True
                        break
        
        # If not found, use first row
        if not found:
            for row in rows:
                cells = row.findall('.//table:table-cell', ns)
                if len(cells) >= 4:
                    name_elem = cells[0].find('.//text:p', ns)
                    type_elem = cells[1].find('.//text:p', ns)
                    code_elem = cells[3].find('.//text:p', ns)
                    if name_elem is not None and name_elem.text:
                        name = name_elem.text.replace('&amp;', '&')
                        single_double = type_elem.text if type_elem is not None and type_elem.text else "Single"
                        code = code_elem.text if code_elem is not None and code_elem.text else "00000"
                        print(f"Extracted from ODS: Name={name}, Type={single_double}, Code={code}")
                        break
            else:
                raise ValueError("No data rows found")
    except Exception as e:
        print(f"Could not parse ODS file: {e}")
        print("Using hardcoded sample data (longest name)")
        name = "Mr & Mrs Eng. Ngwisa Mpembe"
        single_double = "Double"
        code = "52822"
except Exception as e:
    print(f"Could not read spreadsheet: {e}")
    print("Using hardcoded sample data (longest name)")
    name = "Mr & Mrs Eng. Ngwisa Mpembe"
    single_double = "Double"
    code = "52822"

# Load the blank invitation
try:
    img = Image.open('blank_invite.png')
    print(f"Loaded image: {img.size} pixels, mode: {img.mode}")
except Exception as e:
    print(f"Error loading blank_invite.png: {e}")
    sys.exit(1)

# Convert to RGB if needed
if img.mode != 'RGB':
    img = img.convert('RGB')

# Create a copy to work with
invite = img.copy()
draw = ImageDraw.Draw(invite)

# Try to load fonts, fallback to default if not available
try:
    # Try common font paths
    font_paths = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf',
        '/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf',
    ]
    name_font = None
    for path in font_paths:
        if os.path.exists(path):
            try:
                name_font = ImageFont.truetype(path, 50)  # Smaller font size
                break
            except:
                continue
    
    if name_font is None:
        name_font = ImageFont.load_default()
        print("Using default font for name")
    else:
        print(f"Using font: {path}")
except Exception as e:
    name_font = ImageFont.load_default()
    print(f"Using default font: {e}")

# Find where to place the name - based on the image description,
# the name should go in a space designed for it
# We'll place it in the center area where names typically go
width, height = invite.size

# Position for name (adjust based on actual template)
# Based on description, names are in the center area
name_x = width // 2
target_bottom_y = 670  # Bottom of text should be at this position from top

# Draw the name
text_color = (0, 0, 0)  # Black color
# Get text bounding box to center it and calculate height
bbox = draw.textbbox((0, 0), name, font=name_font)
text_width = bbox[2] - bbox[0]
text_height = bbox[3] - bbox[1]
# Position so bottom of text is at target_bottom_y
name_y = target_bottom_y - text_height
text_x = name_x - text_width // 2

draw.text((text_x, name_y), name, fill=text_color, font=name_font)
print(f"Added name '{name}' at position ({text_x}, {name_y}), bottom at {target_bottom_y}px")

# Generate QR code
# URL structure: http://46.62.209.58/c/{code}
qr_url = f"http://46.62.209.58/c/{code}"
print(f"QR Code URL: {qr_url}")

# Load label font for positioning calculation
try:
    label_font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 38)
except:
    try:
        label_font = ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf', 38)
    except:
        label_font = ImageFont.load_default()

qr_size = 300  # Size of QR code (increased)

if QR_AVAILABLE:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    qr_img = qr_img.resize((qr_size, qr_size), Image.Resampling.LANCZOS)
else:
    # Create a placeholder QR code (simple black and white pattern)
    qr_img = Image.new('RGB', (qr_size, qr_size), 'white')
    qr_draw = ImageDraw.Draw(qr_img)
    # Draw a simple placeholder pattern
    block_size = 20
    for i in range(0, qr_size, block_size):
        for j in range(0, qr_size, block_size):
            if (i // block_size + j // block_size) % 2 == 0:
                qr_draw.rectangle([i, j, i+block_size-2, j+block_size-2], fill='black')
    # Add text in center
    try:
        placeholder_font = ImageFont.load_default()
    except:
        placeholder_font = None
    text = "QR\nCODE"
    bbox = qr_draw.textbbox((0, 0), text, font=placeholder_font) if placeholder_font else (0, 0, 50, 20)
    text_x = (qr_size - (bbox[2] - bbox[0])) // 2
    text_y = (qr_size - (bbox[3] - bbox[1])) // 2
    qr_draw.text((text_x, text_y), text, fill='gray', font=placeholder_font)
    print("Created placeholder QR code (install qrcode for real QR codes)")

# Position QR code at bottom right
# Leave equal margin from bottom and right edges
label_text = single_double.upper()
code_text = str(code)  # 5-digit code
margin = 40  # Increased spacing from right and bottom edges
qr_x = width - qr_size - margin  # Spacing from right edge

# Calculate dimensions for both type and code text
type_bbox = draw.textbbox((0, 0), label_text, font=label_font)
type_height = type_bbox[3] - type_bbox[1] if type_bbox else 30
type_width = type_bbox[2] - type_bbox[0] if type_bbox else 100

code_bbox = draw.textbbox((0, 0), code_text, font=label_font)
code_height = code_bbox[3] - code_bbox[1] if code_bbox else 30
code_width = code_bbox[2] - code_bbox[0] if code_bbox else 100

# Spacing between text elements
label_spacing = 8  # Space between type and code text
qr_label_spacing = 20  # Space between code text and QR code (increased)

# Position QR code with equal spacing from bottom
qr_y = height - qr_size - margin  # Equal spacing from bottom edge

# Paste QR code
invite.paste(qr_img, (qr_x, qr_y))

# Add "SINGLE" or "DOUBLE" text above QR code, then code below it
# Center both texts above QR code
# Position code text first (closer to QR code)
code_x = qr_x + (qr_size // 2) - (code_width // 2)
code_y = qr_y - qr_label_spacing - code_height  # Position code text just above QR code

# Position type text above code text
type_x = qr_x + (qr_size // 2) - (type_width // 2)
type_y = code_y - label_spacing - type_height  # Position type text above code text

draw.text((type_x, type_y), label_text, fill=text_color, font=label_font)
draw.text((code_x, code_y), code_text, fill=text_color, font=label_font)
print(f"Added '{label_text}' and code '{code_text}' above QR code")

# Save the sample
output_path = 'cards/sample_card.png'
os.makedirs('cards', exist_ok=True)
invite.save(output_path)
print(f"\nSample card saved to: {output_path}")

