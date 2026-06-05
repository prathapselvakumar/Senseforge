"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Pause, Download } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

// Mock data generator for RL training
const generateMockData = () => {
  const data = [];
  let reward = -200;
  let avg = -200;
  for (let i = 0; i < 48; i++) {
    reward = reward + Math.random() * 40 - 15 + (i * 1.5);
    avg = avg + (reward - avg) * 0.1;
    data.push({
      episode: i,
      reward: Math.round(reward * 10) / 10,
      average: Math.round(avg * 10) / 10,
    });
  }
  return data;
};

export default function TrainingPage() {
  const [data, setData] = React.useState(generateMockData());
  const [isTraining, setIsTraining] = React.useState(true);
  const currentEp = data.length - 1;
  const currentReward = data[currentEp].reward;
  const bestReward = Math.max(...data.map(d => d.reward));

  // Simulate live updating
  React.useEffect(() => {
    if (!isTraining) return;
    const interval = setInterval(() => {
      setData((prev) => {
        const last = prev[prev.length - 1];
        const newReward = last.reward + Math.random() * 40 - 15 + 2;
        const newAvg = last.average + (newReward - last.average) * 0.1;
        return [
          ...prev,
          {
            episode: last.episode + 1,
            reward: Math.round(newReward * 10) / 10,
            average: Math.round(newAvg * 10) / 10,
          }
        ];
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isTraining]);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <PageHeader
        title={
          <div className="flex items-center gap-4">
            <span>RL Training</span>
            <span className="text-sm font-normal text-secondary border-l border-subtle pl-4">
              Algorithm: PPO
            </span>
            {isTraining ? (
              <Badge variant="training">Training (ep {currentEp})</Badge>
            ) : (
              <Badge variant="ready">Paused (ep {currentEp})</Badge>
            )}
          </div>
        }
        actions={
          <div className="flex gap-3">
            <Button 
              variant={isTraining ? "secondary" : "primary"} 
              onClick={() => setIsTraining(!isTraining)}
            >
              {isTraining ? (
                <><Pause className="w-4 h-4 mr-2" /> Pause Training</>
              ) : (
                <><Play className="w-4 h-4 mr-2" /> Resume Training</>
              )}
            </Button>
            <Button variant="primary">
              <Download className="w-4 h-4 mr-2" />
              Export Policy
            </Button>
          </div>
        }
      />

      <div className="flex flex-col flex-1 gap-6 min-h-0">
        {/* Graph Card */}
        <Card className="flex flex-col flex-1 min-h-0 relative overflow-hidden">
          <CardHeader className="absolute top-0 left-0 right-0 z-10 flex flex-row items-center justify-between pb-0 px-6 pt-6 bg-gradient-to-b from-surface to-transparent">
            <CardTitle>Reward over episodes</CardTitle>
            <div className="flex items-center gap-6 font-mono text-sm">
              <div className="flex items-center gap-2">
                <span className="text-secondary">Episode:</span>
                <span className="text-primary font-bold">{currentEp}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-secondary">Reward:</span>
                <span className="text-primary font-bold text-purple">{currentReward.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-secondary">Best:</span>
                <span className="text-primary font-bold">{bestReward.toFixed(1)}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 pt-16">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                <XAxis 
                  dataKey="episode" 
                  stroke="#606060" 
                  tick={{ fill: '#A0A0A0', fontSize: 12, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#606060" 
                  tick={{ fill: '#A0A0A0', fontSize: 12, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#3A3A3A', borderRadius: '8px' }}
                  itemStyle={{ color: '#F5F5F5', fontFamily: 'monospace' }}
                  labelStyle={{ color: '#A0A0A0', marginBottom: '4px' }}
                />
                <ReferenceLine y={0} stroke="#3A3A3A" />
                <Line 
                  type="monotone" 
                  dataKey="average" 
                  stroke="#3B82F6" 
                  strokeWidth={2} 
                  strokeDasharray="5 5" 
                  dot={false}
                  name="Running Avg"
                  isAnimationActive={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="reward" 
                  stroke="#A855F7" 
                  strokeWidth={2} 
                  dot={false}
                  name="Reward"
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hyperparams and Config */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
          <Card>
            <CardHeader>
              <CardTitle>Hyperparameters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-4 font-mono text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-secondary uppercase text-[11px] tracking-wider font-sans">Learning Rate</span>
                  <span>0.0003</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-secondary uppercase text-[11px] tracking-wider font-sans">Gamma</span>
                  <span>0.99</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-secondary uppercase text-[11px] tracking-wider font-sans">Clip Range</span>
                  <span>0.2</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-secondary uppercase text-[11px] tracking-wider font-sans">Batch Size</span>
                  <span>2048</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Training Config</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-4 font-mono text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-secondary uppercase text-[11px] tracking-wider font-sans">Sim World</span>
                  <span>manipulation_v2</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-secondary uppercase text-[11px] tracking-wider font-sans">Max Episodes</span>
                  <span>500</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-secondary uppercase text-[11px] tracking-wider font-sans">Save Frequency</span>
                  <span>Every 50 ep</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-secondary uppercase text-[11px] tracking-wider font-sans">Hardware</span>
                  <span>GPU (CUDA)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Temporary icon
function Play(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
  );
}
