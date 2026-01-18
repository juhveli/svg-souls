export class UIManager {
    private static instance: UIManager;
    private resonanceBar: HTMLElement;
    private resonanceContainer: HTMLElement;
    private overheatBar: HTMLElement;
    private overheatContainer: HTMLElement;
    private statusContainer: HTMLElement; // New: Level/Vibration
    private bossContainer: HTMLElement;
    private bossName: HTMLElement;
    private bossBar: HTMLElement;
    private gameContainer: HTMLElement;

    constructor() {
        if (UIManager.instance) {
            // In singleton pattern usually we'd throw or return the existing, 
            // but here I need to initialize properties on the *new* instance if I am using it,
            // or just act as the singleton. 
            // Simple hack: Assign static instance to this if null.
        }
        UIManager.instance = this;

        this.gameContainer = document.getElementById('ui-layer')!;

        // Create Resonance Meter (Tuning Fork Style)
        this.resonanceContainer = document.createElement('div');
        this.resonanceContainer.id = 'resonance-meter';
        this.resonanceContainer.innerHTML = `
            <div class="label">RESONANCE</div>
            <div class="bar-bg">
                <div class="bar-fill"></div>
            </div>
        `;

        this.gameContainer.appendChild(this.resonanceContainer);
        this.resonanceBar = this.resonanceContainer.querySelector('.bar-fill')!;
        this.resonanceContainer.style.display = 'none'; // Diegetic UI replaced this

        // Create Overheat Meter
        this.overheatContainer = document.createElement('div');
        this.overheatContainer.id = 'overheat-meter';
        this.overheatContainer.innerHTML = `
            <div class="label">HEAT</div>
            <div class="bar-bg">
                <div class="bar-fill"></div>
            </div>
        `;
        this.gameContainer.appendChild(this.overheatContainer);
        this.overheatBar = this.overheatContainer.querySelector('.bar-fill')!;

        // Create Status Center (Level/Vibration)
        this.statusContainer = document.createElement('div');
        this.statusContainer.id = 'status-center';
        this.statusContainer.innerHTML = `
            <div class="stat-item"><span class="label">LEVEL</span> <span id="val-level">1</span></div>
            <div class="stat-item"><span class="label">VIBRATION</span> <span id="val-vib">0</span></div>
        `;
        this.gameContainer.appendChild(this.statusContainer);

        // Create Boss Health Meter
        this.bossContainer = document.createElement('div');
        this.bossContainer.id = 'boss-meter';
        this.bossContainer.style.display = 'none';
        this.bossContainer.innerHTML = `
            <div class="boss-name">BOSS</div>
            <div class="boss-bar-bg">
                <div class="boss-bar-fill"></div>
            </div>
        `;
        this.gameContainer.appendChild(this.bossContainer);
        this.bossName = this.bossContainer.querySelector('.boss-name')!;
        this.bossBar = this.bossContainer.querySelector('.boss-bar-fill')!;
    }

    static getInstance(): UIManager {
        return UIManager.instance;
    }

    updateResonance(current: number, max: number) {
        // Safety check if elements exist (in case of double init)
        if (!this.resonanceBar || !this.resonanceContainer) return;

        const pct = (current / max) * 100;
        this.resonanceBar.style.width = `${pct}%`;

        // Visual Feedback for Low/Empty
        if (pct < 20) {
            this.resonanceBar.style.backgroundColor = '#ff4444';
        } else {
            this.resonanceBar.style.backgroundColor = '#44ffff';
        }

        // Vibrate if high resonance
        if (pct > 80) {
            this.resonanceContainer.style.transform = `translate(${Math.random()}px, ${Math.random()}px)`;
        } else {
            this.resonanceContainer.style.transform = 'skewX(-20deg)'; // Keep the skew
        }
    }

    updateOverheat(value: number) {
        if (!this.overheatBar || !this.overheatContainer) return;

        const pct = Math.max(0, Math.min(100, value));
        this.overheatBar.style.width = `${pct}%`;

        // Heat Color Transition: Yellow -> Orange -> Red
        if (pct > 80) {
            this.overheatBar.style.backgroundColor = '#ff4400';
            this.overheatContainer.style.animation = 'vibration 0.1s infinite';
        } else if (pct > 50) {
            this.overheatBar.style.backgroundColor = '#ffaa00';
            this.overheatContainer.style.animation = 'none';
        } else {
            this.overheatBar.style.backgroundColor = '#ffff00';
            this.overheatContainer.style.animation = 'none';
        }

        // Show/Hide based on zone
        const zone = (window as any).ZoneSystem?.currentZoneIndex;
        this.overheatContainer.style.display = zone === 2 ? 'block' : 'none';
    }

    updateProgression(level: number, vibration: number) {
        const lvlEl = document.getElementById('val-level');
        const vibEl = document.getElementById('val-vib');
        if (lvlEl) lvlEl.innerText = level.toString();
        if (vibEl) vibEl.innerText = vibration.toString();
    }

    updateBossHealth(name: string, current: number, max: number) {
        if (!this.bossContainer || !this.bossBar) return;

        this.bossContainer.style.display = 'block';
        this.bossName.innerText = name;

        const pct = Math.max(0, (current / max) * 100);
        this.bossBar.style.width = `${pct}%`;
    }

    hideBossHealth() {
        if (this.bossContainer) {
            this.bossContainer.style.display = 'none';
        }
    }

    showLootGain(x: number, y: number, amount: number) {
        const popup = document.createElement('div');
        popup.className = 'loot-popup';
        popup.innerText = `+${amount} VIB`;
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
        this.gameContainer.appendChild(popup);

        setTimeout(() => popup.classList.add('fade-out'), 500);
        setTimeout(() => popup.remove(), 1500);
    }

    updateHealthEffect(current: number, max: number) {
        if (max === 0) max = 1;
        const pct = Math.max(0, Math.min(1, current / max));
        const gray = 1.0 - pct;

        const gameView = document.getElementById('game-view');
        if (gameView) {
            gameView.style.filter = `grayscale(${gray})`;
        }
    }

    showBark(x: number, y: number, text: string) {
        const bark = document.createElement('div');
        bark.className = 'bark-bubble';
        bark.innerText = text;

        // Random slight offset
        const offsetX = (Math.random() - 0.5) * 20;
        bark.style.left = `${x + offsetX}px`;
        bark.style.top = `${y - 50}px`; // Above head

        this.gameContainer.appendChild(bark);

        // Animate up and fade
        setTimeout(() => {
            bark.style.transform = 'translateY(-30px)';
            bark.style.opacity = '0';
        }, 50);

        setTimeout(() => bark.remove(), 1050);
    }
}
