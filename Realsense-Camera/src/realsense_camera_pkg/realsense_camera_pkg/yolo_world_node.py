import rclpy
from rclpy.node import Node
import cv2
import numpy as np
import pyrealsense2 as rs
import supervision as sv
from inference.models.yolo_world.yolo_world import YOLOWorld
from sensor_msgs.msg import Image
from std_msgs.msg import String
from cv_bridge import CvBridge
import json

class YoloWorldNode(Node):
    def __init__(self):
        super().__init__('yolo_world_node')
        self.get_logger().info('Initializing YOLO-World Node...')

        # --- Parameters ---
        self.declare_parameter('classes', ["a blue cuboid", "a red cuboid", "a green cuboid"])
        self.declare_parameter('confidence_threshold', 0.01)
        self.declare_parameter('nms_threshold', 0.1)

        self.classes = self.get_parameter('classes').value
        self.confidence_threshold = self.get_parameter('confidence_threshold').value
        self.nms_threshold = self.get_parameter('nms_threshold').value

        self.get_logger().info(f'Configured classes: {self.classes}')

        # --- Model Setup ---
        self.model = YOLOWorld(model_id="yolo_world/s")
        self.model.set_classes(self.classes)

        # --- Realsense Setup ---
        self.pipeline = rs.pipeline()
        self.config = rs.config()
        self.config.enable_stream(rs.stream.color, 640, 480, rs.format.bgr8, 60)
        self.config.enable_stream(rs.stream.depth, 640, 480, rs.format.z16, 60)

        self.pipeline.start(self.config)

        # --- Publishers ---
        self.image_pub = self.create_publisher(Image, '/yolo_world/annotated_image', 10)
        self.detections_pub = self.create_publisher(String, '/yolo_world/detections', 10)
        self.cv_bridge = CvBridge()

        # Use a timer to poll for frames
        self.timer_period = 1.0 / 60.0  # 60 Hz
        self.timer = self.create_timer(self.timer_period, self.timer_callback)

    def timer_callback(self):
        # Wait for frames non-blockingly
        frames = self.pipeline.poll_for_frames()
        if not frames:
            return

        color_frame = frames.get_color_frame()
        depth_frame = frames.get_depth_frame()

        if not color_frame or not depth_frame:
            return

        color_image = np.asanyarray(color_frame.get_data())
        rgb_frame = cv2.cvtColor(color_image, cv2.COLOR_BGR2RGB)

        results = self.model.infer(rgb_frame, confidence=self.confidence_threshold)
        detections = sv.Detections.from_inference(results).with_nms(threshold=self.nms_threshold)

        BOUNDING_BOX_ANNOTATOR = sv.BoundingBoxAnnotator(thickness=2)
        LABEL_ANNOTATOR = sv.LabelAnnotator(text_thickness=2, text_scale=1, text_color=sv.Color.BLACK)
        
        labels = [
            f"{self.classes[class_id]} {confidence:0.3f}"
            for class_id, confidence in zip(detections.class_id, detections.confidence)
        ]
        
        annotated_frame = color_image.copy()
        annotated_frame = BOUNDING_BOX_ANNOTATOR.annotate(annotated_frame, detections)
        annotated_frame = LABEL_ANNOTATOR.annotate(annotated_frame, detections, labels=labels)

        detected_objects_data = []

        for i in range(len(detections)):
            xyxy = detections.xyxy[i]
            confidence = float(detections.confidence[i])
            class_id = int(detections.class_id[i])
            label = self.classes[class_id]
            
            if confidence is not None:
                x_pixel = int((xyxy[0] + xyxy[2]) / 2)
                y_pixel = int((xyxy[1] + xyxy[3]) / 2)

                depth_value = float(depth_frame.get_distance(x_pixel, y_pixel))

                depth_intrin = depth_frame.profile.as_video_stream_profile().intrinsics
                depth_point = rs.rs2_deproject_pixel_to_point(depth_intrin, [x_pixel, y_pixel], depth_value)

                xyz_str = f"({depth_point[0]:.2f}, {depth_point[1]:.2f}, {depth_point[2]:.2f})"
                
                # Draw on frame
                cv2.putText(annotated_frame, f"Class: {label}", (x_pixel, y_pixel), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
                cv2.putText(annotated_frame, f"Confidence: {confidence:.3f}", (x_pixel, y_pixel + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
                cv2.putText(annotated_frame, f"Depth: {depth_value:.2f} meters", (x_pixel, y_pixel + 40), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
                cv2.putText(annotated_frame, f"XYZ: {xyz_str}", (x_pixel, y_pixel + 60), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

                # Append to JSON output
                detected_objects_data.append({
                    "class": label,
                    "confidence": confidence,
                    "depth_meters": depth_value,
                    "xyz_camera_frame": [float(depth_point[0]), float(depth_point[1]), float(depth_point[2])]
                })

        # --- Publish Results ---
        # 1. Annotated Image
        try:
            ros_image = self.cv_bridge.cv2_to_imgmsg(annotated_frame, encoding="bgr8")
            self.image_pub.publish(ros_image)
        except Exception as e:
            self.get_logger().error(f"Failed to publish image: {e}")

        # 2. Detections JSON
        json_msg = String()
        json_msg.data = json.dumps({"detections": detected_objects_data})
        self.detections_pub.publish(json_msg)

    def destroy_node(self):
        super().destroy_node()
        self.pipeline.stop()

def main(args=None):
    rclpy.init(args=args)
    node = YoloWorldNode()
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
