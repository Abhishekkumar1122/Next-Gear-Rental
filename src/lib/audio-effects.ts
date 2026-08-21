/**
 * Premium Web Audio API Synthesizer for Next Gear Vendor Dashboard
 * Generates custom high-fidelity chimes directly in the browser to avoid assets loading latency.
 */

class AudioSynth {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
  }

  /**
   * Ascending premium arpeggio for successful verifications (QR scans)
   */
  public playSuccess() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      // Notes: G5 (784Hz), C6 (1047Hz), E6 (1319Hz)
      const notes = [783.99, 1046.50, 1318.51];
      
      notes.forEach((freq, index) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + index * 0.07);
        
        gain.gain.setValueAtTime(0, now + index * 0.07);
        gain.gain.linearRampToValueAtTime(0.12, now + index * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.07 + 0.25);
        
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        
        osc.start(now + index * 0.07);
        osc.stop(now + index * 0.07 + 0.3);
      });
    } catch (e) {
      console.warn("AudioSynth error playing success chime:", e);
    }
  }

  /**
   * Cash register and coin coins chime for payouts and manual withdrawals
   */
  public playCashRegister() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Bell ping 1
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(2500, now);
      osc.frequency.exponentialRampToValueAtTime(1500, now + 0.15);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);

      // Bell ping 2 (chime echo)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(3200, now + 0.04);
      osc2.frequency.exponentialRampToValueAtTime(2200, now + 0.2);
      
      gain2.gain.setValueAtTime(0.1, now + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.04);
      osc2.stop(now + 0.3);

      // White noise buffer for coin coins sliding sound
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 8000;
      
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.08, now + 0.05);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      
      noise.start(now + 0.05);
      noise.stop(now + 0.2);
    } catch (e) {
      console.warn("AudioSynth error playing cash chime:", e);
    }
  }

  /**
   * Friendly notification bell for alerts, ticket replies, and toggling schedules
   */
  public playAlert() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880.00, now + 0.1); // A5
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      console.warn("AudioSynth error playing alert chime:", e);
    }
  }
}

export const audioSynth = new AudioSynth();
