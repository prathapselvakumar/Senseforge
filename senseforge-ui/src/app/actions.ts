"use server";

import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function getDirectories(dirPath: string) {
  // kept for fallback/legacy if needed, though replaced by native picker
  try {
    const resolvedPath = dirPath ? path.resolve(dirPath) : process.env.HOME || "/";
    if (!fs.existsSync(resolvedPath)) {
      return { path: resolvedPath, dirs: [], error: "Directory does not exist" };
    }
    const entries = fs.readdirSync(resolvedPath, { withFileTypes: true });
    const dirs = entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.'))
      .map(e => e.name)
      .sort((a, b) => a.localeCompare(b));
    const parentPath = resolvedPath === "/" ? null : path.dirname(resolvedPath);
    return { path: resolvedPath, parentPath, dirs, error: null };
  } catch (error: any) {
    return { path: dirPath, parentPath: null, dirs: [], error: error.message };
  }
}

export async function openNativeFolderPicker(initialPath?: string): Promise<{ path: string | null, error: string | null }> {
  try {
    // This utilizes zenity on the host Linux machine to pop up the native GTK file dialog.
    // It will block the server action until the user makes a selection or cancels.
    const startPath = initialPath ? `--filename="${initialPath}"` : "";
    const { stdout } = await execAsync(`zenity --file-selection --directory --title="Select Workspace Folder" ${startPath}`);
    
    // Zenity returns the absolute path followed by a newline
    const selectedPath = stdout.trim();
    return { path: selectedPath, error: null };
  } catch (error: any) {
    // If the user clicks cancel, zenity exits with code 1. We shouldn't throw an error, just return null.
    if (error.code === 1) {
      return { path: null, error: null };
    }
    return { path: null, error: error.message };
  }
}

