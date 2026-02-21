import { Application, Container, Graphics, Sprite, Texture, Rectangle } from 'pixi.js';
import { PhysicsWorld } from './engine/physics';
import { ParticleSystem } from './engine/particles';
import { ChunkSystem } from './engine/chunks';
import { DamageOverlay } from './engine/damage';
import { AudioEngine } from './audio/audio';
import type { WeaponType, GameState } from './engine/types';
import { WEAPONS } from './engine/types';
import { Weapon } from './weapons/Weapon';
import { HammerWeapon } from './weapons/HammerWeapon';
import { MachineGunWeapon } from './weapons/MachineGunWeapon';
import { LaserWeapon } from './weapons/LaserWeapon';
import { FlameWeapon } from './weapons/FlameWeapon';
import { DynamiteWeapon } from './weapons/DynamiteWeapon';
import { TermiteWeapon } from './weapons/TermiteWeapon';
import { ChainsawWeapon } from './weapons/ChainsawWeapon';
import { StampWeapon } from './weapons/StampWeapon';
import { PaintbrushWeapon } from './weapons/PaintbrushWeapon';

export class Game {
  app!: Application;
  physics!: PhysicsWorld;
  particles!: ParticleSystem;
  chunks!: ChunkSystem;
  damage!: DamageOverlay;
  audio: AudioEngine;
  fxContainer!: Container;

  resumeTexture: Texture | null = null;

  private weapons: Map<WeaponType, Weapon> = new Map();
  private activeWeapon!: Weapon;
  private cursorGfx!: Graphics;

  private state: GameState = {
    weapon: 'hammer',
    pointerDown: false,
    pointerX: 0,
    pointerY: 0,
    prevPointerX: 0,
    prevPointerY: 0,
    shiftHeld: false,
    totalDamage: 0,
    maxDamage: 5000,
    chunks: [],
    particles: [],
    cracks: [],
    burns: [],
    termites: [],
    shakeMagnitude: 0,
    shakeDecay: 0,
    destroyed: false,
  };

  // Shake state
  private shakeX = 0;
  private shakeY = 0;

  // Resume element tracking
  private resumeEl!: HTMLElement;
  private mainEl!: HTMLElement;

  // Damage tracking for DOM elements
  private elementDamage: Map<Element, number> = new Map();

  // Callbacks
  onDamageChange?: (total: number, max: number) => void;
  onWeaponChange?: (weapon: WeaponType) => void;

  constructor() {
    this.audio = new AudioEngine();
  }

