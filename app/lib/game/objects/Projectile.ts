import Phaser from 'phaser';

export class Projectile extends Phaser.GameObjects.Arc {
  private velocity: { x: number; y: number };
  private lifespan: number = 5000; // 5 seconds max flight time
  private startTime: number;

  constructor(scene: Phaser.Scene, x: number, y: number, velocity: { x: number; y: number }) {
    super(scene, x, y, 4, 0, 360, false, 0xff00ff);
    
    this.velocity = velocity;
    this.startTime = Date.now();
    
    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set initial velocity
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(velocity.x * 200, velocity.y * 200);
    body.setGravityY(300);
    body.setBounce(0.3);
    body.setCollideWorldBounds(true);
  }

  update() {
    // Check if projectile should be destroyed
    if (Date.now() - this.startTime > this.lifespan) {
      this.destroy();
      return false;
    }

    return true;
  }

  onHit() {
    // Create explosion effect
    const explosion = this.scene.add.circle(this.x, this.y, 20, 0xff0000, 0.5);
    this.scene.tweens.add({
      targets: explosion,
      scale: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => explosion.destroy()
    });

    this.destroy();
  }
} 