#!/usr/bin/env python3
"""
Generate wedding invitation cards and messages from the spreadsheet
Creates subfolders for each invitee with their card and message
"""
import sys
import os
import re

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
    print("Warning: qrcode not available. Will create placeholder QR codes.")
    print("Install with: pip install qrcode[pil]")

# Read message templates from files
def load_message_templates():
    """Load message templates from files"""
    templates = {}
    try:
        with open('message_whatsapp.txt', 'r', encoding='utf-8') as f:
            templates['whatsapp'] = f.read().strip()
    except FileNotFoundError:
        print("Warning: message_whatsapp.txt not found, using default")
        templates['whatsapp'] = "Mwaliko wa harusi ya George Laurent Sechu & Violet Titus Macha. Namba ya mwaliko *{code}*"
    
    try:
        with open('message_sms.txt', 'r', encoding='utf-8') as f:
            templates['sms'] = f.read().strip()
    except FileNotFoundError:
        print("Warning: message_sms.txt not found, using default")
        templates['sms'] = "Mwaliko wa harusi ya George Laurent Sechu & Violet Titus Macha. Namba ya mwaliko {code}"
    
    return templates

def sanitize_folder_name(name):
    """Sanitize name for use in folder name"""
    # Remove special characters, keep only alphanumeric, spaces, and common punctuation
    name = re.sub(r'[^\w\s\-&.]', '', name)
    # Replace spaces and special chars with underscores
    name = re.sub(r'[\s&.]+', '_', name)
    # Remove multiple underscores
    name = re.sub(r'_+', '_', name)
    # Remove leading/trailing underscores
    name = name.strip('_')
    return name

