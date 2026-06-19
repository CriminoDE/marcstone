// Web Audio API medieval-themed synthesizer for Marcstone sound effects
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

export function playSound(type: "play_card" | "attack" | "spell" | "heal" | "victory" | "loss" | "countdown_warning" | "countdown_urgent") {
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
    }
  } catch (error) {
    console.warn("Audio Context setup not allowed or failed:", error);
  }
}
