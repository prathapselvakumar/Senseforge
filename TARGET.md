# SenseForge — Project Target Document

## Vision

A unified, offline-first desktop web application that acts as the central platform for all Intel RealSense cameras. Users select a camera, choose a use case, configure parameters, upload custom data, train using reinforcement learning, and receive a fully generated ROS2 workspace — ready to deploy on real hardware including KUKA and ABB robot arms.

---

## Problem Statement

Intel RealSense cameras are powerful but fragmented. Engineers must manually write ROS2 nodes, configure camera parameters, integrate ML models, and wire up robot arms from scratch every time. No unified tool exists that:

- Supports all RealSense camera models
- Covers every major robotics use case
- Generates ready-to-run ROS2 workspaces automatically
- Enables RL-based training without deep expertise
- Works fully offline on a NUC or local machine

SenseForge solves all of this.

---

## Target Users

| User Type | Technical Level | Primary Need |
|---|---|---|
| Factory engineers | Low | Quality control, no coding |
| Robotics researchers | High | Custom RL experiments |
| Robotics developers | Medium | ROS2 workspace scaffolding |
| Students / hobbyists | Low–Medium | Learning + prototyping |

---

## Supported Hardware

### Intel RealSense Cameras

| Camera | Type | Key Feature |
|---|---|---|
| D405 | Depth | Close-range, manipulation |
| D415 | Depth | High accuracy scanning |
| D435i | Depth + IMU | General robotics (primary dev camera) |
| D455 | Depth + IMU | Long range, outdoor |
| D555 | Depth + IMU | New industrial, PoE, ROS2 native |
| L515 | LiDAR Depth | Indoor high accuracy |
| T265 | Tracking | Visual odometry, SLAM |

### Robot Arms

**KUKA**
- KR 3 R540
- KR 6 R900
- KR 10 R1100
- KR AGILUS
- LBR iiwa 7 / 14 (collaborative)

**ABB**
- IRB 120
- IRB 1200
- IRB 2600
- GoFa CRB 15000 (collaborative)
- YuMi IRB 14000 (dual arm)

---

## Use Cases (Modules)

Each module is a predefined ROS2 template that gets copied, configured, and deployed.

| Module | Supported Cameras | Arm Required |
|---|---|---|
| Quality control / defect detection | D405, D415, D435i | Optional |
| Object detection + 3D localisation | D415, D435i, D455, D555 | Optional |
| Robot arm pick and place | D405, D415, D435i | Yes |
| RL-based arm training | D435i, D455, D555 | Yes |
| SLAM / mapping | D435i, D455, T265 | No |
| Visual odometry | T265, D435i | No |
| Human pose / gesture detection | D435i, D455 | No |
| Dimension measurement | D405, D415, D555 | No |
| Point cloud scanning | D415, D455, L515 | No |
| Obstacle avoidance | D435i, D455, D555 | No |
| Face detection | D435i, D455 | No |

---

## Platform Architecture

```
React / Next.js Frontend (browser)
         |
    WebSocket (roslibjs)
         |
  rosbridge_suite
         |
    ROS2 Layer
    /         \
Camera Node   Arm Node
(pyrealsense2) (MoveIt2 / KUKA / ABB drivers)
         |
   Use Case Nodes
   (YOLOv8 / RL agent / Nav2 / PCL)
         |
  Generated Workspace
  (saved to local filesystem)
```

---

## User Flow

```
1. Open SenseForge in browser (localhost)
2. Select RealSense camera (auto-detected or manual)
3. Select robot arm (optional)
4. Select use case (filtered by valid camera + arm combo)
5. Configure parameters (resolution, FPS, thresholds)
6. Upload custom dataset or model (optional)
7. Click GENERATE WORKSPACE
8. Workspace saved to local system
9. Click LAUNCH — colcon build + ros2 launch runs automatically
10. Live view: camera feed, results, logs
11. Optional: open workspace and customise code
```

---

## Generated ROS2 Workspace Structure

```
/senseforge_ws/
  /src/
    /realsense_node/
        realsense_node.py
        launch/realsense.launch.py
    /detection_node/          ← if detection use case
        yolov8_node.py
        launch/detection.launch.py
    /arm_control_node/        ← if arm selected
        moveit_node.py
        launch/arm.launch.py
    /rl_agent_node/           ← if RL selected
        ppo_agent.py
        environment.py
        reward.py
        launch/training.launch.py
  /config/
      camera_config.yaml
      model_config.yaml
      arm_config.yaml
      rl_config.yaml
  /models/
      custom_model.pt         ← user uploaded or RL trained
  CMakeLists.txt
  package.xml
  README.md                   ← auto-generated instructions
```

---

## Reinforcement Learning Pipeline

Training flow when RL module is selected:

