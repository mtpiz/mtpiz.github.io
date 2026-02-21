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

  onPointerDown(_x: number, _y: number, _shift: boolean) {
    this.cutting = true;
  }

  onPointerMove(x: number, y: number, prevX: number, prevY: number, shift: boolean) {
    if (!this.cutting) return;
    if (!this.inBounds(x, y) && !this.inBounds(prevX, prevY)) return;

    const width = shift ? 10 : 5;
    const f = this.toFx(x, y);
    const fp = this.toFx(prevX, prevY);

    this.game.damage.addCut(fp.x, fp.y, f.x, f.y, width);

    this.beamGfx.clear();
    this.beamGfx.moveTo(fp.x, fp.y);
    this.beamGfx.lineTo(f.x, f.y);
    this.beamGfx.stroke({ color: 0xff2200, width: width + 8, alpha: 0.3 });
    this.beamGfx.moveTo(fp.x, fp.y);
    this.beamGfx.lineTo(f.x, f.y);
    this.beamGfx.stroke({ color: 0xff6644, width: width + 2, alpha: 0.6 });
    this.beamGfx.moveTo(fp.x, fp.y);
    this.beamGfx.lineTo(f.x, f.y);
    this.beamGfx.stroke({ color: 0xffffff, width: 2, alpha: 0.9 });
    this.beamGfx.alpha = 1;
    this.fadeTimer = 0.1;

    this.game.particles.emitEmbers(f.x, f.y, 3);
    this.game.particles.emitSparks(f.x, f.y, 4);
    this.damageAt(x, y, (shift ? 2 : 1));
    this.game.audio.play('laser');
  }

  onPointerUp() { this.cutting = false; }

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
