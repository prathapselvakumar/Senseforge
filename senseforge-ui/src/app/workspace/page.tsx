"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Play, ExternalLink, Folder, File, FileCode2, Terminal, CheckCircle2 } from "lucide-react";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css"; // A good dark theme for highlight.js

const MOCK_CODE = `import rclpy
from rclpy.node import Node
import pyrealsense2 as rs
from sensor_msgs.msg import Image
from cv_bridge import CvBridge

class RealSenseNode(Node):
    def __init__(self):
        super().__init__('realsense_node')
        self.publisher_ = self.create_publisher(Image, '/camera/color/image_raw', 10)
        self.bridge = CvBridge()
        self.pipeline = rs.pipeline()
        
        config = rs.config()
        config.enable_stream(rs.stream.color, 1280, 720, rs.format.bgr8, 30)
        self.pipeline.start(config)
        
        self.timer = self.create_timer(1.0 / 30.0, self.timer_callback)
        self.get_logger().info('RealSense Node Started')

    def timer_callback(self):
        frames = self.pipeline.wait_for_frames()
        color_frame = frames.get_color_frame()
        if not color_frame:
            return
            
        img = np.asanyarray(color_frame.get_data())
        msg = self.bridge.cv2_to_imgmsg(img, encoding="bgr8")
        self.publisher_.publish(msg)

def main(args=None):
    rclpy.init(args=args)
    node = RealSenseNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
`;

export default function WorkspacePage() {
  const codeRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (codeRef.current) {
      // Small timeout to let React render the DOM node first
      setTimeout(() => {
        if (codeRef.current) hljs.highlightElement(codeRef.current);
      }, 0);
    }
  }, []);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <PageHeader
        title={
          <div className="flex items-center gap-4">
            <span>Workspace:</span>
            <span className="font-mono text-lg text-accent">qc_workspace_01</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open ↗
            </Button>
            <Button variant="primary" size="sm" className="bg-green hover:bg-green-muted">
              <Play className="w-4 h-4 mr-2" />
              Launch
            </Button>
          </div>
        }
      />

      <div className="flex flex-1 gap-4 min-h-0 mb-4">
        {/* File Tree Panel */}
        <div className="w-[180px] rounded-lg border border-subtle bg-surface flex flex-col min-h-0">
          <div className="p-3 border-b border-subtle flex justify-between items-center">
            <span className="text-xs font-medium uppercase tracking-wider text-secondary">Files</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 text-[13px] font-mono text-secondary flex flex-col gap-0.5">
            <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-elevated hover:text-primary rounded cursor-pointer">
              <Folder className="w-4 h-4 text-accent" />
              <span>src/</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 ml-4 bg-elevated text-primary rounded cursor-pointer relative">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-accent rounded-r" />
              <FileCode2 className="w-4 h-4 text-amber" />
              <span>realsense_node.py</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 ml-4 hover:bg-elevated hover:text-primary rounded cursor-pointer">
              <FileCode2 className="w-4 h-4 text-accent" />
              <span>detection.py</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-elevated hover:text-primary rounded cursor-pointer mt-1">
              <Folder className="w-4 h-4 text-accent" />
              <span>launch/</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-elevated hover:text-primary rounded cursor-pointer mt-1">
              <Folder className="w-4 h-4 text-accent" />
              <span>config/</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 ml-4 hover:bg-elevated hover:text-primary rounded cursor-pointer">
              <File className="w-4 h-4" />
              <span>camera_params.yaml</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-elevated hover:text-primary rounded cursor-pointer mt-1">
              <Folder className="w-4 h-4 text-accent" />
              <span>models/</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-elevated hover:text-primary rounded cursor-pointer mt-1">
              <File className="w-4 h-4" />
              <span>README.md</span>
            </div>
          </div>
        </div>

        {/* Code Viewer Panel */}
        <div className="flex-1 rounded-lg border border-subtle bg-[#282c34] overflow-hidden flex flex-col min-h-0 relative">
          <div className="h-10 bg-[#21252b] border-b border-[#181a1f] flex items-center px-4 justify-between shrink-0">
            <div className="flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-amber" />
              <span className="font-mono text-sm text-primary">realsense_node.py</span>
            </div>
            <div className="flex gap-2">
               <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-accent/20 text-accent border border-accent/30">
                 Python
               </span>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-[#282c34]">
            <pre className="!m-0 !p-4 !bg-transparent h-full text-[13px] leading-relaxed">
              <code ref={codeRef} className="language-python !bg-transparent !p-0">
                {MOCK_CODE}
              </code>
            </pre>
          </div>
        </div>
      </div>

      {/* Build & Node Status Footer */}
      <div className="h-14 shrink-0 rounded-lg border border-subtle bg-surface flex items-center justify-between px-6">
        <div className="flex items-center gap-6 text-sm font-medium">
          <div className="flex items-center gap-2 text-green">
            <CheckCircle2 className="w-4 h-4" />
            <span>Built successfully</span>
          </div>
          <div className="w-px h-6 bg-subtle" />
          <div className="flex items-center gap-3">
            <span className="text-secondary">Active Nodes:</span>
            <div className="flex gap-2">
              <span className="font-mono text-[12px] bg-elevated px-2 py-1 rounded border border-subtle">
                realsense_node
              </span>
              <span className="font-mono text-[12px] bg-elevated px-2 py-1 rounded border border-subtle">
                detection_node
              </span>
            </div>
          </div>
        </div>
        
        <Button variant="secondary" size="sm">
          <Terminal className="w-4 h-4 mr-2" />
          Rebuild
        </Button>
      </div>
    </div>
  );
}
