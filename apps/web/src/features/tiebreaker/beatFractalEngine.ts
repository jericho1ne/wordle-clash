// beatFractalEngine.ts
// Framework-agnostic WebGL Mandelbrot/Julia engine. No React here on purpose —
// the render loop runs imperatively so beat pulses never trigger React re-renders.

export type ThemeName = 'neonArcade' | 'synthwaveSunset' | 'cyberIce' | 'inferno' | 'matrixPulse';

export interface Theme {
  center: { x: number; y: number };
  zoom: number;
  julia?: boolean;
  juliaC?: { x: number; y: number };
  colA: [number, number, number];
  colB: [number, number, number];
  colC: [number, number, number];
  colD: [number, number, number];
}

export interface BeatFractalOptions {
  theme?: ThemeName;
  dprCap?: number;
  beatDecay?: number;
  rotationSpeed?: number;
}

export const THEMES: Record<ThemeName, Theme> = {
  neonArcade: {
    center: { x: -0.5, y: 0.0 }, zoom: 2.5, julia: false,
    colA: [0.5, 0.5, 0.5], colB: [0.5, 0.5, 0.5],
    colC: [1.0, 1.0, 1.0], colD: [0.0, 0.10, 0.20],
  },
  synthwaveSunset: {
    center: { x: -0.088, y: 0.654 }, zoom: 1.2, julia: false,
    colA: [0.6, 0.35, 0.4], colB: [0.5, 0.4, 0.4],
    colC: [1.0, 0.8, 0.6], colD: [0.0, 0.15, 0.35],
  },
  cyberIce: {
    center: { x: 0.275, y: 0.0 }, zoom: 0.9, julia: false,
    colA: [0.2, 0.4, 0.6], colB: [0.3, 0.4, 0.5],
    colC: [0.8, 1.0, 1.2], colD: [0.35, 0.45, 0.55],
  },
  inferno: {
    center: { x: -0.75, y: 0.1 }, zoom: 1.6, julia: false,
    colA: [0.6, 0.3, 0.2], colB: [0.5, 0.4, 0.3],
    colC: [1.2, 0.9, 0.6], colD: [0.0, 0.05, 0.1],
  },
  matrixPulse: {
    center: { x: -0.4, y: 0.6 }, zoom: 1.6, julia: true,
    juliaC: { x: -0.4, y: 0.6 },
    colA: [0.15, 0.35, 0.15], colB: [0.15, 0.35, 0.15],
    colC: [0.6, 1.0, 0.6], colD: [0.0, 0.1, 0.0],
  },
};

