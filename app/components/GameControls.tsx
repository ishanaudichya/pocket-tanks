'use client';
import { useState } from 'react';

interface GameControlsProps {
  onMove: (direction: -1 | 1) => void;
  onPowerChange: (power: number) => void;
  onAngleChange: (angle: number) => void;
  onFire: () => void;
  isMyTurn: boolean;
  player?: 'ishan' | 'sakshi';
}

export default function GameControls({ 
  onMove, 
  onPowerChange, 
  onAngleChange, 
  onFire,
  isMyTurn,
  player = 'ishan'
}: GameControlsProps) {
  const [power, setPower] = useState(50);
  const [angle, setAngle] = useState(player === 'sakshi' ? 135 : 45);

  // Set angle constraints based on player
  const minAngle = player === 'sakshi' ? 90 : 0;
  const maxAngle = player === 'sakshi' ? 180 : 90;

  const handlePowerChange = (value: number) => {
    const newPower = Math.min(100, Math.max(10, value));
    setPower(newPower);
    onPowerChange(newPower);
  };

  const handleAngleChange = (value: number) => {
    const newAngle = Math.min(maxAngle, Math.max(minAngle, value));
    setAngle(newAngle);
    onAngleChange(newAngle);
  };

  const adjustAngle = (delta: number) => {
    handleAngleChange(angle + delta);
  };

  const adjustPower = (delta: number) => {
    handlePowerChange(power + delta);
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
      <div className="grid grid-cols-2 gap-4 min-w-[400px]">
        {/* Movement Controls */}
        <div className="col-span-2 flex justify-center gap-4">
          <button
            onClick={() => onMove(-1)}
            disabled={!isMyTurn}
            className="px-6 py-2 bg-[#89cff0] hover:bg-[#4a9eca] text-white rounded-full disabled:opacity-50 transition-colors"
          >
            ← Move Left
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={!isMyTurn}
            className="px-6 py-2 bg-[#89cff0] hover:bg-[#4a9eca] text-white rounded-full disabled:opacity-50 transition-colors"
          >
            Move Right →
          </button>
        </div>

        {/* Power Control */}
        <div className="space-y-2">
          <label className="text-sm text-gray-600 font-medium">Power (10-100)</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => adjustPower(-5)}
              disabled={!isMyTurn}
              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
            >
              -
            </button>
            <input
              type="number"
              value={power}
              onChange={(e) => handlePowerChange(parseInt(e.target.value) || 10)}
              disabled={!isMyTurn}
              min="10"
              max="100"
              className="w-16 px-2 py-1 border rounded text-center focus:outline-none focus:border-[#4a9eca]"
            />
            <button
              onClick={() => adjustPower(5)}
              disabled={!isMyTurn}
              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
            >
              +
            </button>
          </div>
          <input
            type="range"
            value={power}
            onChange={(e) => handlePowerChange(parseInt(e.target.value))}
            disabled={!isMyTurn}
            min="10"
            max="100"
            className="w-full"
          />
        </div>

        {/* Angle Control */}
        <div className="space-y-2">
          <label className="text-sm text-gray-600 font-medium">
            Angle ({minAngle}-{maxAngle}°)
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => adjustAngle(-5)}
              disabled={!isMyTurn}
              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
            >
              -
            </button>
            <input
              type="number"
              value={angle}
              onChange={(e) => handleAngleChange(parseInt(e.target.value) || minAngle)}
              disabled={!isMyTurn}
              min={minAngle}
              max={maxAngle}
              className="w-16 px-2 py-1 border rounded text-center focus:outline-none focus:border-[#4a9eca]"
            />
            <button
              onClick={() => adjustAngle(5)}
              disabled={!isMyTurn}
              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
            >
              +
            </button>
          </div>
          <input
            type="range"
            value={angle}
            onChange={(e) => handleAngleChange(parseInt(e.target.value))}
            disabled={!isMyTurn}
            min={minAngle}
            max={maxAngle}
            className="w-full"
          />
        </div>

        {/* Fire Button */}
        <button
          onClick={onFire}
          disabled={!isMyTurn}
          className="col-span-2 py-3 bg-[#ff69b4] hover:bg-[#ff4da6] text-white rounded-full disabled:opacity-50 font-bold text-lg transition-colors"
        >
          🔥 FIRE! 🔥
        </button>

        {/* Status indicator */}
        <div className="col-span-2 text-center text-sm">
          {isMyTurn ? (
            <span className="text-green-600 font-medium">Your turn - Aim and fire!</span>
          ) : (
            <span className="text-gray-500">Waiting for opponent...</span>
          )}
        </div>
      </div>
    </div>
  );
} 