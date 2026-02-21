import Matter from 'matter-js';

const { Engine, World, Bodies, Body, Events, Composite } = Matter;

export class PhysicsWorld {
  engine: Matter.Engine;
  private ground: Matter.Body;
  private wallL: Matter.Body;
  private wallR: Matter.Body;
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;

    this.engine = Engine.create({
      gravity: { x: 0, y: 1.8, scale: 0.001 },
    });

    // Floor and walls so debris piles up
    this.ground = Bodies.rectangle(width / 2, height + 25, width * 2, 50, { isStatic: true, friction: 0.8, restitution: 0.3 });
    this.wallL = Bodies.rectangle(-25, height / 2, 50, height * 2, { isStatic: true });
    this.wallR = Bodies.rectangle(width + 25, height / 2, 50, height * 2, { isStatic: true });

    Composite.add(this.engine.world, [this.ground, this.wallL, this.wallR]);
  }

  addBody(x: number, y: number, w: number, h: number, options?: Record<string, any>): Matter.Body {
    const body = Bodies.rectangle(x, y, w, h, {
      friction: 0.6,
      restitution: 0.35,
      density: 0.002,
      frictionAir: 0.01,
      ...options,
    } as any);
    Composite.add(this.engine.world, body);
    return body;
  }

  addCircle(x: number, y: number, radius: number, options?: Record<string, any>): Matter.Body {
    const body = Bodies.circle(x, y, radius, {
      friction: 0.5,
      restitution: 0.4,
      density: 0.001,
      frictionAir: 0.008,
      ...options,
    } as any);
    Composite.add(this.engine.world, body);
    return body;
  }

  removeBody(body: Matter.Body) {
    Composite.remove(this.engine.world, body);
  }

  applyExplosion(x: number, y: number, radius: number, force: number) {
    const bodies = Composite.allBodies(this.engine.world);
    for (const body of bodies) {
      if (body.isStatic) continue;
      const dx = body.position.x - x;
      const dy = body.position.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < radius && dist > 0) {
        const strength = force * (1 - dist / radius);
        const nx = dx / dist;
        const ny = dy / dist;
        Body.applyForce(body, body.position, {
          x: nx * strength,
          y: ny * strength - strength * 0.5,
        });
      }
    }
  }

  update(delta: number) {
    Engine.update(this.engine, delta);
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    Body.setPosition(this.ground, { x: width / 2, y: height + 25 });
    Body.setPosition(this.wallR, { x: width + 25, y: height / 2 });
  }
}