export async function generateWorkspace(
  basePath: string,
  baseWorkspaceName: string,
  config: any
): Promise<{ success: boolean; message: string }> {
  try {
    const modeSuffix = config.detectionMode && config.detectionMode !== 'yolo_world' 
      ? `_${config.detectionMode.replace('_', '')}` 
      : '';
    const workspaceName = `${baseWorkspaceName}${modeSuffix}`;

    const fullPath = path.join(basePath, workspaceName);
    const srcPath = path.join(fullPath, "src");

    if (!fs.existsSync(srcPath)) {
      fs.mkdirSync(srcPath, { recursive: true });
    }

    // 1. Generate Custom URDF (always generate senseforge_scene)
    const urdfDir = path.join(srcPath, "senseforge_scene", "urdf");
    if (!fs.existsSync(urdfDir)) {
      fs.mkdirSync(urdfDir, { recursive: true });
    }

    let armInclude = "";
    let cameraInclude = "";
    let mountParent = "world";

    if (config.requiresArm) {
      if (config.armType === "ur5e") {
        armInclude = `
  <xacro:include filename="$(find ur_description)/urdf/ur_macro.xacro"/>
  <xacro:ur_robot
    name="ur"
    tf_prefix=""
    parent="world"
    joint_limits_parameters_file="$(find ur_description)/config/ur5e/joint_limits.yaml"
    kinematics_parameters_file="$(find ur_description)/config/ur5e/default_kinematics.yaml"
    physical_parameters_file="$(find ur_description)/config/ur5e/physical_parameters.yaml"
    visual_parameters_file="$(find ur_description)/config/ur5e/visual_parameters.yaml"
    use_mock_hardware="true">
    <origin xyz="0 0 0" rpy="0 0 0" />
  </xacro:ur_robot>`;
        mountParent = "tool0";
      } else if (config.armType === "xarm6") {
        armInclude = `
  <xacro:include filename="$(find xarm_description)/urdf/xarm6/xarm6_robot_macro.xacro"/>
  <xacro:xarm6_robot prefix="" hw_ns="xarm" ros2_control_plugin="xarm_control/FakeXarmHW" />`;
        mountParent = "link6";
      } else if (config.armType === "franka") {
        armInclude = `
  <xacro:include filename="$(find franka_description)/robots/panda_arm.urdf.xacro"/>
  <xacro:panda_arm parent="world" />`;
        mountParent = "panda_link8";
      }
    }

    if (config.cameraType === "D435i") {
        cameraInclude = `
  <xacro:include filename="$(find realsense2_description)/urdf/_d435i.urdf.xacro"/>
  <xacro:sensor_d435i parent="${mountParent}" name="camera" use_nominal_extrinsics="true">
    <origin xyz="0 0 0" rpy="0 0 0"/>
  </xacro:sensor_d435i>`;
      } else if (config.cameraType === "D455") {
        cameraInclude = `
  <xacro:include filename="$(find realsense2_description)/urdf/_d455.urdf.xacro"/>
  <xacro:sensor_d455 parent="${mountParent}" name="camera" use_nominal_extrinsics="true">
    <origin xyz="0 0 0" rpy="0 0 0"/>
  </xacro:sensor_d455>`;
      } else {
        cameraInclude = `
  <!-- Placeholder for webcam -->
  <link name="camera_link"/>
  <joint name="camera_joint" type="fixed">
    <parent link="${mountParent}"/>
    <child link="camera_link"/>
    <origin xyz="0 0 0" rpy="0 0 0"/>
  </joint>`;
      }

      const xacroContent = `<?xml version="1.0"?>
<robot xmlns:xacro="http://ros.org/wiki/xacro" name="senseforge_scene">
  <link name="world" />
  ${armInclude}
  ${cameraInclude}
</robot>`;

      fs.writeFileSync(path.join(urdfDir, "scene.urdf.xacro"), xacroContent);

      // Create launch directory and simulation.launch.py
      const launchDir = path.join(srcPath, "senseforge_scene", "launch");
      if (!fs.existsSync(launchDir)) fs.mkdirSync(launchDir, { recursive: true });
      const launchContent = `import os
from launch import LaunchDescription
from launch.actions import ExecuteProcess, DeclareLaunchArgument, Shutdown
from launch.substitutions import LaunchConfiguration, Command
from launch_ros.actions import Node
from ament_index_python.packages import get_package_share_directory

def generate_launch_description():
    pkg_share = get_package_share_directory('senseforge_scene')
    urdf_file = os.path.join(pkg_share, 'urdf', 'scene.urdf.xacro')
    rviz_config = os.path.join(pkg_share, 'rviz', 'config.rviz')

    rsp_node = Node(
        package='robot_state_publisher',
        executable='robot_state_publisher',
        output='screen',
        parameters=[{'robot_description': Command(['xacro ', urdf_file])}]
    )

    gz_sim = ExecuteProcess(
        cmd=['gz', 'sim', '-r', 'empty.sdf'],
        output='screen'
    )

    gz_spawn = Node(
        package='ros_gz_sim',
        executable='create',
        arguments=['-topic', 'robot_description', '-name', 'senseforge_robot', '-z', '0.0'],
        output='screen'
    )

    rviz_node = Node(
        package='rviz2',
        executable='rviz2',
        arguments=['-d', rviz_config],
        output='screen',
        on_exit=Shutdown()
    )

    cv_node_name = LaunchConfiguration('cv_node', default='yolo_world_node')
    confidence = LaunchConfiguration('confidence', default='0.5')
    iou = LaunchConfiguration('iou', default='0.4')

    cv_node = Node(
        package='realsense_camera_pkg',
        executable=cv_node_name,
        output='screen',
        parameters=[{
            'confidence_threshold': confidence,
            'nms_threshold': iou
        }]
    )

    return LaunchDescription([
        DeclareLaunchArgument('cv_node', default_value='yolo_world_node'),
        DeclareLaunchArgument('confidence', default_value='0.5'),
        DeclareLaunchArgument('iou', default_value='0.4'),
        rsp_node,
        gz_sim,
        gz_spawn,
        rviz_node,
        cv_node
    ])
`;
      fs.writeFileSync(path.join(launchDir, "simulation.launch.py"), launchContent);

      // Create rviz directory and config.rviz
      const rvizDir = path.join(srcPath, "senseforge_scene", "rviz");
      if (!fs.existsSync(rvizDir)) fs.mkdirSync(rvizDir, { recursive: true });
      let rvizTopic = "/yolo_world/annotated_image";
      if (config.detectionMode === 'face_detection') {
        rvizTopic = "/face_detection/annotated_image";
      } else if (config.detectionMode === 'shape_color') {
        rvizTopic = "/shape_color/annotated_image";
      }

      const rvizContent = `Panels:
  - Class: rviz_common/Displays
    Name: Displays
  - Class: rviz_common/Views
    Name: Views
Visualization Manager:
  Class: ""
  Displays:
    - Class: rviz_default_plugins/Grid
      Name: Grid
      Value: true
    - Class: rviz_default_plugins/RobotModel
      Description Topic:
        Value: /robot_description
      Name: RobotModel
      Value: true
    - Class: rviz_default_plugins/Image
      Name: Image
      Topic:
        Value: ${rvizTopic}
      Value: true
  Global Options:
    Fixed Frame: world
  Views:
    Current:
      Class: rviz_default_plugins/Orbit
      Name: Current View
      Distance: 2.0
Window Geometry:
  Height: 800
  Width: 1200
`;
      fs.writeFileSync(path.join(rvizDir, "config.rviz"), rvizContent);

      // Create CMakeLists.txt and package.xml for senseforge_scene
      const cmakelists = `cmake_minimum_required(VERSION 3.8)
project(senseforge_scene)
find_package(ament_cmake REQUIRED)
install(DIRECTORY urdf launch rviz DESTINATION share/\${PROJECT_NAME})
ament_package()`;
      fs.writeFileSync(path.join(srcPath, "senseforge_scene", "CMakeLists.txt"), cmakelists);
      
      const pkgxml = `<?xml version="1.0"?>
<?xml-model href="http://download.ros.org/schema/package_format3.xsd" schematypens="http://www.w3.org/2001/XMLSchema"?>
<package format="3">
  <name>senseforge_scene</name>
  <version>0.0.0</version>
  <description>Generated scene</description>
  <maintainer email="user@todo.todo">user</maintainer>
  <license>TODO: License declaration</license>
  <buildtool_depend>ament_cmake</buildtool_depend>
  <export><build_type>ament_cmake</build_type></export>
</package>`;
      fs.writeFileSync(path.join(srcPath, "senseforge_scene", "package.xml"), pkgxml);

      // Copy the required hardware descriptions into the workspace so xacro can find them
      const baseSrcPath = "/home/laptop17/Projects/Realsense_Software/Realsense-Camera/src";
      
      const rsDescPath = path.join(baseSrcPath, "realsense_ros", "realsense2_description");
      if (fs.existsSync(rsDescPath)) await execAsync(`cp -r ${rsDescPath} ${srcPath}/`);

      if (config.requiresArm) {
        if (config.armType === "ur5e") {
          const urDescPath = path.join(baseSrcPath, "ur_description");
          if (fs.existsSync(urDescPath)) await execAsync(`cp -r ${urDescPath} ${srcPath}/`);
        } else if (config.armType === "xarm6") {
          const xarmDescPath = path.join(baseSrcPath, "xarm_ros2", "xarm_description");
          if (fs.existsSync(xarmDescPath)) await execAsync(`cp -r ${xarmDescPath} ${srcPath}/`);
        }
      }

    const sourcePkgPath = "/home/laptop17/Projects/Realsense_Software/Realsense-Camera/src/realsense_camera_pkg";
    if (fs.existsSync(sourcePkgPath)) {
      await execAsync(`cp -r ${sourcePkgPath} ${srcPath}/`);
    }

    const targetNodePath = path.join(srcPath, "realsense_camera_pkg/realsense_camera_pkg/yolo_world_node.py");
    if (fs.existsSync(targetNodePath)) {
      let content = fs.readFileSync(targetNodePath, "utf-8");
      if (config.confidence) {
        content = content.replace(/self\.declare_parameter\('confidence_threshold', [0-9.]+\)/, `self.declare_parameter('confidence_threshold', ${config.confidence})`);
      }
      if (config.iou) {
        content = content.replace(/self\.declare_parameter\('nms_threshold', [0-9.]+\)/, `self.declare_parameter('nms_threshold', ${config.iou})`);
      }
      if (config.cameraType === "System Webcam") {
        content = content.replace(
          "self.pipeline = rs.pipeline()",
          "self.use_realsense = False\n        self.cap = cv2.VideoCapture(0)"
        );
        content = content.replace("self.pipeline.start(self.config)", "");
        
        const originalPolling = `        frames = self.pipeline.poll_for_frames()
        if not frames:
            return

        color_frame = frames.get_color_frame()
        depth_frame = frames.get_depth_frame()

        if not color_frame or not depth_frame:
            return

        color_image = np.asanyarray(color_frame.get_data())`;

        const newPolling = `        if not hasattr(self, 'use_realsense') or self.use_realsense:
            frames = self.pipeline.poll_for_frames()
            if not frames: return
            color_frame = frames.get_color_frame()
            depth_frame = frames.get_depth_frame()
            if not color_frame or not depth_frame: return
            color_image = np.asanyarray(color_frame.get_data())
        else:
            ret, frame = self.cap.read()
            if not ret: return
            color_image = frame
            depth_frame = None`;

        content = content.replace(originalPolling, newPolling);

        const originalDepth = `                depth_value = float(depth_frame.get_distance(x_pixel, y_pixel))

                depth_intrin = depth_frame.profile.as_video_stream_profile().intrinsics
                depth_point = rs.rs2_deproject_pixel_to_point(depth_intrin, [x_pixel, y_pixel], depth_value)

                xyz_str = f"({depth_point[0]:.2f}, {depth_point[1]:.2f}, {depth_point[2]:.2f})"`;

        const newDepth = `                if depth_frame:
                    depth_value = float(depth_frame.get_distance(x_pixel, y_pixel))
                    depth_intrin = depth_frame.profile.as_video_stream_profile().intrinsics
                    depth_point = rs.rs2_deproject_pixel_to_point(depth_intrin, [x_pixel, y_pixel], depth_value)
                    xyz_str = f"({depth_point[0]:.2f}, {depth_point[1]:.2f}, {depth_point[2]:.2f})"
                else:
                    depth_value = 0.0
                    depth_point = [0.0, 0.0, 0.0]
                    xyz_str = "(0.0, 0.0, 0.0)"`;
        content = content.replace(originalDepth, newDepth);
      }
      fs.writeFileSync(targetNodePath, content);
    }

    const shapeColorNodePath = path.join(srcPath, "realsense_camera_pkg/realsense_camera_pkg/object_shape_color_node.py");
    if (fs.existsSync(shapeColorNodePath) && config.cameraType === "System Webcam") {
      let content = fs.readFileSync(shapeColorNodePath, "utf-8");
      content = content.replace("USE_REALSENSE = True", "USE_REALSENSE = False");
      fs.writeFileSync(shapeColorNodePath, content);
    }

    if (config.detectionMode === 'face_detection') {
      const faceNodePath = path.join(srcPath, "realsense_camera_pkg/realsense_camera_pkg/face_detection_node.py");
      const faceNodeCode = `import rclpy
from rclpy.node import Node
import cv2
import numpy as np
import pyrealsense2 as rs
from sensor_msgs.msg import Image
from std_msgs.msg import String
from cv_bridge import CvBridge
import json

class FaceDetectionNode(Node):
    def __init__(self):
        super().__init__('face_detection_node')
        self.get_logger().info('Initializing Face Detection Node...')
        
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        self.use_realsense = ${config.cameraType !== "System Webcam" ? "True" : "False"}
        
        if self.use_realsense:
            self.pipeline = rs.pipeline()
            self.config = rs.config()
            self.config.enable_stream(rs.stream.color, 640, 480, rs.format.bgr8, 30)
            self.config.enable_stream(rs.stream.depth, 640, 480, rs.format.z16, 30)
            self.pipeline.start(self.config)
        else:
            self.cap = cv2.VideoCapture(0)
            
        self.image_pub = self.create_publisher(Image, '/face_detection/annotated_image', 10)
        self.cv_bridge = CvBridge()
        
        self.timer = self.create_timer(1.0/30.0, self.timer_callback)

    def timer_callback(self):
        if self.use_realsense:
            frames = self.pipeline.poll_for_frames()
            if not frames: return
            color_frame = frames.get_color_frame()
            if not color_frame: return
            color_image = np.asanyarray(color_frame.get_data())
        else:
            ret, frame = self.cap.read()
            if not ret: return
            color_image = frame

        gray = cv2.cvtColor(color_image, cv2.COLOR_BGR2GRAY)
        
        faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)
        for (x, y, w, h) in faces:
            cv2.rectangle(color_image, (x, y), (x+w, y+h), (255, 0, 0), 2)
            cv2.putText(color_image, "Face", (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255,0,0), 2)
            
        try:
            ros_image = self.cv_bridge.cv2_to_imgmsg(color_image, encoding="bgr8")
            self.image_pub.publish(ros_image)
        except Exception as e:
            pass

    def destroy_node(self):
        super().destroy_node()
        if self.use_realsense:
            self.pipeline.stop()
        else:
            self.cap.release()

def main(args=None):
    rclpy.init(args=args)
    node = FaceDetectionNode()
    try: rclpy.spin(node)
    except KeyboardInterrupt: pass
    finally:
        node.destroy_node()
        if rclpy.ok(): rclpy.shutdown()

if __name__ == '__main__':
    main()
`;
      fs.writeFileSync(faceNodePath, faceNodeCode);

      // Update setup.py
      const setupPyPath = path.join(srcPath, "realsense_camera_pkg/setup.py");
      if (fs.existsSync(setupPyPath)) {
        let setupContent = fs.readFileSync(setupPyPath, "utf-8");
        setupContent = setupContent.replace(
          "'yolo_world_node = realsense_camera_pkg.yolo_world_node:main',",
          "'yolo_world_node = realsense_camera_pkg.yolo_world_node:main',\n            'face_detection_node = realsense_camera_pkg.face_detection_node:main',"
        );
        fs.writeFileSync(setupPyPath, setupContent);
      }
    }

    // Try to find ROS 2 setup script
    const rosDistros = ["jazzy", "humble", "iron", "galactic", "foxy"];
    let setupScript = "";
    for (const distro of rosDistros) {
      const scriptPath = `/opt/ros/${distro}/setup.bash`;
      if (fs.existsSync(scriptPath)) {
        setupScript = scriptPath;
        break;
      }
    }

    if (!setupScript) {
      return { success: false, message: "Error: ROS 2 installation not found in /opt/ros. Please install ROS 2 and colcon." };
    }

    // Return immediately. The terminal spawn in simulateWorkspace will run the colcon build visibly.
    return { success: true, message: `Workspace generated successfully at ${fullPath}` };
  } catch (error: any) {
    return { success: false, message: `Error: ${error.message}` };
  }
}

