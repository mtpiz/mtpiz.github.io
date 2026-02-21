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

    const count = shift ? 18 : 8;
    for (let i = 0; i < count; i++) {
      this.termites.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
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

      // Random walk
      t.wiggle += dt * 8;
      t.dir += (Math.sin(t.wiggle) * 0.3 + (Math.random() - 0.5) * 0.4) * dt * 4;
      t.x += Math.cos(t.dir) * t.speed;
      t.y += Math.sin(t.dir) * t.speed;

      // Eat holes
      if (this.inBounds(t.x, t.y)) {
        if (Math.random() < 0.15) {
          this.game.damage.addHole(t.x, t.y, 2 + Math.random() * 2);
          this.damageAt(t.x, t.y, 1);
          // Tiny dust
          if (Math.random() < 0.3) {
            this.game.particles.emitDust(t.x, t.y, 1);
          }
        }
      }

      // Remove if out of bounds completely
      if (t.x < -50 || t.x > window.innerWidth + 50 || t.y < -50 || t.y > window.innerHeight + 50) {
        this.termites.splice(i, 1);
        continue;
      }

      // Draw termite
      const alpha = Math.min(1, t.life / 1);
      // Body
      this.termiteGfx.circle(t.x, t.y, 3);
      this.termiteGfx.fill({ color: 0x553311, alpha });
      // Head
      this.termiteGfx.circle(t.x + Math.cos(t.dir) * 4, t.y + Math.sin(t.dir) * 4, 2);
      this.termiteGfx.fill({ color: 0x442200, alpha });
      // Antennae
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
