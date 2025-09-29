#!/bin/bash
echo "Installing LionHook..."

# Update packages
pkg update && pkg upgrade -y

# Install required packages
pkg install python -y
pkg install openssl-tool -y

# Install pip
python -m ensurepip --upgrade

# Install Python packages
pip install flask flask-sslify pyopenssl

# Create directories
mkdir -p lionhook/templates lionhook/static lionhook/data/devices

# Generate SSL certificate
cd lionhook
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

echo "Installation complete!"
echo "To start LionHook:"
echo "cd lionhook && python main.py"
