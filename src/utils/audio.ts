// Web Audio API medieval-themed synthesizer for Marcgard sound effects
// No external assets required, ensuring 100% offline-first reliability

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// Kurzer Rausch-Impuls (fuer Treffer-Knall). Eigener kleiner Buffer pro Aufruf.
function noiseBurst(ctx: AudioContext, dur: number): AudioBufferSourceNode {
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    // leicht abklingendes Rauschen
    data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  return src;
}

export function playSound(type: "play_card" | "attack" | "spell" | "heal" | "victory" | "loss" | "countdown_warning" | "countdown_urgent" | "hit" | "hurt" | "hero_death") {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Output node
    const destination = ctx.destination;

    switch (type) {
      case "countdown_warning": {
        // Deep warning gong at 10s - clearly audible
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.18);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(destination);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }

      case "countdown_urgent": {
        // Loud sharp clock TICK for the final 5 seconds.
        // Two-layer: a hard click transient + a short pitched body so it cuts through music/SFX.
        const click = ctx.createOscillator();
        const clickGain = ctx.createGain();
        click.type = "square";
        click.frequency.setValueAtTime(1400, now);
        click.frequency.exponentialRampToValueAtTime(900, now + 0.04);
        clickGain.gain.setValueAtTime(0.4, now);
        clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);
        click.connect(clickGain);
        clickGain.connect(destination);
        click.start(now);
        click.stop(now + 0.08);

        const body = ctx.createOscillator();
        const bodyGain = ctx.createGain();
        body.type = "triangle";
        body.frequency.setValueAtTime(700, now);
        bodyGain.gain.setValueAtTime(0.3, now);
        bodyGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        body.connect(bodyGain);
        bodyGain.connect(destination);
        body.start(now);
        body.stop(now + 0.11);
        break;
      }

      case "play_card": {
        // Magical harp pluck
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, now); // A4
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
        
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        
        osc.connect(gain);
        gain.connect(destination);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }

      case "attack": {
        // Heavy impact rumble with high pass crackle
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.2);
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        
        osc.connect(gain);
        gain.connect(destination);
        osc.start(now);
        osc.stop(now + 0.22);
        break;
      }

      case "spell": {
        // Fire crackle sizzle and blast
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.35);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        
        osc.connect(gain);
        gain.connect(destination);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      }

      case "heal": {
        // Shimmering chimes
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.3); // C6
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        
        osc.connect(gain);
        gain.connect(destination);
        osc.start(now);
        osc.stop(now + 0.45);
        break;
      }

      case "victory": {
        // Majestic chord cascade
        [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          
          gain.gain.setValueAtTime(0.1, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
          
          osc.connect(gain);
          gain.connect(destination);
          osc.start(now + i * 0.08);
          osc.stop(now + 0.8);
        });
        break;
      }

      case "loss": {
        // Somber downsweep growl
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(30, now + 0.7);
        
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        
        osc.connect(gain);
        gain.connect(destination);
        osc.start(now);
        osc.stop(now + 0.8);
        break;
      }

      case "hit": {
        // Kurzer, knackiger Treffer-Boom: tiefer Sinus-Thud + Rausch-Transient.
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.16);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.connect(gain);
        gain.connect(destination);
        osc.start(now);
        osc.stop(now + 0.19);

        const noise = noiseBurst(ctx, 0.09);
        const nGain = ctx.createGain();
        const nFilt = ctx.createBiquadFilter();
        nFilt.type = "lowpass";
        nFilt.frequency.setValueAtTime(1800, now);
        nGain.gain.setValueAtTime(0.18, now);
        nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        noise.connect(nFilt);
        nFilt.connect(nGain);
        nGain.connect(destination);
        noise.start(now);
        noise.stop(now + 0.1);
        break;
      }

      case "hurt": {
        // Eigener Held getroffen: tieferer, etwas laengerer "Aua"-Boom mit Dissonanz.
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(42, now + 0.26);
        gain.gain.setValueAtTime(0.34, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(destination);
        osc.start(now);
        osc.stop(now + 0.31);

        const sub = ctx.createOscillator();
        const subGain = ctx.createGain();
        sub.type = "triangle";
        sub.frequency.setValueAtTime(90, now);
        sub.frequency.exponentialRampToValueAtTime(38, now + 0.22);
        subGain.gain.setValueAtTime(0.22, now);
        subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.26);
        sub.connect(subGain);
        subGain.connect(destination);
        sub.start(now);
        sub.stop(now + 0.27);

        const noise = noiseBurst(ctx, 0.12);
        const nGain = ctx.createGain();
        const nFilt = ctx.createBiquadFilter();
        nFilt.type = "lowpass";
        nFilt.frequency.setValueAtTime(1200, now);
        nGain.gain.setValueAtTime(0.2, now);
        nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        noise.connect(nFilt);
        nFilt.connect(nGain);
        nGain.connect(destination);
        noise.start(now);
        noise.stop(now + 0.12);
        break;
      }

      case "hero_death": {
        // Entscheidender Schlag: tiefer, langer Untergangs-Boom + abfallender Heulton + Explosion-Rausch.
        const boom = ctx.createOscillator();
        const bGain = ctx.createGain();
        boom.type = "sine";
        boom.frequency.setValueAtTime(140, now);
        boom.frequency.exponentialRampToValueAtTime(28, now + 0.9);
        bGain.gain.setValueAtTime(0.001, now);
        bGain.gain.exponentialRampToValueAtTime(0.5, now + 0.04);
        bGain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
        boom.connect(bGain); bGain.connect(destination);
        boom.start(now); boom.stop(now + 1.05);

        const wail = ctx.createOscillator();
        const wGain = ctx.createGain();
        wail.type = "sawtooth";
        wail.frequency.setValueAtTime(520, now);
        wail.frequency.exponentialRampToValueAtTime(70, now + 0.8);
        wGain.gain.setValueAtTime(0.12, now);
        wGain.gain.exponentialRampToValueAtTime(0.01, now + 0.85);
        wail.connect(wGain); wGain.connect(destination);
        wail.start(now); wail.stop(now + 0.9);

        const ex = noiseBurst(ctx, 0.5);
        const exGain = ctx.createGain();
        const exFilt = ctx.createBiquadFilter();
        exFilt.type = "lowpass";
        exFilt.frequency.setValueAtTime(2400, now);
        exFilt.frequency.exponentialRampToValueAtTime(300, now + 0.5);
        exGain.gain.setValueAtTime(0.3, now);
        exGain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
        ex.connect(exFilt); exFilt.connect(exGain); exGain.connect(destination);
        ex.start(now); ex.stop(now + 0.55);
        break;
      }
    }
  } catch (error) {
    console.warn("Audio Context setup not allowed or failed:", error);
  }
}

// Real recorded clips for atmosphere/events (raven caw etc.).
// A fresh element per call so overlapping caws are fine; the browser GCs them.
export function playRaven() {
  try {
    const a = new Audio("/audio/raven.mp3");
    a.volume = 0.45;
    a.play().catch(() => {});
  } catch {
    // autoplay blocked before first interaction; ignore
  }
}
