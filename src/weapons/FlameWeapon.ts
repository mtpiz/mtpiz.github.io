import { Weapon } from './Weapon';
import type { Game } from '../Game';

export class FlameWeapon extends Weapon {
  private burning = false;

  constructor(game: Game) { super(game); }

  onPointerDown(x: number, y: number, _shift: boolean) {
    this.burning = true;
    this.game.audio.ensureLoop('flame');
    this.applyFlame(x, y, false);
  }

  onPointerMove(x: number, y: number, _prevX: number, _prevY: number, shift: boolean) {
    if (!this.burning) return;
    this.applyFlame(x, y, shift);
  }

  private applyFlame(x: number, y: number, shift: boolean) {
    if (!this.inBounds(x, y)) return;
    const radius = shift ? 55 : 38;
    const f = this.toFx(x, y);
    this.game.damage.addBurn(f.x, f.y, radius);
    this.game.particles.emitFire(f.x, f.y, 8);
    this.game.particles.emitEmbers(f.x, f.y, 4);
    this.game.particles.emitSmoke(f.x, f.y - 20, 2);
    this.damageAt(x, y, shift ? 3 : 2);
  }

  onPointerUp() {
    this.burning = false;
    this.game.audio.stopLoop('flame');
  }

  update(_dt: number) {}
}
