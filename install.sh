#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Lion ASCII Art
show_lion_logo() {
    echo -e "${YELLOW}"
    cat << "EOF"
 
██║       ██╗ ██████╗ ███╗   ██╗██╗  ██╗ ██████╗  ██████╗ ██╗  ██╗
██║       ██║██╔═══██╗████╗  ██║██║  ██║██╔═══██╗██╔═══██╗██║ ██╔╝
██║       ██║██║   ██║██╔██╗ ██║███████║██║   ██║██║   ██║█████╔╝ 
██║       ██║██║   ██║██║╚██╗██║██╔══██║██║   ██║██║   ██║██╔═██╗ 
██████╔╝ ██║╚██████╔╝██║ ╚████║██║  ██║╚██████╔╝╚██████╔╝██║  ██╗
╚═════╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝
                                                                  
EOF
    echo -e "${NC}"
    echo -e "${CYAN}           Advanced Penetration Testing Tool${NC}"
    echo -e "${PURPLE}         Developed by: https://t.me/Akhand_Aryavart${NC}"
    echo -e "${GREEN}=========================================================${NC}"
    echo ""
}

# Detect OS and Architecture
detect_environment() {
    echo -e "${BLUE}[*] Detecting environment...${NC}"
    
    if [[ "$OSTYPE" == "linux-android"* ]]; then
        OS="Termux"
        echo -e "${GREEN}[+] Environment: Termux (Android)${NC}"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [[ -f "/etc/debian_version" ]]; then
            OS="Debian"
        elif [[ -f "/etc/redhat-release" ]]; then
            OS="RedHat"
        else
            OS="Linux"
        fi
        echo -e "${GREEN}[+] Environment: $OS${NC}"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macOS"
        echo -e "${GREEN}[+] Environment: macOS${NC}"
    elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        OS="Windows"
        echo -e "${GREEN}[+] Environment: Windows${NC}"
    else
        OS="Unknown"
        echo -e "${YELLOW}[!] Unknown environment: $OSTYPE${NC}"
    fi
    
    ARCH=$(uname -m)
    echo -e "${GREEN}[+] Architecture: $ARCH${NC}"
}

# Check dependencies
check_dependencies() {
    echo -e "${BLUE}[*] Checking dependencies...${NC}"
    
    local missing_deps=()
    
    # Check Python
    if command -v python3 &> /dev/null; then
        echo -e "${GREEN}[+] Python3 found${NC}"
    else
        echo -e "${RED}[-] Python3 not found${NC}"
        missing_deps+=("python3")
    fi
    
    # Check pip
    if command -v pip3 &> /dev/null; then
        echo -e "${GREEN}[+] pip3 found${NC}"
    else
        echo -e "${YELLOW}[!] pip3 not found, will attempt to install${NC}"
        missing_deps+=("pip3")
    fi
    
    # Check openssl for certificate generation
    if command -v openssl &> /dev/null; then
        echo -e "${GREEN}[+] OpenSSL found${NC}"
    else
        echo -e "${YELLOW}[!] OpenSSL not found${NC}"
        missing_deps+=("openssl")
    fi
    
    return ${#missing_deps[@]}
}

# Install dependencies based on OS
install_dependencies() {
    echo -e "${BLUE}[*] Installing dependencies...${NC}"
    
    case $OS in
        "Termux")
            echo -e "${CYAN}[*] Updating Termux packages...${NC}"
            pkg update && pkg upgrade -y
            echo -e "${CYAN}[*] Installing required packages...${NC}"
            pkg install python -y
            pkg install openssl-tool -y
            python -m ensurepip --upgrade
            ;;
        "Debian"|"Linux")
            echo -e "${CYAN}[*] Updating system packages...${NC}"
            sudo apt update && sudo apt upgrade -y
            echo -e "${CYAN}[*] Installing required packages...${NC}"
            sudo apt install python3 python3-pip openssl -y
            ;;
        "RedHat")
            echo -e "${CYAN}[*] Updating system packages...${NC}"
            sudo yum update -y
            echo -e "${CYAN}[*] Installing required packages...${NC}"
            sudo yum install python3 python3-pip openssl -y
            ;;
        "macOS")
            echo -e "${CYAN}[*] Checking for Homebrew...${NC}"
            if ! command -v brew &> /dev/null; then
                echo -e "${YELLOW}[!] Homebrew not found. Installing...${NC}"
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            echo -e "${CYAN}[*] Installing required packages...${NC}"
            brew install python3 openssl
            ;;
        "Windows")
            echo -e "${YELLOW}[!] Please install Python3 and OpenSSL manually on Windows${NC}"
            echo -e "${YELLOW}[!] Download Python: https://www.python.org/downloads/${NC}"
            echo -e "${YELLOW}[!] Download OpenSSL: https://slproweb.com/products/Win32OpenSSL.html${NC}"
            return 1
            ;;
        *)
            echo -e "${RED}[-] Unsupported OS for automatic dependency installation${NC}"
            return 1
            ;;
    esac
    
    return 0
}

