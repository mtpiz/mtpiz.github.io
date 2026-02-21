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
    this.currentColor = PAINT_COLORS[Math.floor(Math.random() * PAINT_COLORS.length)];
    this.brushSize = shift ? 18 : 8;

    if (this.inBounds(x, y)) {
      const f = this.toFx(x, y);
      this.paintGfx.circle(f.x, f.y, this.brushSize / 2);
      this.paintGfx.fill({ color: this.currentColor, alpha: 0.6 });
      this.game.audio.play('spray');
    }
  }

  onPointerMove(x: number, y: number, prevX: number, prevY: number, shift: boolean) {
    if (!this.painting) return;
    if (!this.inBounds(x, y)) return;
    this.brushSize = shift ? 18 : 8;

    const f = this.toFx(x, y);
    const fp = this.toFx(prevX, prevY);

    this.paintGfx.moveTo(fp.x, fp.y);
    this.paintGfx.lineTo(f.x, f.y);
    this.paintGfx.stroke({ color: this.currentColor, width: this.brushSize, alpha: 0.6, cap: 'round' });

    if (Math.random() < 0.08) {
      const dripLen = 10 + Math.random() * 30;
      this.paintGfx.moveTo(f.x, f.y);
      this.paintGfx.lineTo(f.x + (Math.random() - 0.5) * 4, f.y + dripLen);
      this.paintGfx.stroke({ color: this.currentColor, width: 2 + Math.random() * 2, alpha: 0.4, cap: 'round' });
    }

    if (Math.random() < 0.3) {
      this.game.particles.emit({
        x: f.x + (Math.random() - 0.5) * 20,
        y: f.y + (Math.random() - 0.5) * 20,
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

  onPointerUp() { this.painting = false; }
  update(_dt: number) {}
}
