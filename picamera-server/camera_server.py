#!/usr/bin/env python3
"""
PiCamera LRN Scanner Server
Runs on the Raspberry Pi alongside the kiosk web app.
Captures frames from PiCamera, performs OCR, and serves results via HTTP API.

Endpoints:
  GET /stream       — MJPEG live stream for the browser to display
  GET /scan         — Capture + OCR, returns detected LRN
  GET /health       — Health check

Usage:
  pip install flask flask-cors opencv-python pytesseract picamera2
  python camera_server.py

For Raspberry Pi with PiCamera Module:
  - Uses picamera2 (libcamera) by default
  - Falls back to OpenCV VideoCapture if picamera2 is not available

Tesseract must be installed:
  sudo apt install tesseract-ocr
"""

import re
import io
import time
import base64
import logging
import threading
from flask import Flask, Response, jsonify
from flask_cors import CORS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# LRN pattern: XX-XXXX-XXX (9 digits with dashes)
LRN_PATTERN = re.compile(r'\d{2}-\d{4}-\d{3}')
# Also match plain 9 digits
PLAIN_PATTERN = re.compile(r'\b\d{9}\b')

# ─── Camera Abstraction ─────────────────────────────────────────

camera = None
camera_lock = threading.Lock()
camera_type = None  # 'picamera2' or 'opencv'


def init_camera():
    """Initialize camera — tries picamera2 first, then OpenCV."""
    global camera, camera_type

    # Try picamera2 first (Raspberry Pi Camera Module)
    try:
        from picamera2 import Picamera2
        cam = Picamera2()
        config = cam.create_still_configuration(
            main={"size": (1280, 720), "format": "RGB888"}
        )
        cam.configure(config)
        cam.start()
        time.sleep(1)  # Let camera warm up
        camera = cam
        camera_type = 'picamera2'
        logger.info("Camera initialized: picamera2 (PiCamera Module)")
        return
    except Exception as e:
        logger.info(f"picamera2 not available: {e}")

    # Fall back to OpenCV (USB webcam or V4L2)
    try:
        import cv2
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            # Try other indices
            for idx in [1, 2]:
                cap = cv2.VideoCapture(idx)
                if cap.isOpened():
                    break

        if not cap.isOpened():
            raise RuntimeError("No camera found on any index")

        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        cap.set(cv2.CAP_PROP_AUTOFOCUS, 1)
        camera = cap
        camera_type = 'opencv'
        logger.info("Camera initialized: OpenCV (USB/V4L2)")
    except Exception as e:
        logger.error(f"Failed to initialize any camera: {e}")
        raise


def capture_frame():
    """Capture a single frame as a numpy array (BGR for OpenCV, RGB for picamera2)."""
    import cv2

    with camera_lock:
        if camera_type == 'picamera2':
            frame = camera.capture_array()
            # picamera2 gives RGB, convert to BGR for OpenCV compatibility
            frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
            return frame
        else:
            ret, frame = camera.read()
            if not ret:
                raise RuntimeError("Failed to capture frame")
            return frame


def frame_to_jpeg(frame):
    """Convert numpy frame to JPEG bytes."""
    import cv2
    _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return buffer.tobytes()


def preprocess_for_ocr(frame):
    """Preprocess frame for better OCR results."""
    import cv2

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Apply adaptive threshold for varying lighting conditions
    thresh = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 31, 10
    )

    # Also try Otsu's method
    _, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    return thresh, otsu


def extract_lrn(frame):
    """Run OCR on a frame and try to extract the LRN number."""
    import pytesseract

    thresh, otsu = preprocess_for_ocr(frame)

    config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789-'

    # Try both preprocessed versions
    for img in [thresh, otsu]:
        text = pytesseract.image_to_string(img, config=config).strip()
        logger.debug(f"OCR text: {text}")

        # Try LRN format first (XX-XXXX-XXX)
        match = LRN_PATTERN.search(text)
        if match:
            lrn_raw = match.group()
            lrn_digits = lrn_raw.replace('-', '')
            return {
                'found': True,
                'lrn_formatted': lrn_raw,
                'lrn_digits': lrn_digits,
                'raw_text': text,
            }

        # Try plain 9-digit format
        match = PLAIN_PATTERN.search(text)
        if match:
            digits = match.group()
            return {
                'found': True,
                'lrn_formatted': f"{digits[:2]}-{digits[2:6]}-{digits[6:9]}",
                'lrn_digits': digits,
                'raw_text': text,
            }

    return {
        'found': False,
        'lrn_formatted': None,
        'lrn_digits': None,
        'raw_text': text if text else '',
    }


# ─── Routes ──────────────────────────────────────────────────────

@app.route('/health')
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'camera_type': camera_type,
        'camera_ready': camera is not None,
    })


@app.route('/scan')
def scan():
    """Capture a frame, run OCR, return detected LRN and frame as base64."""
    try:
        frame = capture_frame()
        result = extract_lrn(frame)

        # Also return the frame as base64 JPEG so the browser can display it
        jpeg_bytes = frame_to_jpeg(frame)
        frame_b64 = base64.b64encode(jpeg_bytes).decode('utf-8')
        result['frame'] = f"data:image/jpeg;base64,{frame_b64}"

        return jsonify(result)
    except Exception as e:
        logger.error(f"Scan error: {e}")
        return jsonify({'error': str(e), 'found': False}), 500


@app.route('/stream')
def stream():
    """MJPEG video stream for live preview in the browser."""
    def generate():
        while True:
            try:
                frame = capture_frame()
                jpeg = frame_to_jpeg(frame)
                yield (
                    b'--frame\r\n'
                    b'Content-Type: image/jpeg\r\n\r\n' + jpeg + b'\r\n'
                )
                time.sleep(0.066)  # ~15 fps
            except Exception as e:
                logger.error(f"Stream error: {e}")
                break

    return Response(
        generate(),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )


# ─── Main ────────────────────────────────────────────────────────

if __name__ == '__main__':
    init_camera()
    logger.info("Starting PiCamera LRN Scanner Server on port 5555")
    logger.info("Endpoints:")
    logger.info("  GET http://localhost:5555/stream  — Live video stream")
    logger.info("  GET http://localhost:5555/scan    — Capture + OCR scan")
    logger.info("  GET http://localhost:5555/health  — Health check")
    app.run(host='0.0.0.0', port=5555, threaded=True)
