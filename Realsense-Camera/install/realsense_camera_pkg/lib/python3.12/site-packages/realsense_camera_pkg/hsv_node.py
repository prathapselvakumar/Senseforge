import rclpy
from rclpy.node import Node
import numpy as np
import cv2
import pyrealsense2 as rs

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

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

DRAW_COLOUR = {
    "green": (0, 255, 0),
    "red":   (0, 0, 255),
    "blue":  (255, 0, 0),
}

MIN_CONTOUR_AREA = 200
MAX_NAVIGATE_DISTANCE_M = 3.0

def build_mask(hsv_frame: np.ndarray, ranges: list) -> np.ndarray:
    mask = None
    for (lo, hi) in ranges:
        m = cv2.inRange(hsv_frame, lo, hi)
        mask = m if mask is None else cv2.bitwise_or(mask, m)
    return mask

class HSVNode(Node):
    def __init__(self):
        super().__init__('hsv_node')
        self.get_logger().info('Initializing HSV Node...')

        self.pipeline = rs.pipeline()
        self.cfg = rs.config()
        self.cfg.enable_stream(rs.stream.color, 640, 480, rs.format.bgr8, 30)
        self.cfg.enable_stream(rs.stream.depth, 640, 480, rs.format.z16,  30)

        try:
            self.profile = self.pipeline.start(self.cfg)
            depth_sensor = self.profile.get_device().first_depth_sensor()
            self.depth_scale = depth_sensor.get_depth_scale()
            self.get_logger().info(f"RealSense started  |  depth_scale={self.depth_scale:.6f}")
        except Exception as e:
            self.get_logger().error(f"Failed to start RealSense pipeline: {e}")
            raise e

        # Use a timer to poll for frames
        self.timer_period = 1.0 / 30.0  # 30 Hz
        self.timer = self.create_timer(self.timer_period, self.timer_callback)

    def timer_callback(self):
        # Poll frames without blocking indefinitely
        frames = self.pipeline.poll_for_frames()
        if not frames:
            return

        color_frame = frames.get_color_frame()
        depth_frame = frames.get_depth_frame()

        if not color_frame or not depth_frame:
            return

        color_image = np.asanyarray(color_frame.get_data())
        depth_image = np.asanyarray(depth_frame.get_data())
        hsv_frame   = cv2.cvtColor(color_image, cv2.COLOR_BGR2HSV)

        depth_intrin = depth_frame.profile.as_video_stream_profile().intrinsics

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

                xyz = rs.rs2_deproject_pixel_to_point(
                    depth_intrin, [cX, cY], depth_value
                )

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

                length_cm = w * depth_value / depth_intrin.fx * 100
                width_cm  = h * depth_value / depth_intrin.fy * 100
                cv2.putText(
                    color_image,
                    f"L:{length_cm:.1f}cm W:{width_cm:.1f}cm",
                    (x, y + h + 16),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, dc, 1
                )

                dist = depth_value
                if best_detection is None or dist < best_detection[0]:
                    best_detection = (dist, colour, xyz)

        cv2.imshow("Detections", color_image)

        depth_vis = cv2.normalize(depth_image, None, 255, 0,
                                  cv2.NORM_INF, cv2.CV_8UC1)
        depth_vis = cv2.applyColorMap(
            cv2.equalizeHist(depth_vis), cv2.COLORMAP_JET
        )
        cv2.imshow("Depth", depth_vis)

        if cv2.waitKey(1) == ord("q"):
            self.get_logger().info("Quit requested - shutting down.")
            rclpy.shutdown()

    def destroy_node(self):
        super().destroy_node()
        self.pipeline.stop()
        cv2.destroyAllWindows()


def main(args=None):
    rclpy.init(args=args)
    node = HSVNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        if rclpy.ok():
            rclpy.shutdown()

if __name__ == '__main__':
    main()
