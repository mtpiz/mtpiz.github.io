import { Graphics, Container } from 'pixi.js';
import type { Particle } from './types';

export class ParticleSystem {
  particles: Particle[] = [];
  private gfx: Graphics;
  container: Container;

  constructor() {
    this.container = new Container();
    this.gfx = new Graphics();
    this.container.addChild(this.gfx);
  }

  emit(config: Partial<Particle> & { x: number; y: number }) {
    this.particles.push({
      vx: 0, vy: 0,
      life: 1, maxLife: 1,
      size: 4, color: 0xffffff, alpha: 1,
      gravity: 0.1, drag: 0.98,
      type: 'spark',
      rotation: 0,
      rotationSpeed: 0,
      sizeDecay: 0,
      ...config,
    });
  }

  burst(x: number, y: number, count: number, config: Partial<Particle> = {}) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * (config.type === 'debris' ? 8 : 5);
      this.emit({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (config.type === 'debris' ? 3 : 1),
        life: 0.5 + Math.random() * 1.0,
        maxLife: 0.5 + Math.random() * 1.0,
        size: 2 + Math.random() * 4,
        color: 0xffd166,
        alpha: 1,
        gravity: 0.15,
        drag: 0.97,
        type: 'spark',
        ...config,
      });
    }
  }

  emitSparks(x: number, y: number, count: number = 20) {
    this.burst(x, y, count, {
      color: Math.random() > 0.5 ? 0xffd166 : 0xff8800,
      size: 2 + Math.random() * 3,
      gravity: 0.2,
      type: 'spark',
    });
  }

  emitEmbers(x: number, y: number, count: number = 10) {
    for (let i = 0; i < count; i++) {
      this.emit({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 2,
        vy: -1 - Math.random() * 3,
        life: 1 + Math.random() * 2,
        maxLife: 1 + Math.random() * 2,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.3 ? 0xff4400 : 0xff8800,
        alpha: 0.9,
        gravity: -0.03,
        drag: 0.99,
        type: 'ember',
      });
    }
  }

  emitSmoke(x: number, y: number, count: number = 8) {
    for (let i = 0; i < count; i++) {
      this.emit({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -0.5 - Math.random() * 1.5,
        life: 1.5 + Math.random() * 2,
        maxLife: 1.5 + Math.random() * 2,
        size: 8 + Math.random() * 16,
        color: 0x444444,
        alpha: 0.3,
        gravity: -0.02,
        drag: 0.995,
        type: 'smoke',
        sizeDecay: -0.3,
      });
    }
  }

  emitDust(x: number, y: number, count: number = 12) {
    for (let i = 0; i < count; i++) {
      this.emit({
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 4,
        vy: -1 - Math.random() * 2,
        life: 0.8 + Math.random() * 1.2,
        maxLife: 0.8 + Math.random() * 1.2,
        size: 4 + Math.random() * 8,
        color: 0xccbbaa,
        alpha: 0.5,
        gravity: 0.05,
        drag: 0.96,
        type: 'dust',
        sizeDecay: -0.15,
      });
    }
  }

  emitFire(x: number, y: number, count: number = 6) {
    for (let i = 0; i < count; i++) {
      const colors = [0xff2200, 0xff6600, 0xff9900, 0xffcc00];
      this.emit({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 3,
        vy: -2 - Math.random() * 4,
        life: 0.3 + Math.random() * 0.5,
        maxLife: 0.3 + Math.random() * 0.5,
        size: 6 + Math.random() * 14,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.8,
        gravity: -0.1,
        drag: 0.97,
        type: 'fire',
        sizeDecay: -0.5,
      });
    }
  }

  emitSplinters(x: number, y: number, count: number = 15, dirX: number = 0, dirY: number = 0) {
    for (let i = 0; i < count; i++) {
      const angle = Math.atan2(dirY, dirX) + (Math.random() - 0.5) * 1.5;
      const speed = 3 + Math.random() * 6;
      this.emit({
        x, y,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
        vy: Math.sin(angle) * speed - 2,
        life: 1 + Math.random() * 1.5,
        maxLife: 1 + Math.random() * 1.5,
        size: 3 + Math.random() * 5,
        color: Math.random() > 0.5 ? 0xddccbb : 0xeeddcc,
        alpha: 1,
        gravity: 0.25,
        drag: 0.97,
        type: 'splinter',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
      });
    }
  }

  emitBulletImpact(x: number, y: number) {
    // White flash
    this.emit({
      x, y, vx: 0, vy: 0,
      life: 0.08, maxLife: 0.08,
      size: 16, color: 0xffffff, alpha: 1,
      gravity: 0, drag: 1, type: 'spark',
    });
    // Paper bits
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 2 + Math.random() * 4;
      this.emit({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 2,
        life: 0.6 + Math.random() * 0.8,
        maxLife: 0.6 + Math.random() * 0.8,
        size: 2 + Math.random() * 3,
        color: 0xffeedd,
        alpha: 1,
        gravity: 0.2,
        drag: 0.96,
        type: 'debris',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.5,
      });
    }
  }

  update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      if (p.rotation !== undefined && p.rotationSpeed) {
        p.rotation += p.rotationSpeed;
      }
      if (p.sizeDecay) {
        p.size += p.sizeDecay * dt;
        if (p.size < 0.5) p.size = 0.5;
      }
    }
  }

  draw() {
    this.gfx.clear();
    for (const p of this.particles) {
      const t = p.life / p.maxLife;
      const alpha = p.alpha * t;
      if (alpha < 0.01) continue;

      this.gfx.circle(p.x, p.y, p.size * (p.type === 'smoke' || p.type === 'fire' ? (2 - t) : 1));
      this.gfx.fill({ color: p.color, alpha });
    }
  }
}
