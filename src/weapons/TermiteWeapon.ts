import { Graphics } from 'pixi.js';
import { Weapon } from './Weapon';
import type { Game } from '../Game';
import type { TermiteAgent } from '../engine/types';

export class TermiteWeapon extends Weapon {
  private termites: TermiteAgent[] = [];
  private termiteGfx: Graphics;

  constructor(game: Game) {
    super(game);
    this.termiteGfx = new Graphics();
    game.fxContainer.addChild(this.termiteGfx);
  }

  onPointerDown(x: number, y: number, shift: boolean) {
    if (!this.inBounds(x, y)) return;

    // Termites are spawned in fx-space so they scroll with the resume
    const f = this.toFx(x, y);
    const count = shift ? 18 : 8;
    for (let i = 0; i < count; i++) {
      this.termites.push({
        x: f.x + (Math.random() - 0.5) * 20,
        y: f.y + (Math.random() - 0.5) * 20,
        dir: Math.random() * Math.PI * 2,
        speed: 1.5 + Math.random() * 2,
        life: 6 + Math.random() * 8,
        maxLife: 6 + Math.random() * 8,
        wiggle: Math.random() * 100,
      });
    }
    this.game.audio.play('termites');
  }

  onPointerMove() {}
  onPointerUp() {}

  update(dt: number) {
    this.termiteGfx.clear();

    for (let i = this.termites.length - 1; i >= 0; i--) {
      const t = this.termites[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.termites.splice(i, 1);
        continue;
      }

      t.wiggle += dt * 8;
      t.dir += (Math.sin(t.wiggle) * 0.3 + (Math.random() - 0.5) * 0.4) * dt * 4;
      t.x += Math.cos(t.dir) * t.speed;
      t.y += Math.sin(t.dir) * t.speed;

      // Termite coords are in fx-space; check bounds by converting back to viewport
      const scroll = this.game.viewportToFx(0, 0);
      const tvx = t.x - scroll.x;
      const tvy = t.y - scroll.y;

      if (this.inBounds(tvx, tvy)) {
        if (Math.random() < 0.15) {
          this.game.damage.addHole(t.x, t.y, 2 + Math.random() * 2);
          this.damageAt(tvx, tvy, 1);
          if (Math.random() < 0.3) {
            this.game.particles.emitDust(t.x, t.y, 1);
          }
        }
      }

      // Draw termite (in fx-space, scrolls with container)
      const alpha = Math.min(1, t.life / 1);
      this.termiteGfx.circle(t.x, t.y, 3);
      this.termiteGfx.fill({ color: 0x553311, alpha });
      this.termiteGfx.circle(t.x + Math.cos(t.dir) * 4, t.y + Math.sin(t.dir) * 4, 2);
      this.termiteGfx.fill({ color: 0x442200, alpha });
      const headX = t.x + Math.cos(t.dir) * 6;
      const headY = t.y + Math.sin(t.dir) * 6;
      for (const side of [-0.5, 0.5]) {
        const ax = headX + Math.cos(t.dir + side) * 3;
        const ay = headY + Math.sin(t.dir + side) * 3;
        this.termiteGfx.moveTo(headX, headY);
        this.termiteGfx.lineTo(ax, ay);
        this.termiteGfx.stroke({ color: 0x442200, width: 0.8, alpha });
      }
    }
  }
}
