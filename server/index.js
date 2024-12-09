const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Store active players
const players = {
  ishan: null,
  sakshi: null
};

// Add game state tracking
const gameState = {
  currentTurn: null,
  isGameStarted: false
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle player join
  socket.on('join_game', (data) => {
    const { player, password } = data;
    console.log('Join attempt:', player, 'Current players:', players);
    
    // Validate passwords
    if ((player === 'ishan' && password === 'ishu1') || 
        (player === 'sakshi' && password === 'sakku2')) {
      
      players[player] = socket.id;
      socket.player = player;
      
      console.log(`${player} joined the game. Players now:`, players);
      
      // Notify both players if they're both connected
      if (players.ishan && players.sakshi) {
        console.log('Both players connected, starting game');
        gameState.isGameStarted = true;
        gameState.currentTurn = 'ishan';
        
        // Notify both players that game is starting
        io.to(players.ishan).emit('game_ready', { 
          opponent: 'sakshi',
          startTurn: 'ishan'
        });
        io.to(players.sakshi).emit('game_ready', { 
          opponent: 'ishan',
          startTurn: 'ishan'
        });

        // Start the first turn
        io.emit('turn_start', { player: gameState.currentTurn });
      } else {
        console.log('Waiting for other player. Current players:', players);
        // Notify the connected player they're waiting
        socket.emit('waiting_for_opponent');
      }
    } else {
      console.log('Invalid password attempt for', player);
      socket.emit('auth_failed');
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (socket.player) {
      console.log(`${socket.player} disconnected`);
      players[socket.player] = null;
      gameState.isGameStarted = false;
      
      // Notify the other player
      const otherPlayer = socket.player === 'ishan' ? players.sakshi : players.ishan;
      if (otherPlayer) {
        io.to(otherPlayer).emit('opponent_disconnected');
      }
    }
  });

  socket.on('player_position', (data) => {
    console.log('Player position received:', data);
    const opponent = data.player === 'ishan' ? players.sakshi : players.ishan;
    if (opponent) {
      io.to(opponent).emit('opponent_position', {
        x: data.x,
        y: data.y
      });
    }
  });

  socket.on('fire', (data) => {
    console.log('Fire event received from:', data.shooter);
    console.log('Fire data:', data);

    const opponent = data.shooter === 'ishan' ? players.sakshi : players.ishan;
    if (opponent) {
      console.log('Sending fire event to opponent:', opponent);
      io.to(opponent).emit('opponent_fire', data);
    }

    setTimeout(() => {
      const nextPlayer = data.shooter === 'ishan' ? 'sakshi' : 'ishan';
      gameState.currentTurn = nextPlayer;
      console.log('Starting next turn:', nextPlayer);
      io.emit('turn_start', { player: nextPlayer });
    }, 3000);
  });

  socket.on('tank_move', (data) => {
    // Broadcast movement to opponent
    const opponent = socket.player === 'ishan' ? players.sakshi : players.ishan;
    if (opponent) {
      io.to(opponent).emit('opponent_move', data);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