# Function to generate a single card
def generate_card(name, single_double, code, output_path):
    """Generate a single invitation card"""
    # Load the blank invitation
    try:
        img = Image.open('blank_invite.png')
    except Exception as e:
        print(f"Error loading blank_invite.png: {e}")
        return False

    # Convert to RGB if needed
    if img.mode != 'RGB':
        img = img.convert('RGB')

    # Create a copy to work with
    invite = img.copy()
    draw = ImageDraw.Draw(invite)
    width, height = invite.size

    # Load name font
    try:
        font_paths = [
            '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf',
            '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf',
            '/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf',
        ]
        name_font = None
        for path in font_paths:
            if os.path.exists(path):
                try:
                    name_font = ImageFont.truetype(path, 50)
                    break
                except:
                    continue
        
        if name_font is None:
            name_font = ImageFont.load_default()
    except Exception as e:
        name_font = ImageFont.load_default()

    # Position and draw the name
    name_x = width // 2
    target_bottom_y = 670  # Bottom of text should be at this position from top
    text_color = (0, 0, 0)  # Black color
    
    bbox = draw.textbbox((0, 0), name, font=name_font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    name_y = target_bottom_y - text_height
    text_x = name_x - text_width // 2
    
    draw.text((text_x, name_y), name, fill=text_color, font=name_font)

    # Load label font
    try:
        label_font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 38)
    except:
        try:
            label_font = ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf', 38)
        except:
            label_font = ImageFont.load_default()

    # Generate QR code
    qr_url = f"http://46.62.209.58/c/{code}"
    qr_size = 300

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
        # Create a placeholder QR code
        qr_img = Image.new('RGB', (qr_size, qr_size), 'white')
        qr_draw = ImageDraw.Draw(qr_img)
        block_size = 20
        for i in range(0, qr_size, block_size):
            for j in range(0, qr_size, block_size):
                if (i // block_size + j // block_size) % 2 == 0:
                    qr_draw.rectangle([i, j, i+block_size-2, j+block_size-2], fill='black')
        try:
            placeholder_font = ImageFont.load_default()
        except:
            placeholder_font = None
        text = "QR\nCODE"
        bbox = qr_draw.textbbox((0, 0), text, font=placeholder_font) if placeholder_font else (0, 0, 50, 20)
        text_x = (qr_size - (bbox[2] - bbox[0])) // 2
        text_y = (qr_size - (bbox[3] - bbox[1])) // 2
        qr_draw.text((text_x, text_y), text, fill='gray', font=placeholder_font)

    # Position QR code at bottom right
    label_text = single_double.upper()
    code_text = str(code)
    margin = 40
    qr_x = width - qr_size - margin
    qr_y = height - qr_size - margin

    # Calculate dimensions for both type and code text
    type_bbox = draw.textbbox((0, 0), label_text, font=label_font)
    type_height = type_bbox[3] - type_bbox[1] if type_bbox else 30
    type_width = type_bbox[2] - type_bbox[0] if type_bbox else 100

    code_bbox = draw.textbbox((0, 0), code_text, font=label_font)
    code_height = code_bbox[3] - code_bbox[1] if code_bbox else 30
    code_width = code_bbox[2] - code_bbox[0] if code_bbox else 100

    # Spacing between text elements
    label_spacing = 8
    qr_label_spacing = 20

    # Paste QR code
    invite.paste(qr_img, (qr_x, qr_y))

    # Add "SINGLE" or "DOUBLE" text above QR code, then code below it
    code_x = qr_x + (qr_size // 2) - (code_width // 2)
    code_y = qr_y - qr_label_spacing - code_height

    type_x = qr_x + (qr_size // 2) - (type_width // 2)
    type_y = code_y - label_spacing - type_height

    draw.text((type_x, type_y), label_text, fill=text_color, font=label_font)
    draw.text((code_x, code_y), code_text, fill=text_color, font=label_font)

    # Save the card
    invite.save(output_path)
    return True

# Read ODS file
try:
    import pandas as pd
    df = pd.read_excel('wedding_invites.ods', engine='odf')
    print(f"Loaded {len(df)} rows from spreadsheet")
except ImportError:
    # Try to parse ODS XML directly
    try:
        import xml.etree.ElementTree as ET
        import zipfile
        
        with zipfile.ZipFile('wedding_invites.ods', 'r') as z:
            content = z.read('content.xml')
        root = ET.fromstring(content)
        ns = {'table': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
              'text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0'}
        
        rows = root.findall('.//table:table-row', ns)
        data = []
        for row in rows:
            cells = row.findall('.//table:table-cell', ns)
            if len(cells) >= 4:
                name_elem = cells[0].find('.//text:p', ns)
                type_elem = cells[1].find('.//text:p', ns)
                code_elem = cells[3].find('.//text:p', ns)
                if name_elem is not None and name_elem.text and code_elem is not None and code_elem.text:
                    name = name_elem.text.replace('&amp;', '&')
                    single_double = type_elem.text if type_elem is not None and type_elem.text else "Single"
                    code = code_elem.text if code_elem is not None and code_elem.text else None
                    if code:
                        data.append({'name': name, 'type': single_double, 'code': code})
        
        # Create a simple dataframe-like structure
        class SimpleDF:
            def __init__(self, data):
                self.data = data
            def __iter__(self):
                return iter(self.data)
            def __len__(self):
                return len(self.data)
        
        df = SimpleDF(data)
        print(f"Loaded {len(df)} rows from spreadsheet")
    except Exception as e:
        print(f"Could not read spreadsheet: {e}")
        sys.exit(1)

# Load message templates
print("Loading message templates...")
message_templates = load_message_templates()
print(f"Loaded WhatsApp template: {message_templates['whatsapp'][:50]}...")
print(f"Loaded SMS template: {message_templates['sms'][:50]}...")

# Create cards directory
os.makedirs('cards', exist_ok=True)

# Generate cards for all guests
success_count = 0
error_count = 0

for row in df:
    if hasattr(row, 'iloc'):
        # pandas DataFrame row
        name = str(row.iloc[0]) if pd.notna(row.iloc[0]) else None
        single_double = str(row.iloc[1]) if pd.notna(row.iloc[1]) else "Single"
        code_raw = row.iloc[3]
        
        # Handle code (preserve leading zeros)
        if pd.notna(code_raw):
            if isinstance(code_raw, (int, float)):
                code = str(int(code_raw)).zfill(5)
            else:
                code = str(code_raw).rstrip('.0').zfill(5)
        else:
            code = None
    else:
        # Simple dict-like structure
        name = row.get('name')
        single_double = row.get('type', 'Single')
        code = row.get('code')
        if code and str(code).isdigit():
            code = str(code).zfill(5)
    
    if not name or not code or name == 'nan' or code == 'nan':
        continue
    
    # Create folder name: {sanitized_name}_{code}
    sanitized_name = sanitize_folder_name(name)
    folder_name = f"{sanitized_name}_{code}"
    folder_path = os.path.join('cards', folder_name)
    os.makedirs(folder_path, exist_ok=True)
    
    # Generate card
    card_path = os.path.join(folder_path, f"{code}.png")
    
    try:
        if generate_card(name, single_double, code, card_path):
            # Create WhatsApp message file
            whatsapp_message = message_templates['whatsapp'].format(code=code)
            whatsapp_path = os.path.join(folder_path, 'message_whatsapp.txt')
            with open(whatsapp_path, 'w', encoding='utf-8') as f:
                f.write(whatsapp_message)
            
            # Create SMS message file
            sms_message = message_templates['sms'].format(code=code)
            sms_path = os.path.join(folder_path, 'message_sms.txt')
            with open(sms_path, 'w', encoding='utf-8') as f:
                f.write(sms_message)
            
            success_count += 1
            if success_count % 10 == 0:
                print(f"Generated {success_count} cards with messages...")
        else:
            error_count += 1
            print(f"Error generating card for {name} (code: {code})")
    except Exception as e:
        error_count += 1
        print(f"Error generating card for {name} (code: {code}): {e}")

print(f"\nDone! Generated {success_count} cards with messages successfully.")
if error_count > 0:
    print(f"Errors: {error_count}")

