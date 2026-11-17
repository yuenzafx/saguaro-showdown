// Everything drawn on the canvas: the sunset desert, the cactus gunslinger,
// its enemies, the HUD and every menu screen. Pure drawing — no game rules
// live here, so the outline of this file reads as the game's art direction.

import { PALETTE, WORLD } from './config.js';

const W = WORLD.width;
const H = WORLD.height;

export function drawBackground(ctx, time, palette = PALETTE) {
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.72);
  sky.addColorStop(0, palette.skyTop);
  sky.addColorStop(0.55, palette.skyMid);
  sky.addColorStop(1, palette.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Sun, low and huge, with a soft halo.
  const sunX = W * 0.78;
  const sunY = H * 0.34;
  const halo = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 190);
  halo.addColorStop(0, 'rgba(255, 217, 138, 0.55)');
  halo.addColorStop(1, 'rgba(255, 217, 138, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(sunX - 200, sunY - 200, 400, 400);
  ctx.fillStyle = palette.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 62, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.sunCore;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 46, 0, Math.PI * 2);
  ctx.fill();

  drawMesas(ctx, palette);
  drawGround(ctx, time, palette);
  drawFence(ctx, palette);
}

function drawMesas(ctx, palette) {
  ctx.fillStyle = palette.mesaFar;
  mesa(ctx, -40, 330, 340, 128);
  mesa(ctx, 420, 356, 260, 102);
  mesa(ctx, 1020, 322, 320, 136);
  ctx.fillStyle = palette.mesaNear;
  mesa(ctx, 120, 392, 300, 84);
  mesa(ctx, 760, 398, 360, 78);
}

function mesa(ctx, x, baseY, width, height) {
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.lineTo(x + width * 0.14, baseY - height);
  ctx.lineTo(x + width * 0.86, baseY - height);
  ctx.lineTo(x + width, baseY);
  ctx.closePath();
  ctx.fill();
}

function drawGround(ctx, time, palette) {
  ctx.fillStyle = palette.ground;
  ctx.fillRect(0, 430, W, H - 430);
  ctx.fillStyle = palette.groundDark;
  ctx.fillRect(0, 430, W, 10);
  // Drifting sand speckles, offset by time so the ground feels alive.
  ctx.fillStyle = palette.groundLight;
  const drift = (time * 14) % 90;
  for (let row = 0; row < 5; row += 1) {
    const y = 486 + row * 62;
    for (let i = 0; i < 9; i += 1) {
      const x = ((i * 173 + row * 61 - drift + 1280) % 1280) + 8;
      ctx.fillRect(x, y, 26, 4);
    }
  }
  // Decorative cacti and bones at the edges, clear of the fight.
  drawPropCactus(ctx, 66, 520, 0.9);
  drawPropCactus(ctx, 1184, 560, 1.15);
  drawPropCactus(ctx, 1120, 470, 0.6);
  drawBones(ctx, 220, 716);
  drawBones(ctx, 1050, 700);
}

function drawPropCactus(ctx, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(38, 92, 48, 0.85)';
  roundRect(ctx, -9, -64, 18, 64, 9);
  ctx.fill();
  roundRect(ctx, -26, -46, 12, 26, 6);
  ctx.fill();
  roundRect(ctx, -26, -26, 20, 10, 5);
  ctx.fill();
  roundRect(ctx, 14, -54, 12, 32, 6);
  ctx.fill();
  roundRect(ctx, 6, -32, 20, 10, 5);
  ctx.fill();
  ctx.restore();
}

function drawBones(ctx, x, y) {
  ctx.strokeStyle = 'rgba(244, 234, 216, 0.5)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(x, y, 16, Math.PI * 0.15, Math.PI * 1.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 12, y + 8);
  ctx.lineTo(x + 30, y + 16);
  ctx.stroke();
}

function drawFence(ctx, palette = PALETTE) {
  // The fence marks the playfield, tucked between the HUD at the top and
  // the dash meter and controls line at the bottom.
  ctx.strokeStyle = palette.fence;
  ctx.lineWidth = 5;
  ctx.setLineDash([16, 12]);
  ctx.strokeRect(WORLD.wall, 88, W - WORLD.wall * 2, H - 88 - 48);
  ctx.setLineDash([]);
}

