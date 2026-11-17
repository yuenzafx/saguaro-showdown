// Bootstrap: wire canvas, input, sound and the game together, run the
// frame loop, and draw every state. With ?shot=<scene> the game renders one
// staged frame instead, for screenshots.

import { Input } from './input.js';
import { SoundFX } from './audio.js';
import { Game } from './game.js';
import { shotModeFromUrl, stageShotScene } from './shots.js';
import {
  drawBackground,
  drawBullet,
  drawCrosshair,
  drawEnemy,
  drawFloatingTexts,
  drawGameOverScreen,
  drawHUD,
  drawHurtVignette,
  drawParticle,
  drawPausedScreen,
  drawPickup,
  drawPlayer,
  drawPlayerDefeated,
  drawRings,
  drawTitleScreen,
  drawUpgradeScreen,
  drawVenom,
  drawVictoryScreen,
  drawWaveBanner,
} from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const input = new Input(canvas);
const sfx = new SoundFX();
const game = new Game(input, sfx);

// Play-test hook: only with ?debug in the URL (never in normal play) the
// game object is exposed so scripted verification can drive a full run.
if (new URLSearchParams(window.location.search).has('debug')) {
  window.__saguaro = game;
}

canvas.addEventListener('pointerdown', () => sfx.unlock());
window.addEventListener('keydown', () => sfx.unlock());

function render() {
  // The crosshair replaces the pointer while playing; menus keep theirs.
  canvas.style.cursor = game.state === 'playing' ? 'none' : '';
  ctx.save();
  // Trauma shake: offset is trauma squared, summed sines at unrelated
  // rates — smooth and punchy, never a per-frame random buzz. Visual only;
  // it moves the camera, never a body, so aim and collisions stay true.
  const shakeAmount = game.trauma * game.trauma;
  if (shakeAmount > 0.001) {
    const t = game.time * 30;
    const dx = (Math.sin(t * 1.7) * 13 + Math.sin(t * 2.9) * 5) * shakeAmount;
    const dy = (Math.cos(t * 2.3) * 10 + Math.sin(t * 3.7) * 4) * shakeAmount;
    ctx.translate(dx, dy);
  }
  drawBackground(ctx, game.time, game.palette);
  for (const pickup of game.pickups) drawPickup(ctx, pickup, game.time);
  for (const enemy of game.enemies) drawEnemy(ctx, enemy, game.time);
  if (game.state === 'gameover') drawPlayerDefeated(ctx, game.player, game.time);
  else if (game.state !== 'title') drawPlayer(ctx, game.player, game.time);
  else drawPlayer(ctx, { ...game.player, x: 152, y: 646, aimAngle: -0.35, invulnTime: 0, walkPhase: 0 }, game.time);
  for (const bullet of game.bullets) drawBullet(ctx, bullet);
  for (const venom of game.venom) drawVenom(ctx, venom);
  for (const particle of game.particles) drawParticle(ctx, particle);
  drawRings(ctx, game);
  drawFloatingTexts(ctx, game);
  ctx.restore();
  drawHurtVignette(ctx, game);
  if (game.state === 'playing') drawCrosshair(ctx, game.input.mouse.x, game.input.mouse.y);

  if (game.state === 'playing' || game.state === 'paused' || game.state === 'upgrade') {
    drawHUD(ctx, game);
  }
  if (game.state === 'playing') drawWaveBanner(ctx, game);
  if (game.state === 'title') drawTitleScreen(ctx, game, game.time);
  if (game.state === 'upgrade') drawUpgradeScreen(ctx, game, game.time);
  if (game.state === 'gameover') drawGameOverScreen(ctx, game, game.time);
  if (game.state === 'victory') drawVictoryScreen(ctx, game, game.time);
  if (game.state === 'paused') drawPausedScreen(ctx);
}

const shot = shotModeFromUrl();
if (shot) {
  stageShotScene(game, shot);
  game.time = 1.25;
  // Two frames so fonts and gradients settle before the capture.
  requestAnimationFrame(() => requestAnimationFrame(render));
} else {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    if (game.state !== 'paused') game.update(dt);
    else game.handleGlobalKeys();
    render();
    input.endFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
