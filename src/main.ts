import { Game } from './Game';
import { initSidebar } from './ui/sidebar';

async function main() {
  const game = new Game();
  await game.init();
  initSidebar(game);
}

main().catch(console.error);
