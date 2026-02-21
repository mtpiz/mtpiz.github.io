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

  // Separate cursor canvas (native 2D) — always in viewport coords
  private cursorCtx!: CanvasRenderingContext2D;

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

  private shakeX = 0;
  private shakeY = 0;

  private resumeEl!: HTMLElement;
  private mainEl!: HTMLElement;

  private elementDamage: Map<Element, number> = new Map();

  onDamageChange?: (total: number, max: number) => void;
  onWeaponChange?: (weapon: WeaponType) => void;

  constructor() {
    this.audio = new AudioEngine();
  }

  async init() {
    this.resumeEl = document.getElementById('page')!;
    this.mainEl = document.getElementById('main-area')!;

    // --- Effects canvas (PixiJS) — fixed overlay ---
    const canvas = document.getElementById('pixi-canvas') as HTMLCanvasElement;
    this.app = new Application();
    await this.app.init({
      canvas,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundAlpha: 0,
      antialias: true,
      resolution: 1,
      autoDensity: false,
    });

    // --- Cursor canvas (native 2D, separate layer) ---
    const cursorCanvas = document.getElementById('cursor-canvas') as HTMLCanvasElement;
    cursorCanvas.width = window.innerWidth;
    cursorCanvas.height = window.innerHeight;
    this.cursorCtx = cursorCanvas.getContext('2d')!;

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

    this.captureResumeTexture();
    this.setupInput();

    window.addEventListener('resize', () => this.onResize());

    // Game loop
    this.app.ticker.add((ticker) => this.update(ticker.deltaTime / 60));
  }

  /**
   * Convert viewport (clientX/clientY) to effect-space coordinates.
   *
   * The PixiJS canvas is position:fixed over the entire viewport.
   * Every frame, fxContainer is shifted by -scrollOffset so effects
   * scroll with the resume. So when placing a new effect, we need to
   * add the current scroll offset so that after the container shift,
   * the effect appears at the right viewport position.
   */
  viewportToFx(vx: number, vy: number): { x: number; y: number } {
    return {
      x: vx + this.mainEl.scrollLeft,
      y: vy + this.mainEl.scrollTop,
    };
  }

  private captureResumeTexture() {
    const gfx = new Graphics();
    gfx.rect(0, 0, 200, 200);
    gfx.fill({ color: 0xffffff });
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

    window.addEventListener('keydown', (e) => {
      this.state.shiftHeld = e.shiftKey;
      const idx = parseInt(e.key) - 1;
      if (idx >= 0 && idx < WEAPONS.length) {
        this.setWeapon(WEAPONS[idx].id);
      }
      if (e.key.toLowerCase() === 'r') {
        this.reset();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.state.shiftHeld = e.shiftKey;
    });

    main.addEventListener('mousedown', (e) => {
      if ((e.target as Element)?.closest('#page')) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  setWeapon(type: WeaponType) {
    this.activeWeapon.onPointerUp();
    this.audio.stopAllLoops();
    this.state.weapon = type;
    this.activeWeapon = this.weapons.get(type)!;
    this.onWeaponChange?.(type);
  }

  private update(dt: number) {
    dt = Math.min(dt, 0.05);

    // Shift the entire effects container so effects scroll with the resume
    this.fxContainer.position.set(-this.mainEl.scrollLeft, -this.mainEl.scrollTop);

    this.physics.update(dt * 1000);
    this.activeWeapon.update(dt);
    this.particles.update(dt);
    this.particles.draw();
    this.chunks.update(dt, this.physics);
    this.damage.update(dt);
    this.damage.draw();
    this.updateShake(dt);
    this.drawCursor();
    this.onDamageChange?.(this.state.totalDamage, this.state.maxDamage);
  }

  private updateShake(dt: number) {
    if (this.state.shakeMagnitude > 0) {
      this.shakeX = (Math.random() * 2 - 1) * this.state.shakeMagnitude;
      this.shakeY = (Math.random() * 2 - 1) * this.state.shakeMagnitude;
      this.state.shakeMagnitude *= Math.pow(0.05, dt);

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

  /** Cursor drawn on a separate native canvas so it always tracks viewport coords */
  private drawCursor() {
    const ctx = this.cursorCtx;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const x = this.state.pointerX;
    const y = this.state.pointerY;

    ctx.save();

    // Outer circle
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.stroke();

    // Cross lines
    const len = 8, gap = 4;
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y - gap - len); ctx.lineTo(x, y - gap);
    ctx.moveTo(x, y + gap); ctx.lineTo(x, y + gap + len);
    ctx.moveTo(x - gap - len, y); ctx.lineTo(x - gap, y);
    ctx.moveTo(x + gap, y); ctx.lineTo(x + gap + len, y);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = 'rgba(255,85,68,0.9)';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();

    // Weapon-specific ring
    if (this.state.weapon === 'flame' && this.state.pointerDown) {
      ctx.strokeStyle = 'rgba(255,68,0,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 38, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.state.weapon === 'dynamite') {
      ctx.strokeStyle = 'rgba(255,0,0,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 24, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
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
    const canvas = this.app.canvas;
    const prev = canvas.style.pointerEvents;
    canvas.style.pointerEvents = 'none';
    const cursorCanvas = this.cursorCtx.canvas;
    const prevCursor = cursorCanvas.style.pointerEvents;
    cursorCanvas.style.pointerEvents = 'none';
    const el = document.elementFromPoint(x, y);
    canvas.style.pointerEvents = prev;
    cursorCanvas.style.pointerEvents = prevCursor;
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

    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const fxPos = this.viewportToFx(cx, cy);
    this.chunks.spawnDebris(
      this.physics, this.resumeTexture!, fxPos.x, fxPos.y,
      8, 6, { x: 0, y: 0, w: 200, h: 200 }
    );
    this.particles.emitDust(fxPos.x, fxPos.y, 20);
    this.shake(8, 0.3);
  }

  healAll() {
    for (const [el] of this.elementDamage) {
      const htmlEl = el as HTMLElement;
      htmlEl.style.filter = '';
      htmlEl.style.opacity = '';
      delete htmlEl.dataset.crumbled;
    }
    this.elementDamage.clear();
    this.state.totalDamage = 0;
    this.damage.clear();

    for (const chunk of this.chunks.chunks) {
      this.chunks.container.removeChild(chunk.sprite);
      chunk.sprite.destroy();
      this.physics.removeBody(chunk.body);
    }
    this.chunks.chunks.length = 0;
  }

  reset() { location.reload(); }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.app.renderer.resize(w, h);
    this.physics.resize(w, h);
    this.cursorCtx.canvas.width = w;
    this.cursorCtx.canvas.height = h;
  }
}
