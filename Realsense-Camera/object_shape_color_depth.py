import cv2
import numpy as np
import pyrealsense2 as rs
from collections import deque
import time

# ==========================================
# CONFIGURATION
# ==========================================

USE_REALSENSE = True   # Set False for normal USB / Pi camera
ENABLE_TFLITE = False  # Set True if using TensorFlow Lite (Jetson)

# ==========================================
# REALSENSE SETUP (Leo Rover Compatible)
# ==========================================

if USE_REALSENSE:
    pipeline = rs.pipeline()
    config = rs.config()
    config.enable_stream(rs.stream.color, 640, 480, rs.format.bgr8, 30)
    config.enable_stream(rs.stream.depth, 640, 480, rs.format.z16, 30)
    profile = pipeline.start(config)
    align = rs.align(rs.stream.color)
    depth_scale = profile.get_device().first_depth_sensor().get_depth_scale()
else:
    cap = cv2.VideoCapture(0)

# ==========================================
# HSV COLOR RANGES (Lighting Robust)
# ==========================================

COLOR_RANGES = {
    "red": [(0, 120, 80, 10, 255, 255),
            (170, 120, 80, 180, 255, 255)],
    "green": [(35, 80, 80, 85, 255, 255)],
    "blue": [(90, 80, 80, 130, 255, 255)],
    "yellow": [(20, 80, 80, 35, 255, 255)],
    "orange": [(10, 100, 100, 20, 255, 255)]
}

# ==========================================
# DEPTH SMOOTHING
# ==========================================

depth_buffer = deque(maxlen=5)

# ==========================================
# SHAPE DETECTION
# ==========================================

def detect_shape(contour):
    epsilon = 0.02 * cv2.arcLength(contour, True)
    approx = cv2.approxPolyDP(contour, epsilon, True)
    vertices = len(approx)

    if vertices == 3:
        return "triangle"
    elif vertices == 4:
        x, y, w, h = cv2.boundingRect(approx)
        aspect = float(w) / (h + 1e-5)
        if 0.9 < aspect < 1.1:
            return "square"
        return "rectangle"
    elif vertices > 4:
        return "circle"
    return "unknown"

# ==========================================
# MAIN LOOP
# ==========================================

print("🚀 Leo Rover Dynamic Color Detection Running")

try:
    while True:

        # ===============================
        # Capture Frame
        # ===============================
        if USE_REALSENSE:
            frames = pipeline.wait_for_frames()
            aligned = align.process(frames)
            depth_frame = aligned.get_depth_frame()
            color_frame = aligned.get_color_frame()

            if not depth_frame or not color_frame:
                continue

            frame = np.asanyarray(color_frame.get_data())
            depth_image = np.asanyarray(depth_frame.get_data())
        else:
            ret, frame = cap.read()
            if not ret:
                break
            depth_image = None

        # ===============================
        # Image Preprocessing
        # ===============================
        blurred = cv2.GaussianBlur(frame, (5,5), 0)
        hsv = cv2.cvtColor(blurred, cv2.COLOR_BGR2HSV)

        detected_objects = []

        # ===============================
        # Color Segmentation
        # ===============================
        for color_name, ranges in COLOR_RANGES.items():

            mask_total = None

            for (h1,s1,v1,h2,s2,v2) in ranges:
                lower = np.array([h1,s1,v1])
                upper = np.array([h2,s2,v2])
                mask = cv2.inRange(hsv, lower, upper)
                mask_total = mask if mask_total is None else mask_total + mask

            # Noise Filtering
            kernel = np.ones((5,5), np.uint8)
            mask_total = cv2.morphologyEx(mask_total, cv2.MORPH_OPEN, kernel)
            mask_total = cv2.morphologyEx(mask_total, cv2.MORPH_CLOSE, kernel)

            contours, _ = cv2.findContours(mask_total,
                                           cv2.RETR_EXTERNAL,
                                           cv2.CHAIN_APPROX_SIMPLE)

            for contour in contours:

                area = cv2.contourArea(contour)
                if area < 800:
                    continue

                shape = detect_shape(contour)
                if shape == "unknown":
                    continue

                x, y, w, h = cv2.boundingRect(contour)

                M = cv2.moments(contour)
                if M["m00"] == 0:
                    continue

                cx = int(M["m10"] / M["m00"])
                cy = int(M["m01"] / M["m00"])

                depth_m = 0
                if USE_REALSENSE:
                    depth_m = depth_frame.get_distance(cx, cy)
                    if depth_m <= 0:
                        continue

                detected_objects.append({
                    "contour": contour,
                    "color": color_name,
                    "shape": shape,
                    "depth": depth_m,
                    "center": (cx, cy)
                })

        # ===============================
        # Select Nearest Object
        # ===============================
        if detected_objects:

            if USE_REALSENSE:
                target = min(detected_objects, key=lambda o: o["depth"])
                depth_buffer.append(target["depth"])
                depth_smooth = np.mean(depth_buffer)
            else:
                target = detected_objects[0]
                depth_smooth = 0

            cx, cy = target["center"]

            cv2.drawContours(frame, [target["contour"]], -1, (0,0,255), 3)
            cv2.circle(frame, (cx,cy), 6, (0,255,255), -1)

            label = f"TARGET: {target['color']} {target['shape']}"
            depth_text = f"Depth: {depth_smooth:.2f}m"

            cv2.putText(frame, label, (20,40),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,0,255), 2)

            if USE_REALSENSE:
                cv2.putText(frame, depth_text, (20,70),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,255), 2)

        # ===============================
        # Display
        # ===============================
        cv2.imshow("Leo Rover Color Detection", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

finally:
    if USE_REALSENSE:
        pipeline.stop()
    else:
        cap.release()
    cv2.destroyAllWindows()