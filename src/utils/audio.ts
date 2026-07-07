/**
 * Synthesizes birthday music and celebratory sound effects using the Web Audio API. Pure client-side.
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private currentLoopNode: OscillatorNode | null = null;
  private currentNotes: any[] = [];
  private isSynthesizing: boolean = false;
  private playTimeoutId: any = null;

  init() {
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
    } catch (err) {
      console.warn("AudioContext failed to initialize:", err);
    }
  }

  // Plays a short sparkle sound effect when blowing candles or opening gifts
  playSparkle() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const time = now + idx * 0.08;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(time);
        osc.stop(time + 0.3);
      });
    } catch (err) {
      console.warn("playSparkle failed:", err);
    }
  }

  // Plays a short balloon pop noise burst
  playPop() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      // Short pop frequency snap
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
      
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);

      // High snap click
      const oscClick = this.ctx.createOscillator();
      const gainClick = this.ctx.createGain();
      oscClick.type = "sine";
      oscClick.frequency.setValueAtTime(800, now);
      gainClick.gain.setValueAtTime(0.15, now);
      gainClick.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      oscClick.connect(gainClick);
      gainClick.connect(this.ctx.destination);
      oscClick.start(now);
      oscClick.stop(now + 0.02);
    } catch (err) {
      console.warn("playPop failed:", err);
    }
  }

  // Play a beautiful synthesized clap/cheer noise burst for celebration!
  playCheer() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      // Cheering is modeled using a combination of band-pass filtered white noise 
      // and rapid high-frequency triangle pitches representing clapping hands.
      for (let i = 0; i < 8; i++) {
        const delay = Math.random() * 0.4;
        const clapTime = now + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(100 + Math.random() * 800, clapTime);
        gain.gain.setValueAtTime(0.12, clapTime);
        gain.gain.exponentialRampToValueAtTime(0.001, clapTime + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(clapTime);
        osc.stop(clapTime + 0.08);
      }
    } catch (err) {
      console.warn("playCheer failed:", err);
    }
  }

  // Starts custom looping synthesizer channel
  startMusic(choice: string) {
    this.stopMusic();
    this.init();
    if (!this.ctx || choice === "none") return;
    this.isSynthesizing = true;

    if (choice === "piano") {
      this.playPianoTheme();
    } else if (choice === "chiptune") {
      this.playChiptuneTheme();
    } else if (choice === "festive") {
      this.playFestiveBirthdayTheme();
    } else if (choice === "zen") {
      this.playAmbientZenTheme();
    }
  }

  stopMusic() {
    this.isSynthesizing = false;
    if (this.playTimeoutId) {
      clearTimeout(this.playTimeoutId);
      this.playTimeoutId = null;
    }
    this.currentNotes.forEach((osc) => {
      try {
        osc.stop();
      } catch (e) {}
    });
    this.currentNotes = [];
  }

  // Theme 1: Cozy flowing warm piano lullaby
  private playPianoTheme() {
    if (!this.isSynthesizing || !this.ctx) return;
    // Classic simple soothing chord progression: Cmaj9 - Fmaj7 - G6 - Em7
    // Beautiful random notes from the C Major pentatonic scale
    const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00]; // C4 to A5
    
    const playNextNote = () => {
      if (!this.isSynthesizing || !this.ctx) return;
      const now = this.ctx.currentTime;
      const freq = pentatonic[Math.floor(Math.random() * pentatonic.length)];
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      // Triangle gives a clean, warm flute/piano-like acoustic wave
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now);
      
      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.1); // Soft attack
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2); // Slower release

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 1.5);
      
      this.currentNotes.push(osc);
      this.currentNotes = this.currentNotes.filter(n => n.currentTime < now + 2);

      // Play soft backing base chord notes
      if (Math.random() > 0.6) {
        const baseFreqs = [130.81, 146.83, 164.81, 174.61]; // low bass notes
        const baseOsc = this.ctx.createOscillator();
        const baseGain = this.ctx.createGain();
        baseOsc.type = "sine";
        baseOsc.frequency.setValueAtTime(baseFreqs[Math.floor(Math.random() * baseFreqs.length)], now);
        baseGain.gain.setValueAtTime(0.03, now);
        baseGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
        baseOsc.connect(baseGain);
        baseGain.connect(this.ctx.destination);
        baseOsc.start(now);
        baseOsc.stop(now + 2.0);
      }

      this.playTimeoutId = setTimeout(playNextNote, 350 + Math.random() * 400);
    };

    playNextNote();
  }

  // Theme 2: Upbeat 8-bit retro gaming chiptune theme
  private playChiptuneTheme() {
    if (!this.isSynthesizing || !this.ctx) return;
    const bpm = 125;
    const step = 60 / bpm / 2; // eighth notes
    
    // Catch-phased chiptune melody
    const melody = [
      329.63, 329.63, 0, 329.63, 0, 261.63, 329.63, 0,
      392.00, 0, 0, 0, 196.00, 0, 0, 0,
      261.63, 0, 0, 196.00, 0, 0, 164.81, 0,
      220.00, 0, 246.94, 0, 233.08, 220.00, 0, 0
    ];
    let noteIdx = 0;

    const tick = () => {
      if (!this.isSynthesizing || !this.ctx) return;
      const now = this.ctx.currentTime;
      const freq = melody[noteIdx];

      if (freq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        // Square wave is perfect for classic NES style chiptunes
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, now);
        
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + step * 1.8);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + step * 2);
        
        this.currentNotes.push(osc);
      }

      // Add a fun little snare chiptune crack on beats 2 and 4
      if (noteIdx % 8 === 4) {
        const noise = this.ctx.createOscillator();
        const noiseGain = this.ctx.createGain();
        noise.type = "triangle";
        noise.frequency.setValueAtTime(100, now);
        noise.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
        noiseGain.gain.setValueAtTime(0.02, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        noise.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noise.start(now);
        noise.stop(now + 0.07);
      }

      noteIdx = (noteIdx + 1) % melody.length;
      this.playTimeoutId = setTimeout(tick, step * 1000);
    };

    tick();
  }

  // Theme 3: Happy Birthday theme synthesized beautifully!
  private playFestiveBirthdayTheme() {
    if (!this.isSynthesizing || !this.ctx) return;
    
    // Happy birthday melody notes
    // G4 G4 A4 G4 C5 B4, G4 G4 A4 G4 D5 C5, G4 G4 G5 E5 C5 B4 A4, F5 F5 E5 C5 D5 C5
    const notes = [
      196.00, 196.00, 220.00, 196.00, 261.63, 246.94, // Happy Birthday to you
      196.00, 196.00, 220.00, 196.00, 293.66, 261.63, // Happy Birthday to you
      196.00, 196.00, 392.00, 329.63, 261.63, 246.94, 220.00, // Happy Birthday dear...
      349.23, 349.23, 329.63, 261.63, 293.66, 261.63  // Happy Birthday to you
    ];

    const durations = [
      0.75, 0.25, 1, 1, 1, 2,
      0.75, 0.25, 1, 1, 1, 2,
      0.75, 0.25, 1, 1, 1, 1, 2,
      0.75, 0.25, 1, 1, 1, 2
    ];

    let index = 0;

    const playNext = () => {
      if (!this.isSynthesizing || !this.ctx) return;
      
      const now = this.ctx.currentTime;
      const freq = notes[index];
      const dur = durations[index] * 0.45; // Speed multiplier

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      // Triangle for warm festive vibes
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      
      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + dur + 0.1);
      
      this.currentNotes.push(osc);
      
      // Add harmony on key beats!
      if (index === 5 || index === 11 || index === 18 || index === 24) {
        const harmonyOsc = this.ctx.createOscillator();
        const harmonyGain = this.ctx.createGain();
        harmonyOsc.type = "triangle";
        harmonyOsc.frequency.setValueAtTime(freq * 0.75, now); // a perfect fourth/fifth below
        harmonyGain.gain.setValueAtTime(0.03, now);
        harmonyGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        harmonyOsc.connect(harmonyGain);
        harmonyGain.connect(this.ctx.destination);
        harmonyOsc.start(now);
        harmonyOsc.stop(now + dur);
        this.currentNotes.push(harmonyOsc);
      }

      index = (index + 1) % notes.length;
      this.playTimeoutId = setTimeout(playNext, (dur + 0.06) * 1000);
    };

    playNext();
  }

  // Theme 4: Ambient Zen Space Humming Theme
  private playAmbientZenTheme() {
    if (!this.isSynthesizing || !this.ctx) return;

    const playNextChord = () => {
      if (!this.isSynthesizing || !this.ctx) return;
      const now = this.ctx.currentTime;
      
      // Ambient soothing frequencies: Fmaj9 scale
      const freqs = [174.61, 220.00, 261.63, 329.63, 392.00, 440.00]; 
      
      // Play 3 randomized voices at once to create a gorgeous sweeping pad chord
      for (let i = 0; i < 3; i++) {
        const freq = freqs[Math.floor(Math.random() * freqs.length)];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq + (Math.random() * 4 - 2), now); // slightly detuned for chorus effect
        
        // Sweeping volume
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.03, now + 1.2); // very slow attack
        gain.gain.exponentialRampToValueAtTime(0.001, now + 4.5); // long decay
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 5.0);
        
        this.currentNotes.push(osc);
      }

      this.playTimeoutId = setTimeout(playNextChord, 3000);
    };

    playNextChord();
  }
}

export const synth = new AudioSynthesizer();
