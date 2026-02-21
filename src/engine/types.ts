export type WeaponType = 'hammer' | 'laser' | 'flame' | 'dynamite' | 'termites' | 'chainsaw' | 'machinegun' | 'stamp' | 'paintbrush';

export interface WeaponDef {
  id: WeaponType;
  name: string;
  icon: string;
  description: string;
  key: string;
  cursor: 'crosshair' | 'hammer' | 'flame' | 'saw' | 'laser' | 'bug' | 'gun' | 'stamp' | 'brush';
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface Chunk {
  id: number;
  body: Matter.Body;
  sprite: import('pixi.js').Sprite;
  life: number;
  maxLife: number;
  type: 'debris' | 'shard' | 'paper' | 'ash';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
  alpha: number;
  gravity: number;
  drag: number;
  type: 'spark' | 'ember' | 'smoke' | 'dust' | 'fire' | 'debris' | 'splinter';
  rotation?: number;
  rotationSpeed?: number;
  sizeDecay?: number;
}

export interface CrackLine {
  points: Vec2[];
  width: number;
  alpha: number;
  life: number;
}

export interface BurnMark {
  x: number;
  y: number;
  radius: number;
  alpha: number;
}

export interface TermiteAgent {
  x: number;
  y: number;
  dir: number;
  speed: number;
  life: number;
  maxLife: number;
  wiggle: number;
}

export interface GameState {
  weapon: WeaponType;
  pointerDown: boolean;
  pointerX: number;
  pointerY: number;
  prevPointerX: number;
  prevPointerY: number;
  shiftHeld: boolean;
  totalDamage: number;
  maxDamage: number;
  chunks: Chunk[];
  particles: Particle[];
  cracks: CrackLine[];
  burns: BurnMark[];
  termites: TermiteAgent[];
  shakeMagnitude: number;
  shakeDecay: number;
  destroyed: boolean;
}

export const WEAPONS: WeaponDef[] = [
  { id: 'hammer',     name: 'Hammer',       icon: '\u{1F528}', description: 'Smash + debris',     key: '1', cursor: 'hammer' },
  { id: 'machinegun', name: 'Machine Gun',  icon: '\u{1F52B}', description: 'Rapid fire bullets', key: '2', cursor: 'gun' },
  { id: 'laser',      name: 'Laser',        icon: '\u{1F4A5}', description: 'Cut clean lines',    key: '3', cursor: 'laser' },
  { id: 'flame',      name: 'Flamethrower', icon: '\u{1F525}', description: 'Scorch + burn',      key: '4', cursor: 'flame' },
  { id: 'dynamite',   name: 'Dynamite',     icon: '\u{1F9E8}', description: 'Massive blast',      key: '5', cursor: 'crosshair' },
  { id: 'termites',   name: 'Termites',     icon: '\u{1F41C}', description: 'Nibble everything',  key: '6', cursor: 'bug' },
  { id: 'chainsaw',   name: 'Chainsaw',     icon: '\u{1FA9A}', description: 'Tear + shred',       key: '7', cursor: 'saw' },
  { id: 'stamp',      name: 'REJECTED',     icon: '\u{274C}',  description: 'Stamp rejection',    key: '8', cursor: 'stamp' },
  { id: 'paintbrush', name: 'Graffiti',     icon: '\u{1F3A8}', description: 'Spray paint',        key: '9', cursor: 'brush' },
];
