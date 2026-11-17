// All sound is synthesised with WebAudio: no audio files, nothing to load.
// A tiny synth voice (oscillator or noise burst with an envelope) per effect,
// a master gain, and an M-key mute. Under the effects runs a generative
// western music loop — a four-bar bass line under a sparse pentatonic
// melody, scheduled a step at a time by musicStep. The context is created
// lazily on the first user gesture, as browsers require.

// The loop's material: A-minor pentatonic, the loneliest scale in the
// west. Chords walk Am - F - C - G, one per bar; the melody is a written
// 32-step motif (semitone offsets from A4, -1 rests) that leaves most of
// the desert empty, the way a Morricone cue would.
const MUSIC = {
  bpm: 92,
  stepsPerBar: 8,
  chordRoots: [110, 87.31, 130.81, 98], // A2, F2, C3, G2
  melody: [
    0, -1, -1, 7, -1, 5, 3, -1,
    0, -1, -1, -1, 3, -1, -1, -1,
    7, -1, 5, -1, 3, -1, 5, -1,
    7, -1, -1, -1, 5, -1, -1, -1,
  ],
};

export class SoundFX {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.musicTimer = null;
    this.musicStepIndex = 0;
    this.nextStepTime = 0;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.startMusic();
      return;
    }
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    this.ctx = new AudioCtor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.32;
    this.master.connect(this.ctx.destination);
    this.startMusic();
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // --- The generative music loop -------------------------------------
  // A lookahead scheduler: a 90 ms timer wakes musicStep, which books
  // every note due in the next 0.18 s through the same tone/noise voices
  // the effects use — so the M-key mute silences the band too, and no
  // second audio graph exists to maintain.

  startMusic() {
    if (!this.ctx || this.musicTimer !== null) return;
    this.musicStepIndex = 0;
    this.nextStepTime = this.ctx.currentTime + 0.06;
    this.musicTimer = setInterval(() => this.musicStep(), 90);
  }

  stopMusic() {
    if (this.musicTimer !== null) clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  musicStep() {
    if (!this.ctx) return;
    const stepSeconds = 60 / MUSIC.bpm / 2; // eighth notes
    while (this.nextStepTime < this.ctx.currentTime + 0.18) {
      this.scheduleStep(this.musicStepIndex, this.nextStepTime - this.ctx.currentTime);
      this.musicStepIndex += 1;
      this.nextStepTime += stepSeconds;
    }
  }

  scheduleStep(index, delay) {
    const stepInBar = index % MUSIC.stepsPerBar;
    const bar = Math.floor(index / MUSIC.stepsPerBar) % MUSIC.chordRoots.length;
    const root = MUSIC.chordRoots[bar];
    // Bass: the chord root walks in on the bar's first and fifth steps.
    if (stepInBar === 0 || stepInBar === 4) {
      this.tone(root, root, 0.3, 'triangle', 0.16, delay);
    }
    // Distant hoofbeats on the off steps, barely there.
    if (stepInBar === 2 || stepInBar === 6) {
      this.noise(0.05, 0.045, delay, 800);
    }
    // The melody: one motif note, or a rest — most steps are rests.
    const note = MUSIC.melody[index % MUSIC.melody.length];
    if (note >= 0) {
      const freq = 440 * Math.pow(2, note / 12);
      this.tone(freq, freq, 0.34, 'sine', 0.11, delay);
      this.tone(freq * 2, freq * 2, 0.2, 'sine', 0.03, delay);
    }
  }

  tone(freqFrom, freqTo, seconds, type = 'square', volume = 0.5, delay = 0) {
    if (!this.ctx || this.muted) return;
    const start = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), start + seconds);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(start);
    osc.stop(start + seconds + 0.02);
  }

  noise(seconds, volume = 0.4, delay = 0, lowpass = 1200) {
    if (!this.ctx || this.muted) return;
    const start = this.ctx.currentTime + delay;
    const length = Math.max(1, Math.floor(this.ctx.sampleRate * seconds));
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(start);
  }

  shoot() {
    this.tone(880, 320, 0.09, 'square', 0.22);
    this.noise(0.05, 0.12, 0, 3200);
  }

  enemyHit() {
    this.tone(300, 140, 0.06, 'sawtooth', 0.2);
  }

  enemyDown() {
    this.noise(0.18, 0.35, 0, 900);
    this.tone(220, 55, 0.2, 'triangle', 0.35);
  }

  playerHurt() {
    this.tone(160, 60, 0.28, 'sawtooth', 0.5);
    this.noise(0.2, 0.3, 0, 700);
  }

  dash() {
    this.noise(0.14, 0.25, 0, 2400);
  }

  spit() {
    // A rattlesnake's hiss-spit: a short wet burst of high noise.
    this.noise(0.12, 0.2, 0, 3600);
    this.tone(1400, 700, 0.08, 'sawtooth', 0.06);
  }

  pickup() {
    this.tone(660, 990, 0.09, 'sine', 0.35);
    this.tone(990, 1320, 0.1, 'sine', 0.3, 0.07);
  }

  waveStart() {
    this.tone(392, 392, 0.11, 'square', 0.3);
    this.tone(523, 523, 0.11, 'square', 0.3, 0.11);
    this.tone(659, 659, 0.16, 'square', 0.32, 0.22);
  }

  upgrade() {
    this.tone(523, 523, 0.09, 'triangle', 0.35);
    this.tone(659, 659, 0.09, 'triangle', 0.35, 0.09);
    this.tone(784, 784, 0.09, 'triangle', 0.35, 0.18);
    this.tone(1046, 1046, 0.2, 'triangle', 0.4, 0.27);
  }

  bossRoar() {
    this.tone(90, 45, 0.6, 'sawtooth', 0.55);
    this.noise(0.5, 0.3, 0, 400);
  }

  stomp() {
    // The Goliath's ground slam: a low thud and a burst of dust noise.
    this.tone(70, 32, 0.32, 'sine', 0.6);
    this.noise(0.28, 0.4, 0, 500);
  }

  victory() {
    // A little sundown fanfare for clearing the tenth wave: the upgrade
    // arpeggio, finished with a high harmony the upgrades never get.
    this.tone(523, 523, 0.11, 'triangle', 0.38);
    this.tone(659, 659, 0.11, 'triangle', 0.38, 0.11);
    this.tone(784, 784, 0.11, 'triangle', 0.38, 0.22);
    this.tone(1046, 1046, 0.3, 'triangle', 0.42, 0.33);
    this.tone(1318, 1318, 0.42, 'sine', 0.3, 0.33);
  }

  gameOver() {
    this.tone(392, 392, 0.22, 'triangle', 0.4);
    this.tone(330, 330, 0.22, 'triangle', 0.4, 0.22);
    this.tone(262, 196, 0.5, 'triangle', 0.42, 0.44);
  }
}
