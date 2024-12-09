import Phaser from 'phaser';

export class BaseScene extends Phaser.Scene {
  protected socket: any;
  protected player: 'ishan' | 'sakshi' = 'ishan';

  constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
    super(config);
  }

  init(data: { socket: any; player: 'ishan' | 'sakshi' }) {
    this.socket = data.socket;
    this.player = data.player;
  }
} 