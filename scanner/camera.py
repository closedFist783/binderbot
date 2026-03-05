"""
Camera abstraction — works with Pi Camera (picamera2) or any OpenCV-compatible webcam.
Falls back to a test image if no camera hardware is found.
"""
import os
import time
from PIL import Image

# Try picamera2 first (Pi), then OpenCV
try:
    from picamera2 import Picamera2
    _USE_PICAMERA = True
except ImportError:
    _USE_PICAMERA = False

try:
    import cv2
    _USE_CV2 = not _USE_PICAMERA
except ImportError:
    _USE_CV2 = False

_picam = None
_cv2_cap = None

def init_camera():
    global _picam, _cv2_cap
    if _USE_PICAMERA:
        _picam = Picamera2()
        config = _picam.create_still_configuration(main={'size': (2028, 1520)})
        _picam.configure(config)
        _picam.start()
        time.sleep(2)  # warm-up
        print('[camera] Pi camera initialised')
    elif _USE_CV2:
        _cv2_cap = cv2.VideoCapture(0)
        _cv2_cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
        _cv2_cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
        print('[camera] OpenCV camera initialised')
    else:
        print('[camera] No camera found — will use test images')

def capture() -> Image.Image:
    """Capture a single frame and return as PIL Image."""
    if _USE_PICAMERA and _picam:
        arr = _picam.capture_array()
        return Image.fromarray(arr)
    elif _USE_CV2 and _cv2_cap:
        ret, frame = _cv2_cap.read()
        if not ret:
            raise RuntimeError('OpenCV capture failed')
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        return Image.fromarray(frame_rgb)
    else:
        # Dev mode: return a blank white image so the pipeline still runs
        print('[camera] DEV MODE: returning blank test image')
        return Image.new('RGB', (800, 1120), color=(240, 240, 240))

def close_camera():
    global _picam, _cv2_cap
    if _picam:
        _picam.close()
        _picam = None
    if _cv2_cap:
        _cv2_cap.release()
        _cv2_cap = None
