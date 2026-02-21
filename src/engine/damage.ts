import { Graphics, Container, RenderTexture, Sprite, type Application, type Renderer } from 'pixi.js';
import type { CrackLine, BurnMark } from './types';

/**
 * DamageOverlay renders persistent destruction marks on top of the resume:
 * - Cracks (white jagged lines from hammer impacts)
 * - Burn marks (dark scorched circles from fire/explosions)
 * - Bullet holes (transparent circles punched through)
 * - Laser cuts (transparent lines cut through)
 * - General holes from any weapon
 */
export class DamageOverlay {
  container: Container;
  private cracksGfx: Graphics;
  private burnsGfx: Graphics;
  private holesGfx: Graphics;

  cracks: CrackLine[] = [];
  burns: BurnMark[] = [];
  holes: { x: number; y: number; radius: number }[] = [];
  cuts: { x0: number; y0: number; x1: number; y1: number; width: number }[] = [];

  constructor() {
    this.container = new Container();
    this.burnsGfx = new Graphics();
    this.holesGfx = new Graphics();
    this.cracksGfx = new Graphics();
    this.container.addChild(this.burnsGfx);
    this.container.addChild(this.holesGfx);
    this.container.addChild(this.cracksGfx);
  }

  addCrack(x: number, y: number, radius: number = 80) {
    const rays = 5 + Math.floor(Math.random() * 8);
    for (let i = 0; i < rays; i++) {
      const angle = Math.random() * Math.PI * 2;
      const len = radius * (0.4 + Math.random() * 0.8);
      const points = [{ x, y }];
      const segments = 3 + Math.floor(Math.random() * 4);
      let cx = x, cy = y;
      for (let j = 0; j < segments; j++) {
        cx += Math.cos(angle + (Math.random() - 0.5) * 0.4) * (len / segments);
        cy += Math.sin(angle + (Math.random() - 0.5) * 0.4) * (len / segments);
        points.push({ x: cx, y: cy });
      }
      this.cracks.push({
        points,
        width: 1 + Math.random() * 2,
        alpha: 0.7 + Math.random() * 0.3,
        life: 30 + Math.random() * 30,
      });
    }
  }

  addBurn(x: number, y: number, radius: number = 40) {
    this.burns.push({ x, y, radius, alpha: 0.3 + Math.random() * 0.3 });
  }

  addHole(x: number, y: number, radius: number = 8) {
    this.holes.push({ x, y, radius });
  }

  addCut(x0: number, y0: number, x1: number, y1: number, width: number = 6) {
    this.cuts.push({ x0, y0, x1, y1, width });
  }

  draw() {
    // Burns
    this.burnsGfx.clear();
    for (const b of this.burns) {
      // Outer glow
      this.burnsGfx.circle(b.x, b.y, b.radius * 1.3);
      this.burnsGfx.fill({ color: 0x000000, alpha: b.alpha * 0.3 });
      // Inner scorch
      this.burnsGfx.circle(b.x, b.y, b.radius);
      this.burnsGfx.fill({ color: 0x1a0a00, alpha: b.alpha * 0.6 });
      // Hot center
      this.burnsGfx.circle(b.x, b.y, b.radius * 0.4);
      this.burnsGfx.fill({ color: 0x442200, alpha: b.alpha * 0.4 });
    }

    // Holes - rendered as dark circles with light edge
    this.holesGfx.clear();
    for (const h of this.holes) {
      // Dark hole
      this.holesGfx.circle(h.x, h.y, h.radius);
      this.holesGfx.fill({ color: 0x0a0a12, alpha: 0.95 });
      // Light edge ring
      this.holesGfx.circle(h.x, h.y, h.radius + 1.5);
      this.holesGfx.stroke({ color: 0xdddddd, width: 1.5, alpha: 0.4 });
    }
    for (const c of this.cuts) {
      this.holesGfx.moveTo(c.x0, c.y0);
      this.holesGfx.lineTo(c.x1, c.y1);
      this.holesGfx.stroke({ color: 0x0a0a12, width: c.width, alpha: 0.9 });
    }

    // Cracks
    this.cracksGfx.clear();
    for (let i = this.cracks.length - 1; i >= 0; i--) {
      const crack = this.cracks[i];
      if (crack.points.length < 2) continue;
      // Shadow
      this.cracksGfx.moveTo(crack.points[0].x + 1, crack.points[0].y + 1);
      for (let j = 1; j < crack.points.length; j++) {
        this.cracksGfx.lineTo(crack.points[j].x + 1, crack.points[j].y + 1);
      }
      this.cracksGfx.stroke({ color: 0x000000, width: crack.width + 1, alpha: crack.alpha * 0.4 });
      // White crack
      this.cracksGfx.moveTo(crack.points[0].x, crack.points[0].y);
      for (let j = 1; j < crack.points.length; j++) {
        this.cracksGfx.lineTo(crack.points[j].x, crack.points[j].y);
      }
      this.cracksGfx.stroke({ color: 0xffffff, width: crack.width, alpha: crack.alpha });
    }
  }

  update(dt: number) {
    // Slowly fade very old cracks
    for (let i = this.cracks.length - 1; i >= 0; i--) {
      this.cracks[i].life -= dt;
      if (this.cracks[i].life <= 0) {
        this.cracks.splice(i, 1);
      }
    }
  }

  clear() {
    this.cracks = [];
    this.burns = [];
    this.holes = [];
    this.cuts = [];
    this.cracksGfx.clear();
    this.burnsGfx.clear();
    this.holesGfx.clear();
  }
}
