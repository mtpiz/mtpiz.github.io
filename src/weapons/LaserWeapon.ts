import { Graphics } from 'pixi.js';
import { Weapon } from './Weapon';
import type { Game } from '../Game';

export class LaserWeapon extends Weapon {
  private cutting = false;
  private beamGfx: Graphics;
  private fadeTimer = 0;

  constructor(game: Game) {
    super(game);
    this.beamGfx = new Graphics();
    this.beamGfx.alpha = 0;
    game.fxContainer.addChild(this.beamGfx);
  }

  onPointerDown(x: number, y: number, _shift: boolean) {
    this.cutting = true;
  }

  onPointerMove(x: number, y: number, prevX: number, prevY: number, shift: boolean) {
    if (!this.cutting) return;
    if (!this.inBounds(x, y) && !this.inBounds(prevX, prevY)) return;

    const width = shift ? 10 : 5;

    // Persistent cut line
    this.game.damage.addCut(prevX, prevY, x, y, width);

    // Glowing beam effect (temporary)
    this.beamGfx.clear();
    // Outer glow
    this.beamGfx.moveTo(prevX, prevY);
    this.beamGfx.lineTo(x, y);
    this.beamGfx.stroke({ color: 0xff2200, width: width + 8, alpha: 0.3 });
    // Core beam
    this.beamGfx.moveTo(prevX, prevY);
    this.beamGfx.lineTo(x, y);
    this.beamGfx.stroke({ color: 0xff6644, width: width + 2, alpha: 0.6 });
    // White hot center
    this.beamGfx.moveTo(prevX, prevY);
    this.beamGfx.lineTo(x, y);
    this.beamGfx.stroke({ color: 0xffffff, width: 2, alpha: 0.9 });

    this.beamGfx.alpha = 1;
    this.fadeTimer = 0.1;

    // Embers at cut point
    this.game.particles.emitEmbers(x, y, 3);
    this.game.particles.emitSparks(x, y, 4);

    // Damage
    const turbo = shift ? 2 : 1;
    this.damageAt(x, y, 1 * turbo);

    this.game.audio.play('laser');
  }

  onPointerUp() {
    this.cutting = false;
  }

  update(dt: number) {
    if (this.fadeTimer > 0) {
      this.fadeTimer -= dt;
      if (this.fadeTimer <= 0) {
        this.beamGfx.clear();
        this.beamGfx.alpha = 0;
      }
    }
  }
}
