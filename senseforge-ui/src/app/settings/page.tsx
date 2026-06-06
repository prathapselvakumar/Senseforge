"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { RotateCcw, Plug, Save, Download, Loader2 } from "lucide-react";
import { openNativeFolderPicker } from "@/app/actions";

import { useTheme } from "next-themes";

export default function SettingsPage() {
  const [autoDetect, setAutoDetect] = React.useState(true);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  const [defaultSavePath, setDefaultSavePath] = React.useState("/home/laptop17/ros2_ws");
  const [gazeboPathOverride, setGazeboPathOverride] = React.useState("");

  const [isBrowsing, setIsBrowsing] = React.useState(false);

  const handleBrowseSavePath = async () => {
    setIsBrowsing(true);
    const res = await openNativeFolderPicker(defaultSavePath);
    if (res.path) setDefaultSavePath(res.path);
    setIsBrowsing(false);
  };

  const handleBrowseGazeboPath = async () => {
    setIsBrowsing(true);
    const res = await openNativeFolderPicker(gazeboPathOverride || "/");
    if (res.path) setGazeboPathOverride(res.path);
    setIsBrowsing(false);
  };

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 max-w-4xl mx-auto w-full">
      <PageHeader title="Settings" />

      <div className="flex flex-col gap-6">
        {/* Connections */}
        <Card>
          <CardHeader>
            <CardTitle>Connections</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <label className="text-sm font-medium text-secondary">ROS Bridge URL</label>
              <div className="col-span-3 flex gap-3">
                <Input defaultValue="ws://localhost:9090" className="flex-1" />
                <Button variant="secondary">
                  <Plug className="w-4 h-4 mr-2" />
                  Test
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workspace */}
        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <label className="text-sm font-medium text-secondary">Default Save Path</label>
              <div className="col-span-3 flex gap-3">
                <Input value={defaultSavePath} onChange={e => setDefaultSavePath(e.target.value)} className="flex-1" />
                <Button variant="secondary" disabled={isBrowsing} onClick={handleBrowseSavePath}>
                  {isBrowsing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Browse"}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center pt-2 border-t border-subtle">
              <label className="text-sm font-medium text-secondary">Gazebo Path Override</label>
              <div className="col-span-3 flex gap-3">
                <Input placeholder="/opt/ros/humble/bin/gzserver" value={gazeboPathOverride} onChange={e => setGazeboPathOverride(e.target.value)} className="flex-1" />
                <Button variant="secondary" disabled={isBrowsing} onClick={handleBrowseGazeboPath}>
                  {isBrowsing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Browse"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-secondary">Theme</label>
                <span className="text-xs text-tertiary">Live preview</span>
              </div>
              <div className="col-span-3 flex gap-3">
                <Button
                  variant={mounted && theme === "dark" ? "primary" : "secondary"}
                  className="w-24"
                  onClick={() => setTheme("dark")}
                >
                  Dark
                </Button>
                <Button
                  variant={mounted && theme === "light" ? "primary" : "secondary"}
                  className="w-24"
                  onClick={() => setTheme("light")}
                >
                  Light
                </Button>
                <Button
                  variant={mounted && theme === "system" ? "primary" : "secondary"}
                  className="w-24"
                  onClick={() => setTheme("system")}
                >
                  System
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center pt-2 border-t border-subtle">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-secondary">Auto-detect Cameras</label>
                <span className="text-xs text-tertiary">On startup</span>
              </div>
              <div className="col-span-3">
                <Toggle checked={autoDetect} onChange={(e) => setAutoDetect(e.target.checked)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System */}
        <Card>
          <CardHeader>
            <CardTitle>System</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">SenseForge Version</span>
                <span className="text-xs font-mono text-tertiary">v1.2.0-beta.4 (build 8349a2)</span>
              </div>
              <Button variant="secondary" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Check for Updates
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <div className="flex justify-end pt-4">
          <Button variant="danger">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>

        {/* Main Save Action */}
        <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-subtle bg-base/80 backdrop-blur-md flex justify-end gap-3 z-50 lg:left-[220px]">
          <Button variant="secondary">Cancel</Button>
          <Button variant="primary">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
        <div className="h-16" /> {/* Spacer for fixed footer */}
      </div>
    </div>
  );
}
