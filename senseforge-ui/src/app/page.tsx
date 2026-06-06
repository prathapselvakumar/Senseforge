"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Camera, Activity, FolderCode, Trash2, Loader2 } from "lucide-react";
import { getDefaultWorkspacePath, getWorkspaces, deleteWorkspace, getSystemStats, checkCameraStatus } from "@/app/actions";

export default function DashboardPage() {
  const [greeting, setGreeting] = React.useState("Good day");
  const [workspaces, setWorkspaces] = React.useState<string[]>([]);
  const [basePath, setBasePath] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
  const [sysStats, setSysStats] = React.useState({ cpu: 0, ram: 0 });
  const [cameraConnected, setCameraConnected] = React.useState(false);

  React.useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    getDefaultWorkspacePath().then(path => {
      setBasePath(path);
      getWorkspaces(path).then(setWorkspaces);
    });

    const fetchStats = async () => {
      const stats = await getSystemStats();
      setSysStats(stats);
      const cam = await checkCameraStatus();
      setCameraConnected(cam.connected);
    };

    fetchStats();
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(name);
    const res = await deleteWorkspace(basePath, name);
    if (res.success) {
      setWorkspaces(prev => prev.filter(w => w !== name));
    }
    setIsDeleting(null);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 slide-in-from-bottom-2">
      <PageHeader
        title={`${greeting} — SenseForge is ready.`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-4">
        {/* Camera Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-secondary">Camera</span>
              <Camera className="w-4 h-4 text-secondary" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="text-xl font-semibold">{cameraConnected ? "D435i Detected" : "No Camera"}</div>
            <div className="flex items-center justify-between">
              {cameraConnected ? (
                <Badge variant="connected">Live</Badge>
              ) : (
                <Badge variant="ready">Disconnected</Badge>
              )}
              <span className="text-sm text-secondary">{cameraConnected ? "30 FPS" : "-- FPS"}</span>
            </div>
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
            <div className="text-xl font-semibold truncate">{workspaces.length > 0 ? workspaces[0] : "None"}</div>
            <div className="text-sm text-secondary truncate">{basePath}</div>
          </CardContent>
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
                <span className="text-secondary">{sysStats.cpu}%</span>
              </div>
              <div className="w-full bg-overlay h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${sysStats.cpu > 80 ? 'bg-red-500' : 'bg-accent'}`}
                  style={{ width: `${sysStats.cpu}%` }} 
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span>RAM</span>
                <span className="text-secondary">{sysStats.ram}%</span>
              </div>
              <div className="w-full bg-overlay h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${sysStats.ram > 80 ? 'bg-red-500' : 'bg-accent'}`}
                  style={{ width: `${sysStats.ram}%` }} 
                />
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
        <Card className="col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle>SenseForge Workspaces</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 flex-1 overflow-y-auto">
            {workspaces.length === 0 ? (
              <div className="text-center text-sm text-tertiary py-8 border border-dashed border-subtle rounded-lg">
                No workspaces found in <br/><span className="font-mono text-xs">{basePath || '...'}</span>
              </div>
            ) : (
              workspaces.map((wsName) => (
                <div
                  key={wsName}
                  className="flex items-center justify-between p-3 rounded-md bg-overlay hover:bg-elevated transition-colors border border-subtle hover:border-default group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded bg-surface flex items-center justify-center shrink-0 border border-subtle">
                      <FolderCode className="w-4 h-4 text-accent" />
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="font-medium text-sm truncate">{wsName}</span>
                      <span className="text-[11px] text-tertiary truncate">{basePath}</span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 hover:text-red-500"
                    onClick={(e) => handleDelete(wsName, e)}
                    disabled={isDeleting === wsName}
                  >
                    {isDeleting === wsName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </Button>
                </div>
              ))
            )}
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
