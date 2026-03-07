#!/usr/bin/env bash
#
# CYOA Creator Server Setup Script
# Interactive setup with platform detection and error handling
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to detect platform
detect_platform() {
    print_step "Detecting your operating system..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        PLATFORM="linux"
        print_success "Detected: Linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        PLATFORM="macos"
        print_success "Detected: macOS"
    elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        PLATFORM="windows"
        print_success "Detected: Windows"
    else
        PLATFORM="unknown"
        print_warning "Unknown platform: $OSTYPE"
    fi
}

# Function to check Node.js
check_nodejs() {
    print_step "Checking for Node.js installation..."
    
    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_success "Node.js found: $NODE_VERSION"
        
        # Check version (need >= 18)
        NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_MAJOR" -lt 18 ]; then
            print_error "Node.js version $NODE_VERSION is too old. Need version 18 or higher."
            return 1
        fi
        return 0
    else
        print_error "Node.js is not installed!"
        return 1
    fi
}

# Function to install Node.js on different platforms
install_nodejs_interactive() {
    print_step "Let's install Node.js for you..."
    echo ""
    echo "I'll try to install Node.js automatically, but you may need to:"
    echo "1. Enter your password if prompted"
    echo "2. Approve any system dialogs that appear"
    echo ""
    read -p "Press Enter to continue or Ctrl+C to cancel..."
    
    case $PLATFORM in
        linux)
            if command_exists apt-get; then
                print_info "Detected Debian/Ubuntu system"
                print_info "Updating package lists..."
                sudo apt-get update
                print_info "Installing Node.js..."
                sudo apt-get install -y nodejs npm
            elif command_exists yum; then
                print_info "Detected RHEL/CentOS/Fedora system"
                print_info "Installing Node.js..."
                sudo yum install -y nodejs npm
            elif command_exists pacman; then
                print_info "Detected Arch Linux system"
                print_info "Installing Node.js..."
                sudo pacman -S nodejs npm --noconfirm
            else
                print_error "Could not determine package manager. Please install Node.js manually from:"
                print_error "https://nodejs.org/"
                return 1
            fi
            ;;
        macos)
            if command_exists brew; then
                print_info "Using Homebrew to install Node.js..."
                brew install node
            else
                print_warning "Homebrew not found. Installing Homebrew first..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
                print_info "Now installing Node.js..."
                brew install node
            fi
            ;;
        windows)
            print_error "Automatic installation on Windows is not supported."
            print_info "Please download and install Node.js from:"
            print_info "https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi"
            print_info ""
            print_info "After installation, close and reopen this terminal, then run this script again."
            return 1
            ;;
        *)
            print_error "Unsupported platform. Please install Node.js manually from:"
            print_error "https://nodejs.org/"
            return 1
            ;;
    esac
    
    # Verify installation
    if command_exists node; then
        print_success "Node.js installed successfully!"
        print_info "Version: $(node --version)"
        return 0
    else
        print_error "Installation may have failed. Please try installing manually."
        return 1
    fi
}

# Function to check and install dependencies
install_dependencies() {
    print_step "Installing project dependencies..."
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found! Are you in the right directory?"
        print_info "Please make sure you're running this script from the CYOA Creator folder."
        return 1
    fi
    
    print_info "Running: npm install"
    print_info "This may take a few minutes..."
    echo ""
    
    if npm install; then
        print_success "Dependencies installed successfully!"
        return 0
    else
        print_error "Failed to install dependencies!"
        print_info "Common causes:"
        print_info "  - No internet connection"
        print_info "  - npm registry is down"
        print_info "  - Permission issues"
        print_info ""
        print_info "Try running: npm install --verbose"
        print_info "To see more details about what went wrong."
        return 1
    fi
}

# Function to check if port is in use
check_port() {
    local port=$1
    
    if command_exists lsof; then
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            return 0
        fi
    elif command_exists netstat; then
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            return 0
        fi
    elif command_exists ss; then
        if ss -tuln 2>/dev/null | grep -q ":$port "; then
            return 0
        fi
    fi
    
    return 1
}

# Function to start the server
start_server() {
    print_step "Starting the CYOA Creator server..."
    
    # Check if port 8787 is already in use
    if check_port 8787; then
        print_warning "Port 8787 is already in use!"
        print_info "Another instance might be running, or another app is using this port."
        print_info ""
        read -p "Do you want to try to kill the process using port 8787? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if command_exists lsof; then
                sudo kill -9 $(lsof -t -i:8787) 2>/dev/null || true
            fi
        else
            print_info "Please stop the other process first, or use a different port with:"
            print_info "PORT=3000 npm run dev:api"
            return 1
        fi
    fi
    
    print_success "Starting server on http://localhost:8787"
    print_info ""
    print_info "The server is now running! You can:"
    print_info "  1. Open your browser to http://localhost:5173 (frontend)"
    print_info "  2. Use the Android app to upload stories"
    print_info ""
    print_info "Press Ctrl+C to stop the server"
    print_info ""
    
    # Start the server
    npm run dev:api
}

# Function to create data directory
setup_data_directory() {
    print_step "Setting up data directory..."
    
    if [ ! -d "data" ]; then
        mkdir -p data/stories data/tmp
        print_success "Created data directories"
    else
        print_info "Data directory already exists"
    fi
}

# Main setup function
main() {
    # Clear screen for better presentation
    clear
    
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║         CYOA Creator Server Setup Assistant                ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    print_info "This script will help you set up and run the CYOA Creator server."
    print_info "It will check prerequisites, install dependencies, and start the server."
    echo ""
    read -p "Press Enter to begin setup..."
    echo ""
    
    # Detect platform
    detect_platform
    echo ""
    
    # Check Node.js
    if ! check_nodejs; then
        print_warning "Node.js is required but not found or too old."
        print_info "Node.js 18+ is needed to run the server."
        echo ""
        read -p "Would you like me to try to install Node.js for you? (Y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            if ! install_nodejs_interactive; then
                print_error "Failed to install Node.js automatically."
                print_info "Please install it manually from https://nodejs.org/ and try again."
                exit 1
            fi
        else
            print_info "Please install Node.js 18+ manually and run this script again."
            exit 1
        fi
    fi
    
    echo ""
    
    # Setup data directory
    setup_data_directory
    echo ""
    
    # Install dependencies
    if [ ! -d "node_modules" ]; then
        if ! install_dependencies; then
            print_error "Setup failed. Please fix the issues above and try again."
            exit 1
        fi
    else
        print_info "Dependencies already installed (node_modules exists)"
        read -p "Do you want to reinstall/update dependencies? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if ! install_dependencies; then
                print_error "Setup failed."
                exit 1
            fi
        fi
    fi
    
    echo ""
    
    # Success message
    print_success "Setup complete! Everything is ready to go."
    echo ""
    
    # Ask to start server
    read -p "Would you like to start the server now? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        echo ""
        start_server
    else
        print_info "You can start the server later by running:"
        print_info "  npm run dev:api"
        print_info ""
        print_info "Or run both frontend and backend together:"
        print_info "  npm run dev:all"
    fi
}

# Trap Ctrl+C
trap 'echo; print_info "Setup interrupted. You can run this script again anytime."; exit 0' INT

# Run main function
main
