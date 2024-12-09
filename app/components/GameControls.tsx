'use client';
import { useState } from 'react';

interface GameControlsProps {
  onMove: (direction: -1 | 1) => void;
  onPowerChange: (power: number) => void;
  onAngleChange: (angle: number) => void;
  onFire: () => void;
  isMyTurn: boolean;
}

export default function GameControls({ 
  onMove, 
  onPowerChange, 
  onAngleChange, 
  onFire,
  isMyTurn 
}: GameControlsProps) {
  const [power, setPower] = useState(50);
  const [angle, setAngle] = useState(45);

  const handlePowerChange = (value: number) => {
    const newPower = Math.min(100, Math.max(0, value));
    setPower(newPower);
    onPowerChange(newPower);
  };

  const handleAngleChange = (value: number) => {
    const newAngle = Math.min(360, Math.max(0, value));
    setAngle(newAngle);
    onAngleChange(newAngle);
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
      <div className="grid grid-cols-2 gap-4 min-w-[300px]">
        {/* Movement Controls */}
        <div className="col-span-2 flex justify-center gap-4">
          <button
            onClick={() => onMove(-1)}
            disabled={!isMyTurn}
            className="px-6 py-2 bg-[#89cff0] hover:bg-[#4a9eca] text-white rounded-full disabled:opacity-50"
          >
            ← Move Left
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={!isMyTurn}
            className="px-6 py-2 bg-[#89cff0] hover:bg-[#4a9eca] text-white rounded-full disabled:opacity-50"
          >
            Move Right →
          </button>
        </div>

        {/* Power Control */}
        <div className="space-y-1">
          <label className="text-sm text-gray-600">Power (0-100)</label>
          <input
            type="number"
            value={power}
            onChange={(e) => handlePowerChange(parseInt(e.target.value))}
            disabled={!isMyTurn}
            min="0"
            max="100"
            className="w-full px-3 py-1 border rounded-lg focus:outline-none focus:border-[#4a9eca]"
          />
        </div>

        {/* Angle Control */}
        <div className="space-y-1">
          <label className="text-sm text-gray-600">Angle (0-360)</label>
          <input
            type="number"
            value={angle}
            onChange={(e) => handleAngleChange(parseInt(e.target.value))}
            disabled={!isMyTurn}
            min="0"
            max="360"
            className="w-full px-3 py-1 border rounded-lg focus:outline-none focus:border-[#4a9eca]"
          />
        </div>

        {/* Fire Button */}
        <button
          onClick={onFire}
          disabled={!isMyTurn}
          className="col-span-2 py-2 bg-[#ff69b4] hover:bg-[#ff4da6] text-white rounded-full disabled:opacity-50"
        >
          🔥 Fire!
        </button>
      </div>
    </div>
  );
} 