export async function getDefaultWorkspacePath() {
  return (process.env.HOME || "/home/user") + "/ros2_ws";
}

export async function simulateWorkspace(
  basePath: string,
  baseWorkspaceName: string,
  config: any
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Make it completely dynamic: always regenerate the workspace right before simulating
    // so the user never has to click 'Generate Workspace' to apply settings
    await generateWorkspace(basePath, baseWorkspaceName, config);

    const modeSuffix = config.detectionMode && config.detectionMode !== 'yolo_world' 
      ? `_${config.detectionMode.replace('_', '')}` 
      : '';
    const workspaceName = `${baseWorkspaceName}${modeSuffix}`;

    const fullPath = path.join(basePath, workspaceName);
    const { spawn } = require('child_process');

    const rosDistros = ["jazzy", "humble", "iron", "galactic", "foxy"];
    let setupScript = "";
    for (const distro of rosDistros) {
      const scriptPath = `/opt/ros/${distro}/setup.bash`;
      if (fs.existsSync(scriptPath)) {
        setupScript = scriptPath;
        break;
      }
    }

    if (!setupScript) {
      return { success: false, message: "Error: ROS 2 installation not found." };
    }

    const wsSetup = path.join(fullPath, "install", "setup.bash");
    // Always source the workspace after colcon build since colcon build will generate it.
    const wsSourceCmd = `source ${wsSetup} && `;

    let nodeName = "yolo_world_node";
    if (config.detectionMode === 'face_detection') {
      nodeName = "face_detection_node";
    } else if (config.detectionMode === 'shape_color') {
      nodeName = "object_shape_color_node";
    }

    const rosCmd = `cd ${fullPath} && source ${setupScript} && colcon build && ${wsSourceCmd} export DISPLAY=:0 && ros2 launch senseforge_scene simulation.launch.py cv_node:=${nodeName} confidence:=${config.confidence} iou:=${config.iou}`;
    
    // By ignoring SIGINT in the parent bash, Ctrl+C only kills ros2 launch, and then exec bash keeps the terminal open
    const bashWrapper = `trap '' SIGINT; ${rosCmd}; trap - SIGINT; exec bash`;

    const child = spawn('gnome-terminal', ['--', 'bash', '-c', bashWrapper], {
      detached: true,
      stdio: 'ignore',
      env: { ...process.env, DISPLAY: ':0' }
    });
    
    child.unref();

    return { success: true, message: `Simulation launched successfully` };
  } catch (error: any) {
    return { success: false, message: `Error: ${error.message}` };
  }
}