const VERTEX_SRC = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SRC = `
  precision highp float;
  uniform vec2  u_resolution;
  uniform vec2  u_center;
  uniform float u_zoom;
  uniform float u_time;
  uniform float u_beat;
  uniform float u_rotation;
  uniform float u_juliaMix;
  uniform vec2  u_juliaC;
  uniform int   u_maxIter;
  uniform vec3  u_colA;
  uniform vec3  u_colB;
  uniform vec3  u_colC;
  uniform vec3  u_colD;

  const int MAX_ITER_CAP = 500;

  vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);

    float ca = cos(u_rotation);
    float sa = sin(u_rotation);
    uv = mat2(ca, -sa, sa, ca) * uv;

    float zoomPulse = 1.0 + u_beat * 0.15;
    vec2 c = u_center + uv * (u_zoom / zoomPulse);

    vec2 z;
    vec2 cc;
    if (u_juliaMix > 0.5) {
      z = c;
      cc = u_juliaC;
    } else {
      z = vec2(0.0);
      cc = c;
    }

    int iter = 0;
    float escaped = 0.0;
    for (int i = 0; i < MAX_ITER_CAP; i++) {
      if (i >= u_maxIter) break;
      float x = z.x * z.x - z.y * z.y + cc.x;
      float y = 2.0 * z.x * z.y + cc.y;
      z = vec2(x, y);
      iter = i;
      if (dot(z, z) > 16.0) { escaped = 1.0; break; }
    }

    vec3 color;
    if (escaped < 0.5) {
      color = vec3(0.015, 0.015, 0.03) * (1.0 + u_beat * 0.6);
    } else {
      float nu = float(iter) - log2(log2(dot(z, z))) + 4.0;
      float t = nu * 0.025 + u_time * 0.03 + u_beat * 0.25;
      color = palette(t, u_colA, u_colB, u_colC, u_colD);
      color *= 0.85 + u_beat * 0.6;
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;

export class BeatFractalEngine {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private program!: WebGLProgram;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};

  private dprCap: number;
  themeName: ThemeName;
  private theme: Theme;

  beatEnergy = 0;
  private beatDecay: number;

  center: { x: number; y: number };
  private targetCenter: { x: number; y: number };
  zoom: number;
  private baseZoom: number;
  private rotation = 0;
  private rotationSpeed: number;
  julia: boolean;
  juliaC: { x: number; y: number };

  private retargetT = 0;
  private retargetDur = 0;
  private fromCenter: { x: number; y: number };

  private bpmTimer: ReturnType<typeof setInterval> | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioData: Uint8Array | null = null;
  private audioCooldown = 0;
  private audioCooldownMs = 200;
  private audioThreshold = 1.35;
  private runningEnergy = 0;

  private startTime: number;
  private lastFrame: number;
  private running = false;
  private rafId: number | null = null;

  constructor(canvas: HTMLCanvasElement, opts: BeatFractalOptions = {}) {
    this.canvas = canvas;
    const gl = (canvas.getContext('webgl', { antialias: false, alpha: false }) ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) throw new Error('WebGL not supported in this browser');
    this.gl = gl;

    this.dprCap = opts.dprCap ?? 1.75;
    this.themeName = opts.theme ?? 'neonArcade';
    this.theme = THEMES[this.themeName];

    this.beatDecay = opts.beatDecay ?? 3.2;
    this.rotationSpeed = opts.rotationSpeed ?? 0.015;

    this.center = { ...this.theme.center };
    this.targetCenter = { ...this.theme.center };
    this.fromCenter = { ...this.theme.center };
    this.zoom = this.theme.zoom;
    this.baseZoom = this.theme.zoom;
    this.julia = this.theme.julia ?? false;
    this.juliaC = { ...(this.theme.juliaC ?? { x: -0.7, y: 0.27015 }) };

    this.startTime = performance.now();
    this.lastFrame = this.startTime;

    this.initGL();
    this.resize();
  }

  private compile(type: number, src: string): WebGLShader {
    const gl = this.gl;
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(sh);
      gl.deleteShader(sh);
      throw new Error('Shader compile error: ' + info);
    }
    return sh;
  }

  private initGL() {
    const gl = this.gl;
    const vs = this.compile(gl.VERTEX_SHADER, VERTEX_SRC);
    const fs = this.compile(gl.FRAGMENT_SHADER, FRAGMENT_SRC);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error('Program link error: ' + gl.getProgramInfoLog(prog));
    }
    this.program = prog;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1,
    ]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    [
      'u_resolution', 'u_center', 'u_zoom', 'u_time', 'u_beat', 'u_rotation',
      'u_juliaMix', 'u_juliaC', 'u_maxIter', 'u_colA', 'u_colB', 'u_colC', 'u_colD',
    ].forEach((name) => { this.uniforms[name] = gl.getUniformLocation(prog, name); });
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, this.dprCap);
    const w = Math.floor(this.canvas.clientWidth * dpr);
    const h = Math.floor(this.canvas.clientHeight * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.gl.viewport(0, 0, w, h);
    }
  }

  /** Call this on every beat / note-hit. strength: roughly 0–1.5. */
  pulse(strength = 1.0) {
    this.beatEnergy = Math.min(2.5, Math.max(this.beatEnergy, strength));
  }

  setBPM(bpm: number, opts: { strength?: number } = {}) {
    this.stopBPM();
    if (!bpm || bpm <= 0) return;
    const intervalMs = 60000 / bpm;
    const strength = opts.strength ?? 1.0;
    this.bpmTimer = setInterval(() => this.pulse(strength), intervalMs);
  }

  stopBPM() {
    if (this.bpmTimer) {
      clearInterval(this.bpmTimer);
      this.bpmTimer = null;
    }
  }

  async connectAudio(audioEl: HTMLAudioElement, opts: { threshold?: number; cooldownMs?: number } = {}) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.audioCtx = new AudioCtx();
    const source = this.audioCtx.createMediaElementSource(audioEl);
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 1024;
    source.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);
    this.audioData = new Uint8Array(this.analyser.frequencyBinCount);
    this.audioThreshold = opts.threshold ?? 1.35;
    this.audioCooldownMs = opts.cooldownMs ?? 200;
    if (this.audioCtx.state === 'suspended') await this.audioCtx.resume();
  }

  private pollAudio(dtMs: number) {
    if (!this.analyser || !this.audioData) return;
    // Cast avoids a TS lib.dom typed-array strictness mismatch that
    // varies between TypeScript versions; safe at runtime either way.
    this.analyser.getByteFrequencyData(this.audioData as any);
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += this.audioData[i];
    const avg = sum / 12;
    this.runningEnergy = this.runningEnergy * 0.92 + avg * 0.08;
    this.audioCooldown -= dtMs;
    if (avg > this.runningEnergy * this.audioThreshold && avg > 40 && this.audioCooldown <= 0) {
      this.pulse(Math.min(1.5, avg / 130));
      this.audioCooldown = this.audioCooldownMs;
    }
  }

  setTheme(name: ThemeName, opts: { instant?: boolean; duration?: number } = {}) {
    const t = THEMES[name];
    if (!t) return;
    this.themeName = name;
    this.theme = t;
    this.julia = !!t.julia;
    this.juliaC = { ...(t.juliaC ?? this.juliaC) };
    this.baseZoom = t.zoom;
    if (opts.instant) {
      this.center = { ...t.center };
      this.zoom = t.zoom;
    } else {
      this.retarget(t.center, opts.duration ?? 4000);
    }
  }

  retarget(point?: { x: number; y: number }, durationMs = 5000) {
    this.fromCenter = { ...this.center };
    this.targetCenter = point ?? this.randomPoint();
    this.retargetT = 0;
    this.retargetDur = durationMs;
  }

  private randomPoint() {
    const pts = Object.values(THEMES).map((t) => t.center);
    return pts[Math.floor(Math.random() * pts.length)];
  }

  setJulia(on: boolean) { this.julia = on; }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastFrame = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      const dt = now - this.lastFrame;
      this.lastFrame = now;
      this.tick(dt, now);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
  }

  /**
   * Stop timers/audio/rendering and release non-GL resources. Call on unmount.
   * Deliberately does NOT force-lose the WebGL context (WEBGL_lose_context):
   * React StrictMode's dev-mode mount->unmount->remount cycle calls this
   * synchronously, and an explicit lost context isn't guaranteed to finish
   * restoring before the remount tries to render on the same canvas — that
   * left compileShader() silently failing with a null info log. The browser
   * reclaims a canvas's GL context on its own once the element is discarded.
   */
  destroy() {
    this.stop();
    this.stopBPM();
    if (this.audioCtx) this.audioCtx.close().catch(() => {});
  }

  private tick(dtMs: number, now: number) {
    this.pollAudio(dtMs);

    const dt = dtMs / 1000;
    this.beatEnergy = Math.max(0, this.beatEnergy - this.beatDecay * dt * this.beatEnergy - 0.15 * dt);

    this.rotation += this.rotationSpeed * dt;

    if (this.retargetDur > 0) {
      this.retargetT += dtMs;
      const p = Math.min(1, this.retargetT / this.retargetDur);
      const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      this.center = {
        x: this.fromCenter.x + (this.targetCenter.x - this.fromCenter.x) * ease,
        y: this.fromCenter.y + (this.targetCenter.y - this.fromCenter.y) * ease,
      };
      if (p >= 1) this.retargetDur = 0;
    }

    const breathe = 1 + Math.sin(now * 0.00025) * 0.04;
    this.zoom = this.baseZoom * breathe;

    this.render(now);
  }

  private iterForZoom() {
    const base = 140;
    const extra = Math.floor(Math.log2(2.5 / Math.max(this.zoom, 1e-6)) * 40);
    return Math.min(500, Math.max(80, base + extra));
  }

  private render(now: number) {
    const gl = this.gl;
    this.resize();
    const t = this.theme;
    gl.useProgram(this.program);
    gl.uniform2f(this.uniforms.u_resolution, this.canvas.width, this.canvas.height);
    gl.uniform2f(this.uniforms.u_center, this.center.x, this.center.y);
    gl.uniform1f(this.uniforms.u_zoom, this.zoom);
    gl.uniform1f(this.uniforms.u_time, (now - this.startTime) / 1000);
    gl.uniform1f(this.uniforms.u_beat, this.beatEnergy);
    gl.uniform1f(this.uniforms.u_rotation, this.rotation);
    gl.uniform1f(this.uniforms.u_juliaMix, this.julia ? 1 : 0);
    gl.uniform2f(this.uniforms.u_juliaC, this.juliaC.x, this.juliaC.y);
    gl.uniform1i(this.uniforms.u_maxIter, this.iterForZoom());
    gl.uniform3fv(this.uniforms.u_colA, t.colA);
    gl.uniform3fv(this.uniforms.u_colB, t.colB);
    gl.uniform3fv(this.uniforms.u_colC, t.colC);
    gl.uniform3fv(this.uniforms.u_colD, t.colD);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}
