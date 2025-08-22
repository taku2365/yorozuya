"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface WBSTimeTrackerProps {
  taskId: string;
  taskTitle: string;
  actualHours: number;
  onUpdateTime: (hours: number) => void;
  className?: string;
}

export function WBSTimeTracker({
  taskId,
  taskTitle,
  actualHours,
  onUpdateTime,
  className,
}: WBSTimeTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [manualHours, setManualHours] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isTracking) {
      startTimeRef.current = Date.now() - elapsedSeconds * 1000;
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setElapsedSeconds(elapsed);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTracking, elapsedSeconds]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartStop = () => {
    if (isTracking) {
      // Stop tracking and add time
      const additionalHours = elapsedSeconds / 3600;
      onUpdateTime(actualHours + additionalHours);
      setElapsedSeconds(0);
    }
    setIsTracking(!isTracking);
  };

  const handleReset = () => {
    setIsTracking(false);
    setElapsedSeconds(0);
    startTimeRef.current = null;
  };

  const handleManualTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(manualHours);
    if (!isNaN(hours) && hours >= 0) {
      onUpdateTime(actualHours + hours);
      setManualHours("");
    }
  };

  return (
    <div
      className={cn(
        "bg-gray-50 rounded-lg p-4 space-y-4",
        className
      )}
      data-testid="wbs-time-tracker"
    >
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-gray-600" />
        <h3 className="font-medium text-gray-900">時間記録</h3>
        <span className="text-sm text-gray-500">- {taskTitle}</span>
      </div>

      {/* Timer section */}
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-mono font-medium">
            {formatTime(elapsedSeconds)}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={isTracking ? "destructive" : "default"}
              onClick={handleStartStop}
              aria-label={isTracking ? "停止" : "開始"}
            >
              {isTracking ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              disabled={isTracking || elapsedSeconds === 0}
              aria-label="リセット"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          現在の実績時間: {actualHours.toFixed(2)}時間
        </p>
      </div>

      {/* Manual time entry */}
      <form onSubmit={handleManualTimeSubmit} className="space-y-2">
        <Label htmlFor="manual-hours">手動で時間を追加</Label>
        <div className="flex gap-2">
          <Input
            id="manual-hours"
            type="number"
            step="0.25"
            min="0"
            placeholder="例: 1.5"
            value={manualHours}
            onChange={(e) => setManualHours(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={!manualHours}>
            追加
          </Button>
        </div>
      </form>
    </div>
  );
}