"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Play, Camera, CircleDot, Activity, FolderCode } from "lucide-react";

export default function DashboardPage() {
  const [greeting, setGreeting] = React.useState("Good day");

  React.useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 slide-in-from-bottom-2">
      <PageHeader
        title={`${greeting} — SenseForge is ready.`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Camera Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-secondary">Camera</span>
              <Camera className="w-4 h-4 text-secondary" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="text-xl font-semibold">D435i</div>
            <div className="flex items-center justify-between">
              <Badge variant="connected">Live</Badge>
              <span className="text-sm text-secondary">30 FPS</span>
            </div>
          </CardContent>
        </Card>

        {/* ROS2 Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-secondary">ROS2</span>
              <CircleDot className="w-4 h-4 text-secondary" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="text-xl font-semibold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green" />
              Active
            </div>
            <div className="text-sm text-secondary">Humble</div>
          </CardContent>
        </Card>

        {/* Last Workspace */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-secondary">Last Workspace</span>
              <FolderCode className="w-4 h-4 text-secondary" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="text-xl font-semibold truncate">qc_ws</div>
            <div className="text-sm text-secondary">/home/user/ros2_ws</div>
          </CardContent>
        </Card>

        {/* Quick Launch */}
        <Card className="border-accent bg-accent-muted flex flex-col justify-center items-center h-[120px]">
          <Button variant="primary" size="lg" className="w-full max-w-[140px]">
            <Play className="w-4 h-4 mr-2 fill-current" />
            Resume
          </Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* System Health */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>System Health</CardTitle>
              <Activity className="w-4 h-4 text-secondary" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span>CPU</span>
                <span className="text-secondary">76%</span>
              </div>
              <div className="w-full bg-overlay h-2 rounded-full overflow-hidden">
                <div className="bg-accent h-full rounded-full w-[76%]" />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span>RAM</span>
                <span className="text-secondary">58%</span>
              </div>
              <div className="w-full bg-overlay h-2 rounded-full overflow-hidden">
                <div className="bg-accent h-full rounded-full w-[58%]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-subtle">
              <div className="flex items-center gap-2">
                <span className="text-sm text-secondary">ROS2 Bridge</span>
                <Badge variant="connected">Connected</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-secondary">Gazebo</span>
                <Badge variant="ready">Idle</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Workspaces */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Workspaces</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {[
              { name: "qc_conveyor_ws", time: "2 hours ago" },
              { name: "slam_ws", time: "Yesterday" },
              { name: "rl_pick_place_ws", time: "3 days ago" },
            ].map((ws) => (
              <div
                key={ws.name}
                className="flex items-center justify-between p-2 rounded-md hover:bg-elevated cursor-pointer transition-colors border border-transparent hover:border-default"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{ws.name}</span>
                  <span className="text-[11px] text-tertiary">{ws.time}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-tertiary" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Temporary ChevronRight until we create an icon component or import properly
function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
