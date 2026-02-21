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

    // Burn marks
    this.game.damage.addBurn(x, y, radius);

    // Fire particles rising
    this.game.particles.emitFire(x, y, 8);
    this.game.particles.emitEmbers(x, y, 4);
    this.game.particles.emitSmoke(x, y - 20, 2);

    // Damage
    this.damageAt(x, y, shift ? 3 : 2);
  }

  onPointerUp() {
    this.burning = false;
    this.game.audio.stopLoop('flame');
  }

  update(_dt: number) {}
}
