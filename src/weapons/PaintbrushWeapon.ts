import { Graphics } from 'pixi.js';
import { Weapon } from './Weapon';
import type { Game } from '../Game';

const PAINT_COLORS = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xff6600, 0x6600ff];

export class PaintbrushWeapon extends Weapon {
  private painting = false;
  private paintGfx: Graphics;
  private currentColor: number;
  private brushSize = 8;

  constructor(game: Game) {
    super(game);
    this.paintGfx = new Graphics();
    this.paintGfx.alpha = 0.7;
    game.fxContainer.addChild(this.paintGfx);
    this.currentColor = PAINT_COLORS[Math.floor(Math.random() * PAINT_COLORS.length)];
  }

  onPointerDown(x: number, y: number, shift: boolean) {
    this.painting = true;
    // New random color each stroke
    this.currentColor = PAINT_COLORS[Math.floor(Math.random() * PAINT_COLORS.length)];
    this.brushSize = shift ? 18 : 8;

    if (this.inBounds(x, y)) {
      this.paintDot(x, y);
      this.game.audio.play('spray');
    }
  }

  onPointerMove(x: number, y: number, prevX: number, prevY: number, shift: boolean) {
    if (!this.painting) return;
    if (!this.inBounds(x, y)) return;
    this.brushSize = shift ? 18 : 8;

    // Paint stroke
    this.paintGfx.moveTo(prevX, prevY);
    this.paintGfx.lineTo(x, y);
    this.paintGfx.stroke({ color: this.currentColor, width: this.brushSize, alpha: 0.6, cap: 'round' });

    // Drip effect randomly
    if (Math.random() < 0.08) {
      const dripLen = 10 + Math.random() * 30;
      this.paintGfx.moveTo(x, y);
      this.paintGfx.lineTo(x + (Math.random() - 0.5) * 4, y + dripLen);
      this.paintGfx.stroke({ color: this.currentColor, width: 2 + Math.random() * 2, alpha: 0.4, cap: 'round' });
    }

    // Spray particles
    if (Math.random() < 0.3) {
      this.game.particles.emit({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 2,
        vy: 0.5 + Math.random(),
        life: 0.5 + Math.random() * 0.5,
        maxLife: 0.5 + Math.random() * 0.5,
        size: 2 + Math.random() * 3,
        color: this.currentColor,
        alpha: 0.5,
        gravity: 0.1,
        drag: 0.98,
        type: 'spark',
      });
    }

    this.damageAt(x, y, 1);
    this.game.audio.play('spray');
  }

  private paintDot(x: number, y: number) {
    this.paintGfx.circle(x, y, this.brushSize / 2);
    this.paintGfx.fill({ color: this.currentColor, alpha: 0.6 });
  }

  onPointerUp() {
    this.painting = false;
  }

  update(_dt: number) {}
}
