import { Graphics, Text } from 'pixi.js';
import { Weapon } from './Weapon';
import type { Game } from '../Game';

interface PlantedDynamite {
  vx: number; vy: number; // viewport coords for damageAt
  fx: number; fy: number; // fx-space coords for drawing
  fuse: number;
  maxFuse: number;
  gfx: Graphics;
  label: Text;
}

export class DynamiteWeapon extends Weapon {
  private planted: PlantedDynamite[] = [];

  constructor(game: Game) { super(game); }

  onPointerDown(x: number, y: number, shift: boolean) {
    if (!this.inBounds(x, y)) return;

    const fuseTime = shift ? 1.0 : 2.0;
    const f = this.toFx(x, y);

    const gfx = new Graphics();
    gfx.roundRect(-6, -14, 12, 28, 3);
    gfx.fill({ color: 0xcc1111 });
    gfx.moveTo(0, -14);
    gfx.lineTo(4, -22);
    gfx.stroke({ color: 0x886644, width: 2 });
    gfx.position.set(f.x, f.y);
    this.game.fxContainer.addChild(gfx);

    const label = new Text({
      text: fuseTime.toFixed(1),
      style: { fontSize: 14, fill: 0xff4444, fontWeight: 'bold', fontFamily: 'monospace' },
    });
    label.anchor.set(0.5);
    label.position.set(f.x, f.y - 30);
    this.game.fxContainer.addChild(label);

    this.planted.push({ vx: x, vy: y, fx: f.x, fy: f.y, fuse: fuseTime, maxFuse: fuseTime, gfx, label });
    this.game.audio.play('fuse');
  }

  onPointerMove() {}
  onPointerUp() {}

  update(dt: number) {
    for (let i = this.planted.length - 1; i >= 0; i--) {
      const d = this.planted[i];
      d.fuse -= dt;
      d.label.text = Math.max(0, d.fuse).toFixed(1);

      const blink = Math.sin(d.fuse * 12) > 0;
      d.gfx.alpha = blink ? 1 : 0.6;

      if (Math.random() < 0.3) {
        this.game.particles.emitSparks(d.fx + 4, d.fy - 22, 2);
      }

      if (d.fuse <= 0) {
        this.explode(d);
        this.game.fxContainer.removeChild(d.gfx);
        this.game.fxContainer.removeChild(d.label);
        d.gfx.destroy();
        d.label.destroy();
        this.planted.splice(i, 1);
      }
    }
  }

  private explode(d: PlantedDynamite) {
    const { fx: x, fy: y, vx, vy } = d;

    this.game.damage.addBurn(x, y, 120);
    this.game.damage.addBurn(x + 30, y - 20, 80);
    this.game.damage.addBurn(x - 25, y + 25, 90);
    this.game.damage.addHole(x, y, 40);
    this.game.damage.addCrack(x, y, 140);

    this.game.particles.emitSparks(x, y, 80);
    this.game.particles.emitFire(x, y, 30);
    this.game.particles.emitSmoke(x, y, 20);
    this.game.particles.emitDust(x, y, 30);

    this.game.chunks.spawnDebris(
      this.game.physics, this.game.resumeTexture!, x, y, 20, 15,
      this.game.getResumeSourceRect(x, y, 140)
    );
    this.game.chunks.spawnShards(this.game.physics, x, y, 12, 12);
    this.game.physics.applyExplosion(x, y, 300, 0.08);

    // damageAt uses viewport coords
    for (let dx = -100; dx <= 100; dx += 40) {
      for (let dy = -100; dy <= 100; dy += 40) {
        this.damageAt(vx + dx, vy + dy, 10);
      }
    }

    this.game.shake(22, 0.5);
    this.game.audio.play('explosion');
  }
}
