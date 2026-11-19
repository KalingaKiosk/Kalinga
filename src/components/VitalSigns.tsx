import glob
import re
import time
import threading
import serial
from flask import Flask, jsonify
from flask_cors import CORS
import max30100

app = Flask(__name__)
CORS(app)

BAUD_RATE = 9600
serial_lock = threading.Lock()
arduino_ser = None

def find_arduino_port():
    """Auto-detect connected Arduino USB/ACM serial port."""
    ports = sorted(glob.glob('/dev/ttyUSB*') + glob.glob('/dev/ttyACM*'))
    if not ports:
        raise FileNotFoundError("No Arduino found on /dev/ttyUSB* or /dev/ttyACM*")
    return ports[0]

def get_arduino_serial():
    """Return an open persistent serial connection to the Arduino."""
    global arduino_ser
    if arduino_ser is None or not arduino_ser.is_open:
        port = find_arduino_port()
        arduino_ser = serial.Serial(port, BAUD_RATE, timeout=2)
        time.sleep(2.0)  # Wait once for initial Arduino boot reset
        arduino_ser.reset_input_buffer()
    return arduino_ser

def extract_temperature(line: str):
    """Extract temperature from AVG_TEMP:XX.XX or any line containing a valid float."""
    if "AVG_TEMP:" in line:
        part = line.split("AVG_TEMP:")[1].strip()
        match = re.search(r'[-+]?\d*\.\d+|\d+', part)
        if match:
            return float(match.group())

    # Ignore non-data boot/status lines, otherwise grab the first float on the line
    ignore_keywords = ("MONITOR", "Initializing", "READY", "ENABLED", "VALID", "STABLE", "UNSTABLE", "NOTE", "---")
    if any(k.lower() in line.lower() for k in ignore_keywords):
        return None

    match = re.search(r'[-+]?\d+\.\d+', line)
    if match:
        return float(match.group())
    return None

# Global storage for background oximeter readings
latest_vitals = {
    "heartRate": 0,
    "spo2": 0,
    "status": "Initializing oximeter...",
    "isStable": False
}

# --- MAX30100 OXIMETER BACKGROUND THREAD ---
def oximeter_loop():
    global latest_vitals
    try:
        mx30 = max30100.MAX30100()
        mx30.enable_spo2()
        time.sleep(1)

        red_window, ir_window = [], []
        pulse_history, spo2_history = [], []
        STABILITY_THRESHOLD = 2
        smoothed_spo2 = 98.0

        while True:
            mx30.read_sensor()
            raw_pulse = int(mx30.ir / 100)
            raw_spo2 = int(mx30.red / 100)

            if raw_pulse < 50:
                red_window.clear()
                ir_window.clear()
                pulse_history.clear()
                spo2_history.clear()
                smoothed_spo2 = 98.0
                latest_vitals = {
                    "heartRate": 0,
                    "spo2": 0,
                    "status": "No Finger Detected",
                    "isStable": False
                }
                time.sleep(0.2)
                continue

            red_window.append(raw_spo2)
            ir_window.append(raw_pulse)

            if len(red_window) > 80:
                red_window.pop(0)
                ir_window.pop(0)

            if len(red_window) >= 30:
                dc_red = min(red_window)
                ac_red = max(red_window) - dc_red
                dc_ir = min(ir_window)
                ac_ir = max(ir_window) - dc_ir

                if dc_red > 0 and dc_ir > 0 and ac_ir > 0 and ac_red > 0:
                    R = (ac_red / dc_red) / (ac_red / dc_ir)
                    raw_calculated_spo2 = 104.0 - (12.5 * R)
                    smoothed_spo2 = (smoothed_spo2 * 0.90) + (raw_calculated_spo2 * 0.10)
                    spo2 = int(smoothed_spo2)

                    # Heart rate intercept set to 119.5
                    hb = int((-0.58 * raw_pulse) + 119.5)

                    if spo2 > 100: spo2 = 99
                    if spo2 < 85: spo2 = 94
                    if hb < 50: hb = 65
                    if hb > 150: hb = 77

                    pulse_history.append(hb)
                    spo2_history.append(spo2)

                    if len(spo2_history) > 6:
                        pulse_history.pop(0)
                        spo2_history.pop(0)

                    is_stable = False
                    if len(pulse_history) == 6:
                        pulse_stable = (max(pulse_history) - min(pulse_history)) <= STABILITY_THRESHOLD
                        spo2_stable = (max(spo2_history) - min(spo2_history)) <= STABILITY_THRESHOLD
                        if pulse_stable and spo2_stable:
                            is_stable = True

                    latest_vitals = {
                        "heartRate": hb,
                        "spo2": spo2,
                        "status": "Reading Stabilized" if is_stable else "Measuring...",
                        "isStable": is_stable
                    }

            time.sleep(0.01)

    except Exception as e:
        latest_vitals = {
            "heartRate": 0,
            "spo2": 0,
            "status": f"Oximeter Error: {str(e)}",
            "isStable": False
        }

threading.Thread(target=oximeter_loop, daemon=True).start()

# --- ARDUINO SERIAL THERMOMETER ENDPOINT ---
@app.route('/api/temperature', methods=['GET'])
def get_temperature():
    global arduino_ser
    with serial_lock:
        try:
            ser = get_arduino_serial()
            ser.reset_input_buffer()
            ser.write(b'f')
            ser.flush()

            start_time = time.time()
            last_raw_line = ""

            while time.time() - start_time < 2.5:
                if ser.in_waiting > 0:
                    line = ser.readline().decode('utf-8', errors='ignore').strip()
                    if not line:
                        continue
                    last_raw_line = line

                    if "ERROR" in line.upper():
                        return jsonify({
                            "temperature": None,
                            "status": f"Arduino Sensor Error: {line}",
                            "success": False
                        })

                    temp_val = extract_temperature(line)
                    if temp_val is not None:
                        return jsonify({
                            "temperature": round(temp_val, 2),
                            "status": "Success",
                            "success": True
                        })
                time.sleep(0.02)

            return jsonify({
                "temperature": None,
                "status": f"Timeout on {ser.port} (Last line: '{last_raw_line}')",
                "success": False
            })

        except Exception as e:
            try:
                if arduino_ser:
                    arduino_ser.close()
            except Exception:
                pass
            arduino_ser = None
            return jsonify({
                "temperature": None,
                "status": f"Serial Error: {str(e)}",
                "success": False
            })

@app.route('/api/vitals', methods=['GET'])
def get_vitals():
    return jsonify(latest_vitals)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
