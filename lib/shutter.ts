let audioContext: AudioContext | null = null;

function context() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export async function playShutter() {
  const ctx = context();
  if (ctx.state === "suspended") await ctx.resume();

  const now = ctx.currentTime;
  const noiseDuration = 0.07;
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * noiseDuration), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.18, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseDuration);
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 1200;
  noise.connect(filter).connect(noiseGain).connect(ctx.destination);
  noise.start(now);

  const click = ctx.createOscillator();
  const clickGain = ctx.createGain();
  click.type = "square";
  click.frequency.setValueAtTime(220, now);
  click.frequency.exponentialRampToValueAtTime(90, now + 0.05);
  clickGain.gain.setValueAtTime(0.07, now);
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
  click.connect(clickGain).connect(ctx.destination);
  click.start(now);
  click.stop(now + 0.07);
}

export async function fadeAudio(audio: HTMLAudioElement, from: number, to: number, ms = 1600) {
  const steps = 24;
  const interval = ms / steps;
  audio.volume = from;
  for (let i = 1; i <= steps; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, interval));
    audio.volume = from + ((to - from) * i) / steps;
  }
}
