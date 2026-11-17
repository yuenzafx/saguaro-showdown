// Keyboard and mouse state, translated into the game's world coordinates.
// The canvas is letterboxed by CSS, so pointer positions are scaled by the
// ratio between the canvas bitmap and its on-screen rectangle.

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, down: false };
    this.clicked = false; // one-frame click pulse for menus
    this.confirmPressed = false; // one-frame Enter/Space pulse

    window.addEventListener('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
      if (!event.repeat && (event.code === 'Enter' || event.code === 'Space')) {
        this.confirmPressed = true;
      }
      this.keys.add(event.code);
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
    });
    canvas.addEventListener('pointermove', (event) => {
      this.updateMouse(event);
    });
    canvas.addEventListener('pointerdown', (event) => {
      this.updateMouse(event);
      this.mouse.down = true;
      this.clicked = true;
    });
    window.addEventListener('pointerup', () => {
      this.mouse.down = false;
    });
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  updateMouse(event) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    this.mouse.x = (event.clientX - rect.left) * scaleX;
    this.mouse.y = (event.clientY - rect.top) * scaleY;
  }

  axis() {
    const left = this.keys.has('KeyA') || this.keys.has('ArrowLeft');
    const right = this.keys.has('KeyD') || this.keys.has('ArrowRight');
    const up = this.keys.has('KeyW') || this.keys.has('ArrowUp');
    const down = this.keys.has('KeyS') || this.keys.has('ArrowDown');
    let x = (right ? 1 : 0) - (left ? 1 : 0);
    let y = (down ? 1 : 0) - (up ? 1 : 0);
    if (x !== 0 && y !== 0) {
      const inv = Math.SQRT1_2;
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  get dashHeld() {
    return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.keys.has('KeyK');
  }

  get firing() {
    return this.mouse.down || this.keys.has('KeyJ') || this.keys.has('Space');
  }

  get pausePressed() {
    return this.keys.has('KeyP') || this.keys.has('Escape');
  }

  // Called once at the end of every frame so pulses live exactly one frame.
  endFrame() {
    this.clicked = false;
    this.confirmPressed = false;
  }
}