```
User uploads:
  - Demonstration images / depth frames
  - Success / failure labels
         ↓
Platform converts to RL training format
         ↓
Simulation phase (PyBullet / Isaac Gym)
  - PPO / SAC / HER trains safely in sim
         ↓
Sim-to-Real transfer
  - RealSense visual domain adaptation
         ↓
Policy saved as trained_policy.pt
         ↓
ROS2 rl_agent_node loads policy
         ↓
Runs on real arm hardware
```

### Supported RL Algorithms

| Algorithm | Best For |
|---|---|
| PPO | General arm control |
| SAC | Continuous joint control |
| HER | Pick and place tasks |
| Sim-to-Real | Safe training before real deployment |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React / Next.js |
| Camera bridge | WebSocket via roslibjs |
| ROS2 communication | rosbridge_suite |
| Camera driver | pyrealsense2 |
| Object detection | YOLOv8 |
| RL training | Stable-Baselines3 (PPO, SAC, HER) |
| Simulation | PyBullet / Isaac Gym |
| Arm motion planning | MoveIt2 |
| KUKA driver | kuka_ros2 |
| ABB driver | abb_ros2 |
| Navigation | Nav2 |
| Point cloud | PCL (Point Cloud Library) |
| Code generation | Jinja2 templates |
| Local storage | SQLite |
| OS | Ubuntu 22.04 LTS |

---

## GUI Pages

| Page | Purpose |
|---|---|
| Dashboard | Camera status, system health, quick launch |
| Use Case Selector | Grid of module cards with smart filtering |
| Configuration | Parameters, model upload, arm selection |
| Live View | RGB / Depth / IR tabs, detection overlay |
| Workspace | Generated code viewer, launch controls |
| Training | RL reward graph, live training metrics |
| Logs | ROS2 node output, error monitoring |
| Settings | rosbridge URL, theme toggle, workspace path |

---

## Smart Filtering Logic

The platform automatically restricts invalid combinations:

- T265 selected → SLAM and odometry modules only
- D405 selected → close-range modules only
- No arm selected → perception-only modules shown
- KUKA iiwa selected → collaborative tasks unlocked
- ABB YuMi selected → dual-arm assembly tasks unlocked
- D555 selected → industrial + PoE deployment options unlocked

---

## Build Phases

### Phase 1 — GUI + Use Case Selector (Weeks 1–4)
- Next.js project setup
- Sidebar navigation
- Dashboard page (camera status, system health)
- Use case selector (grid of cards)
- Smart filtering by camera and arm
- Theme toggle (dark / light)
- rosbridge WebSocket connection
- Live camera feed (RGB, Depth, IR tabs)

### Phase 2 — ROS2 Template Generator (Weeks 5–10)
- Jinja2 template engine
- All 11 use case templates
- Configuration page (parameters, model upload)
- Workspace generation and local save
- Auto colcon build + ros2 launch
- README auto-generation per workspace

### Phase 3 — Robot Arm Integration (Weeks 11–18)
- KUKA ROS2 driver templates
- ABB ROS2 driver templates
- MoveIt2 integration
- Hand-eye calibration module
- Grasp point detection pipeline
- Arm selector in GUI with model filtering

### Phase 4 — RL Training Pipeline (Weeks 19–26)
- Dataset upload and format conversion
- PyBullet simulation environment
- PPO / SAC / HER training loop
- Live reward graph in browser
- Sim-to-Real transfer pipeline
- Trained policy export and ROS2 node integration

---

## Success Metrics

| Metric | Target |
|---|---|
| Cameras supported | All 7 RealSense models |
| Use case modules | 11 modules |
| Robot arms supported | 10 (KUKA + ABB) |
| Time from selection to running workspace | Under 2 minutes |
| Works fully offline | Yes |
| RL training without writing code | Yes |
| Workspace is human-readable and editable | Yes |

---

## Competitive Positioning

| Tool | Gap SenseForge fills |
|---|---|
| Intel RealSense Viewer | No AI, no code generation, no arms |
| Roboflow | Cloud-dependent, no depth, no ROS2 |
| LandingLens | QC only, expensive, no depth usage |
| NVIDIA Isaac | Extremely complex, not plug-and-play |
| OpenCV + pyrealsense2 | Requires heavy manual coding |

**SenseForge unique position:**
> Offline-first, RealSense-native, no-code platform that generates real ownable ROS2 workspaces with RL training — for every RealSense camera and every major industrial robot arm.

---

## Key Contacts

| Person | Role | Company | Status |
|---|---|---|---|
| Chris Matthieu | VP Developer Ecosystem | RealSense Inc. | Active — replied positively |

---

## Notes

- Developed on Ubuntu 22.04 LTS with ROS2 Humble
- Primary dev hardware: Intel RealSense D435i + Intel NUC
- All templates follow ROS2 best practices
- Workspaces are fully owned by the user — no vendor lock-in
- Open source first strategy — build traction, then commercialise