  async init() {
    this.resumeEl = document.getElementById('page')!;
    this.mainEl = document.getElementById('main-area')!;

    const canvas = document.getElementById('pixi-canvas') as HTMLCanvasElement;

    this.app = new Application();
    await this.app.init({
      canvas,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // Create layers
    this.fxContainer = new Container();
    this.app.stage.addChild(this.fxContainer);

    // Init subsystems
    this.physics = new PhysicsWorld(window.innerWidth, window.innerHeight);
    this.particles = new ParticleSystem();
    this.chunks = new ChunkSystem();
    this.damage = new DamageOverlay();

    this.fxContainer.addChild(this.damage.container);
    this.fxContainer.addChild(this.chunks.container);
    this.fxContainer.addChild(this.particles.container);

    // Cursor
    this.cursorGfx = new Graphics();
    this.app.stage.addChild(this.cursorGfx);

    // Init weapons
    this.weapons.set('hammer', new HammerWeapon(this));
    this.weapons.set('machinegun', new MachineGunWeapon(this));
    this.weapons.set('laser', new LaserWeapon(this));
    this.weapons.set('flame', new FlameWeapon(this));
    this.weapons.set('dynamite', new DynamiteWeapon(this));
    this.weapons.set('termites', new TermiteWeapon(this));
    this.weapons.set('chainsaw', new ChainsawWeapon(this));
    this.weapons.set('stamp', new StampWeapon(this));
    this.weapons.set('paintbrush', new PaintbrushWeapon(this));
    this.activeWeapon = this.weapons.get('hammer')!;

    // Capture resume as texture for debris
    this.captureResumeTexture();

    // Input
    this.setupInput();

    // Resize
    window.addEventListener('resize', () => this.onResize());

    // Game loop
    this.app.ticker.add((ticker) => this.update(ticker.deltaTime / 60));
  }

  private captureResumeTexture() {
    // We'll use html2canvas-style approach: create a simple colored texture
    // since we can't easily rasterize DOM in PixiJS
    const gfx = new Graphics();
    gfx.rect(0, 0, 200, 200);
    gfx.fill({ color: 0xffffff });
    // Add some "text" lines
    for (let i = 0; i < 12; i++) {
      const w = 40 + Math.random() * 140;
      gfx.rect(10, 10 + i * 15, w, 8);
      gfx.fill({ color: 0x333333 });
    }
    this.resumeTexture = this.app.renderer.generateTexture(gfx);
    gfx.destroy();
  }

  private setupInput() {
    const main = this.mainEl;

    main.addEventListener('pointerdown', (e) => {
      this.audio.init();
      this.state.pointerDown = true;
      this.state.pointerX = e.clientX;
      this.state.pointerY = e.clientY;
      this.state.prevPointerX = e.clientX;
      this.state.prevPointerY = e.clientY;
      this.state.shiftHeld = e.shiftKey;
      this.activeWeapon.onPointerDown(e.clientX, e.clientY, e.shiftKey);
    });

    window.addEventListener('pointermove', (e) => {
      this.state.prevPointerX = this.state.pointerX;
      this.state.prevPointerY = this.state.pointerY;
      this.state.pointerX = e.clientX;
      this.state.pointerY = e.clientY;
      this.state.shiftHeld = e.shiftKey;

      if (this.state.pointerDown) {
        this.activeWeapon.onPointerMove(
          e.clientX, e.clientY,
          this.state.prevPointerX, this.state.prevPointerY,
          e.shiftKey
        );
      }
    });

    window.addEventListener('pointerup', () => {
      this.state.pointerDown = false;
      this.activeWeapon.onPointerUp();
    });

    // Keyboard weapon switching
    window.addEventListener('keydown', (e) => {
      this.state.shiftHeld = e.shiftKey;

      // Number keys for weapons
      const idx = parseInt(e.key) - 1;
      if (idx >= 0 && idx < WEAPONS.length) {
        this.setWeapon(WEAPONS[idx].id);
      }

      // R for reset
      if (e.key.toLowerCase() === 'r') {
        this.reset();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.state.shiftHeld = e.shiftKey;
    });

    // Prevent text selection on resume
    main.addEventListener('mousedown', (e) => {
      if ((e.target as Element)?.closest('#page')) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  setWeapon(type: WeaponType) {
    // Clean up current weapon
    this.activeWeapon.onPointerUp();
    this.audio.stopAllLoops();

    this.state.weapon = type;
    this.activeWeapon = this.weapons.get(type)!;
    this.onWeaponChange?.(type);
  }

  private update(dt: number) {
    // Cap delta to avoid huge jumps
    dt = Math.min(dt, 0.05);

    // Physics
    this.physics.update(dt * 1000);

    // Weapons
    this.activeWeapon.update(dt);

    // Particles
    this.particles.update(dt);
    this.particles.draw();

    // Chunks
    this.chunks.update(dt, this.physics);

    // Damage overlay
    this.damage.update(dt);
    this.damage.draw();

    // Screen shake
    this.updateShake(dt);

    // Cursor
    this.drawCursor();

    // Stats
    this.onDamageChange?.(this.state.totalDamage, this.state.maxDamage);
  }

  private updateShake(dt: number) {
    if (this.state.shakeMagnitude > 0) {
      this.shakeX = (Math.random() * 2 - 1) * this.state.shakeMagnitude;
      this.shakeY = (Math.random() * 2 - 1) * this.state.shakeMagnitude;
      this.state.shakeMagnitude *= Math.pow(0.05, dt); // exponential decay

      if (this.state.shakeMagnitude < 0.5) {
        this.state.shakeMagnitude = 0;
        this.shakeX = 0;
        this.shakeY = 0;
      }

      this.mainEl.style.transform = `translate(${this.shakeX}px, ${this.shakeY}px)`;
    } else {
      this.mainEl.style.transform = '';
    }
  }

  shake(magnitude: number, _duration: number) {
    this.state.shakeMagnitude = Math.max(this.state.shakeMagnitude, magnitude);
  }

  private drawCursor() {
    this.cursorGfx.clear();
    const x = this.state.pointerX;
    const y = this.state.pointerY;
    const weapon = this.state.weapon;

    // Main crosshair circle
    this.cursorGfx.circle(x, y, 14);
    this.cursorGfx.stroke({ color: 0xffffff, width: 1.5, alpha: 0.7 });

    // Cross lines
    const len = 8;
    const gap = 4;
    // Top
    this.cursorGfx.moveTo(x, y - gap - len);
    this.cursorGfx.lineTo(x, y - gap);
    // Bottom
    this.cursorGfx.moveTo(x, y + gap);
    this.cursorGfx.lineTo(x, y + gap + len);
    // Left
    this.cursorGfx.moveTo(x - gap - len, y);
    this.cursorGfx.lineTo(x - gap, y);
    // Right
    this.cursorGfx.moveTo(x + gap, y);
    this.cursorGfx.lineTo(x + gap + len, y);
    this.cursorGfx.stroke({ color: 0xffffff, width: 1.5, alpha: 0.8 });

    // Center dot
    this.cursorGfx.circle(x, y, 2);
    this.cursorGfx.fill({ color: 0xff5544, alpha: 0.9 });

    // Weapon-specific indicator
    if (weapon === 'flame' && this.state.pointerDown) {
      this.cursorGfx.circle(x, y, 38);
      this.cursorGfx.stroke({ color: 0xff4400, width: 1, alpha: 0.4 });
    } else if (weapon === 'dynamite') {
      this.cursorGfx.circle(x, y, 24);
      this.cursorGfx.stroke({ color: 0xff0000, width: 1, alpha: 0.5 });
    }
  }

  // --- Public interface for weapons ---

  inResumeBounds(x: number, y: number): boolean {
    const rect = this.resumeEl.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  getResumeSourceRect(x: number, y: number, radius: number) {
    if (!this.resumeTexture) return { x: 0, y: 0, w: 100, h: 100 };
    return {
      x: Math.max(0, x - radius),
      y: Math.max(0, y - radius),
      w: radius * 2,
      h: radius * 2,
    };
  }

  addDamageAt(x: number, y: number, amount: number) {
    const el = this.getElementAt(x, y);
    if (el) {
      const current = this.elementDamage.get(el) || 0;
      const newDamage = current + amount;
      this.elementDamage.set(el, newDamage);
      this.applyDamageVisual(el, newDamage);
    }
    this.state.totalDamage += amount;
  }

  private getElementAt(x: number, y: number): Element | null {
    if (!this.inResumeBounds(x, y)) return null;
    // Temporarily hide the canvas to hit-test the DOM underneath
    const canvas = this.app.canvas;
    const prev = canvas.style.pointerEvents;
    canvas.style.pointerEvents = 'none';
    const el = document.elementFromPoint(x, y);
    canvas.style.pointerEvents = prev;
    return el?.closest('#page .card, #page .resume-header, #page .resume-footer, #page h2, #page h3, #page p, #page a, #page strong') || null;
  }

  private applyDamageVisual(el: Element, damage: number) {
    const htmlEl = el as HTMLElement;
    if (damage > 25) {
      this.crumbleElement(htmlEl);
    } else if (damage > 18) {
      htmlEl.style.filter = 'grayscale(0.9) brightness(0.7) blur(1px)';
      htmlEl.style.opacity = '0.4';
    } else if (damage > 12) {
      htmlEl.style.filter = 'grayscale(0.6) brightness(0.8) blur(0.5px)';
      htmlEl.style.opacity = '0.7';
    } else if (damage > 6) {
      htmlEl.style.filter = 'grayscale(0.3) brightness(0.9)';
    } else if (damage > 3) {
      htmlEl.style.filter = 'contrast(0.95) brightness(0.96)';
    }
  }

  private crumbleElement(el: HTMLElement) {
    if (el.dataset.crumbled === '1') return;
    el.dataset.crumbled = '1';

    // Wrap text in spans that can fall
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      if (node.textContent?.trim()) textNodes.push(node);
    }

    for (const textNode of textNodes) {
      const text = textNode.textContent || '';
      const frag = document.createDocumentFragment();
      for (const ch of text) {
        const span = document.createElement('span');
        span.textContent = ch === ' ' ? '\u00A0' : ch;
        span.style.display = 'inline-block';
        span.style.willChange = 'transform, opacity';
        frag.appendChild(span);

        // Animate fall
        const dx = (Math.random() * 2 - 1) * 100;
        const dy = 80 + Math.random() * 200;
        const rot = (Math.random() * 2 - 1) * 90;
        requestAnimationFrame(() => {
          span.style.transition = 'transform 1.2s cubic-bezier(.1,.8,0,1), opacity 1.2s ease-out';
          requestAnimationFrame(() => {
            span.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
            span.style.opacity = '0';
          });
        });
      }
      textNode.parentNode?.replaceChild(frag, textNode);
    }

    // Spawn physics debris from the element's position
    const rect = el.getBoundingClientRect();
    this.chunks.spawnDebris(
      this.physics, this.resumeTexture!, rect.left + rect.width / 2, rect.top + rect.height / 2,
      8, 6,
      { x: 0, y: 0, w: 200, h: 200 }
    );
    this.particles.emitDust(rect.left + rect.width / 2, rect.top + rect.height / 2, 20);
    this.shake(8, 0.3);
  }

  healAll() {
    // Reset all DOM damage
    for (const [el] of this.elementDamage) {
      const htmlEl = el as HTMLElement;
      htmlEl.style.filter = '';
      htmlEl.style.opacity = '';
      if (htmlEl.dataset.crumbled === '1') {
        // Can't easily un-crumble, reload instead
      }
      delete htmlEl.dataset.crumbled;
    }
    this.elementDamage.clear();
    this.state.totalDamage = 0;

    // Clear visual effects
    this.damage.clear();

    // Remove all chunks
    for (const chunk of this.chunks.chunks) {
      this.chunks.container.removeChild(chunk.sprite);
      chunk.sprite.destroy();
      this.physics.removeBody(chunk.body);
    }
    this.chunks.chunks.length = 0;
  }

  reset() {
    location.reload();
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.app.renderer.resize(w, h);
    this.physics.resize(w, h);
  }
}
