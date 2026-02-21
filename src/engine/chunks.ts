import { Container, Sprite, Texture, Rectangle, type Application } from 'pixi.js';
import type { Chunk } from './types';
import type { PhysicsWorld } from './physics';

let chunkId = 0;

export class ChunkSystem {
  chunks: Chunk[] = [];
  container: Container;

  constructor() {
    this.container = new Container();
  }

  spawnDebris(
    physics: PhysicsWorld,
    texture: Texture,
    x: number,
    y: number,
    count: number,
    force: number = 5,
    sourceRect?: { x: number; y: number; w: number; h: number }
  ) {
    for (let i = 0; i < count; i++) {
      const cw = 12 + Math.random() * 28;
      const ch = 12 + Math.random() * 28;

      // Create a sub-texture from the source if possible
      let tex: Texture;
      if (sourceRect) {
        const sx = sourceRect.x + Math.random() * (sourceRect.w - cw);
        const sy = sourceRect.y + Math.random() * (sourceRect.h - ch);
        tex = new Texture({
          source: texture.source,
          frame: new Rectangle(
            Math.max(0, sx),
            Math.max(0, sy),
            Math.min(cw, texture.width - sx),
            Math.min(ch, texture.height - sy)
          ),
        });
      } else {
        // Fallback: just use a small solid colored rect
        tex = Texture.WHITE;
      }

      const sprite = new Sprite(tex);
      sprite.anchor.set(0.5);
      sprite.width = cw;
      sprite.height = ch;
      sprite.position.set(x, y);

      if (tex === Texture.WHITE) {
        sprite.tint = Math.random() > 0.5 ? 0xeeddcc : 0xddccbb;
      }

      const angle = Math.random() * Math.PI * 2;
      const speed = force * (0.5 + Math.random());
      const body = physics.addBody(x, y, cw, ch, {
        angle: Math.random() * Math.PI * 2,
        frictionAir: 0.005 + Math.random() * 0.01,
      });

      // Apply initial velocity
      const velX = Math.cos(angle) * speed * 0.01;
      const velY = Math.sin(angle) * speed * 0.01 - force * 0.008;
      (body as any).force = { x: velX, y: velY };

      const life = 15 + Math.random() * 20;
      const chunk: Chunk = {
        id: chunkId++,
        body,
        sprite,
        life,
        maxLife: life,
        type: 'debris',
      };

      this.chunks.push(chunk);
      this.container.addChild(sprite);
    }
  }

  spawnShards(
    physics: PhysicsWorld,
    x: number,
    y: number,
    count: number,
    force: number = 8
  ) {
    for (let i = 0; i < count; i++) {
      const cw = 6 + Math.random() * 14;
      const ch = 6 + Math.random() * 14;

      const sprite = new Sprite(Texture.WHITE);
      sprite.anchor.set(0.5);
      sprite.width = cw;
      sprite.height = ch;
      sprite.position.set(x, y);
      sprite.tint = [0xffffff, 0xeeeeff, 0xddddee, 0xccddee][Math.floor(Math.random() * 4)];
      sprite.alpha = 0.8;

      const angle = Math.random() * Math.PI * 2;
      const speed = force * (0.5 + Math.random());
      const body = physics.addCircle(x, y, Math.max(cw, ch) / 2, {
        angle: Math.random() * Math.PI * 2,
        restitution: 0.6,
        frictionAir: 0.003,
      });

      const velX = Math.cos(angle) * speed * 0.012;
      const velY = Math.sin(angle) * speed * 0.012 - force * 0.01;
      (body as any).force = { x: velX, y: velY };

      const life = 10 + Math.random() * 15;
      const chunk: Chunk = {
        id: chunkId++,
        body,
        sprite,
        life,
        maxLife: life,
        type: 'shard',
      };

      this.chunks.push(chunk);
      this.container.addChild(sprite);
    }
  }

  update(dt: number, physics: PhysicsWorld) {
    for (let i = this.chunks.length - 1; i >= 0; i--) {
      const c = this.chunks[i];
      c.life -= dt;

      // Sync sprite to physics body
      c.sprite.position.set(c.body.position.x, c.body.position.y);
      c.sprite.rotation = c.body.angle;

      // Fade out near end of life
      if (c.life < 3) {
        c.sprite.alpha = c.life / 3;
      }

      // Remove dead chunks
      if (c.life <= 0 || c.body.position.y > 2000) {
        this.container.removeChild(c.sprite);
        c.sprite.destroy();
        physics.removeBody(c.body);
        this.chunks.splice(i, 1);
      }
    }
  }
}
