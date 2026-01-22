export class AudioController {
    private static instance: AudioController;

    // Rhythm
    bpm: number = 120;
    lastBeatTime: number = 0;
    beatDuration: number; // Seconds per beat

    // Callbacks
    onBeat: (() => void)[] = [];

    private constructor() {
        this.beatDuration = 60 / this.bpm;
    }

    static getInstance(): AudioController {
        if (!AudioController.instance) {
            AudioController.instance = new AudioController();
        }
        return AudioController.instance;
    }

    update(_dt: number) {
        const now = Date.now() / 1000;

        if (now - this.lastBeatTime >= this.beatDuration) {
            this.lastBeatTime = now;
            this.triggerBeat();
        }
    }

    private triggerBeat() {
        // Dispatch to listeners
        this.onBeat.forEach(cb => cb());

        // Visual Pulse (Temporary Global Effect)
        const world = document.getElementById('world-layer');
        if (world) {
            world.style.filter = 'brightness(1.2)';
            setTimeout(() => {
                if (world) world.style.filter = 'none';
            }, 100);
        }
    }

    subscribeToBeat(callback: () => void) {
        this.onBeat.push(callback);
    }

    unsubscribeFromBeat(callback: () => void) {
        this.onBeat = this.onBeat.filter(cb => cb !== callback);
    }
}
