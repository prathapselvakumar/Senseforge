"""
HSV Object Detection (Standalone / No ROS2)
-------------------------------------------
1. Reads colour + depth frames from an Intel RealSense camera.
2. Detects green / red / blue objects via HSV segmentation.
3. Finds the 3D position of the object in the camera frame.
"""

import numpy as np
import cv2
import pyrealsense2 as rs

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# HSV colour ranges  (H: 0-179, S: 0-255, V: 0-255 in OpenCV)
COLOUR_RANGES = {
    "green": [
        (np.array([35,  50,  50]), np.array([90, 255, 255])),
    ],
    "red": [
        (np.array([0,  100, 100]), np.array([10,  255, 255])),
        (np.array([170, 100, 100]), np.array([180, 255, 255])),
    ],
    "blue": [
        (np.array([100, 100, 100]), np.array([140, 255, 255])),
    ],
}

# BGR draw colours (for cv2 annotations)
DRAW_COLOUR = {
    "green": (0, 255, 0),
    "red":   (0, 0, 255),
    "blue":  (255, 0, 0),
}

# Minimum contour area (px²) to consider a detection valid
MIN_CONTOUR_AREA = 200

# Only track objects closer than this distance (metres)
MAX_NAVIGATE_DISTANCE_M = 3.0

# ---------------------------------------------------------------------------
# Helper: build a colour mask from one or more HSV ranges
# ---------------------------------------------------------------------------

def build_mask(hsv_frame: np.ndarray, ranges: list) -> np.ndarray:
    mask = None
    for (lo, hi) in ranges:
        m = cv2.inRange(hsv_frame, lo, hi)
        mask = m if mask is None else cv2.bitwise_or(mask, m)
    return mask

# ---------------------------------------------------------------------------
# Main Loop
# ---------------------------------------------------------------------------

def main():
    # ── RealSense pipeline ────────────────────────────────────────────────
    pipeline = rs.pipeline()
    cfg = rs.config()
    cfg.enable_stream(rs.stream.color, 640, 480, rs.format.bgr8, 30)
    cfg.enable_stream(rs.stream.depth, 640, 480, rs.format.z16,  30)

    try:
        profile = pipeline.start(cfg)
        depth_sensor = profile.get_device().first_depth_sensor()
        depth_scale = depth_sensor.get_depth_scale()
        print(f"RealSense started  |  depth_scale={depth_scale:.6f}")
    except Exception as e:
        print(f"Failed to start RealSense pipeline: {e}")
        return

    try:
        while True:
            # ── Grab frames ──────────────────────────────────────────────────────
            frames = pipeline.wait_for_frames()
            color_frame = frames.get_color_frame()
            depth_frame = frames.get_depth_frame()

            if not color_frame or not depth_frame:
                continue

            color_image = np.asanyarray(color_frame.get_data())
            depth_image = np.asanyarray(depth_frame.get_data())
            hsv_frame   = cv2.cvtColor(color_image, cv2.COLOR_BGR2HSV)

            depth_intrin = depth_frame.profile.as_video_stream_profile().intrinsics

            # ── Detect objects for every colour ──────────────────────────────────
            best_detection = None   # (distance, colour, xyz_camera)

            for colour, ranges in COLOUR_RANGES.items():
                mask = build_mask(hsv_frame, ranges)
                contours, _ = cv2.findContours(
                    mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
                )

                for contour in contours:
                    area = cv2.contourArea(contour)
                    if area < MIN_CONTOUR_AREA:
                        continue

                    x, y, w, h = cv2.boundingRect(contour)
                    cX = x + w // 2
                    cY = y + h // 2

                    depth_value = depth_frame.get_distance(cX, cY)
                    if depth_value <= 0 or depth_value > MAX_NAVIGATE_DISTANCE_M:
                        continue

                    # 3-D point in camera optical frame
                    xyz = rs.rs2_deproject_pixel_to_point(
                        depth_intrin, [cX, cY], depth_value
                    )

                    # ── Annotate frame ────────────────────────────────────────
                    dc = DRAW_COLOUR[colour]
                    cv2.rectangle(color_image, (x, y), (x+w, y+h), dc, 2)

                    label = (
                        f"{colour.upper()}  "
                        f"X:{xyz[0]:.2f} Y:{xyz[1]:.2f} Z:{xyz[2]:.2f} m"
                    )
                    cv2.putText(
                        color_image, label, (x, y - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, dc, 1, cv2.LINE_AA
                    )

                    # Convert px bounding-box to real-world size (cm)
                    length_cm = w * depth_value / depth_intrin.fx * 100
                    width_cm  = h * depth_value / depth_intrin.fy * 100
                    cv2.putText(
                        color_image,
                        f"L:{length_cm:.1f}cm W:{width_cm:.1f}cm",
                        (x, y + h + 16),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, dc, 1
                    )

                    # Keep the closest detection
                    dist = depth_value
                    if best_detection is None or dist < best_detection[0]:
                        best_detection = (dist, colour, xyz)

            # ── Show windows ─────────────────────────────────────────────────────
            cv2.imshow("Detections", color_image)

            depth_vis = cv2.normalize(depth_image, None, 255, 0,
                                      cv2.NORM_INF, cv2.CV_8UC1)
            depth_vis = cv2.applyColorMap(
                cv2.equalizeHist(depth_vis), cv2.COLORMAP_JET
            )
            cv2.imshow("Depth", depth_vis)

            if cv2.waitKey(1) == ord("q"):
                print("Quit requested - shutting down.")
                break

    except KeyboardInterrupt:
        pass
    finally:
        pipeline.stop()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()