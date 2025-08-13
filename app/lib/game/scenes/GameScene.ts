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
  private moveSpeed: number = 3;
  private projectiles: Projectile[] = [];
  private projectileOwners: Map<Projectile, 'ishan' | 'sakshi'> = new Map();
  private terrainPolygon!: Phaser.Geom.Polygon;
  private terrainBodies: Phaser.Physics.Arcade.StaticGroup[] = [];
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
    // Create simple colored rectangles for tanks if images don't exist
    this.load.on('loaderror', () => {
      console.log('Asset loading failed, using fallback graphics');
    });
    
    // Try to load assets, but handle failure gracefully
    this.load.image('tank-body', '/assets/tank-body.png');
    this.load.image('tank-barrel', '/assets/tank-barrel.png');
  }

  create() {
    // Generate terrain first
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
      const terrainHeight = this.getTerrainHeight(data.x);
      this.opponentTank.setPosition(data.x, terrainHeight - 15);
    });

    // Add listener for opponent fire
    this.socket.on('opponent_fire', (data: { startX: number, startY: number, velocity: { x: number, y: number }, angle: number, power: number, shooter: string }) => {
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
      const terrainHeight = this.getTerrainHeight(data.x);
      this.opponentTank.setPosition(data.x, terrainHeight - 15);
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
    
    // Generate more interesting terrain points
    this.terrainPoints = [];
    const segments = 80;
    const baseHeight = 450;
    
    for (let i = 0; i <= segments; i++) {
      const x = (this.game.config.width as number) * (i / segments);
      // Create more varied terrain with multiple waves and random elements
      let y = baseHeight;
      y += Math.sin(i * 0.15) * 60; // Large waves
      y += Math.sin(i * 0.4) * 30;  // Medium waves
      y += Math.sin(i * 0.8) * 15;  // Small waves
      y += (Math.random() - 0.5) * 20; // Random variation
      
      // Ensure terrain stays within bounds
      y = Math.max(300, Math.min(550, y));
      
      this.terrainPoints.push(x, y);
    }

    this.drawTerrain();
    this.createTerrainCollision();
  }

  private createTerrainCollision() {
    // Create collision bodies along the terrain
    this.terrainBodies = [];
    const segmentWidth = 20;
    
    for (let i = 0; i < this.terrainPoints.length - 2; i += 2) {
      const x1 = this.terrainPoints[i];
      const y1 = this.terrainPoints[i + 1];
      const x2 = this.terrainPoints[i + 2];
      const y2 = this.terrainPoints[i + 3];
      
      // Create collision rectangles along terrain segments
      const avgX = (x1 + x2) / 2;
      const avgY = (y1 + y2) / 2;
      const height = Math.max(10, Math.abs(y2 - y1) + 10);
      
      const terrainBody = this.physics.add.staticGroup();
      const rect = this.add.rectangle(avgX, avgY + height/2, segmentWidth, height, 0x00ff00, 0);
      terrainBody.add(rect);
      this.terrainBodies.push(terrainBody);
    }
  }

  private drawTerrain() {
    this.terrain.clear();
    this.terrain.lineStyle(3, 0x00ff00);

    // Create terrain polygon for collision
    const bottomPoints = [
      ...this.terrainPoints,
      this.game.config.width as number, this.game.config.height as number,
      0, this.game.config.height as number
    ];
    this.terrainPolygon = new Phaser.Geom.Polygon(bottomPoints);

    // Draw terrain with smoother curves
    this.terrain.beginPath();
    this.terrain.moveTo(this.terrainPoints[0], this.terrainPoints[1]);
    
    // Use spline curves for smoother terrain
    for (let i = 2; i < this.terrainPoints.length - 2; i += 2) {
      this.terrain.lineTo(this.terrainPoints[i], this.terrainPoints[i + 1]);
    }
    
    this.terrain.strokePath();
    this.terrain.lineTo(this.game.config.width as number, this.game.config.height as number);
    this.terrain.lineTo(0, this.game.config.height as number);
    this.terrain.closePath();
    this.terrain.fillStyle(0x228B22, 0.4);
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
        const deformation = (radius - distance) * 0.7;
        this.terrainPoints[i + 1] += deformation;
      }
    }

    // Redraw terrain and recreate collision
    this.drawTerrain();
    this.createTerrainCollision();
  }

  private getTerrainHeight(x: number): number {
    // Clamp x to valid range
    x = Math.max(0, Math.min(this.game.config.width as number, x));
    
    // Find the terrain segment that contains x
    const segmentWidth = (this.game.config.width as number) / (this.terrainPoints.length / 2 - 1);
    const segmentIndex = Math.floor(x / segmentWidth);
    const index = Math.min(segmentIndex * 2, this.terrainPoints.length - 4);
    
    // Get the two points of the segment
    const x1 = this.terrainPoints[index];
    const y1 = this.terrainPoints[index + 1];
    const x2 = this.terrainPoints[index + 2];
    const y2 = this.terrainPoints[index + 3];
    
    // Interpolate to find the height at x
    if (x2 === x1) return y1;
    const t = (x - x1) / (x2 - x1);
    return y1 + (y2 - y1) * t;
  }

  private createTanks() {
    const startX = this.player === 'ishan' ? 100 : 700;
    const tankY = this.getTerrainHeight(startX) - 15;
    
    // Create my tank
    this.myTank = this.add.container(startX, tankY);
    const myBody = this.add.rectangle(0, 0, 40, 25, this.player === 'ishan' ? 0x4a9eca : 0xff69b4);
    this.barrel = this.add.rectangle(this.player === 'sakshi' ? -20 : 20, -5, 35, 6, 0x333333);
    this.myTank.add([myBody, this.barrel]);
    
    // Create opponent tank
    const opponentX = this.player === 'ishan' ? 700 : 100;
    const opponentY = this.getTerrainHeight(opponentX) - 15;
    this.opponentTank = this.add.container(opponentX, opponentY);
    const opponentBody = this.add.rectangle(0, 0, 40, 25, this.player === 'ishan' ? 0xff69b4 : 0x4a9eca);
    this.opponentBarrel = this.add.rectangle(this.player === 'sakshi' ? 20 : -20, -5, 35, 6, 0x333333);
    this.opponentTank.add([opponentBody, this.opponentBarrel]);
    
    // Add physics to tanks
    this.physics.world.enable(this.myTank);
    this.physics.world.enable(this.opponentTank);
    
    const tankBody = this.myTank.body as Phaser.Physics.Arcade.Body;
    const opponentTankBody = this.opponentTank.body as Phaser.Physics.Arcade.Body;
    
    tankBody.setCollideWorldBounds(true);
    tankBody.setSize(40, 25);
    opponentTankBody.setCollideWorldBounds(true);
    opponentTankBody.setSize(40, 25);
    
    // Set up terrain collision for tanks
    this.terrainBodies.forEach(terrainBody => {
      this.physics.add.collider(this.myTank, terrainBody);
      this.physics.add.collider(this.opponentTank, terrainBody);
    });
    
    if (this.player === 'sakshi') {
      this.angle = 135;
      this.updateBarrelAngle();
    }
  }

  private updateBarrelAngle() {
    if (this.barrel) {
      const angleRad = this.angle * Math.PI / 180;
      const barrelLength = 35;
      
      if (this.player === 'sakshi') {
        // Left-facing tank
        this.barrel.setRotation(Math.PI - angleRad);
        this.barrel.x = -Math.cos(angleRad) * (barrelLength / 2);
        this.barrel.y = -5 + Math.sin(angleRad) * (barrelLength / 2);
      } else {
        // Right-facing tank
        this.barrel.setRotation(-angleRad);
        this.barrel.x = Math.cos(angleRad) * (barrelLength / 2);
        this.barrel.y = -5 - Math.sin(angleRad) * (barrelLength / 2);
      }
    }
  }

  public moveTank(direction: number) {
    if (!this.isMyTurn) return;
    
    const newX = this.myTank.x + (direction * this.moveSpeed);
    if (newX > 30 && newX < (this.game.config.width as number - 30)) {
      const newY = this.getTerrainHeight(newX) - 15;
      this.myTank.setPosition(newX, newY);
      this.socket.emit('tank_move', { x: newX, y: newY });
    }
  }

  public fire() {
    console.log('Fire method called, isMyTurn:', this.isMyTurn);
    if (!this.isMyTurn) return;

    // Calculate firing position based on barrel
    const radians = this.angle * Math.PI / 180;
    const barrelLength = 35;
    let fireX, fireY;
    
    if (this.player === 'sakshi') {
      fireX = this.myTank.x - Math.cos(radians) * barrelLength;
      fireY = this.myTank.y - 5 + Math.sin(radians) * barrelLength;
    } else {
      fireX = this.myTank.x + Math.cos(radians) * barrelLength;
      fireY = this.myTank.y - 5 - Math.sin(radians) * barrelLength;
    }
    
    const velocity = {
      x: Math.cos(radians) * (this.power / 30) * (this.player === 'sakshi' ? -1 : 1),
      y: -Math.sin(radians) * (this.power / 30)
    };

    const projectile = new Projectile(
      this,
      fireX,
      fireY,
      velocity
    );

    this.projectiles.push(projectile);
    this.projectileOwners.set(projectile, this.player);

    console.log('Emitting fire event');
    this.socket.emit('fire', {
      startX: fireX,
      startY: fireY,
      velocity,
      angle: this.angle,
      power: this.power,
      shooter: this.player
    });

    this.isMyTurn = false;
  }

  private handleOpponentFire(data: { startX: number, startY: number, velocity: { x: number, y: number }, angle: number, power: number, shooter: string }) {
    const projectile = new Projectile(
      this,
      data.startX,
      data.startY,
      data.velocity
    );
    this.projectiles.push(projectile);
    this.projectileOwners.set(projectile, data.shooter as 'ishan' | 'sakshi');
  }

  update() {
    // Update projectiles and check for terrain collisions
    this.projectiles = this.projectiles.filter(projectile => {
      if (!projectile.active) {
        this.projectileOwners.delete(projectile);
        return false;
      }
      
      // Check if projectile hit terrain
      const terrainHeight = this.getTerrainHeight(projectile.x);
      if (projectile.y >= terrainHeight - 5) { // Add small buffer
        // Projectile hit terrain
        const owner = this.projectileOwners.get(projectile);
        const damage = Math.floor(Math.random() * 20) + 10;
        if (owner) {
          this.updateScore(owner, damage);
        }
        this.deformTerrain(projectile.x, projectile.y, 40);
        projectile.onHit();
        this.projectileOwners.delete(projectile);
        return false;
      }
      
      return projectile.update();
    });

    // Keep tanks properly positioned on terrain
    const myTerrainY = this.getTerrainHeight(this.myTank.x) - 15;
    const opponentTerrainY = this.getTerrainHeight(this.opponentTank.x) - 15;
    
    // Smoothly adjust tank positions to terrain
    if (Math.abs(this.myTank.y - myTerrainY) > 2) {
      this.myTank.y = Phaser.Math.Linear(this.myTank.y, myTerrainY, 0.1);
    } else {
      this.myTank.y = myTerrainY;
    }
    
    if (Math.abs(this.opponentTank.y - opponentTerrainY) > 2) {
      this.opponentTank.y = Phaser.Math.Linear(this.opponentTank.y, opponentTerrainY, 0.1);
    } else {
      this.opponentTank.y = opponentTerrainY;
    }

    // Reset tank velocities to prevent drifting
    const tankBody = this.myTank.body as Phaser.Physics.Arcade.Body;
    const opponentTankBody = this.opponentTank.body as Phaser.Physics.Arcade.Body;
    
    if (tankBody) {
      tankBody.setVelocity(0, 0);
    }
    if (opponentTankBody) {
      opponentTankBody.setVelocity(0, 0);
    }
  }

  setPower(power: number) {
    if (this.isMyTurn) {
      this.power = Math.max(10, Math.min(100, power));
    }
  }

  setAngle(angle: number) {
    if (this.isMyTurn) {
      this.angle = Math.max(0, Math.min(180, angle));
      this.updateBarrelAngle();
    }
  }
} 