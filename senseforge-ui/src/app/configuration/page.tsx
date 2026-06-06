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
import { ArrowLeft, Play, Zap, Loader2, CheckCircle2, Trash2, Bot } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { openNativeFolderPicker, generateWorkspace, getDefaultWorkspacePath, simulateWorkspace, getWorkspaces, deleteWorkspace, checkCameraStatus } from "@/app/actions";

export default function ConfigurationPage() {
  const [depthEnabled, setDepthEnabled] = React.useState(true);
  const [irEnabled, setIrEnabled] = React.useState(false);
  const [imuEnabled, setImuEnabled] = React.useState(true);
  
  const [workspacePath, setWorkspacePath] = React.useState("");
  const [workspaceName, setWorkspaceName] = React.useState("qc_workspace_01");
  const [confidence, setConfidence] = React.useState(50);
  const [iou, setIou] = React.useState(40);
  
  // Hardware Settings
  const [cameraType, setCameraType] = React.useState("D435i");
  const [armType, setArmType] = React.useState("ur5e");
  const [endEffector, setEndEffector] = React.useState("gripper_2f");

  const router = useRouter();
  const searchParams = useSearchParams();
  const useCase = searchParams.get("useCase");
  const requiresArm = useCase === "pick-place" || useCase === "rl-training";

  const [isBrowsing, setIsBrowsing] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isSimulating, setIsSimulating] = React.useState(false);
  const [generateMessage, setGenerateMessage] = React.useState<{type: 'success' | 'error', text: string} | null>(null);
  const [workspaces, setWorkspaces] = React.useState<string[]>([]);

  React.useEffect(() => {
    getDefaultWorkspacePath().then(path => setWorkspacePath(path));
  }, []);

  React.useEffect(() => {
    if (workspacePath) {
      getWorkspaces(workspacePath).then(setWorkspaces);
    }
  }, [workspacePath]);

  React.useEffect(() => {
    checkCameraStatus().then(res => {
      if (res.connected && res.name) {
        if (res.name.includes("D435i")) setCameraType("D435i");
        else if (res.name.includes("D455")) setCameraType("D455");
        else if (res.name.includes("D415")) setCameraType("D415");
        else if (res.name.includes("D405")) setCameraType("D405");
        else setCameraType("webcam");
      }
    });
  }, []);

  const handleDelete = async () => {
    if (!workspaces.includes(workspaceName)) return;
    const res = await deleteWorkspace(workspacePath, workspaceName);
    if (res.success) {
      setGenerateMessage({ type: 'success', text: res.message });
      setWorkspaces(prev => prev.filter(w => w !== workspaceName));
      setWorkspaceName("");
    } else {
      setGenerateMessage({ type: 'error', text: res.message });
    }
  };

  const handleBrowse = async () => {
    setIsBrowsing(true);
    const res = await openNativeFolderPicker(workspacePath);
    if (res.path) setWorkspacePath(res.path);
    setIsBrowsing(false);
  };

  const handleGenerateWorkspace = async () => {
    setIsGenerating(true);
    setGenerateMessage(null);
    const config = {
      confidence: confidence / 100,
      iou: iou / 100,
      cameraType,
      requiresArm,
      armType,
      endEffector
    };
    const res = await generateWorkspace(workspacePath, workspaceName, config);
    setIsGenerating(false);
    if (res.success) {
      setGenerateMessage({ type: 'success', text: res.message });
    } else {
      setGenerateMessage({ type: 'error', text: res.message });
    }
  };

  const handleSimulateFirst = async () => {
    setIsSimulating(true);
    setGenerateMessage(null);
    const config = {
      confidence: confidence / 100,
      iou: iou / 100
    };
    const res = await simulateWorkspace(workspacePath, workspaceName, config);
    setIsSimulating(false);
    if (res.success) {
      setGenerateMessage({ type: 'success', text: "Simulation launched natively. Check your desktop windows!" });
    } else {
      setGenerateMessage({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/use-cases">
          <Button variant="icon" size="icon" aria-label="Go back to Use Cases">
            <ArrowLeft className="w-5 h-5 text-secondary" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Configure: {useCase === "pick-place" ? "Pick & Place" : useCase === "rl-training" ? "RL Arm Training" : "Quality Control"}
        </h1>
      </div>

      <div className={`grid grid-cols-1 ${requiresArm ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6 mb-6`}>
        {/* Camera Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Camera Settings</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-secondary">Camera</label>
              <div className="col-span-3">
                <Select value={cameraType} onChange={(e) => setCameraType(e.target.value)}>
                  <option value="D435i">D435i</option>
                  <option value="D455">D455</option>
                  <option value="webcam">System Webcam</option>
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
                <Slider value={confidence} onChange={e => setConfidence(Number(e.target.value))} min={1} max={100} />
                <span className="text-xs text-tertiary w-8">{(confidence / 100).toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-secondary">IOU</label>
              <div className="col-span-3 flex items-center gap-3">
                <Slider value={iou} onChange={e => setIou(Number(e.target.value))} min={1} max={100} />
                <span className="text-xs text-tertiary w-8">{(iou / 100).toFixed(2)}</span>
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

        {/* Robotic Arm Settings (Conditional) */}
        {requiresArm && (
          <Card className="border-accent bg-accent/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-accent" />
                <CardTitle>Robotic Arm Settings</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-secondary">Arm Type</label>
                <div className="col-span-3">
                  <Select value={armType} onChange={(e) => setArmType(e.target.value)}>
                    <option value="ur5e">UR5e (Universal Robots)</option>
                    <option value="xarm6">xArm 6 (UFACTORY)</option>
                    <option value="franka">Franka Emika</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-secondary leading-tight">End Effector</label>
                <div className="col-span-3">
                  <Select value={endEffector} onChange={(e) => setEndEffector(e.target.value)}>
                    <option value="gripper_2f">Robotiq 2F-85</option>
                    <option value="vacuum">Vacuum Gripper</option>
                    <option value="none">None</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-secondary">Mount</label>
                <div className="col-span-3">
                  <Select defaultValue="table">
                    <option value="table">Tabletop</option>
                    <option value="wall">Wall</option>
                    <option value="ceiling">Ceiling</option>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-secondary">Name</label>
              <div className="flex gap-2">
                <Input value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} placeholder="qc_workspace_..." className="flex-1" />
                {workspaces.length > 0 && (
                  <Select value={workspaces.includes(workspaceName) ? workspaceName : ""} onChange={e => setWorkspaceName(e.target.value)} className="w-[180px]">
                    <option value="" disabled>Existing...</option>
                    {workspaces.map(w => <option key={w} value={w}>{w}</option>)}
                  </Select>
                )}
                <Button 
                  variant="secondary" 
                  onClick={handleDelete} 
                  disabled={!workspaces.includes(workspaceName)}
                  title="Delete Workspace"
                  className="px-3"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-secondary">Path</label>
              <div className="flex gap-2">
                <Input value={workspacePath} onChange={e => setWorkspacePath(e.target.value)} className="flex-1" />
                <Button variant="secondary" disabled={isBrowsing} onClick={handleBrowse}>
                  {isBrowsing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Browse"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 mt-auto pt-6 border-t border-subtle">
        {generateMessage && (
          <div className={`p-4 rounded-lg text-sm border ${generateMessage.type === 'success' ? 'bg-[#10b981]/10 border-[#10b981]/20 text-[#10b981]' : 'bg-[#ef4444]/10 border-[#ef4444]/20 text-[#ef4444]'}`}>
            <span className="font-medium mr-2">{generateMessage.type === 'success' ? '✅ Success:' : '❌ Error:'}</span>
            {generateMessage.text}
          </div>
        )}
        <div className="flex items-center justify-between">
          <Button variant="secondary" size="lg" disabled={isGenerating || isSimulating} onClick={handleSimulateFirst}>
            {isSimulating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            {isSimulating ? "Launching..." : "Simulate First"}
          </Button>
          <Button variant="primary" size="lg" onClick={handleGenerateWorkspace} disabled={isGenerating || isSimulating}>
            {isGenerating ? (
              <>Generating... <Loader2 className="w-4 h-4 ml-2 animate-spin" /></>
            ) : (
              <>Generate Workspace <Zap className="w-4 h-4 ml-2 fill-current" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
