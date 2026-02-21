import { Text, Graphics } from 'pixi.js';
import { Weapon } from './Weapon';
import type { Game } from '../Game';

export class StampWeapon extends Weapon {
  constructor(game: Game) { super(game); }

  onPointerDown(x: number, y: number, shift: boolean) {
    if (!this.inBounds(x, y)) return;

    const labels = ['REJECTED', 'DENIED', 'VOID', 'FAILED', 'NOPE', 'F-', 'REDACTED'];
    const label = shift ? 'DESTROYED' : labels[Math.floor(Math.random() * labels.length)];
    const colors = [0xff0000, 0xcc0000, 0xff2200, 0xdd0000];
    const color = colors[Math.floor(Math.random() * colors.length)];

    // Stamp text
    const rotation = (Math.random() - 0.5) * 0.5;
    const size = shift ? 48 : 32 + Math.random() * 16;

    const text = new Text({
      text: label,
      style: {
        fontSize: size,
        fontWeight: 'bold',
        fontFamily: 'Impact, Arial Black, sans-serif',
        fill: color,
        letterSpacing: 4,
        stroke: { color: 0x880000, width: 2 },
      },
    });
    text.anchor.set(0.5);
    text.position.set(x, y);
    text.rotation = rotation;
    text.alpha = 0.85;
    this.game.fxContainer.addChild(text);

    // Stamp border
    const border = new Graphics();
    const w = text.width + 20;
    const h = text.height + 12;
    border.rect(-w / 2, -h / 2, w, h);
    border.stroke({ color, width: 3, alpha: 0.7 });
    border.position.set(x, y);
    border.rotation = rotation;
    this.game.fxContainer.addChild(border);

    // Impact effect
    this.game.particles.emitDust(x, y, 10);
    this.game.shake(6, 0.15);
    this.damageAt(x, y, 3);

    this.game.audio.play('stamp');

    // These persist - they're permanent stamps on the resume
  }

  onPointerMove() {}
  onPointerUp() {}
  update(_dt: number) {}
}
