export type AmbientSoundType = 'off' | 'brown' | 'pink' | 'white' | 'binaural'

class AmbientAudioEngine {
  private ctx: AudioContext | null = null
  private noiseNode: AudioNode | null = null
  private gainNode: GainNode | null = null
  private currentType: AmbientSoundType = 'off'
  private isRunning = false
  private volume = 0.5

  public getCurrentType(): AmbientSoundType {
    return this.currentType
  }

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AudioCtx()
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol))
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05)
    }
  }

  public play(type: AmbientSoundType, volume = 0.5) {
    this.stop()
    if (type === 'off') return

    this.currentType = type
    this.volume = volume
    const ctx = this.getContext()

    this.gainNode = ctx.createGain()
    this.gainNode.gain.setValueAtTime(this.volume, ctx.currentTime)
    this.gainNode.connect(ctx.destination)

    const bufferSize = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = buffer.getChannelData(0)

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1
      }
    } else if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.96900 * b2 + white * 0.1538520
        b3 = 0.86650 * b3 + white * 0.3104856
        b4 = 0.55000 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.0168980
        b6 = white * 0.115926
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
        output[i] *= 0.11
      }
    } else if (type === 'brown') {
      let lastOutput = 0.0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        output[i] = (lastOutput + 0.02 * white) / 1.02
        lastOutput = output[i]
        output[i] *= 3.5
      }
    } else if (type === 'binaural') {
      const oscL = ctx.createOscillator()
      const oscR = ctx.createOscillator()
      const merger = ctx.createChannelMerger(2)

      oscL.frequency.value = 200
      oscR.frequency.value = 210

      oscL.connect(merger, 0, 0)
      oscR.connect(merger, 0, 1)

      merger.connect(this.gainNode)
      oscL.start()
      oscR.start()

      this.noiseNode = oscL
      this.isRunning = true
      return
    }

    const whiteNoise = ctx.createBufferSource()
    whiteNoise.buffer = buffer
    whiteNoise.loop = true
    whiteNoise.connect(this.gainNode)
    whiteNoise.start()

    this.noiseNode = whiteNoise
    this.isRunning = true
  }

  public stop() {
    this.currentType = 'off'
    if (this.noiseNode) {
      try {
        if ('stop' in this.noiseNode && typeof this.noiseNode.stop === 'function') {
          this.noiseNode.stop()
        }
        this.noiseNode.disconnect()
      } catch {
        // Source already stopped
      }
      this.noiseNode = null
    }
    this.isRunning = false
  }

  public isActive() {
    return this.isRunning
  }
}

export const ambientAudio = new AmbientAudioEngine()
