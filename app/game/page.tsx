'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Game from '../components/Game';
import io from 'socket.io-client';

export default function GamePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const player = searchParams.get('player') as 'ishan' | 'sakshi';
  const [socket, setSocket] = useState<any>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Connecting...');

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setStatus('Connected, joining game...');
      
      // Send join request after connection
      newSocket.emit('join_game', {
        player,
        password: player === 'ishan' ? 'ishu1' : 'sakku2'
      });
    });

    // Handle game ready event
    newSocket.on('game_ready', (data: { opponent: string, startTurn: 'ishan' | 'sakshi' }) => {
      console.log('Game ready received:', data);
      setGameStarted(true);
      setStatus('Game starting!');
    });

    newSocket.on('waiting_for_opponent', () => {
      console.log('Waiting for opponent');
      setStatus('Waiting for other player to join...');
    });

    newSocket.on('auth_failed', () => {
      setError('Authentication failed');
    });

    // Handle disconnection
    newSocket.on('disconnect', () => {
      setError('Connection lost. Please refresh the page.');
    });

    // Handle opponent disconnect
    newSocket.on('opponent_disconnected', () => {
      setError('Opponent disconnected. Please return to home page.');
    });

    return () => {
      console.log('Cleaning up socket connection');
      newSocket.close();
    };
  }, [player]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#e6f3ff] to-[#d4e9ff]">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6">
          <h2 className="text-2xl text-red-500">{error}</h2>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-[#89cff0] text-white rounded-full"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#e6f3ff] to-[#d4e9ff]">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6">
          <h2 className="text-2xl text-[#4a9eca]">{status}</h2>
          <div className="mt-4 animate-spin w-8 h-8 border-4 border-[#89cff0] border-t-transparent rounded-full"/>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e6f3ff] to-[#d4e9ff] p-4">
      <Game player={player} socket={socket} />
    </div>
  );
} 