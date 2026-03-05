"""
Motor control — GPIO-based roller feed for the Pi.
Stub mode if RPi.GPIO isn't available (dev machines).
"""
import time
import os

try:
    import RPi.GPIO as GPIO
    _GPIO_OK = True
except ImportError:
    _GPIO_OK = False
    print('[motor] RPi.GPIO not found — running in stub mode')

# GPIO pin config (BCM numbering) — adjust to match your wiring
MOTOR_IN1  = int(os.environ.get('MOTOR_IN1', 17))
MOTOR_IN2  = int(os.environ.get('MOTOR_IN2', 18))
MOTOR_ENA  = int(os.environ.get('MOTOR_ENA', 27))  # PWM enable pin

FEED_SPEED     = 60   # PWM duty cycle 0–100
FEED_DURATION  = 0.8  # seconds — how long to spin to advance one card
EJECT_DURATION = 0.6  # seconds — shorter eject pulse

_pwm = None

def init_motor():
    global _pwm
    if not _GPIO_OK:
        return
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(MOTOR_IN1, GPIO.OUT)
    GPIO.setup(MOTOR_IN2, GPIO.OUT)
    GPIO.setup(MOTOR_ENA, GPIO.OUT)
    _pwm = GPIO.PWM(MOTOR_ENA, 1000)
    _pwm.start(0)
    print('[motor] GPIO motor initialised')

def _run(direction: str, duration: float, speed: int = FEED_SPEED):
    if not _GPIO_OK or _pwm is None:
        print(f'[motor] STUB: {direction} for {duration}s at {speed}%')
        time.sleep(duration)
        return
    if direction == 'forward':
        GPIO.output(MOTOR_IN1, GPIO.HIGH)
        GPIO.output(MOTOR_IN2, GPIO.LOW)
    else:
        GPIO.output(MOTOR_IN1, GPIO.LOW)
        GPIO.output(MOTOR_IN2, GPIO.HIGH)
    _pwm.ChangeDutyCycle(speed)
    time.sleep(duration)
    _pwm.ChangeDutyCycle(0)

def feed_card():
    """Advance one card to the scan position."""
    _run('forward', FEED_DURATION)

def eject_card():
    """Push card out to the exit bin."""
    _run('forward', EJECT_DURATION)

def cleanup():
    if _GPIO_OK:
        if _pwm:
            _pwm.stop()
        GPIO.cleanup()
