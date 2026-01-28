import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, Clock, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAlarmManager } from "@/hooks/useAlarmManager";
import { useGamification } from "@/lib/gamification";
import type { Alarm } from "@shared/schema";
import { alarmSounds, type SoundType } from "@/lib/alarmSounds";

const SOUNDS = [
  { id: "bell", name: "🔔 Bell" },
  { id: "chime", name: "🎵 Chime" },
  { id: "buzz", name: "⚡ Buzz" },
  { id: "piano", name: "🎹 Piano" },
];

const DAYS = [
  { id: "sunday", name: "Sun" },
  { id: "monday", name: "Mon" },
  { id: "tuesday", name: "Tue" },
  { id: "wednesday", name: "Wed" },
  { id: "thursday", name: "Thu" },
  { id: "friday", name: "Fri" },
  { id: "saturday", name: "Sat" },
];

export default function AlarmPage() {
  const { alarms, loading, fetchAlarms } = useAlarmManager();
  const { userId } = useGamification();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [customSoundFile, setCustomSoundFile] = useState<File | null>(null);
  const [customSoundPreview, setCustomSoundPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    label: "",
    time: "07:00",
    sound: "bell",
    repeatDays: "[]",
  });
  const { toast } = useToast();
  const [wakeLock, setWakeLock] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(true);

  // Request Wake Lock when alarms are enabled
  useEffect(() => {
    const enabledAlarms = alarms.filter(a => a.enabled);
    
    if (enabledAlarms.length > 0 && 'wakeLock' in navigator) {
      requestWakeLock();
    } else if (enabledAlarms.length === 0 && wakeLock) {
      releaseWakeLock();
    }

    return () => {
      releaseWakeLock();
    };
  }, [alarms]);

  // Monitor visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
      
      const enabledAlarms = alarms.filter(a => a.enabled);
      if (document.hidden && enabledAlarms.length > 0) {
        toast({
          title: "⚠️ Tab Hidden",
          description: "Background alarms will work via push notifications. Keep tab open for full alarm experience with sound.",
          duration: 5000,
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [alarms, toast]);

  // Warn before closing with active alarms
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const enabledAlarms = alarms.filter(a => a.enabled);
      if (enabledAlarms.length > 0) {
        e.preventDefault();
        e.returnValue = 'You have active alarms. They will still work via push notifications, but sound will only play if the app is open.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [alarms]);

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator && !wakeLock) {
        const lock = await (navigator as any).wakeLock.request('screen');
        setWakeLock(lock);
        console.log('Wake Lock activated');
      }
    } catch (err) {
      console.error('Wake Lock error:', err);
    }
  };

  const releaseWakeLock = () => {
    if (wakeLock) {
      wakeLock.release();
      setWakeLock(null);
      console.log('Wake Lock released');
    }
  };

  const testSound = async () => {
    if (isPlayingSound) {
      console.log("Stopping sound");
      alarmSounds.stopSound();
      setIsPlayingSound(false);
      return;
    }

    console.log("Testing sound:", formData.sound.substring(0, 50) + "...");

    try {
      setIsPlayingSound(true);
      await alarmSounds.playSound(formData.sound as SoundType, 3000); // Play for 3 seconds
      setTimeout(() => {
        alarmSounds.stopSound();
        setIsPlayingSound(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to play sound:", error);
      setIsPlayingSound(false);
      toast({
        title: "Error",
        description: "Failed to play sound. Make sure your browser allows audio.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({ label: "", time: "07:00", sound: "bell", repeatDays: "[]" });
    setEditingId(null);
    setShowForm(false);
    setCustomSoundFile(null);
    setCustomSoundPreview(null);
  };

  const handleCustomSoundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("File selected:", file.name, file.type, file.size);

    // Validate file type (audio only)
    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an audio file (mp3, wav, ogg, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an audio file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setCustomSoundFile(file);

    try {
      toast({
        title: "Processing...",
        description: "Compressing audio file to save storage",
      });

      // Compress audio using Web Audio API
      const compressedDataUrl = await compressAudio(file);
      
      const originalSize = file.size;
      const compressedSize = Math.round((compressedDataUrl.length * 3) / 4); // Rough base64 to bytes
      const savings = Math.round((1 - compressedSize / originalSize) * 100);

      console.log(`Audio compressed: ${originalSize} → ${compressedSize} bytes (${savings}% savings)`);
      
      setCustomSoundPreview(compressedDataUrl);
      setFormData({ ...formData, sound: `custom:${compressedDataUrl}` });
      
      toast({
        title: "Success",
        description: `${file.name} uploaded! Compressed ${savings}% to save storage.`,
      });
    } catch (error) {
      console.error("Compression error:", error);
      // Fallback to uncompressed if compression fails
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setCustomSoundPreview(dataUrl);
        setFormData({ ...formData, sound: `custom:${dataUrl}` });
        toast({
          title: "Success",
          description: `${file.name} uploaded (uncompressed)`,
        });
      };
      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to read the audio file",
          variant: "destructive",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Compress audio to reduce storage usage
  const compressAudio = async (file: File): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Create audio context
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Read file as array buffer
        const arrayBuffer = await file.arrayBuffer();
        
        // Decode audio
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Resample to lower quality to reduce size (44.1kHz → 22.05kHz for alarm sounds)
        const targetSampleRate = 22050; // Half the standard rate, still good quality for alarms
        const targetChannels = 1; // Mono instead of stereo
        
        // Create offline context for rendering
        const offlineContext = new OfflineAudioContext(
          targetChannels,
          audioBuffer.duration * targetSampleRate,
          targetSampleRate
        );
        
        // Create buffer source
        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineContext.destination);
        source.start();
        
        // Render audio
        const renderedBuffer = await offlineContext.startRendering();
        
        // Convert to WAV format (smaller than original, predictable size)
        const wavBlob = audioBufferToWav(renderedBuffer);
        
        // Convert to data URL
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(wavBlob);
      } catch (error) {
        reject(error);
      }
    });
  };

  // Convert AudioBuffer to WAV Blob
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const length = buffer.length * buffer.numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);
    const channels: Float32Array[] = [];
    let offset = 0;
    let pos = 0;

    // Write WAV header
    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };
    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    // RIFF chunk descriptor
    setUint32(0x46464952); // "RIFF"
    setUint32(36 + length); // File size - 8
    setUint32(0x45564157); // "WAVE"

    // FMT sub-chunk
    setUint32(0x20746d66); // "fmt "
    setUint32(16); // Subchunk size
    setUint16(1); // Audio format (1 = PCM)
    setUint16(buffer.numberOfChannels);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * buffer.numberOfChannels * 2); // Byte rate
    setUint16(buffer.numberOfChannels * 2); // Block align
    setUint16(16); // Bits per sample

    // Data sub-chunk
    setUint32(0x61746164); // "data"
    setUint32(length); // Subchunk size

    // Write interleaved audio data
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < arrayBuffer.byteLength) {
      for (let i = 0; i < buffer.numberOfChannels; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const createAlarm = async () => {
    if (!formData.label || !formData.time) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Validate custom sound is uploaded
    if (formData.sound === "custom" && !formData.sound.startsWith("custom:")) {
      toast({
        title: "Validation Error",
        description: "Please upload a custom sound file",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/alarms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId || "demo-user",
          ...formData,
          enabled: true,
        }),
      });

      if (response.ok) {
        fetchAlarms();
        resetForm();
        toast({
          title: "Success",
          description: "Alarm created successfully",
        });
      } else {
        // Handle error responses from backend
        const errorData = await response.json().catch(() => ({ error: "Failed to create alarm" }));
        toast({
          title: "Cannot create alarm",
          description: errorData.error || "Failed to create alarm",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create alarm. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateAlarm = async (id: string) => {
    if (!formData.label || !formData.time) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Validate custom sound is uploaded
    if (formData.sound === "custom" && !formData.sound.startsWith("custom:")) {
      toast({
        title: "Validation Error",
        description: "Please upload a custom sound file",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/alarms/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchAlarms();
        resetForm();
        toast({
          title: "Success",
          description: "Alarm updated successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update alarm",
        variant: "destructive",
      });
    }
  };

  const updateAlarmStatus = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/alarms/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        fetchAlarms();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update alarm",
        variant: "destructive",
      });
    }
  };

  const deleteAlarm = async (id: string) => {
    try {
      const response = await fetch(`/api/alarms/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchAlarms();
        toast({
          title: "Success",
          description: "Alarm deleted successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete alarm",
        variant: "destructive",
      });
    }
  };

  const toggleRepeatDay = (dayId: string) => {
    const days = JSON.parse(formData.repeatDays || "[]");
    const index = days.indexOf(dayId);
    if (index > -1) {
      days.splice(index, 1);
    } else {
      days.push(dayId);
    }
    setFormData({ ...formData, repeatDays: JSON.stringify(days) });
  };

  const handleEdit = (alarm: Alarm) => {
    setFormData({
      label: alarm.label,
      time: alarm.time,
      sound: alarm.sound,
      repeatDays: alarm.repeatDays || "[]",
    });
    setEditingId(alarm.id);
    setShowForm(true);
    
    // If it's a custom sound, set the preview
    if (alarm.sound.startsWith("custom:")) {
      setCustomSoundPreview(alarm.sound.substring(7));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      {/* Global alarm modal is now in App.tsx - removed duplicate */}
      
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-2">
            <Clock className="w-8 h-8" />
            Alarms
          </h1>
          <p className="text-gray-400">Set and manage your daily alarms</p>
        </div>

        {!showForm ? (
          <Button
            onClick={() => setShowForm(true)}
            className="mb-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Alarm
          </Button>
        ) : (
          <Card className="mb-6 p-6 bg-slate-800 border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingId ? "Edit Alarm" : "Create New Alarm"}
            </h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="label" className="text-gray-300">
                  Alarm Label
                </Label>
                <Input
                  id="label"
                  placeholder="e.g., Morning Workout"
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="time" className="text-gray-300">
                  Time
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="sound" className="text-gray-300">
                  Sound
                </Label>
                <div className="flex gap-2">
                  <Select 
                    value={formData.sound.startsWith("custom:") ? "custom" : formData.sound} 
                    onValueChange={(value) => {
                      if (value === "custom") {
                        setFormData({ ...formData, sound: "custom" });
                      } else {
                        setFormData({ ...formData, sound: value });
                        setCustomSoundFile(null);
                        setCustomSoundPreview(null);
                      }
                    }}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {SOUNDS.map((sound) => (
                        <SelectItem key={sound.id} value={sound.id} className="text-white">
                          {sound.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom" className="text-white">
                        🎵 Custom Sound
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    onClick={testSound}
                    variant="outline"
                    className="border-slate-600 text-gray-300 hover:bg-slate-700"
                  >
                    {isPlayingSound ? "Stop" : "Test"}
                  </Button>
                </div>

                {/* Custom Sound Upload */}
                {(formData.sound === "custom" || formData.sound.startsWith("custom:")) && (
                  <div className="mt-3 p-4 bg-slate-700 rounded-lg border border-slate-600">
                    <Label htmlFor="custom-sound" className="text-gray-300 mb-2 block">
                      Upload Custom Sound
                    </Label>
                    <Input
                      id="custom-sound"
                      type="file"
                      accept="audio/*"
                      onChange={handleCustomSoundUpload}
                      className="bg-slate-600 border-slate-500 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                    />
                    {customSoundFile && (
                      <p className="text-sm text-green-400 mt-2 flex items-center gap-2">
                        ✓ {customSoundFile.name} uploaded
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Supported formats: MP3, WAV, OGG • Max size: 5MB
                      <br />
                      <span className="text-green-400">✓ Auto-compressed to save 60-80% storage</span>
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-gray-300 mb-3 block">Repeat Days</Label>
                <div className="grid grid-cols-4 gap-2">
                  {DAYS.map((day) => (
                    <button
                      key={day.id}
                      onClick={() => toggleRepeatDay(day.id)}
                      className={`p-2 rounded text-sm font-medium transition ${
                        JSON.parse(formData.repeatDays || "[]").includes(day.id)
                          ? "bg-purple-500 text-white"
                          : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                      }`}
                    >
                      {day.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (editingId) {
                      updateAlarm(editingId);
                    } else {
                      createAlarm();
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {editingId ? "Update Alarm" : "Create Alarm"}
                </Button>
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="flex-1 border-slate-600 text-gray-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-3">
          {loading ? (
            <p className="text-gray-400">Loading alarms...</p>
          ) : alarms.length === 0 ? (
            <Card className="p-6 bg-slate-800 border-slate-700 text-center">
              <p className="text-gray-400">No alarms yet. Create one to get started!</p>
            </Card>
          ) : (
            alarms.map((alarm) => (
              <Card
                key={alarm.id}
                className="p-4 bg-slate-800 border-slate-700 flex items-center justify-between"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{alarm.label}</h3>
                  <p className="text-purple-400 text-sm">{alarm.time}</p>
                  {alarm.sound.startsWith("custom:") && (
                    <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                      🎵 Custom Sound
                    </p>
                  )}
                  {alarm.repeatDays && alarm.repeatDays !== "[]" && (() => {
                    try {
                      const days = JSON.parse(alarm.repeatDays);
                      if (Array.isArray(days) && days.length > 0) {
                        return (
                          <p className="text-gray-400 text-xs mt-1">
                            Repeats: {days
                              .map((d: string) => DAYS.find((day) => day.id === d)?.name)
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        );
                      }
                    } catch (e) {
                      console.error("Error parsing repeatDays:", e, alarm.repeatDays);
                    }
                    return null;
                  })()}
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={alarm.enabled}
                    onCheckedChange={(checked) =>
                      updateAlarmStatus(alarm.id, checked)
                    }
                  />
                  <Button
                    onClick={() => handleEdit(alarm)}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-blue-900 hover:text-blue-200"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => deleteAlarm(alarm.id)}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-red-900 hover:text-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}