export async function getWorkspaces(basePath: string) {
  try {
    const entries = await fs.promises.readdir(basePath, { withFileTypes: true });
    return entries.filter(e => e.isDirectory() && e.name.startsWith('qc_workspace')).map(e => e.name);
  } catch (e) {
    return [];
  }
}

export async function deleteWorkspace(basePath: string, name: string) {
  try {
    const targetPath = path.join(basePath, name);
    if (!targetPath.startsWith(basePath) || name.includes('..')) {
      return { success: false, message: "Invalid workspace name." };
    }
    await fs.promises.rm(targetPath, { recursive: true, force: true });
    return { success: true, message: `Deleted ${name}` };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

import * as os from 'os';

export async function getSystemStats() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercent = Math.round((usedMem / totalMem) * 100);

  const cpus = os.cpus();
  let totalUser = 0, totalNice = 0, totalSys = 0, totalIdle = 0, totalIrq = 0;
  for (let cpu of cpus) {
    totalUser += cpu.times.user;
    totalNice += cpu.times.nice;
    totalSys += cpu.times.sys;
    totalIdle += cpu.times.idle;
    totalIrq += cpu.times.irq;
  }
  const totalTime = totalUser + totalNice + totalSys + totalIdle + totalIrq;
  const idleTime = totalIdle;
  const cpuPercent = totalTime > 0 ? Math.round(((totalTime - idleTime) / totalTime) * 100) : 0;

  return { cpu: cpuPercent, ram: memPercent };
}

export async function checkCameraStatus() {
  try {
    const { stdout } = await execAsync('lsusb');
    const lower = stdout.toLowerCase();
    const isConnected = lower.includes('realsense') || lower.includes('camera') || lower.includes('video');
    
    let cameraName = "System Webcam";
    if (lower.includes('d435i')) cameraName = "Intel RealSense D435i";
    else if (lower.includes('d455')) cameraName = "Intel RealSense D455";
    else if (lower.includes('d415')) cameraName = "Intel RealSense D415";
    else if (lower.includes('d405')) cameraName = "Intel RealSense D405";
    else if (lower.includes('realsense')) cameraName = "Intel RealSense Camera";

    return { connected: isConnected, name: isConnected ? cameraName : "No Camera" };
  } catch (e) {
    return { connected: false, name: "No Camera" };
  }
}
