'use client';
import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { gameConfig } from '../lib/game/config';
import GameControls from './GameControls';
import { Socket } from 'socket.io-client';
import { GameScene } from '../lib/game/scenes/GameScene';

interface GameProps {
  player: 'ishan' | 'sakshi';
  socket: Socket;
}

export default function Game({ player, socket }: GameProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const gameSceneRef = useRef<GameScene | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [currentTurn, setCurrentTurn] = useState<'ishan' | 'sakshi' | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !gameRef.current) {
      gameRef.current = new Phaser.Game({
        ...gameConfig,
        parent: 'game-container',
      });

      gameRef.current.scene.start('GameScene', { socket, player });
      gameSceneRef.current = gameRef.current.scene.getScene('GameScene') as GameScene;

      // Listen for turn changes
      socket.on('turn_start', ({ player: currentPlayer }: { player: 'ishan' | 'sakshi' }) => {
        setIsMyTurn(currentPlayer === player);
        setCurrentTurn(currentPlayer);
      });
    }

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [socket, player]);

  const handleMove = (direction: -1 | 1) => {
    if (gameSceneRef.current && isMyTurn) {
      gameSceneRef.current.moveTank(direction);
    }
  };

  const handlePowerChange = (power: number) => {
    if (gameSceneRef.current && isMyTurn) {
      gameSceneRef.current.setPower(power);
    }
  };

  const handleAngleChange = (angle: number) => {
    if (gameSceneRef.current && isMyTurn) {
      gameSceneRef.current.setAngle(angle);
    }
  };

  const handleFire = () => {
    console.log('Fire button clicked, isMyTurn:', isMyTurn);
    if (gameSceneRef.current && isMyTurn) {
      console.log('Calling fire method');
      gameSceneRef.current.fire();
    }
  };

  return (
    <div className="w-full h-full flex justify-center items-center relative">
      <div id="game-container" className="border-4 border-[#89cff0] rounded-lg overflow-hidden" />
      {/* Only show controls on player's turn */}
      {isMyTurn && (
        <GameControls
          onMove={handleMove}
          onPowerChange={handlePowerChange}
          onAngleChange={handleAngleChange}
          onFire={handleFire}
          isMyTurn={isMyTurn}
          player={player}
        />
      )}
      {/* Show whose turn it is */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full px-6 py-2">
        {currentTurn ? `${currentTurn}'s turn` : 'Game starting...'}
      </div>
    </div>
  );
} 