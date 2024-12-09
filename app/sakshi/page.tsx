'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import io from 'socket.io-client';

export default function SakshiPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleJoin = async () => {
    if (password !== 'sakku2') {
      setError('Invalid password');
      return;
    }

    const socket = io('http://localhost:3001');
    
    socket.emit('join_game', { player: 'sakshi', password });
    
    socket.on('game_ready', (data) => {
      router.push('/game?player=sakshi');
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#e6f3ff] to-[#d4e9ff]">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-[#4a9eca] mb-4">Join as Sakshi</h1>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 rounded-full border-2 border-[#89cff0] focus:outline-none focus:border-[#4a9eca] mb-4"
        />
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <button
          onClick={handleJoin}
          className="w-full bg-[#89cff0] hover:bg-[#4a9eca] text-white font-bold py-2 px-4 rounded-full transition-colors"
        >
          Join Game
        </button>
      </div>
    </div>
  );
} 