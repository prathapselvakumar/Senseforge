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
  workspaceName: string,
  config: any
): Promise<{ success: boolean; message: string }> {
  try {
    const fullPath = path.join(basePath, workspaceName);
    const srcPath = path.join(fullPath, "src");

    if (!fs.existsSync(srcPath)) {
      fs.mkdirSync(srcPath, { recursive: true });
    }

    // 1. Generate Custom URDF if Arm is required
    if (config.requiresArm) {
      const urdfDir = path.join(srcPath, "senseforge_scene", "urdf");
      if (!fs.existsSync(urdfDir)) {
        fs.mkdirSync(urdfDir, { recursive: true });
      }

      let armInclude = "";
      let cameraInclude = "";
      let mountParent = "world";

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
  <xacro:xarm6_robot prefix="" namespace="" ros2_control_plugin="xarm_control/FakeXarmHW" />`;
        mountParent = "link6";
      } else if (config.armType === "franka") {
        armInclude = `
  <xacro:include filename="$(find franka_description)/robots/panda_arm.urdf.xacro"/>
  <xacro:panda_arm parent="world" />`;
        mountParent = "panda_link8";
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

      // Create CMakeLists.txt and package.xml for senseforge_scene
      const cmakelists = `cmake_minimum_required(VERSION 3.8)
project(senseforge_scene)
find_package(ament_cmake REQUIRED)
install(DIRECTORY urdf DESTINATION share/\${PROJECT_NAME})
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
      fs.writeFileSync(targetNodePath, content);
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

    await execAsync(`bash -c "source ${setupScript} && cd ${fullPath} && colcon build"`);

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
  workspaceName: string,
  config: any
): Promise<{ success: boolean; message: string }> {
  try {
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
    const wsSourceCmd = fs.existsSync(wsSetup) ? `source ${wsSetup} && ` : "";

    const cmd = `source ${setupScript} && ${wsSourceCmd} export DISPLAY=:0 && gz sim & rviz2 & ros2 run rosbridge_server rosbridge_websocket & ros2 run realsense_camera_pkg yolo_world_node --ros-args -p confidence_threshold:=${config.confidence} -p nms_threshold:=${config.iou} &`;
    
    const child = spawn('bash', ['-c', cmd], {
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
