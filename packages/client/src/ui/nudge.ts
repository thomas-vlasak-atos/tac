/** „Anstupsen" (REQ-FEEDBACK F12): gesprochener Satz bzw. kurzer Signalton beim Empfänger. */

export function nudgePhrase(name: string): string {
  return `${name}, du bist dran!`;
}

/** Zwei kurze Töne als Ersatz, falls keine Sprachausgabe verfügbar ist. */
function chime(): void {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  [660, 880].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.22);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + i * 0.22 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.22 + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.22);
    osc.stop(ctx.currentTime + i * 0.22 + 0.22);
  });
  setTimeout(() => void ctx.close(), 800);
}

/** Spricht den Satz auf Deutsch; ohne Sprachausgabe oder deutsche Stimme gibt es den Signalton. */
export function playNudge(name: string): void {
  try {
    const synth = window.speechSynthesis;
    const hasGerman = synth?.getVoices().some((voice) => voice.lang.toLowerCase().startsWith("de"));
    // Manche Browser laden die Stimmenliste erst verzögert (leer = unbekannt): dann trotzdem versuchen.
    if (synth && (hasGerman || synth.getVoices().length === 0)) {
      const utterance = new SpeechSynthesisUtterance(nudgePhrase(name));
      utterance.lang = "de-DE";
      synth.cancel();
      synth.speak(utterance);
      return;
    }
  } catch {
    // fällt auf den Signalton zurück
  }
  chime();
}
