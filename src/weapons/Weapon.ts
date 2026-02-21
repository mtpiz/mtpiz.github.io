import type { Game } from '../Game';

export abstract class Weapon {
  constructor(protected game: Game) {}

  abstract onPointerDown(x: number, y: number, shift: boolean): void;
  abstract onPointerMove(x: number, y: number, prevX: number, prevY: number, shift: boolean): void;
  abstract onPointerUp(): void;
  abstract update(dt: number): void;

  protected inBounds(x: number, y: number): boolean {
    return this.game.inResumeBounds(x, y);
  }

  protected damageAt(x: number, y: number, amount: number) {
    this.game.addDamageAt(x, y, amount);
  }
}
