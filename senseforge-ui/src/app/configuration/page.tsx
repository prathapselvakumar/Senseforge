"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";
import { FileUpload } from "@/components/ui/FileUpload";
import { ArrowLeft, Play, Zap } from "lucide-react";
import Link from "next/link";

export default function ConfigurationPage() {
  const [depthEnabled, setDepthEnabled] = React.useState(true);
  const [irEnabled, setIrEnabled] = React.useState(false);
  const [imuEnabled, setImuEnabled] = React.useState(true);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/use-cases">
          <Button variant="icon" size="icon" aria-label="Go back to Use Cases">
            <ArrowLeft className="w-5 h-5 text-secondary" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Configure: Quality Control</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Camera Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Camera Settings</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-secondary">Camera</label>
              <div className="col-span-3">
                <Select defaultValue="D435i">
                  <option value="D435i">D435i</option>
                  <option value="D455">D455</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-secondary">Resolution</label>
              <div className="col-span-3">
                <Select defaultValue="1280x720">
                  <option value="1280x720">1280x720</option>
                  <option value="848x480">848x480</option>
                  <option value="640x480">640x480</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-secondary">FPS</label>
              <div className="col-span-3">
                <Select defaultValue="30">
                  <option value="15">15</option>
                  <option value="30">30</option>
                  <option value="60">60</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4 pt-2 border-t border-subtle">
              <label className="text-sm font-medium text-secondary">Depth</label>
              <div className="col-span-3 flex items-center justify-end">
                <Toggle checked={depthEnabled} onChange={(e) => setDepthEnabled(e.target.checked)} />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-secondary">IR</label>
              <div className="col-span-3 flex items-center justify-end">
                <Toggle checked={irEnabled} onChange={(e) => setIrEnabled(e.target.checked)} />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-secondary">IMU</label>
              <div className="col-span-3 flex items-center justify-end">
                <Toggle checked={imuEnabled} onChange={(e) => setImuEnabled(e.target.checked)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Model Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Model Settings</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-secondary">Model</label>
              <div className="col-span-3">
                <Select defaultValue="yolov8n">
                  <option value="yolov8n">YOLOv8n (Fast)</option>
                  <option value="yolov8s">YOLOv8s</option>
                  <option value="custom">Custom...</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <label className="text-sm font-medium text-secondary mt-2">Upload</label>
              <div className="col-span-3">
                <FileUpload accept=".pt,.onnx" />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4 pt-2">
              <label className="text-sm font-medium text-secondary">Conf.</label>
              <div className="col-span-3 flex items-center gap-3">
                <Slider defaultValue={50} min={1} max={100} />
                <span className="text-xs text-tertiary w-8">0.50</span>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-secondary">IOU</label>
              <div className="col-span-3 flex items-center gap-3">
                <Slider defaultValue={40} min={1} max={100} />
                <span className="text-xs text-tertiary w-8">0.40</span>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4 border-t border-subtle pt-4">
              <label className="text-sm font-medium text-secondary">Classes</label>
              <div className="col-span-3">
                <Select defaultValue="all">
                  <option value="all">All (80 classes)</option>
                  <option value="custom">Select specific...</option>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-secondary">Name</label>
              <Input defaultValue="qc_workspace_01" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-secondary">Path</label>
              <div className="flex gap-2">
                <Input defaultValue="/home/user/ros2_ws" className="flex-1" />
                <Button variant="secondary">Browse</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mt-auto pt-6 border-t border-subtle">
        <Button variant="secondary" size="lg">
          <Play className="w-4 h-4 mr-2" />
          Simulate First
        </Button>
        <Button variant="primary" size="lg">
          Generate Workspace
          <Zap className="w-4 h-4 ml-2 fill-current" />
        </Button>
      </div>
    </div>
  );
}
