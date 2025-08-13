import Phaser from 'phaser';

export class Projectile extends Phaser.GameObjects.Arc {
  private velocity: { x: number; y: number };
  private lifespan: number = 8000; // 8 seconds max flight time
  private startTime: number;
  private trail: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, velocity: { x: number; y: number }) {
    super(scene, x, y, 8, 0, 360, false, 0xff4444);
    
    this.velocity = velocity;
    this.startTime = Date.now();
    
    // Create trail effect
    this.trail = scene.add.graphics();
    
    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set initial velocity with better scaling
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(velocity.x * 400, velocity.y * 400);
    body.setGravityY(500);
    body.setBounce(0.1, 0.1);
    body.setCollideWorldBounds(false); // Allow projectiles to go off-screen
    
    // Store previous positions for trail
    this.setData('prevPositions', []);
    
    console.log('Projectile created at:', x, y, 'with velocity:', velocity);
  }

  update() {
    // Check if projectile should be destroyed
    if (Date.now() - this.startTime > this.lifespan) {
      this.destroy();
      return false;
    }

    // Update trail
    this.updateTrail();
    
    // Check if projectile is way off screen
    if (this.x < -200 || this.x > (this.scene.game.config.width as number) + 200 || 
        this.y > (this.scene.game.config.height as number) + 200) {
      this.destroy();
      return false;
    }

    return true;
  }

  private updateTrail() {
    const prevPositions = this.getData('prevPositions') as Array<{x: number, y: number}>;
    
    // Add current position to trail
    prevPositions.push({ x: this.x, y: this.y });
    
    // Limit trail length
    if (prevPositions.length > 6) {
      prevPositions.shift();
    }
    
    // Draw trail
    this.trail.clear();
    if (prevPositions.length > 1) {
      for (let i = 0; i < prevPositions.length - 1; i++) {
        const alpha = (i + 1) / prevPositions.length;
        const width = alpha * 4;
        this.trail.lineStyle(width, 0xff4444, alpha * 0.8);
        this.trail.lineBetween(
          prevPositions[i].x, 
          prevPositions[i].y, 
          prevPositions[i + 1].x, 
          prevPositions[i + 1].y
        );
      }
    }
    
    this.setData('prevPositions', prevPositions);
  }

  onHit() {
    console.log('Projectile hit at:', this.x, this.y);
    
    // Create explosion effect
    const explosion1 = this.scene.add.circle(this.x, this.y, 10, 0xff0000, 1);
    const explosion2 = this.scene.add.circle(this.x, this.y, 20, 0xff4444, 0.7);
    const explosion3 = this.scene.add.circle(this.x, this.y, 30, 0xff8888, 0.4);
    
    // Explosion animation
    this.scene.tweens.add({
      targets: [explosion1, explosion2, explosion3],
      scale: { from: 0.5, to: 2.5 },
      alpha: { from: 1, to: 0 },
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        explosion1.destroy();
        explosion2.destroy();
        explosion3.destroy();
      }
    });

    // Screen shake effect
    this.scene.cameras.main.shake(300, 0.015);

    // Clean up trail
    if (this.trail) {
      this.trail.destroy();
    }

    this.destroy();
  }

  destroy() {
    if (this.trail) {
      this.trail.destroy();
    }
    super.destroy();
  }
} 