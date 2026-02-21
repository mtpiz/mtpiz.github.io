import { Weapon } from './Weapon';
import type { Game } from '../Game';

export class MachineGunWeapon extends Weapon {
  private firing = false;
  private fireTimer = 0;
  private fireRate = 0.06; // seconds between shots
  private targetX = 0;
  private targetY = 0;
  private shift = false;

  constructor(game: Game) { super(game); }

  onPointerDown(x: number, y: number, shift: boolean) {
    this.firing = true;
    this.targetX = x;
    this.targetY = y;
    this.shift = shift;
    this.fireRate = shift ? 0.03 : 0.06;
    this.fireShot(x, y);
    this.game.audio.ensureLoop('machinegun');
  }

  onPointerMove(x: number, y: number, _prevX: number, _prevY: number, shift: boolean) {
    this.targetX = x;
    this.targetY = y;
    this.shift = shift;
    this.fireRate = shift ? 0.03 : 0.06;
  }

  onPointerUp() {
    this.firing = false;
    this.game.audio.stopLoop('machinegun');
  }

  private fireShot(x: number, y: number) {
    // Spread
    const spread = this.shift ? 12 : 6;
    const sx = x + (Math.random() - 0.5) * spread;
    const sy = y + (Math.random() - 0.5) * spread;

    if (!this.inBounds(sx, sy)) return;

    // Bullet hole
    const holeRadius = 3 + Math.random() * 3;
    this.game.damage.addHole(sx, sy, holeRadius);

    // Particles
    this.game.particles.emitBulletImpact(sx, sy);

    // Small debris
    this.game.chunks.spawnShards(this.game.physics, sx, sy, 2, 3);

    // Damage
    this.damageAt(sx, sy, 2);

    // Tiny shake
    this.game.shake(2, 0.05);

    // Sound
    this.game.audio.play('gunshot');
  }

  update(dt: number) {
    if (!this.firing) return;
    this.fireTimer += dt;
    while (this.fireTimer >= this.fireRate) {
      this.fireTimer -= this.fireRate;
      this.fireShot(this.targetX, this.targetY);
    }
  }
}
