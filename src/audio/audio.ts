type LoopHandle = { stop: () => void };

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private loops: Map<string, LoopHandle> = new Map();
  private volume = 0.6;

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.ctx.destination);
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.master) this.master.gain.value = v;
  }

  private env(duration = 0.2, peak = 0.9): GainNode {
    const g = this.ctx!.createGain();
    const t = this.ctx!.currentTime;
    g.gain.value = 0.0001;
    g.gain.exponentialRampToValueAtTime(peak, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    return g;
  }

  private noise(): AudioBufferSourceNode {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }

  play(type: string) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const master = this.master;
    const t = ctx.currentTime;

    switch (type) {
      case 'hammer': {
        const n = this.noise();
        const e = this.env(0.15, 0.9);
        n.connect(e).connect(master);
        n.start();
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);
        osc.connect(e);
        osc.start();
        osc.stop(t + 0.16);
        break;
      }
      case 'gunshot': {
        const n = this.noise();
        const e = this.env(0.06, 0.7);
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 800;
        n.connect(hp).connect(e).connect(master);
        n.start();
        // Click
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.04);
        const g = ctx.createGain();
        g.gain.value = 0.3;
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
        osc.connect(g).connect(master);
        osc.start();
        osc.stop(t + 0.06);
        break;
      }
      case 'laser': {
        const osc = ctx.createOscillator();
        const e = this.env(0.09, 0.6);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2200, t);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.09);
        osc.connect(e).connect(master);
        osc.start();
        osc.stop(t + 0.1);
        break;
      }
      case 'explosion': {
        const n = this.noise();
        const e = this.env(1.0, 1.0);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(1200, t);
        lp.frequency.exponentialRampToValueAtTime(60, t + 1.0);
        n.connect(lp).connect(e).connect(master);
        n.start();
        // Sub thump
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, t);
        osc.frequency.exponentialRampToValueAtTime(20, t + 0.5);
        const g = ctx.createGain();
        g.gain.value = 0.8;
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
        osc.connect(g).connect(master);
        osc.start();
        osc.stop(t + 0.7);
        break;
      }
      case 'fuse': {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = 6;
        g.gain.value = 0.05;
        osc.connect(g).connect(master);
        osc.start();
        setTimeout(() => { try { osc.stop(); } catch {} }, 1600);
        break;
      }
      case 'termites': {
        const osc = ctx.createOscillator();
        const e = this.env(0.2, 0.04);
        osc.type = 'square';
        osc.frequency.value = 600;
        osc.connect(e).connect(master);
        osc.start();
        osc.stop(t + 0.2);
        break;
      }
      case 'stamp': {
        const n = this.noise();
        const e = this.env(0.08, 0.6);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 500;
        n.connect(lp).connect(e).connect(master);
        n.start();
        break;
      }
      case 'spray': {
        const n = this.noise();
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 3000;
        bp.Q.value = 0.5;
        const g = ctx.createGain();
        g.gain.value = 0.03;
        n.connect(bp).connect(g).connect(master);
        n.start();
        setTimeout(() => { try { n.stop(); } catch {} }, 100);
        break;
      }
    }
  }

  ensureLoop(kind: string) {
    if (!this.ctx || !this.master) return;
    if (this.loops.has(kind)) return;
    const ctx = this.ctx;
    const master = this.master;

    switch (kind) {
      case 'flame': {
        const n = this.noise();
        const g = ctx.createGain();
        g.gain.value = 0.06;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 1200;
        n.connect(bp).connect(g).connect(master);
        n.start();
        this.loops.set(kind, { stop: () => { try { n.stop(); } catch {} } });
        break;
      }
      case 'chainsaw': {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = 110;
        const g = ctx.createGain();
        g.gain.value = 0.09;
        osc.connect(g).connect(master);
        osc.start();
        this.loops.set(kind, { stop: () => { try { osc.stop(); } catch {} } });
        break;
      }
      case 'machinegun': {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = 15;
        const g = ctx.createGain();
        g.gain.value = 0.02;
        osc.connect(g).connect(master);
        osc.start();
        this.loops.set(kind, { stop: () => { try { osc.stop(); } catch {} } });
        break;
      }
    }
  }

  stopLoop(kind: string) {
    const loop = this.loops.get(kind);
    if (loop) {
      loop.stop();
      this.loops.delete(kind);
    }
  }

  stopAllLoops() {
    for (const [kind] of this.loops) {
      this.stopLoop(kind);
    }
  }
}
