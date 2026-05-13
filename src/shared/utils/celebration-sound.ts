let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function playSound(url: string): void {
  try {
    const audio = new Audio(url);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch {
    // audio not available
  }
}

export function playCelebrationSound(): void {
  try {
    const ctx = getAudioContext();
    const master = ctx.createGain();
    master.connect(ctx.destination);
    master.gain.value = 0.15;

    const notes = [262, 330, 392, 523];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      noteGain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
      noteGain.gain.linearRampToValueAtTime(0.8, ctx.currentTime + i * 0.1 + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.3);
      osc.connect(noteGain);
      noteGain.connect(master);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.3);
    });
  } catch {
    // audio not available
  }
}
