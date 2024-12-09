import { BaseScene } from './BaseScene';
import { Projectile } from '../objects/Projectile';

export class GameScene extends BaseScene {
  private terrain!: Phaser.GameObjects.Graphics;
  private myTank!: Phaser.GameObjects.Container;
  private opponentTank!: Phaser.GameObjects.Container;
  private barrel!: Phaser.GameObjects.Rectangle;
  private opponentBarrel!: Phaser.GameObjects.Rectangle;
  private isMyTurn: boolean = false;
  
  // Game state
  private power: number = 50;
  private angle: number = 45;
  private moveSpeed: number = 2;
  private projectiles: Projectile[] = [];
  private terrainPolygon!: Phaser.Geom.Polygon;
  private scores = {
    ishan: 0,
    sakshi: 0
  };
  private scoreTexts!: {
    ishan: Phaser.GameObjects.Text;
    sakshi: Phaser.GameObjects.Text;
  };
  private terrainPoints: number[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // Load assets
    this.load.image('tank-body', '/assets/tank-body.png');
    this.load.image('tank-barrel', '/assets/tank-barrel.png');
  }

  create() {
    // Generate terrain
    this.createTerrain();
    
    // Create tanks
    this.createTanks();

    // Create score display
    this.createScoreDisplay();

    // Set up turn system
    this.socket.on('turn_start', ({ player }: { player: 'ishan' | 'sakshi' }) => {
      this.isMyTurn = player === this.player;
      console.log('Turn started for:', player, 'isMyTurn:', this.isMyTurn);
      // Add visual indication of turn
      const turnText = this.add.text(
        this.game.config.width as number / 2,
        50,
        `${this.isMyTurn ? 'Your' : `${player}'s`} turn!`,
        {
          fontSize: '24px',
          color: this.isMyTurn ? '#4a9eca' : '#666666'
        }
      ).setOrigin(0.5);

      // Fade out after 2 seconds
      this.tweens.add({
        targets: turnText,
        alpha: 0,
        duration: 2000,
        ease: 'Power2',
        onComplete: () => turnText.destroy()
      });
    });

    // Listen for opponent actions
    this.socket.on('opponent_move', (data: { x: number, y: number }) => {
      console.log('Opponent moved to:', data);
      this.opponentTank.setPosition(data.x, data.y);
    });

    // Add listener for opponent fire
    this.socket.on('opponent_fire', (data: any) => {
      console.log('Opponent fired:', data);
      this.handleOpponentFire(data);
    });

    // Send initial position to opponent
    this.socket.emit('player_position', {
      x: this.myTank.x,
      y: this.myTank.y,
      player: this.player
    });

    // Listen for opponent position
    this.socket.on('opponent_position', (data: { x: number, y: number }) => {
      console.log('Received opponent position:', data);
      this.opponentTank.setPosition(data.x, data.y);
    });
  }

  private createScoreDisplay() {
    // Sakshi score (left)
    this.scoreTexts = {
      sakshi: this.add.text(20, 20, 'Sakshi: 0', {
        fontSize: '24px',
        color: '#ff69b4',
        fontStyle: 'bold'
      }),
      ishan: this.add.text(this.game.config.width as number - 150, 20, 'Ishan: 0', {
        fontSize: '24px',
        color: '#4a9eca',
        fontStyle: 'bold'
      })
    };
  }

  private updateScore(player: 'ishan' | 'sakshi', damage: number) {
    this.scores[player] += damage;
    this.scoreTexts[player].setText(`${player === 'ishan' ? 'Ishan' : 'Sakshi'}: ${this.scores[player]}`);
  }

  private createTerrain() {
    this.terrain = this.add.graphics();
    this.terrain.lineStyle(2, 0x00ff00);
    
    // Generate terrain points
    this.terrainPoints = [];
    const segments = 60;
    
    for (let i = 0; i <= segments; i++) {
      const x = (this.game.config.width as number) * (i / segments);
      const y = 400 + Math.sin(i * 0.2) * 50;
      this.terrainPoints.push(x, y);
    }

    this.drawTerrain();
  }

  private drawTerrain() {
    this.terrain.clear();
    this.terrain.lineStyle(2, 0x00ff00);

    // Create terrain polygon for collision
    const bottomPoints = [
      ...this.terrainPoints,
      this.game.config.width as number, this.game.config.height as number,
      0, this.game.config.height as number
    ];
    this.terrainPolygon = new Phaser.Geom.Polygon(bottomPoints);

    // Draw terrain
    this.terrain.beginPath();
    this.terrain.moveTo(this.terrainPoints[0], this.terrainPoints[1]);
    
    for (let i = 2; i < this.terrainPoints.length; i += 2) {
      this.terrain.lineTo(this.terrainPoints[i], this.terrainPoints[i + 1]);
    }
    
    this.terrain.strokePath();
    this.terrain.lineTo(this.game.config.width as number, this.game.config.height as number);
    this.terrain.lineTo(0, this.game.config.height as number);
    this.terrain.closePath();
    this.terrain.fillStyle(0x00ff00, 0.3);
    this.terrain.fill();
  }

  private deformTerrain(x: number, y: number, radius: number) {
    // Deform terrain points within radius
    for (let i = 0; i < this.terrainPoints.length; i += 2) {
      const dx = this.terrainPoints[i] - x;
      const dy = this.terrainPoints[i + 1] - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < radius) {
        // Create a crater effect
        const deformation = (radius - distance) * 0.5;
        this.terrainPoints[i + 1] += deformation;
      }
    }