export function drawPlayer(ctx, player, time) {
  const blink = player.invulnTime > 0 && Math.floor(time * 18) % 2 === 0;
  ctx.save();
  ctx.translate(player.x, player.y);
  if (blink) ctx.globalAlpha = 0.35;

  // Shadow
  ctx.fillStyle = 'rgba(30, 10, 16, 0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 24, 22, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Boots shuffle while moving.
  const step = Math.sin(player.walkPhase) * (player.moving ? 5 : 0);
  ctx.fillStyle = '#6b4226';
  roundRect(ctx, -13, 14 + step * 0.3, 10, 9, 3);
  ctx.fill();
  roundRect(ctx, 3, 14 - step * 0.3, 10, 9, 3);
  ctx.fill();

  // Body: a proud saguaro with two arms; the aim arm tracks the mouse.
  ctx.fillStyle = PALETTE.cactus;
  roundRect(ctx, -13, -24, 26, 44, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.cactusDark;
  roundRect(ctx, -13, -24, 8, 44, 4);
  ctx.fill();
  ctx.fillStyle = PALETTE.cactusLight;
  roundRect(ctx, 3, -20, 5, 34, 2.5);
  ctx.fill();
  // Left arm raised in a wave.
  ctx.fillStyle = PALETTE.cactus;
  roundRect(ctx, -25, -18, 10, 20, 5);
  ctx.fill();
  roundRect(ctx, -25, -22, 16, 9, 4.5);
  ctx.fill();

  // Aim arm + water pistol.
  ctx.save();
  ctx.rotate(player.aimAngle);
  ctx.fillStyle = PALETTE.cactus;
  roundRect(ctx, 8, -5, 18, 10, 5);
  ctx.fill();
  ctx.fillStyle = PALETTE.waterDark;
  roundRect(ctx, 22, -4, 16, 8, 3);
  ctx.fill();
  ctx.fillStyle = PALETTE.water;
  roundRect(ctx, 34, -2.5, 7, 5, 2);
  ctx.fill();
  ctx.restore();

  // Face: determined eyes under the hat brim.
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.arc(-5, -10, 2.4, 0, Math.PI * 2);
  ctx.arc(6, -10, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0.5, -3, 4, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  // Cowboy hat.
  ctx.fillStyle = PALETTE.hat;
  roundRect(ctx, -19, -33, 38, 7, 3.5);
  ctx.fill();
  roundRect(ctx, -11, -43, 22, 12, 5);
  ctx.fill();
  ctx.fillStyle = PALETTE.hatBand;
  roundRect(ctx, -11, -34, 22, 4.5, 2);
  ctx.fill();

  // A little pink flower on top — this cactus blooms under pressure.
  ctx.fillStyle = '#ff8fab';
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2 + time * 0.8;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 4.5, -47 + Math.sin(a) * 4.5, 3.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.star;
  ctx.beginPath();
  ctx.arc(0, -47, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (player.dashTime > 0) drawDashTrail(ctx, player);
}

function drawDashTrail(ctx, player) {
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = PALETTE.water;
  ctx.beginPath();
  ctx.arc(player.x - player.vx * 0.03, player.y - player.vy * 0.03, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// The same gunslinger, beaten: tipped over on the sand with both arms
// drooped, X eyes, his hat knocked off beside him and the flower wilted.
// Drawn only on the game-over screen, where the text says the desert won.
export function drawPlayerDefeated(ctx, player, time) {
  ctx.save();
  ctx.translate(player.x, player.y);
  // Shadow, wider now that he is lying down.
  ctx.fillStyle = 'rgba(30, 10, 16, 0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 16, 34, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // The hat, knocked off onto the sand.
  ctx.fillStyle = PALETTE.hat;
  roundRect(ctx, 27, 9, 34, 7, 3.5);
  ctx.fill();
  roundRect(ctx, 34, 1, 20, 10, 5);
  ctx.fill();
  ctx.fillStyle = PALETTE.hatBand;
  roundRect(ctx, 34, 7, 20, 4, 2);
  ctx.fill();
  // The body itself, tipped over onto its side.
  ctx.rotate(-1.35);
  ctx.fillStyle = '#6b4226';
  roundRect(ctx, -13, 14, 10, 9, 3);
  ctx.fill();
  roundRect(ctx, 3, 14, 10, 9, 3);
  ctx.fill();
  ctx.fillStyle = PALETTE.cactus;
  roundRect(ctx, -13, -24, 26, 44, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.cactusDark;
  roundRect(ctx, -13, -24, 8, 44, 4);
  ctx.fill();
  ctx.fillStyle = PALETTE.cactusLight;
  roundRect(ctx, 3, -20, 5, 34, 2.5);
  ctx.fill();
  // Both arms drooped limp — no wave, no pistol.
  ctx.fillStyle = PALETTE.cactus;
  roundRect(ctx, -24, 2, 10, 20, 5);
  ctx.fill();
  roundRect(ctx, 15, 4, 10, 19, 5);
  ctx.fill();
  // X eyes: out cold.
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.2;
  for (const ex of [-5, 6]) {
    ctx.beginPath();
    ctx.moveTo(ex - 3, -14);
    ctx.lineTo(ex + 3, -8);
    ctx.moveTo(ex + 3, -14);
    ctx.lineTo(ex - 3, -8);
    ctx.stroke();
  }
  // The flower, wilted: smaller, duller, off-centre.
  ctx.fillStyle = '#d9708c';
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2 + 0.7;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 4, -45 + Math.sin(a) * 3, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawEnemy(ctx, enemy, time) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.fillStyle = 'rgba(30, 10, 16, 0.28)';
  ctx.beginPath();
  ctx.ellipse(0, enemy.radius * 0.92, enemy.radius * 0.9, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  if (enemy.kind === 'goliath') drawGoliathGround(ctx, enemy, time);
  const flash = enemy.flashTime > 0;
  if (enemy.kind === 'tumbleweed') drawTumbleweed(ctx, enemy, time, flash);
  else if (enemy.kind === 'scorpion') drawScorpion(ctx, enemy, time, flash);
  else if (enemy.kind === 'buzzard') drawBuzzard(ctx, enemy, time, flash);
  else if (enemy.kind === 'rattlesnake') drawRattlesnake(ctx, enemy, time, flash);
  else drawGolem(ctx, enemy, time, flash);
  ctx.restore();
  if (enemy.maxHp > 3 && enemy.hp < enemy.maxHp) drawHealthPips(ctx, enemy);
}

// The Goliath's telegraph, drawn on the ground beneath it: while it winds
// up, a dust lane marks the locked charge line for all to see (and dodge);
// while it charges, dust boils up behind it; the stomp lands in a ring.
function drawGoliathGround(ctx, enemy, time) {
  if (enemy.goliathState === 'windup') {
    const pulse = 0.35 + Math.sin(time * 26) * 0.15;
    ctx.save();
    ctx.rotate(Math.atan2(enemy.chargeY, enemy.chargeX));
    ctx.fillStyle = `rgba(239, 71, 111, ${pulse})`;
    roundRect(ctx, 0, -enemy.radius * 0.62, 430, enemy.radius * 1.24, 18);
    ctx.fill();
    ctx.restore();
  } else if (enemy.goliathState === 'charge') {
    ctx.fillStyle = 'rgba(201, 141, 84, 0.55)';
    for (let i = 1; i <= 4; i += 1) {
      ctx.beginPath();
      ctx.arc(-enemy.chargeX * i * 30, -enemy.chargeY * i * 30 + 12, 16 + i * 6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (enemy.goliathState === 'stomp') {
    ctx.strokeStyle = 'rgba(255, 238, 221, 0.55)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(0, enemy.radius * 0.8, enemy.radius * 1.5, enemy.radius * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawTumbleweed(ctx, enemy, time, flash) {
  const spin = enemy.age * 3.2;
  // Dark, dry browns: against the pale sand a tumbleweed has to read as a
  // threat at a glance, not blend into the ground it rolls over.
  ctx.strokeStyle = flash ? '#ffffff' : '#7c4a1e';
  ctx.lineWidth = 3.4;
  for (let i = 0; i < 7; i += 1) {
    const a = spin + (i / 7) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(
      Math.cos(a + 0.5) * 10,
      Math.sin(a + 0.5) * 10,
      Math.cos(a) * enemy.radius,
      Math.sin(a) * enemy.radius,
    );
    ctx.stroke();
  }
  ctx.strokeStyle = flash ? '#ffffff' : '#96682c';
  ctx.beginPath();
  ctx.arc(0, 0, enemy.radius * 0.62, spin, spin + Math.PI * 1.5);
  ctx.stroke();
}

function drawScorpion(ctx, enemy, time, flash) {
  const body = flash ? '#ffffff' : '#7a3b2e';
  const dark = flash ? '#ffffff' : '#5d2a20';
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  // Tail arched over the back with a stinger.
  ctx.strokeStyle = dark;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-16, 2);
  ctx.quadraticCurveTo(-26, -18, -6, -22);
  ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.moveTo(-6, -26);
  ctx.lineTo(-1, -17);
  ctx.lineTo(-11, -17);
  ctx.closePath();
  ctx.fill();
  // Claws snapping.
  const snap = Math.sin(time * 9 + enemy.wobbleSeed) * 3;
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.arc(19, -9 + snap * 0.3, 6.5, 0, Math.PI * 2);
  ctx.arc(19, 9 - snap * 0.3, 6.5, 0, Math.PI * 2);
  ctx.fill();
  // Legs.
  ctx.strokeStyle = dark;
  ctx.lineWidth = 3;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * 9, 10);
    ctx.lineTo(i * 12, 17);
    ctx.moveTo(i * 9, -10);
    ctx.lineTo(i * 12, -17);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(9, -4, 2.2, 0, Math.PI * 2);
  ctx.arc(9, 4, 2.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawBuzzard(ctx, enemy, time, flash) {
  const flap = Math.sin(time * 11 + enemy.wobbleSeed) * 12;
  const body = flash ? '#ffffff' : '#3d3355';
  ctx.fillStyle = body;
  // Wings.
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.quadraticCurveTo(-20, -16 - flap, -32, -6 - flap);
  ctx.quadraticCurveTo(-18, 2, -4, 4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.quadraticCurveTo(20, -16 - flap, 32, -6 - flap);
  ctx.quadraticCurveTo(18, 2, 4, 4);
  ctx.closePath();
  ctx.fill();
  // Body and bald head.
  ctx.beginPath();
  ctx.ellipse(0, 2, 10, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = flash ? '#ffffff' : '#e2725b';
  ctx.beginPath();
  ctx.arc(0, -13, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.moveTo(-2.5, -10);
  ctx.lineTo(2.5, -10);
  ctx.lineTo(0, -4);
  ctx.closePath();
  ctx.fill();
}

// The rattlesnake: a coiled body in sandy diamonds, its head raised and
// swaying, tail-tip rattle held high. The rattle shakes — the spit
// telegraph — in the last half-second before it lets fly.
function drawRattlesnake(ctx, enemy, time, flash) {
  const body = flash ? '#ffffff' : '#b08968';
  const dark = flash ? '#ffffff' : '#7f5539';
  const sway = Math.sin(time * 3.1 + enemy.wobbleSeed) * 2.4;
  // Coils: three stacked ellipses, widest at the ground.
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 10, 19, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 3, 15, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Diamond markings down the coils.
  ctx.fillStyle = dark;
  for (const [dx, dy, s] of [[-8, 9, 4.4], [3, 11, 5], [11, 8, 4], [-2, 2, 4.2]]) {
    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.restore();
  }
  // The raised neck and head, swaying over the coils.
  ctx.strokeStyle = body;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(-4, 2);
  ctx.quadraticCurveTo(-2 + sway * 0.4, -8, 6 + sway, -13);
  ctx.stroke();
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(7 + sway, -14, 8.5, 6, 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.arc(10 + sway, -16, 1.7, 0, Math.PI * 2);
  ctx.fill();
  // Tongue flicks.
  const flick = Math.sin(time * 7 + enemy.wobbleSeed) > 0.55;
  if (flick) {
    ctx.strokeStyle = '#ef476f';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(14 + sway, -13);
    ctx.lineTo(21 + sway, -12);
    ctx.moveTo(21 + sway, -12);
    ctx.lineTo(24 + sway, -15);
    ctx.moveTo(21 + sway, -12);
    ctx.lineTo(24 + sway, -9.5);
    ctx.stroke();
  }
  // The rattle: a stack of pale segments at the coil's edge, trembling
  // hard while a spit is wound up.
  const winding = enemy.spitTime < 0.5;
  const tremble = winding ? Math.sin(time * 46) * 2 : Math.sin(time * 6 + enemy.wobbleSeed) * 0.7;
  ctx.fillStyle = flash ? '#ffffff' : '#e9d8a6';
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.arc(-16 + tremble, 2 - i * 5, 3.4 - i * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

// A venom glob in flight: a sickly green droplet with a bright skin.
export function drawVenom(ctx, venom) {
  ctx.save();
  ctx.translate(venom.x, venom.y);
  ctx.fillStyle = 'rgba(127, 176, 105, 0.35)';
  ctx.beginPath();
  ctx.arc(0, 0, venom.radius + 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7fb069';
  ctx.beginPath();
  ctx.arc(0, 0, venom.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d7f0c2';
  ctx.beginPath();
  ctx.arc(-2, -2, venom.radius * 0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGolem(ctx, enemy, time, flash) {
  const big = enemy.kind === 'goliath';
  const rock = flash ? '#ffffff' : big ? '#5e4a68' : '#77616f';
  const dark = flash ? '#ffffff' : big ? '#453550' : '#5d4a56';
  const bob = Math.sin(enemy.age * 2.2) * 2;
  ctx.translate(0, bob * 0.3);
  // The telegraph made visible: winding up, the Goliath trembles hard
  // enough to blur; in its second phase it leans into the fight.
  if (big && enemy.goliathState === 'windup') {
    ctx.translate(Math.sin(time * 68) * 3.2, Math.cos(time * 57) * 2.2);
  }
  if (big && enemy.phase2) ctx.rotate(0.05);
  ctx.fillStyle = rock;
  roundRect(ctx, -enemy.radius * 0.85, -enemy.radius * 0.7, enemy.radius * 1.7, enemy.radius * 1.45, 12);
  ctx.fill();
  ctx.fillStyle = dark;
  roundRect(ctx, -enemy.radius * 0.85, enemy.radius * 0.28, enemy.radius * 1.7, enemy.radius * 0.47, 10);
  ctx.fill();
  // Crystal spikes growing out of its back. The Goliath's burn hotter —
  // and in its second phase they flare from violet to ember orange.
  ctx.fillStyle = flash ? '#ffffff' : big && enemy.phase2 ? '#ff7847' : '#c77dff';
  const spikes = big ? [-0.55, -0.18, 0.2, 0.58] : [-0.4, 0.05, 0.48];
  for (const s of spikes) {
    const x = s * enemy.radius;
    ctx.beginPath();
    ctx.moveTo(x - 7, -enemy.radius * 0.62);
    ctx.lineTo(x, -enemy.radius * (big ? 1.18 : 1.05));
    ctx.lineTo(x + 7, -enemy.radius * 0.62);
    ctx.closePath();
    ctx.fill();
  }
  // Glowing eyes.
  ctx.fillStyle = big && enemy.phase2 ? '#ff7847' : '#ffb703';
  const eyeY = -enemy.radius * 0.18;
  ctx.beginPath();
  ctx.arc(-enemy.radius * 0.3, eyeY, big ? 5 : 3.6, 0, Math.PI * 2);
  ctx.arc(enemy.radius * 0.3, eyeY, big ? 5 : 3.6, 0, Math.PI * 2);
  ctx.fill();
  if (big) {
    ctx.fillStyle = PALETTE.hat;
    roundRect(ctx, -20, -enemy.radius - 16, 40, 9, 4);
    ctx.fill();
  }
}

function drawHealthPips(ctx, enemy) {
  const width = enemy.radius * 1.7;
  const x = enemy.x - width / 2;
  const y = enemy.y - enemy.radius - 15;
  ctx.fillStyle = 'rgba(20, 8, 12, 0.55)';
  ctx.fillRect(x, y, width, 6);
  ctx.fillStyle = '#ef476f';
  ctx.fillRect(x, y, width * Math.max(0, enemy.hp / enemy.maxHp), 6);
}

export function drawBullet(ctx, bullet) {
  ctx.save();
  ctx.translate(bullet.x, bullet.y);
  ctx.fillStyle = 'rgba(87, 199, 227, 0.35)';
  ctx.beginPath();
  ctx.arc(0, 0, bullet.radius + 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.water;
  ctx.beginPath();
  ctx.arc(0, 0, bullet.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9f6ff';
  ctx.beginPath();
  ctx.arc(-2, -2, bullet.radius * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawPickup(ctx, pickup, time) {
  const bob = Math.sin(time * 4 + pickup.x * 0.05) * 3;
  ctx.save();
  ctx.translate(pickup.x, pickup.y + bob);
  if (pickup.kind === 'water') {
    ctx.fillStyle = PALETTE.water;
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.quadraticCurveTo(10, 2, 8, 7);
    ctx.quadraticCurveTo(6, 13, 0, 13);
    ctx.quadraticCurveTo(-6, 13, -8, 7);
    ctx.quadraticCurveTo(-10, 2, 0, -13);
    ctx.fill();
    ctx.fillStyle = '#d9f6ff';
    ctx.beginPath();
    ctx.arc(-3, 4, 3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    drawStarShape(ctx, 0, 0, 11, PALETTE.star, PALETTE.hat);
  }
  ctx.restore();
}

export function drawParticle(ctx, particle) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
  ctx.fillStyle = particle.color;
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawStarShape(ctx, x, y, r, fill, stroke) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? r : r * 0.48;
    const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
    const px = x + Math.cos(a) * radius;
    const py = y + Math.sin(a) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

// Floating score pops: they scale in with an overshoot, rise, and fade.
// The pop-in is the whole point — a number that just appears reads as HUD,
// a number that springs reads as feedback.
export function drawFloatingTexts(ctx, game) {
  for (const t of game.texts) {
    const popIn = Math.min(1, t.age / 0.16);
    const scale = 0.6 + 0.4 * easeOutBack(popIn);
    const fade = t.age > t.life - 0.3 ? Math.max(0, (t.life - t.age) / 0.3) : 1;
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = fade;
    ctx.font = '800 21px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = PALETTE.ink;
    ctx.strokeText(t.text, 0, 0);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, 0, 0);
    ctx.restore();
  }
}

function easeOutBack(x) {
  const c = 1.70158;
  const u = x - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
}

// Expanding shockwave rings for the big kills.
export function drawRings(ctx, game) {
  for (const ring of game.rings) {
    const frac = ring.age / ring.life;
    const radius = ring.maxRadius * (1 - Math.pow(1 - frac, 3));
    ctx.save();
    ctx.globalAlpha = (1 - frac) * 0.75;
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = 5 * (1 - frac) + 1;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// A red edge-flash when the player takes a hit: felt more than seen.
export function drawHurtVignette(ctx, game) {
  if (game.hurtFlash <= 0) return;
  const gradient = ctx.createRadialGradient(W / 2, H / 2, H * 0.36, W / 2, H / 2, H * 0.78);
  gradient.addColorStop(0, 'rgba(239, 71, 111, 0)');
  gradient.addColorStop(1, `rgba(239, 71, 111, ${0.38 * game.hurtFlash})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
}

// The aim marker: a ring, ticks and a dot at the mouse. Drawn in screen
// space (outside the camera shake) so it always sits on the true aim
// point; shown only while playing.
export function drawCrosshair(ctx, x, y) {
  ctx.save();
  for (const [style, width] of [[PALETTE.ink, 5], [PALETTE.cream, 2.4]]) {
    ctx.strokeStyle = style;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.stroke();
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      ctx.beginPath();
      ctx.moveTo(x + dx * 15, y + dy * 15);
      ctx.lineTo(x + dx * 20, y + dy * 20);
      ctx.stroke();
    }
  }
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.arc(x, y, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.cream;
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawHUD(ctx, game) {
  const { player } = game;
  // Top-left: hearts.
  for (let i = 0; i < player.maxHp; i += 1) {
    drawHeart(ctx, 34 + i * 30, 34, 11, i < player.hp ? PALETTE.heart : 'rgba(244,234,216,0.25)');
  }
  // Top-center: wave banner chip.
  chip(ctx, W / 2 - 86, 14, 172, 40);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '700 21px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(game.finaleWave ? 'FINAL WAVE' : game.bossWave ? 'BOSS WAVE' : `WAVE ${game.wave}`, W / 2, 41);
  if (game.enemiesLeft > 0) {
    ctx.font = '600 14px Georgia, serif';
    ctx.fillStyle = 'rgba(255, 238, 221, 0.8)';
    ctx.fillText(`${game.enemiesLeft} varmints left`, W / 2, 72);
  }
  // Top-right: score and best.
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '700 25px Georgia, serif';
  ctx.fillText(`${game.score}`, W - 28, 42);
  ctx.font = '600 14px Georgia, serif';
  ctx.fillStyle = 'rgba(255, 238, 221, 0.75)';
  ctx.fillText(`BEST ${game.best}`, W - 28, 64);
  // Combo meter under the hearts: the multiplier the score is earning now.
  if (game.combo > 1) {
    const multiplier = Math.min(8, 1 + Math.floor(game.combo / 6));
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.star;
    ctx.font = '700 19px Georgia, serif';
    ctx.fillText(`COMBO x${multiplier} · ${game.combo} streak`, 24, 84);
    ctx.fillStyle = 'rgba(20, 8, 12, 0.5)';
    ctx.fillRect(24, 92, 110, 6);
    ctx.fillStyle = PALETTE.star;
    ctx.fillRect(24, 92, 110 * Math.max(0, game.comboTime / 3.2), 6);
  }
  // Dash cooldown, bottom-left.
  ctx.textAlign = 'left';
  ctx.font = '600 13px Georgia, serif';
  ctx.fillStyle = 'rgba(255, 238, 221, 0.8)';
  ctx.fillText('DASH', 24, H - 38);
  ctx.fillStyle = 'rgba(20, 8, 12, 0.5)';
  ctx.fillRect(24, H - 32, 90, 8);
  ctx.fillStyle = PALETTE.water;
  const dashFrac = 1 - Math.max(0, player.dashCooldown) / player.dashCooldownMax;
  ctx.fillRect(24, H - 32, 90 * dashFrac, 8);
  // Controls reminder, bottom-right, quiet.
  ctx.textAlign = 'right';
  ctx.font = '600 13px Georgia, serif';
  ctx.fillStyle = 'rgba(255, 238, 221, 0.55)';
  ctx.fillText('WASD move · Mouse aim · Click shoot · Shift dash · P pause · M mute', W - 24, H - 22);
}

function drawHeart(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.9);
  ctx.bezierCurveTo(x - size * 1.25, y - size * 0.1, x - size * 0.55, y - size * 1.05, x, y - size * 0.35);
  ctx.bezierCurveTo(x + size * 0.55, y - size * 1.05, x + size * 1.25, y - size * 0.1, x, y + size * 0.9);
  ctx.fill();
}

function chip(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(26, 10, 18, 0.55)';
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
}

export function drawTitleScreen(ctx, game, time) {
  shade(ctx, 0.42);
  ctx.textAlign = 'center';
  // Big friendly title with a warm outline.
  ctx.font = '900 84px Georgia, serif';
  ctx.lineWidth = 12;
  ctx.strokeStyle = PALETTE.ink;
  ctx.strokeText('SAGUARO', W / 2, 218);
  ctx.fillStyle = PALETTE.sun;
  ctx.fillText('SAGUARO', W / 2, 218);
  ctx.strokeText('SHOWDOWN', W / 2, 302);
  ctx.fillStyle = PALETTE.cream;
  ctx.fillText('SHOWDOWN', W / 2, 302);

  ctx.font = '600 21px Georgia, serif';
  ctx.fillStyle = PALETTE.cream;
  ctx.fillText('Ten waves stand between Cactus Gulch and sundown.', W / 2, 356);
  ctx.fillText('You are the last gunslinger cactus holding the fence line.', W / 2, 386);

  drawHowToCard(ctx, W / 2 - 300, 424, 600, 176);
  const pulse = 0.75 + Math.sin(time * 4) * 0.25;
  ctx.globalAlpha = pulse;
  ctx.font = '800 27px Georgia, serif';
  ctx.fillStyle = PALETTE.star;
  ctx.fillText('CLICK OR PRESS ENTER TO START', W / 2, 640);
  ctx.globalAlpha = 1;
  ctx.font = '600 16px Georgia, serif';
  ctx.fillStyle = 'rgba(255, 238, 221, 0.75)';
  ctx.fillText(`Best score so far: ${game.best}`, W / 2, 682);
}

function drawHowToCard(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(26, 10, 18, 0.66)';
  roundRect(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 217, 138, 0.5)';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 16);
  ctx.stroke();
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '700 19px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('HOW TO PLAY', W / 2, y + 32);
  ctx.font = '600 17px Georgia, serif';
  ctx.fillText('Move with WASD or the arrow keys — aim with the mouse', W / 2, y + 62);
  ctx.fillText('Hold click to spray water droplets · Shift to dash through danger', W / 2, y + 88);
  ctx.fillText('Clear each wave, pick an upgrade, and at sundown', W / 2, y + 114);
  ctx.fillText('outduel the Dusty Goliath to win the day', W / 2, y + 140);
}

export function drawUpgradeScreen(ctx, game, time) {
  shade(ctx, 0.5);
  ctx.textAlign = 'center';
  ctx.font = '900 46px Georgia, serif';
  ctx.fillStyle = PALETTE.sun;
  ctx.fillText(`WAVE ${game.wave} CLEARED!`, W / 2, 196);
  ctx.font = '600 21px Georgia, serif';
  ctx.fillStyle = PALETTE.cream;
  ctx.fillText('Pick one reward before the next wave rides in:', W / 2, 238);
  game.offers.forEach((offer, i) => {
    drawUpgradeCard(ctx, offer, i, game.hoveredOffer === i, time);
  });
  ctx.font = '600 16px Georgia, serif';
  ctx.fillStyle = 'rgba(255, 238, 221, 0.75)';
  ctx.fillText('Click a card, or press 1, 2 or 3', W / 2, 586);
}

export function upgradeCardRect(index) {
  const w = 300;
  const h = 236;
  const gap = 28;
  const total = w * 3 + gap * 2;
  return { x: W / 2 - total / 2 + index * (w + gap), y: 282, w, h };
}

function drawUpgradeCard(ctx, offer, index, hovered, time) {
  const rect = upgradeCardRect(index);
  const lift = hovered ? -8 : 0;
  ctx.save();
  ctx.translate(0, lift + Math.sin(time * 2 + index) * 2);
  ctx.fillStyle = hovered ? 'rgba(52, 22, 34, 0.95)' : 'rgba(34, 14, 24, 0.92)';
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 18);
  ctx.fill();
  ctx.strokeStyle = offer.color;
  ctx.lineWidth = hovered ? 4 : 2;
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 18);
  ctx.stroke();
  // Icon disc: a drawn glyph for the upgrade itself, with the hotkey
  // number riding as a small badge on the rim.
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + 58;
  ctx.fillStyle = offer.color;
  ctx.beginPath();
  ctx.arc(cx, cy, 30, 0, Math.PI * 2);
  ctx.fill();
  drawUpgradeIcon(ctx, offer.id, cx, cy);
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.arc(cx + 22, cy - 22, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '900 14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${index + 1}`, cx + 22, cy - 17);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '800 23px Georgia, serif';
  wrapText(ctx, offer.name, rect.x + rect.w / 2, rect.y + 122, rect.w - 36, 26);
  ctx.font = '600 16.5px Georgia, serif';
  ctx.fillStyle = 'rgba(255, 238, 221, 0.85)';
  wrapText(ctx, offer.desc, rect.x + rect.w / 2, rect.y + 168, rect.w - 44, 21);
  ctx.restore();
}

// One bold glyph per upgrade id, drawn in ink on the card's coloured
// disc. Shapes only — no detail — so each still reads at contact-sheet
// size, where the card text has shrunk away.
function drawUpgradeIcon(ctx, id, cx, cy) {
  ctx.save();
  ctx.strokeStyle = PALETTE.ink;
  ctx.fillStyle = PALETTE.ink;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (id === 'rapid') {
    // A droplet with speed streaks trailing behind it.
    ctx.lineWidth = 3.5;
    for (const dy of [-9, 0, 9]) {
      ctx.beginPath();
      ctx.moveTo(cx - 21, cy + dy);
      ctx.lineTo(cx - 11, cy + dy);
      ctx.stroke();
    }
    dropletPath(ctx, cx + 6, cy, 12);
    ctx.fill();
  } else if (id === 'twin') {
    dropletPath(ctx, cx - 10, cy, 11);
    ctx.fill();
    dropletPath(ctx, cx + 10, cy, 11);
    ctx.fill();
  } else if (id === 'calibre') {
    dropletPath(ctx, cx, cy, 16);
    ctx.fill();
    ctx.fillStyle = '#d9f6ff';
    ctx.beginPath();
    ctx.arc(cx - 5, cy + 5, 3.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'pierce') {
    // A droplet with a cream arrow shot clean through it.
    dropletPath(ctx, cx, cy, 13);
    ctx.fill();
    ctx.strokeStyle = PALETTE.cream;
    ctx.fillStyle = PALETTE.cream;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - 19, cy);
    ctx.lineTo(cx + 13, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 10, cy - 6);
    ctx.lineTo(cx + 21, cy);
    ctx.lineTo(cx + 10, cy + 6);
    ctx.closePath();
    ctx.fill();
  } else if (id === 'boots') {
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 15);
    ctx.lineTo(cx + 3, cy - 15);
    ctx.lineTo(cx + 3, cy + 3);
    ctx.lineTo(cx + 14, cy + 9);
    ctx.lineTo(cx + 14, cy + 15);
    ctx.lineTo(cx - 8, cy + 15);
    ctx.closePath();
    ctx.fill();
  } else if (id === 'spurs') {
    // A spur rowel: a chunky star with a cream hub.
    drawStarShape(ctx, cx, cy, 15, PALETTE.ink, PALETTE.ink);
    ctx.fillStyle = PALETTE.cream;
    ctx.beginPath();
    ctx.arc(cx, cy, 3.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'agave') {
    drawHeart(ctx, cx, cy + 1, 13, PALETTE.ink);
  } else {
    // magnet: a lucky horseshoe, opening up.
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    ctx.arc(cx, cy - 3, 12, 0, Math.PI);
    ctx.stroke();
    ctx.fillRect(cx - 15.5, cy - 11, 7, 9);
    ctx.fillRect(cx + 8.5, cy - 11, 7, 9);
  }
  ctx.restore();
}

function dropletPath(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + r * 0.77, y + r * 0.15, x + r * 0.62, y + r * 0.54);
  ctx.quadraticCurveTo(x + r * 0.46, y + r, x, y + r);
  ctx.quadraticCurveTo(x - r * 0.46, y + r, x - r * 0.62, y + r * 0.54);
  ctx.quadraticCurveTo(x - r * 0.77, y + r * 0.15, x, y - r);
  ctx.closePath();
}

export function drawGameOverScreen(ctx, game, time) {
  shade(ctx, 0.55);
  ctx.textAlign = 'center';
  ctx.font = '900 64px Georgia, serif';
  ctx.lineWidth = 10;
  ctx.strokeStyle = PALETTE.ink;
  ctx.strokeText('THE DESERT WINS...', W / 2, 250);
  ctx.fillStyle = '#ef476f';
  ctx.fillText('THE DESERT WINS...', W / 2, 250);
  ctx.font = '600 22px Georgia, serif';
  ctx.fillStyle = PALETTE.cream;
  ctx.fillText('...this time. The Gulch still needs its gunslinger.', W / 2, 300);
  ctx.font = '800 30px Georgia, serif';
  ctx.fillStyle = PALETTE.star;
  ctx.fillText(`SCORE ${game.score}`, W / 2, 372);
  ctx.font = '600 20px Georgia, serif';
  ctx.fillStyle = PALETTE.cream;
  ctx.fillText(`You reached wave ${game.wave} · Best ${game.best}`, W / 2, 410);
  const pulse = 0.75 + Math.sin(time * 4) * 0.25;
  ctx.globalAlpha = pulse;
  ctx.font = '800 25px Georgia, serif';
  ctx.fillStyle = PALETTE.sun;
  ctx.fillText('CLICK OR PRESS ENTER TO RIDE AGAIN', W / 2, 486);
  ctx.globalAlpha = 1;
}

export function drawVictoryScreen(ctx, game, time) {
  // A lighter shade than defeat: sundown gold, not dusk.
  shade(ctx, 0.34);
  ctx.textAlign = 'center';
  // Celebration stars drifting over the won field.
  for (let i = 0; i < 7; i += 1) {
    const x = 120 + i * 170 + Math.sin(time * 0.9 + i * 2.1) * 16;
    const y = 120 + ((i * 67) % 130) + Math.cos(time * 0.7 + i) * 10;
    drawStarShape(ctx, x, y, 9 + (i % 3) * 2, PALETTE.star, PALETTE.hat);
  }
  ctx.font = '900 68px Georgia, serif';
  ctx.lineWidth = 11;
  ctx.strokeStyle = PALETTE.ink;
  ctx.strokeText('VICTORY AT SUNDOWN!', W / 2, 216);
  ctx.fillStyle = PALETTE.sun;
  ctx.fillText('VICTORY AT SUNDOWN!', W / 2, 216);
  ctx.font = '600 22px Georgia, serif';
  ctx.fillStyle = PALETTE.cream;
  ctx.fillText('Ten waves held. The Dusty Goliath is down, and Cactus Gulch blooms again.', W / 2, 262);

  // The run's tally, four stats in a row on one card.
  const cardY = 308;
  ctx.fillStyle = 'rgba(26, 10, 18, 0.66)';
  roundRect(ctx, W / 2 - 380, cardY, 760, 118, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 217, 138, 0.5)';
  ctx.lineWidth = 2;
  roundRect(ctx, W / 2 - 380, cardY, 760, 118, 16);
  ctx.stroke();
  const stats = [
    ['SCORE', `${game.score}`],
    ['TIME', formatRunTime(game.runTime)],
    ['VARMINTS DOWN', `${game.kills}`],
    ['BEST COMBO', `${game.maxCombo} streak`],
  ];
  stats.forEach(([label, value], i) => {
    const cx = W / 2 - 285 + i * 190;
    ctx.font = '600 14px Georgia, serif';
    ctx.fillStyle = 'rgba(255, 238, 221, 0.7)';
    ctx.fillText(label, cx, cardY + 36);
    ctx.font = '800 27px Georgia, serif';
    ctx.fillStyle = PALETTE.star;
    ctx.fillText(value, cx, cardY + 76);
  });
  ctx.font = '600 19px Georgia, serif';
  ctx.fillStyle = PALETTE.cream;
  ctx.fillText(`Best score so far: ${game.best}`, W / 2, cardY + 152);

  const pulse = 0.75 + Math.sin(time * 4) * 0.25;
  ctx.globalAlpha = pulse;
  ctx.font = '800 24px Georgia, serif';
  ctx.fillStyle = PALETTE.sun;
  ctx.fillText('CLICK — KEEP RIDING INTO THE ENDLESS NIGHT', W / 2, 556);
  ctx.globalAlpha = 1;
  ctx.font = '600 18px Georgia, serif';
  ctx.fillStyle = 'rgba(255, 238, 221, 0.85)';
  ctx.fillText('or press R for a fresh ten-wave stand', W / 2, 590);
}

function formatRunTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const rest = `${total % 60}`.padStart(2, '0');
  return `${minutes}:${rest}`;
}

export function drawPausedScreen(ctx) {
  shade(ctx, 0.5);
  ctx.textAlign = 'center';
  ctx.font = '900 54px Georgia, serif';
  ctx.fillStyle = PALETTE.cream;
  ctx.fillText('PAUSED', W / 2, 380);
  ctx.font = '600 19px Georgia, serif';
  ctx.fillText('Press P to keep riding', W / 2, 424);
}

export function drawWaveBanner(ctx, game) {
  if (game.bannerTime <= 0) return;
  const alpha = Math.min(1, game.bannerTime / 0.5, (1.9 - game.bannerTime) / 0.5 + 0.4);
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.textAlign = 'center';
  ctx.font = '900 44px Georgia, serif';
  ctx.lineWidth = 8;
  ctx.strokeStyle = PALETTE.ink;
  ctx.strokeText(game.bannerText, W / 2, 150);
  ctx.fillStyle = PALETTE.sun;
  ctx.fillText(game.bannerText, W / 2, 150);
  ctx.restore();
}

function shade(ctx, alpha) {
  ctx.fillStyle = `rgba(18, 6, 12, ${alpha})`;
  ctx.fillRect(0, 0, W, H);
}

export function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapText(ctx, text, centerX, startY, maxWidth, lineHeight) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = trial;
    }
  }
  if (line) lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, centerX, startY + i * lineHeight));
}
