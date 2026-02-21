import { Weapon } from './Weapon';
import type { Game } from '../Game';

export class MachineGunWeapon extends Weapon {
  private firing = false;
  private fireTimer = 0;
  private fireRate = 0.06;
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
    const spread = this.shift ? 12 : 6;
    const sx = x + (Math.random() - 0.5) * spread;
    const sy = y + (Math.random() - 0.5) * spread;
    if (!this.inBounds(sx, sy)) return;

    const f = this.toFx(sx, sy);
    this.game.damage.addHole(f.x, f.y, 3 + Math.random() * 3);
    this.game.particles.emitBulletImpact(f.x, f.y);
    this.game.chunks.spawnShards(this.game.physics, f.x, f.y, 2, 3);
    this.damageAt(sx, sy, 2);
    this.game.shake(2, 0.05);
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