    // Redraw terrain
    this.drawTerrain();
  }

  private getTerrainHeight(x: number): number {
    // Find the terrain segment that contains x
    const segmentWidth = (this.game.config.width as number) / (this.terrainPoints.length / 2 - 1);
    const index = Math.floor(x / segmentWidth) * 2;
    
    // Get the two points of the segment
    const x1 = this.terrainPoints[index];
    const y1 = this.terrainPoints[index + 1];
    const x2 = this.terrainPoints[index + 2];
    const y2 = this.terrainPoints[index + 3];
    
    // Interpolate to find the height at x
    const t = (x - x1) / (x2 - x1);
    return y1 + (y2 - y1) * t;
  }

  private createTanks() {
    const startX = this.player === 'ishan' ? 100 : 700;
    const tankY = this.getTerrainHeight(startX) - 10;
    
    // Create my tank
    this.myTank = this.add.container(startX, tankY);
    const myBody = this.add.rectangle(0, 0, 40, 20, 0x888888);
    this.barrel = this.add.rectangle(20, -5, 30, 8, 0x666666);
    this.myTank.add([myBody, this.barrel]);
    
    // Create opponent tank
    const opponentX = this.player === 'ishan' ? 700 : 100;
    const opponentY = this.getTerrainHeight(opponentX) - 10;
    this.opponentTank = this.add.container(opponentX, opponentY);
    const opponentBody = this.add.rectangle(0, 0, 40, 20, 0xFF8888);
    this.opponentBarrel = this.add.rectangle(20, -5, 30, 8, 0xFF6666);
    this.opponentTank.add([opponentBody, this.opponentBarrel]);
    
    // Add physics
    this.physics.world.enable(this.myTank);
    this.physics.world.enable(this.opponentTank);
    
    const tankBody = this.myTank.body as Phaser.Physics.Arcade.Body;
    tankBody.setCollideWorldBounds(true);
    
    if (this.player === 'sakshi') {
      this.angle = 135;
      this.updateBarrelAngle();
    }
  }

  private updateBarrelAngle() {
    if (this.barrel) {
      this.barrel.setAngle(this.player === 'sakshi' ? this.angle - 180 : -this.angle);
    }
  }

  private moveTank(direction: number) {
    if (!this.isMyTurn) return;
    
    const newX = this.myTank.x + (direction * this.moveSpeed);
    if (newX > 0 && newX < (this.game.config.width as number)) {
      const newY = this.getTerrainHeight(newX) - 10;
      this.myTank.setPosition(newX, newY);
      this.socket.emit('tank_move', { x: newX, y: newY });
    }
  }

  public fire() {
    console.log('Fire method called, isMyTurn:', this.isMyTurn);
    if (!this.isMyTurn) return;

    const radians = this.angle * Math.PI / 180;
    const velocity = {
      x: Math.cos(radians) * (this.power / 50) * (this.player === 'sakshi' ? -1 : 1),
      y: -Math.sin(radians) * (this.power / 50)
    };

    const projectile = new Projectile(
      this,
      this.myTank.x + (this.player === 'sakshi' ? -20 : 20),
      this.myTank.y - 5,
      velocity
    );

    this.projectiles.push(projectile);

    console.log('Emitting fire event');
    this.socket.emit('fire', {
      startX: this.myTank.x + (this.player === 'sakshi' ? -20 : 20),
      startY: this.myTank.y - 5,
      velocity,
      angle: this.angle,
      power: this.power,
      shooter: this.player
    });

    this.isMyTurn = false;
  }

  private handleOpponentFire(data: any) {
    const projectile = new Projectile(
      this,
      data.startX,
      data.startY,
      data.velocity
    );
    this.projectiles.push(projectile);
  }

  update() {
    // Update projectiles
    this.projectiles = this.projectiles.filter(projectile => {
      if (!projectile.update()) return false;

      // Check collision with terrain
      if (this.terrainPolygon.contains(projectile.x, projectile.y)) {
        let damage = 10; // Default damage
        
        if (projectile.body) {
          damage = Math.floor(
            Math.sqrt(
              Math.pow(projectile.body.velocity.x, 2) + 
              Math.pow(projectile.body.velocity.y, 2)
            ) / 50
          );
        }
        
        // Update score for the player who fired
        const scoringPlayer = this.player === 'ishan' ? 'ishan' : 'sakshi';
        this.updateScore(scoringPlayer, damage);

        // Deform terrain
        this.deformTerrain(projectile.x, projectile.y, 30);
        projectile.onHit();
        return false;
      }

      return true;
    });

    // Keep tank on terrain
    const tankBody = this.myTank.body as Phaser.Physics.Arcade.Body;
    if (tankBody) {
      const terrainY = this.getTerrainHeight(this.myTank.x) - 10;
      this.myTank.y = terrainY;
      tankBody.setVelocityY(0);
    }
  }

  setPower(power: number) {
    if (this.isMyTurn) {
      this.power = power;
      // Update barrel angle in case it depends on power
      this.updateBarrelAngle();
    }
  }

  setAngle(angle: number) {
    if (this.isMyTurn) {
      this.angle = angle;
      this.updateBarrelAngle();
    }
  }
} 