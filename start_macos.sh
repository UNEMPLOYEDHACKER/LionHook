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
██║       ██║██║   ██║██║╚██╗██║██╔══██║██║   ██║██║   ██║██╔═██╗ 
██████   ██║╚██████╔╝██║ ╚████║██║  ██║╚██████╔╝╚██████╔╝██║  ██╗
╚═════╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝
EOF
echo -e "${NC}"
echo -e "${CYAN}           LionHook V1 - macOS Starter${NC}"
echo -e "${GREEN}         Developer: https://t.me/Akhand_Aryavart${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""

# Check if macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ This script is for macOS only!${NC}"
    exit 1
fi

# Function to check and install Homebrew
install_homebrew() {
    if ! command -v brew &> /dev/null; then
        echo -e "${YELLOW}[!] Homebrew not found. Installing...${NC}"
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # Add Homebrew to PATH for this session
        if [[ -x /opt/homebrew/bin/brew ]]; then
            eval "$(/opt/homebrew/bin/brew shellenv)"
        elif [[ -x /usr/local/bin/brew ]]; then
            eval "$(/usr/local/bin/brew shellenv)"
        fi
    else
        echo -e "${GREEN}[✅] Homebrew found${NC}"
    fi
}

# Function to check and install dependencies
install_dependencies() {
    echo -e "${BLUE}[*] Checking dependencies...${NC}"
    
    # Check Python3
    if ! command -v python3 &> /dev/null; then
        echo -e "${YELLOW}[!] Installing Python3...${NC}"
        brew install python
    else
        echo -e "${GREEN}[✅] Python3 found${NC}"
    fi
    
    # Check OpenSSL
    if ! command -v openssl &> /dev/null; then
        echo -e "${YELLOW}[!] Installing OpenSSL...${NC}"
        brew install openssl
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

# Function to check firewall (macOS)
check_firewall() {
    local firewall_status=$(defaults read /Library/Preferences/com.apple.alf globalstate 2>/dev/null)
    if [[ "$firewall_status" == "1" ]]; then
        echo -e "${YELLOW}[!] macOS Firewall is enabled${NC}"
        echo -e "${YELLOW}[!] You may need to allow incoming connections${NC}"
    fi
}

# Function to get local IP
get_local_ip() {
    local ip=$(ipconfig getifaddr en0)
    if [ -z "$ip" ]; then
        ip=$(ipconfig getifaddr en1)
    fi
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
    
    # Install Homebrew if needed
    install_homebrew
    
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
    echo -e "${CYAN}🍎 Access URLs:${NC}"
    echo -e "  • ${GREEN}Local:${NC}    https://localhost:5000"
    echo -e "  • ${GREEN}Network:${NC}  https://${LOCAL_IP}:5000"
    echo ""
    echo -e "${YELLOW}🔐 Default Credentials:${NC}"
    echo -e "  Username: ${CYAN}ONDORK${NC}"
    echo -e "  Password: ${CYAN}ONDORK${NC}"
    echo ""
    echo -e "${BLUE}💡 macOS Tips:${NC}"
    echo -e "  • First run may prompt for network permissions"
    echo -e "  • Allow incoming connections if prompted"
    echo -e "  • For WAN: Forward port 5000 on your router"
    echo ""
    echo -e "${RED}⚠️  Legal: Use responsibly and ethically${NC}"
    echo -e "${BLUE}=================================================${NC}"
    echo ""
    
    # Start the application
    python3 main.py
}

# Run main function
main
