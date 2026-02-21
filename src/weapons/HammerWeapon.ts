import { Weapon } from './Weapon';
import type { Game } from '../Game';

export class HammerWeapon extends Weapon {
  constructor(game: Game) { super(game); }

  onPointerDown(x: number, y: number, shift: boolean) {
    if (!this.inBounds(x, y)) return;

    const force = shift ? 12 : 8;
    const count = shift ? 10 : 6;
    const f = this.toFx(x, y);

    this.game.damage.addCrack(f.x, f.y, 60 + Math.random() * 40);
    this.game.chunks.spawnDebris(this.game.physics, this.game.resumeTexture!, f.x, f.y, count, force, this.game.getResumeSourceRect(f.x, f.y, 60));
    this.game.particles.emitSparks(f.x, f.y, 25);
    this.game.particles.emitDust(f.x, f.y, 15);
    this.damageAt(x, y, shift ? 8 : 5);
    this.game.shake(shift ? 14 : 9, 0.3);
    this.game.audio.play('hammer');
  }

  onPointerMove(x: number, y: number, _prevX: number, _prevY: number, _shift: boolean) {
    if (!this.inBounds(x, y)) return;
    const f = this.toFx(x, y);
    this.game.damage.addCrack(f.x, f.y, 30 + Math.random() * 20);
    this.game.particles.emitSparks(f.x, f.y, 5);
    this.game.particles.emitDust(f.x, f.y, 3);
    this.damageAt(x, y, 1);
    this.game.shake(3, 0.1);
  }

  onPointerUp() {}
  update(_dt: number) {}
}
