#!/bin/bash
# Setup script for PiCamera LRN Scanner Server on Raspberry Pi
# Run this once to install dependencies

echo "=== PiCamera LRN Scanner Server Setup ==="

# Install system dependencies
echo "Installing system packages..."
sudo apt update
sudo apt install -y tesseract-ocr python3-pip python3-venv libcamera-dev

# Create virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "Installing Python packages..."
pip install flask flask-cors opencv-python pytesseract

# Try to install picamera2 (Raspberry Pi only)
echo "Attempting to install picamera2..."
pip install picamera2 2>/dev/null || echo "picamera2 not available (OK if not on Raspberry Pi)"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To start the camera server:"
echo "  cd picamera-server"
echo "  source venv/bin/activate"
echo "  python camera_server.py"
echo ""
echo "The server will run on http://localhost:5555"
echo "Make sure the kiosk web app is configured to connect to this address."
