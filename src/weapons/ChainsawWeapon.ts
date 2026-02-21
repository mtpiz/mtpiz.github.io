import { Weapon } from './Weapon';
import type { Game } from '../Game';

export class ChainsawWeapon extends Weapon {
  private cutting = false;

  constructor(game: Game) { super(game); }

  onPointerDown(x: number, y: number, _shift: boolean) {
    this.cutting = true;
    this.game.audio.ensureLoop('chainsaw');
  }

  onPointerMove(x: number, y: number, prevX: number, prevY: number, shift: boolean) {
    if (!this.cutting) return;
    if (!this.inBounds(x, y)) return;

    const turbo = shift ? 2 : 1;

    // Jagged tear line (multiple segments with random offsets)
    const segs = 10;
    const dx = x - prevX;
    const dy = y - prevY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 2) return;

    // Calculate perpendicular
    const nx = -dy / dist;
    const ny = dx / dist;

    let lastX = prevX;
    let lastY = prevY;
    for (let i = 1; i <= segs; i++) {
      const t = i / segs;
      const mx = prevX + dx * t;
      const my = prevY + dy * t;
      const offset = (Math.random() - 0.5) * 18;
      const fx = mx + nx * offset;
      const fy = my + ny * offset;

      this.game.damage.addCut(lastX, lastY, fx, fy, 4 + Math.random() * 4);
      lastX = fx;
      lastY = fy;
    }

    // Splinters flying away from cut
    this.game.particles.emitSplinters(x, y, 6 * turbo, dx, dy);
    this.game.particles.emitDust(x, y, 4);

    // Small debris chunks
    if (Math.random() < 0.3) {
      this.game.chunks.spawnShards(this.game.physics, x, y, 2, 4);
    }

    // Damage
    this.damageAt(x, y, 2 * turbo);

    // Shake while cutting
    this.game.shake(4, 0.08);
  }

  onPointerUp() {
    this.cutting = false;
    this.game.audio.stopLoop('chainsaw');
  }

  update(_dt: number) {}
}
