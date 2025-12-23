#!/usr/bin/env python3
"""
Wedding invitation verification service
"""
from flask import Flask, render_template, request, jsonify, redirect, url_for
import os
import sys

# Try to read ODS file
try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False
    # Fallback to XML parsing
    import xml.etree.ElementTree as ET
    import zipfile

app = Flask(__name__)

# Path to the database file
DB_PATH = os.path.join(os.path.dirname(__file__), 'wedding_invites.ods')

def normalize_code(code):
    """Normalize code to 5-digit string with leading zeros"""
    if code is None:
        return None
    code_str = str(code).strip()
    # Remove any trailing .0 from float conversion
    code_str = code_str.rstrip('.0')
    # If it's all digits, pad to 5 digits
    if code_str.isdigit():
        return code_str.zfill(5)
    return code_str

def load_database():
    """Load the guest database from ODS file"""
    if not os.path.exists(DB_PATH):
        return {}
    
    guests = {}
    
    try:
        if HAS_PANDAS:
            df = pd.read_excel(DB_PATH, engine='odf')
            # Read code column as string to preserve leading zeros
            df[df.columns[3]] = df.iloc[:, 3].astype(str)
            for _, row in df.iterrows():
                name = str(row.iloc[0]) if pd.notna(row.iloc[0]) else None
                single_double = str(row.iloc[1]) if pd.notna(row.iloc[1]) else "Single"
                code_raw = row.iloc[3]
                
                if pd.notna(code_raw) and code_raw != 'nan':
                    code = normalize_code(code_raw)
                else:
                    code = None
                
                if name and code and name != 'nan' and code != 'nan':
                    guests[code] = {
                        'name': name,
                        'type': single_double,
                        'code': code
                    }
        else:
            # Parse ODS XML directly
            with zipfile.ZipFile(DB_PATH, 'r') as z:
                content = z.read('content.xml')
            root = ET.fromstring(content)
            ns = {'table': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
                  'text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0'}
            
            rows = root.findall('.//table:table-row', ns)
            for row in rows:
                cells = row.findall('.//table:table-cell', ns)
                if len(cells) >= 4:
                    name_elem = cells[0].find('.//text:p', ns)
                    type_elem = cells[1].find('.//text:p', ns)
                    code_elem = cells[3].find('.//text:p', ns)
                    
                    if name_elem is not None and name_elem.text and code_elem is not None and code_elem.text:
                        name = name_elem.text.replace('&amp;', '&')
                        single_double = type_elem.text if type_elem is not None and type_elem.text else "Single"
                        code = normalize_code(code_elem.text)
                        if code:
                            guests[code] = {
                                'name': name,
                                'type': single_double,
                                'code': code
                            }
    except Exception as e:
        print(f"Error loading database: {e}", file=sys.stderr)
    
    return guests

@app.route('/')
def index():
    """Main page with manual code entry"""
    return render_template('index.html')

@app.route('/c/<code>')
def verify_code(code):
    """Verify invitation by code (from QR code or direct link)"""
    guests = load_database()
    
    # Normalize the input code
    normalized_code = normalize_code(code)
    
    # Try normalized code first
    if normalized_code and normalized_code in guests:
        guest = guests[normalized_code]
        return render_template('verify.html', 
                             name=guest['name'],
                             type=guest['type'],
                             code=normalized_code,
                             found=True)
    
    # Try exact match (in case code is stored differently)
    if code in guests:
        guest = guests[code]
        return render_template('verify.html', 
                             name=guest['name'],
                             type=guest['type'],
                             code=code,
                             found=True)
    
    return render_template('verify.html', 
                         name=None,
                         type=None,
                         code=code,
                         found=False)

@app.route('/verify', methods=['POST'])
def verify_manual():
    """Verify invitation by manually entered code"""
    code = request.form.get('code', '').strip()
    if not code:
        return redirect(url_for('index'))
    
    return redirect(url_for('verify_code', code=code))

@app.route('/api/verify/<code>')
def api_verify(code):
    """API endpoint for verification"""
    guests = load_database()
    
    # Normalize the input code
    normalized_code = normalize_code(code)
    
    # Try normalized code first
    if normalized_code and normalized_code in guests:
        guest = guests[normalized_code]
        return jsonify({
            'found': True,
            'name': guest['name'],
            'type': guest['type'],
            'code': normalized_code
        })
    
    # Try exact match (in case code is stored differently)
    if code in guests:
        guest = guests[code]
        return jsonify({
            'found': True,
            'name': guest['name'],
            'type': guest['type'],
            'code': code
        })
    
    return jsonify({
        'found': False,
        'code': code
    }), 404

if __name__ == '__main__':
    # Production: debug=False, Development: debug=True
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=5000, debug=debug_mode)

