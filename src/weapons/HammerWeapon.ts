import { Weapon } from './Weapon';
import type { Game } from '../Game';

export class HammerWeapon extends Weapon {
  constructor(game: Game) { super(game); }

  onPointerDown(x: number, y: number, shift: boolean) {
    if (!this.inBounds(x, y)) return;

    const force = shift ? 12 : 8;
    const count = shift ? 10 : 6;

    // Cracks radiating from impact
    this.game.damage.addCrack(x, y, 60 + Math.random() * 40);

    // Spawn physical debris chunks
    this.game.chunks.spawnDebris(this.game.physics, this.game.resumeTexture!, x, y, count, force, this.game.getResumeSourceRect(x, y, 60));

    // Particles: sparks + dust
    this.game.particles.emitSparks(x, y, 25);
    this.game.particles.emitDust(x, y, 15);

    // Damage resume elements
    this.damageAt(x, y, shift ? 8 : 5);

    // Screen shake
    this.game.shake(shift ? 14 : 9, 0.3);

    // Sound
    this.game.audio.play('hammer');
  }

  onPointerMove(x: number, y: number, prevX: number, prevY: number, shift: boolean) {
    // Hammer can also do drag impacts — lighter hits
    if (!this.inBounds(x, y)) return;
    this.game.damage.addCrack(x, y, 30 + Math.random() * 20);
    this.game.particles.emitSparks(x, y, 5);
    this.game.particles.emitDust(x, y, 3);
    this.damageAt(x, y, 1);
    this.game.shake(3, 0.1);
  }

  onPointerUp() {}
  update(_dt: number) {}
}
