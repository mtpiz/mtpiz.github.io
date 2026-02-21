import { Weapon } from './Weapon';
import type { Game } from '../Game';

export class ChainsawWeapon extends Weapon {
  private cutting = false;

  constructor(game: Game) { super(game); }

  onPointerDown(_x: number, _y: number, _shift: boolean) {
    this.cutting = true;
    this.game.audio.ensureLoop('chainsaw');
  }

  onPointerMove(x: number, y: number, prevX: number, prevY: number, shift: boolean) {
    if (!this.cutting) return;
    if (!this.inBounds(x, y)) return;

    const turbo = shift ? 2 : 1;
    const f = this.toFx(x, y);
    const fp = this.toFx(prevX, prevY);

    const dx = f.x - fp.x;
    const dy = f.y - fp.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 2) return;

    const nx = -dy / dist;
    const ny = dx / dist;

    let lastX = fp.x;
    let lastY = fp.y;
    const segs = 10;
    for (let i = 1; i <= segs; i++) {
      const t = i / segs;
      const mx = fp.x + dx * t;
      const my = fp.y + dy * t;
      const offset = (Math.random() - 0.5) * 18;
      const sx = mx + nx * offset;
      const sy = my + ny * offset;
      this.game.damage.addCut(lastX, lastY, sx, sy, 4 + Math.random() * 4);
      lastX = sx;
      lastY = sy;
    }

    this.game.particles.emitSplinters(f.x, f.y, 6 * turbo, dx, dy);
    this.game.particles.emitDust(f.x, f.y, 4);

    if (Math.random() < 0.3) {
      this.game.chunks.spawnShards(this.game.physics, f.x, f.y, 2, 4);
    }

    this.damageAt(x, y, 2 * turbo);
    this.game.shake(4, 0.08);
  }

  onPointerUp() {
    this.cutting = false;
    this.game.audio.stopLoop('chainsaw');
  }

  update(_dt: number) {}
}