# Install Python packages
install_python_packages() {
    echo -e "${BLUE}[*] Installing Python packages...${NC}"
    
    # Upgrade pip first
    python3 -m pip install --upgrade pip
    
    # Install required packages
    pip3 install flask flask-sslify pyopenssl
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[+] Python packages installed successfully${NC}"
        return 0
    else
        echo -e "${RED}[-] Failed to install Python packages${NC}"
        return 1
    fi
}

# Generate SSL certificate
generate_ssl_cert() {
    echo -e "${BLUE}[*] Generating SSL certificate...${NC}"
    
    if [[ -f "cert.pem" && -f "key.pem" ]]; then
        echo -e "${GREEN}[+] SSL certificate already exists${NC}"
        return 0
    fi
    
    openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[+] SSL certificate generated successfully${NC}"
        return 0
    else
        echo -e "${RED}[-] Failed to generate SSL certificate${NC}"
        return 1
    fi
}

# Create necessary directories and files
setup_application() {
    echo -e "${BLUE}[*] Setting up application...${NC}"
    
    # Create directory structure
    mkdir -p templates static data/devices
    
    # Check if main.py exists
    if [[ ! -f "main.py" ]]; then
        echo -e "${RED}[-] main.py not found in current directory${NC}"
        echo -e "${YELLOW}[!] Please make sure you're in the LionHook directory${NC}"
        return 1
    fi
    
    echo -e "${GREEN}[+] Directory structure created${NC}"
    return 0
}

# Create startup scripts
create_startup_scripts() {
    echo -e "${BLUE}[*] Creating startup scripts...${NC}"
    
    # For Linux/macOS/Termux
    cat > start.sh << 'EOF'
#!/bin/bash
echo "🦁 Starting LionHook V1..."
echo "Developer: https://t.me/Akhand_Aryavart"
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Please install Python3 first."
    exit 1
fi

# Check if required files exist
if [[ ! -f "main.py" ]]; then
    echo "❌ main.py not found. Please run install.sh first."
    exit 1
fi

if [[ ! -f "cert.pem" || ! -f "key.pem" ]]; then
    echo "🔐 Generating SSL certificate..."
    openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" 2>/dev/null
fi

echo "🚀 Starting LionHook server..."
echo "📱 Access URLs:"
echo "   • Dashboard: https://localhost:5000/dashboard"
echo "   • Login: https://localhost:5000/login"
echo "   • Default credentials: ONDORK / ONDORK"
echo ""
echo "💡 For WAN access, forward port 5000 on your router"
echo "🔒 Press Ctrl+C to stop the server"

python3 main.py
EOF

    # For Windows
    cat > start.bat << 'EOF'
@echo off
chcp 65001 >nul
echo 🦁 Starting LionHook V1...
echo Developer: https://t.me/Akhand_Aryavart
echo.

:: Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python first.
    pause
    exit /b 1
)

:: Check if required files exist
if not exist "main.py" (
    echo ❌ main.py not found. Please run install.sh first.
    pause
    exit /b 1
)

if not exist "cert.pem" if not exist "key.pem" (
    echo 🔐 Generating SSL certificate...
    openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" 2>nul
)

echo 🚀 Starting LionHook server...
echo 📱 Access URLs:
echo    • Dashboard: https://localhost:5000/dashboard
echo    • Login: https://localhost:5000/login
echo    • Default credentials: ONDORK / ONDORK
echo.
echo 💡 For WAN access, forward port 5000 on your router
echo 🔒 Press Ctrl+C to stop the server

