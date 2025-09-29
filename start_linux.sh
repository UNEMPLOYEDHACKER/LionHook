#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Lion Logo
echo -e "${YELLOW}"
cat << "EOF"
 
██║       ██╗ ██████╗ ███╗   ██╗██╗  ██╗ ██████╗  ██████╗ ██╗  ██╗
██║       ██║██╔═══██╗████╗  ██║██║  ██║██╔═══██╗██╔═══██╗██║ ██╔╝
██║       ██║██║   ██║██╔██╗ ██║███████║██║   ██║██║   ██║█████╔╝ 
██        ██║██║   ██║██║╚██╗██║██╔══██║██║   ██║██║   ██║██╔═██╗ 
╚██████  ██║╚██████╔╝██║ ╚████║██║  ██║╚██████╔╝╚██████╔╝██║  ██╗
 ╚═════╝ ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝
EOF
echo -e "${NC}"
echo -e "${CYAN}           LionHook V1 - Linux Starter${NC}"
echo -e "${GREEN}         Developer: https://t.me/Akhand_Aryavart${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""

# Check if Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo -e "${RED}❌ This script is for Linux only!${NC}"
    exit 1
fi

# Function to check and install dependencies
install_dependencies() {
    echo -e "${BLUE}[*] Checking dependencies...${NC}"
    
    # Detect package manager
    if command -v apt &> /dev/null; then
        # Debian/Ubuntu
        PKG_MANAGER="apt"
        echo -e "${GREEN}[✅] Detected: Debian/Ubuntu${NC}"
    elif command -v yum &> /dev/null; then
        # RedHat/CentOS
        PKG_MANAGER="yum"
        echo -e "${GREEN}[✅] Detected: RedHat/CentOS${NC}"
    elif command -v dnf &> /dev/null; then
        # Fedora
        PKG_MANAGER="dnf"
        echo -e "${GREEN}[✅] Detected: Fedora${NC}"
    else
        echo -e "${RED}[❌] Unsupported package manager${NC}"
        exit 1
    fi
    
    # Check and install Python3
    if ! command -v python3 &> /dev/null; then
        echo -e "${YELLOW}[!] Installing Python3...${NC}"
        sudo $PKG_MANAGER update -y
        sudo $PKG_MANAGER install -y python3 python3-pip
    else
        echo -e "${GREEN}[✅] Python3 found${NC}"
    fi
    
    # Check and install OpenSSL
    if ! command -v openssl &> /dev/null; then
        echo -e "${YELLOW}[!] Installing OpenSSL...${NC}"
        sudo $PKG_MANAGER install -y openssl
    else
        echo -e "${GREEN}[✅] OpenSSL found${NC}"
    fi
    
    # Install Python packages
    echo -e "${BLUE}[*] Installing Python packages...${NC}"
    pip3 install flask flask-sslify pyopenssl
}

# Function to generate SSL certificate
generate_ssl() {
    if [[ ! -f "cert.pem" || ! -f "key.pem" ]]; then
        echo -e "${YELLOW}[!] Generating SSL certificate...${NC}"
        openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}[✅] SSL certificate generated${NC}"
        else
            echo -e "${RED}[❌] Failed to generate SSL certificate${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}[✅] SSL certificate found${NC}"
    fi
}

# Function to create directories
create_dirs() {
    mkdir -p templates static data/devices
    echo -e "${GREEN}[✅] Directory structure created${NC}"
}

# Function to check firewall
check_firewall() {
    if command -v ufw &> /dev/null && sudo ufw status | grep -q "active"; then
        echo -e "${YELLOW}[!] UFW firewall is active${NC}"
        read -p "Do you want to allow port 5000? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sudo ufw allow 5000/tcp
            echo -e "${GREEN}[✅] Port 5000 allowed in UFW${NC}"
        fi
    fi
}

# Function to get local IP
get_local_ip() {
    local ip=$(hostname -I | awk '{print $1}')
    if [ -z "$ip" ]; then
        ip="127.0.0.1"
    fi
    echo "$ip"
}

# Main execution
main() {
    # Check if main.py exists
    if [[ ! -f "main.py" ]]; then
        echo -e "${RED}❌ main.py not found!${NC}"
        echo -e "${YELLOW}Please run this script from LionHook directory${NC}"
        exit 1
    fi
    
    # Install dependencies
    install_dependencies
    
    # Generate SSL certificate
    generate_ssl
    
    # Create directories
    create_dirs
    
    # Check firewall
    check_firewall
    
    # Get local IP
    LOCAL_IP=$(get_local_ip)
    
    # Display information
    echo ""
    echo -e "${GREEN}🚀 LionHook V1 Ready!${NC}"
    echo -e "${CYAN}🌐 Access URLs:${NC}"
    echo -e "  • ${GREEN}Local:${NC}    https://localhost:5000"
    echo -e "  • ${GREEN}Network:${NC}  https://${LOCAL_IP}:5000"
    echo ""
    echo -e "${YELLOW}🔐 Default Credentials:${NC}"
    echo -e "  Username: ${CYAN}ONDORK${NC}"
    echo -e "  Password: ${CYAN}ONDORK${NC}"
    echo ""
    echo -e "${BLUE}💡 WAN Access:${NC}"
    echo -e "  • Forward port 5000 on your router"
    echo -e "  • Use your public IP for external access"
    echo ""
    echo -e "${RED}⚠️  Legal: Use responsibly and ethically${NC}"
    echo -e "${BLUE}=================================================${NC}"
    echo ""
    
    # Start the application
    python3 main.py
}

# Run main function
main
