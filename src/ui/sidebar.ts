import { WEAPONS, type WeaponType } from '../engine/types';
import type { Game } from '../Game';

export function initSidebar(game: Game) {
  const toolbar = document.getElementById('toolbar')!;
  const damageBar = document.getElementById('damage-bar')! as HTMLElement;
  const stats = document.getElementById('stats')!;
  const volSlider = document.getElementById('vol') as HTMLInputElement;
  const resetBtn = document.getElementById('reset-btn')!;
  const healBtn = document.getElementById('heal-btn')!;

  // Build weapon buttons
  for (const w of WEAPONS) {
    const tool = document.createElement('div');
    tool.className = 'tool' + (w.id === 'hammer' ? ' active' : '');
    tool.dataset.weapon = w.id;
    tool.innerHTML = `
      <span class="icon">${w.icon}</span>
      <div>
        <div class="name">${w.name}</div>
        <small>${w.description}</small>
      </div>
      <span class="key-hint">${w.key}</span>
    `;
    tool.addEventListener('click', () => {
      selectWeapon(w.id);
    });
    toolbar.appendChild(tool);
  }

  function selectWeapon(id: WeaponType) {
    document.querySelectorAll('.tool').forEach(t => t.classList.remove('active'));
    const el = document.querySelector(`.tool[data-weapon="${id}"]`);
    el?.classList.add('active');
    game.setWeapon(id);
  }

  // Listen for weapon changes from keyboard
  game.onWeaponChange = (weapon: WeaponType) => {
    document.querySelectorAll('.tool').forEach(t => t.classList.remove('active'));
    const el = document.querySelector(`.tool[data-weapon="${weapon}"]`);
    el?.classList.add('active');
  };

  // Damage meter
  game.onDamageChange = (total: number, max: number) => {
    const pct = Math.min(100, (total / max) * 100);
    damageBar.style.width = pct + '%';
    stats.innerHTML = `Damage: ${total} | Chunks: ${game.chunks.chunks.length} | Particles: ${game.particles.particles.length}`;
  };

  // Volume
  volSlider.addEventListener('input', () => {
    game.audio.setVolume(parseFloat(volSlider.value));
  });

  // Buttons
  resetBtn.addEventListener('click', () => game.reset());
  healBtn.addEventListener('click', () => game.healAll());
}