python main.py
EOF

    chmod +x start.sh
    
    echo -e "${GREEN}[+] Startup scripts created${NC}"
    echo -e "${CYAN}[*] Use './start.sh' on Linux/macOS/Termux${NC}"
    echo -e "${CYAN}[*] Use 'start.bat' on Windows${NC}"
}

# Display final instructions
show_instructions() {
    echo -e "${GREEN}"
    echo "========================================================="
    echo "🦁 LIONHOOK V1 INSTALLATION COMPLETED SUCCESSFULLY! 🦁"
    echo "========================================================="
    echo -e "${NC}"
    
    echo -e "${CYAN}📁 Application Location:${NC} $(pwd)"
    echo -e "${CYAN}🔐 Default Credentials:${NC} Username: ONDORK, Password: ONDORK"
    echo ""
    
    echo -e "${YELLOW}🚀 QUICK START:${NC}"
    echo -e "  ${GREEN}./start.sh${NC}    # Linux/macOS/Termux"
    echo -e "  ${GREEN}start.bat${NC}     # Windows"
    echo ""
    
    echo -e "${BLUE}🌐 ACCESS URLs:${NC}"
    echo -e "  ${CYAN}• Dashboard:${NC} https://localhost:5000/dashboard"
    echo -e "  ${CYAN}• Login:${NC}     https://localhost:5000/login"
    echo -e "  ${CYAN}• Settings:${NC}  https://localhost:5000/settings"
    echo -e "  ${CYAN}• Gallery:${NC}   https://localhost:5000/gallery"
    echo ""
    
    echo -e "${PURPLE}📡 WAN ACCESS (Important!):${NC}"
    echo -e "  To access from other devices, you MUST:"
    echo -e "  1. Forward port 5000 on your router"
    echo -e "  2. Use your public IP instead of localhost"
    echo -e "  3. Ensure firewall allows port 5000"
    echo ""
    
    echo -e "${GREEN}🔧 FEATURES:${NC}"
    echo -e "  ✓ Advanced 3D Dashboard"
    echo -e "  ✓ Real-time Device Control"
    echo -e "  ✓ Data Gallery & File Management"
    echo -e "  ✓ HTTPS Secure Connection"
    echo -e "  ✓ Cross-Platform Support"
    echo ""
    
    echo -e "${YELLOW}📞 SUPPORT:${NC}"
    echo -e "  Developer: ${CYAN}https://t.me/Akhand_Aryavart${NC}"
    echo -e "  Report issues on GitHub"
    echo ""
    
    echo -e "${RED}⚠️  LEGAL DISCLAIMER:${NC}"
    echo -e "  This tool is for educational and authorized penetration"
    echo -e "  testing only. Use responsibly and ethically."
}

# Main installation function
main() {
    clear
    show_lion_logo
    
    echo -e "${YELLOW}[!] Starting LionHook V1 Installation...${NC}"
    echo -e "${YELLOW}[!] Legal Disclaimer: Use responsibly and ethically.${NC}"
    echo ""
    
    # Detect environment
    detect_environment
    
    # Check dependencies
    if ! check_dependencies; then
        echo -e "${YELLOW}[!] Missing dependencies detected${NC}"
        if [[ $OS != "Windows" ]]; then
            read -p "Do you want to install missing dependencies? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                install_dependencies
            else
                echo -e "${RED}[-] Installation aborted${NC}"
                exit 1
            fi
        fi
    fi
    
    # Install Python packages
    if ! install_python_packages; then
        echo -e "${RED}[-] Failed to install Python packages${NC}"
        exit 1
    fi
    
    # Generate SSL certificate
    if ! generate_ssl_cert; then
        echo -e "${RED}[-] Failed to generate SSL certificate${NC}"
        exit 1
    fi
    
    # Setup application
    if ! setup_application; then
        echo -e "${RED}[-] Failed to setup application${NC}"
        exit 1
    fi
    
    # Create startup scripts
    create_startup_scripts
    
    # Show final instructions
    show_instructions
}

# Run main function
main
