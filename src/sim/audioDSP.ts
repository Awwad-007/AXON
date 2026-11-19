/**
 * Web Audio DSP Engine (Tier 1 Zero-Hardware Acoustic Monitor).
 * Captures live microphone stream, computes 2048-point FFT, applies speech rejection
 * band-pass filtering, and extracts mechanical hum & ultrasonic friction features.
 */

export interface AcousticFeatures {
  rawFft: Uint8Array;
  lowBand: number;      // 20 - 250 Hz: Mechanical rotation & bearing hum
  speechBand: number;   // 300 - 3000 Hz: Human speech (rejected / notched)
  highBand: number;     // 3500 - 12000 Hz: Valve flutter & acoustic hiss
  filteredEnergy: number; // Weighted composite (speech attenuated)
  peakHz: number;       // Dominant frequency in mechanical/acoustic band
  rms: number;          // Overall root-mean-square amplitude
}

export class AudioDSP {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private dataArray: Uint8Array | null = null;

  public active = false;
  public sampleRate = 48000;
  public error: string | null = null;

  /**
   * Initializes microphone capture and connects to Web Audio AnalyserNode (fftSize: 2048).
   */
  async start(): Promise<boolean> {
    try {
      if (this.active) return true;

      // Request user microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.75;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      this.ctx = ctx;
      this.analyser = analyser;
      this.source = source;
      this.stream = stream;
      this.sampleRate = ctx.sampleRate;
      this.dataArray = new Uint8Array(analyser.frequencyBinCount);
      this.active = true;
      this.error = null;
      return true;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Microphone access denied';
      this.active = false;
      return false;
    }
  }

  /**
   * Stops microphone capture and cleans up AudioContext nodes.
   */
  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.analyser = null;
    this.dataArray = null;
    this.active = false;
  }

  /**
   * Extracts frequency bands and applies speech-rejection filter.
   */
  getAcousticFeatures(): AcousticFeatures {
    if (!this.analyser || !this.dataArray) {
      return {
        rawFft: new Uint8Array(1024),
        lowBand: 0,
        speechBand: 0,
        highBand: 0,
        filteredEnergy: 0,
        peakHz: 0,
        rms: 0,
      };
    }

    this.analyser.getByteFrequencyData(this.dataArray);

    const binCount = this.dataArray.length; // 1024 bins
    const nyquist = this.sampleRate / 2;
    const binHz = nyquist / binCount;

    const hzToBin = (hz: number) => Math.min(binCount - 1, Math.max(0, Math.floor(hz / binHz)));

    // Mechanical hum: 20 Hz - 250 Hz
    const lowStart = hzToBin(20);
    const lowEnd = hzToBin(250);

    // Human speech notch to reject: 300 Hz - 3000 Hz
    const spStart = hzToBin(300);
    const spEnd = hzToBin(3000);

    // Ultrasonic / valve hiss: 3500 Hz - 12000 Hz
    const hiStart = hzToBin(3500);
    const hiEnd = hzToBin(12000);

    let sumLow = 0, countLow = 0;
    let sumSp = 0, countSp = 0;
    let sumHi = 0, countHi = 0;
    let peakVal = 0;
    let peakBin = 0;
    let totalSq = 0;

    for (let i = 0; i < binCount; i++) {
      const val = this.dataArray[i]; // 0 - 255
      totalSq += val * val;

      if (i >= lowStart && i <= lowEnd) {
        sumLow += val;
        countLow++;
        if (val > peakVal) { peakVal = val; peakBin = i; }
      } else if (i >= spStart && i <= spEnd) {
        sumSp += val;
        countSp++;
      } else if (i >= hiStart && i <= hiEnd) {
        sumHi += val;
        countHi++;
        if (val > peakVal) { peakVal = val; peakBin = i; }
      }
    }

    const lowBand = countLow ? sumLow / (countLow * 255) : 0;
    const speechBand = countSp ? sumSp / (countSp * 255) : 0;
    const highBand = countHi ? sumHi / (countHi * 255) : 0;
    const rms = Math.sqrt(totalSq / binCount) / 255;

    // Filtered composite: emphasizes mechanical hum (60%) and high hiss (40%), rejecting speech band
    const filteredEnergy = Math.min(1.0, lowBand * 0.65 + highBand * 0.45);

    return {
      rawFft: this.dataArray,
      lowBand,
      speechBand,
      highBand,
      filteredEnergy,
      peakHz: Math.round(peakBin * binHz),
      rms,
    };
  }
}
