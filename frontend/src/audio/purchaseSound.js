export function preparePurchaseSound() {
  let context;
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (Audio) {
      context = new Audio();
      context.resume().catch(() => {});
    }
  } catch {}
  let played = false;
  return {
    play() {
      if (!context || played) return;
      played = true;
      try {
        const now = context.currentTime;
        const master = context.createGain();
        master.gain.value = 0.52;
        const limiter = context.createDynamicsCompressor();
        limiter.threshold.value = -12;
        limiter.ratio.value = 3;
        master.connect(limiter);
        limiter.connect(context.destination);
        // Assinatura original: corpo grave e notas curtas de mallet.
        const notes = [
          [130.81, 0, 0.18, 0.48, "triangle"],
          [261.63, 0.07, 0.07, 0.58, "sine"],
          [523.25, 0, 0.22, 0.27, "sine"],
          [659.25, 0.075, 0.2, 0.3, "sine"],
          [783.99, 0.15, 0.18, 0.35, "sine"],
          [1046.5, 0.245, 0.16, 0.52, "sine"],
        ];
        notes.forEach(([frequency, offset, volume, duration, type]) => {
          const start = now + offset;
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.type = type;
          oscillator.frequency.setValueAtTime(frequency * 0.94, start);
          oscillator.frequency.exponentialRampToValueAtTime(
            frequency,
            start + 0.04,
          );
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.exponentialRampToValueAtTime(volume, start + 0.009);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
          oscillator.connect(gain);
          gain.connect(master);
          oscillator.start(start);
          oscillator.stop(start + duration + 0.025);
        });
      } catch {}
    },
    dispose() {
      context?.close().catch(() => {});
    },
  };
}
