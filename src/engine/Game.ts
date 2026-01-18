import { EntityManager } from './EntityManager';
import { InputSystem } from './InputSystem';
import { Player } from '../entities/Player';
import { UIManager } from '../ui/UIManager';
import { AudioController } from './AudioController';
import { ScrapyardMap } from '../world/ScrapyardMap';
import { GlassGardensMap } from '../world/GlassGardensMap';
import { SerumBot } from '../entities/enemies/SerumBot';
import { Golgotha } from '../entities/enemies/Golgotha';
import { ParticleSystem } from './ParticleSystem';
import { SVGAssets } from '../world/SVGAssets';
import { LoreFXSystem } from '../systems/LoreFXSystem';
import { EventManager } from './EventManager';
import { BarkSystem } from '../systems/BarkSystem';
import { ZoneSystem } from '../systems/ZoneSystem';
import { GameMap } from '../world/GameMap';
import { NarrativeItem } from '../entities/NarrativeItem';
import { ProgressionSystem } from '../systems/ProgressionSystem';
import { LootSystem } from '../systems/LootSystem';
import { ClockworkArteriesMap } from '../world/ClockworkArteriesMap';
import { ReflectionSystem } from '../systems/ReflectionSystem';
import { ItemDatabase } from '../systems/ItemDatabase';
import { PersistenceManager } from './PersistenceManager';
import { Camera } from './Camera';

export class Game {
    lastTime: number = 0;
    entityManager!: EntityManager;
    particles!: ParticleSystem;
    input!: InputSystem;
    ui!: UIManager;
    audio!: AudioController;
    player!: Player;
    map!: GameMap;
    // Event System
    events!: EventManager;
    loreFX!: LoreFXSystem;
    camera!: Camera;

    static instance: Game;

    // State
    state: 'MENU' | 'PLAY' | 'OVER' = 'MENU';
    screens!: { start: HTMLElement, over: HTMLElement };

    // Graphics Refs
    bgFar: SVGElement | null = null;
    bgMid: SVGElement | null = null;
    monoMatrix: SVGElement | null = null;
    shatterDisp: SVGElement | null = null;

    // Graphics State
    lastResonance: number = 100;
    shatterTimer: number = 0;

    // Progression Gating
    bossesDefeated: Set<string> = new Set();
    narrativesRead: Set<string> = new Set();

    constructor() {
        try {
            Game.instance = this;

            this.entityManager = new EntityManager();
            this.particles = new ParticleSystem();
            this.input = InputSystem.getInstance();
            this.ui = UIManager.getInstance();
            this.audio = AudioController.getInstance();
            this.events = EventManager.getInstance();
            this.loreFX = new LoreFXSystem();
            this.camera = new Camera(800, 600);

            // Initialize Systems
            const barkSystem = BarkSystem.getInstance();
            ZoneSystem.getInstance(); // Ensure singleton init
            ReflectionSystem.getInstance(); // Ensure reflection system init
            ProgressionSystem.getInstance(); // Ensure progression system init
            LootSystem.getInstance(); // Ensure loot system init

            // Initialize Data-Driven Systems
            ItemDatabase.getInstance().init();

            // Load saved game if exists
            const persistence = PersistenceManager.getInstance();
            if (persistence.hasSave()) {
                console.log('[Game] Saved game found. Loading...');
                persistence.load();
            }

            // Wire: Event Bus -> Bark System
            this.events.on('ENTITY_AGGRO', (data: any) => {
                barkSystem.trigger(data.type, 'AGGRO', { x: data.x, y: data.y }, data.id);
            });
            this.events.on('ENTITY_DAMAGED', (data: any) => {
                barkSystem.trigger(data.type, 'DAMAGE', { x: data.x, y: data.y }, data.id);
                // LoreFX: Impact ripple on damage
                this.loreFX.triggerImpact(data.x, data.y, 1.0);
            });
            this.events.on('ENTITY_DIED', (data: any) => {
                barkSystem.trigger(data.type, 'DEATH', { x: data.x, y: data.y }, data.id);
                // Track Boss Deaths
                if (data.type === 'golgotha') {
                    this.bossesDefeated.add('golgotha');
                    console.log("[Game] Boss Defeated: Golgotha");
                }
            });

            this.events.on('NARRATIVE_INTERACTED', (data: any) => {
                this.narrativesRead.add(data.label);
                console.log(`[Game] Narrative Read: ${data.label}`);
            });

            // MAP SWITCHING
            this.events.on('ZONE_CHANGED', (data: any) => {
                this.handleZoneChange(data.name, data.index);
            });

            // LOOT VISUALS
            this.events.on('LOOT_GAINED', (data: any) => {
                if (data.type === 'vibration' && data.amount > 0) {
                    // Find some position? If the event had x,y it would be better.
                    // For now, assume it's near player or we just show a center toast.
                    // Let's assume calculateDrop passed x,y (I'll check LootSystem).
                    this.ui.showLootGain(data.x || 400, data.y || 300, data.amount);
                }
            });

            this.events.on('PLAYER_ATTUNED', (data: any) => {
                this.ui.showBark(this.player.x, this.player.y, `RESONANT LEVEL UP: ${data.level}`);
            });

            // UI Screens
            this.screens = {
                start: this.createScreen('start-screen', '<h1>CHRONOCRYSTAL</h1><p>Press SPACE to Begin</p>'),
                over: this.createScreen('game-over', '<h1>SILENCE</h1><p>The signal is lost.</p><p>Press R to Restart</p>')
            };

            // Input Listener for Menu
            window.addEventListener('keydown', (e) => {
                if (this.state === 'MENU' && e.code === 'Space') {
                    this.startGame();
                }
                if (this.state === 'OVER' && e.code === 'KeyR') {
                    window.location.reload();
                }
            });

            // Background
            this.map = new ScrapyardMap();

            // Grab Graphics Elements
            this.bgFar = document.getElementById('bg-far') as unknown as SVGElement;
            this.bgMid = document.getElementById('bg-mid') as unknown as SVGElement;
            this.monoMatrix = document.querySelector('#silence-mono feColorMatrix') as unknown as SVGElement;
            this.shatterDisp = document.querySelector('#shatter-glitch feDisplacementMap') as unknown as SVGElement;

            // Populate Backgrounds with Procedural Art
            this.initBackgrounds();

            // NO DUMMY PLAYER HERE - Fixes the "Duplicate Sprite" bug.
            // We cast null to satisfy TS, it will be inited in startGame.
            this.player = null as any;

            requestAnimationFrame((t) => this.loop(t));
            console.log("Game: Initialization successful.");
        } catch (error) {
            console.error("Game: CRITICAL INITIALIZATION ERROR:", error);
            document.body.innerHTML = `<div style="color: red; padding: 20px; background: white; z-index: 10000; position: relative;"><h1>CRITICAL ERROR</h1><pre>${error}</pre></div>`;
        }
    }

    static getInstance(): Game {
        return Game.instance;
    }

    createScreen(id: string, html: string): HTMLElement {
        const div = document.createElement('div');
        div.id = id;
        div.innerHTML = html;
        document.getElementById('game-container')!.appendChild(div);
        return div;
    }

    startGame() {
        this.state = 'PLAY';
        this.screens.start.classList.add('hidden');

        // Reset Logic
        this.entityManager.entities.forEach(e => e.destroy());
        this.entityManager.entities = [];

        // Spawn Player (In the mannequin pile)
        this.player = new Player(150, 480);
        this.player.state = 'ASLEEP';
        this.entityManager.add(this.player);

        // Spawn Narrative Items (Scrapyard)
        const mirrorSVG = `
            <rect x="-20" y="-30" width="40" height="60" fill="#4ff" opacity="0.3" filter="url(#glass-shine)" stroke="#fff" />
            <path d="M-20,-30 L20,30 M-20,30 L20,-30" stroke="#fff" stroke-width="0.5" opacity="0.2" />
        `;
        const mirror = new NarrativeItem(300, 450, mirrorSVG, "A Cracked Mirror", "You see the world, but not yourself. Dissonance.", this.player);
        this.entityManager.add(mirror);

        const ledgerSVG = `
            <rect x="-15" y="-10" width="30" height="20" fill="#dcb" stroke="#544" />
            <line x1="-10" y1="-5" x2="10" y2="-5" stroke="#544" stroke-width="1" />
            <line x1="-10" y1="0" x2="10" y2="0" stroke="#544" stroke-width="1" />
        `;
        const ledger = new NarrativeItem(600, 520, ledgerSVG, "Foreman's Ledger", "Entries for 'Soft Units' scheduled for disposal. 12:00:00. 12:00:00. Time stopped here.", this.player);
        this.entityManager.add(ledger);

        // Spawn First Enemy
        const bot = new SerumBot(650, 300, this.player);
        this.entityManager.add(bot);

        // Camera Follow
        this.camera.follow(this.player);
        if (this.map) {
            this.camera.setBounds(this.map.width, this.map.height);
        }
    }

    handleZoneChange(name: string, _index: number) {
        console.log(`[Game] Switching to ${name}`);

        // AUTO-SAVE before zone transition
        PersistenceManager.getInstance().save();

        // 1. Destroy old map
        if (this.map) this.map.destroy();

        // 2. Clear Entities (except Player)
        this.entityManager.entities.forEach(e => {
            if (e !== this.player) e.destroy();
        });
        this.entityManager.entities = [this.player]; // Keep player

        // 3. Create New Map
        if (name === "Glass Gardens") {
            this.map = new GlassGardensMap();
        } else if (name === "The Clockwork Arteries") {
            this.map = new ClockworkArteriesMap();
        } else {
            this.map = new ScrapyardMap();
            this.initBackgrounds(); // Restore scrapyard BG art

            // Re-spawn Narrative Items in Scrapyard if returning
            // (Simplified for prototype: just spawn them again)
            const mirrorSVG = `<rect x="-20" y="-30" width="40" height="60" fill="#4ff" opacity="0.3" filter="url(#glass-shine)" stroke="#fff" />`;
            this.entityManager.add(new NarrativeItem(300, 450, mirrorSVG, "Mirror", "No reflection.", this.player));
        }

        // Update Camera Bounds
        this.camera.setBounds(this.map.width, this.map.height);

        // 4. Teleport Player
        if (this.player.x > 400) {
            this.player.x = 50; // Entered from left
        } else {
            this.player.x = this.map.width - 50; // Entered from right
        }

        // 5. Update Background Art (Cheap Hack)
        if (this.bgFar) {
            if (name === "Glass Gardens") {
                this.bgFar.style.filter = "hue-rotate(180deg)"; // Blue theme
                this.bgFar.innerHTML = ''; // Clear gears
            } else {
                this.bgFar.style.filter = "none";
            }
        }
    }

    loop(time: number) {
        if (this.state !== 'PLAY') {
            requestAnimationFrame((t) => this.loop(t));
            return;
        }

        const dt = (time - this.lastTime) / 1000;
        this.lastTime = time;

        const safeDt = Math.min(dt, 0.1);

        // Time Dilation (Area 1: Heavy Room)
        let dilation = 1.0;
        if (this.player) {
            dilation = ZoneSystem.getInstance().getCurrentTimeDilation(this.player.x, this.player.y);
        }
        const physicsDt = safeDt * dilation;

        // Update Systems
        this.audio.update(safeDt);
        this.entityManager.update(physicsDt);
        this.particles.update(physicsDt);
        if (this.player) this.loreFX.update(physicsDt, this.player);

        // Zone Logic (Check Transitions)
        if (this.player) {
            ZoneSystem.getInstance().checkTransition(this.player.x, this.player.y);
        }

        // --- GRAPHICS UPDATE ---

        // 0. Update Camera
        this.camera.update();

        // 1. World Scroll
        if (this.map && this.map.el) {
            this.map.el.setAttribute('transform', this.camera.getTransform());
        }

        // 2. Parallax (Based on Camera position)
        if (this.bgFar && this.bgMid) {
            // Far moves very slowly (10% of world speed)
            const ox = -this.camera.x * 0.1;
            const oy = -this.camera.y * 0.1;

            // Mid moves slowly (50% of world speed)
            const mx = -this.camera.x * 0.5;
            const my = -this.camera.y * 0.5;

            this.bgFar.setAttribute('transform', `translate(${ox}, ${oy})`);
            this.bgMid.setAttribute('transform', `translate(${mx}, ${my})`);
        }

        // 2. Health Desaturation (The Silence)
        if (this.player && this.monoMatrix) {
            const healthPct = Math.max(0, this.player.currentResonance / this.player.maxResonance);
            // Saturation logic: 1.0 (Full) -> 0.0 (Grey)
            this.monoMatrix.setAttribute('values', healthPct.toFixed(2));
        }

        // 3. Shatter Glitch (Trigger on Damage)
        if (this.player) {
            if (this.player.currentResonance < this.lastResonance) {
                // Damage taken -> Trigger Glitch
                this.shatterTimer = 0.5; // Glitch for 0.5s
            }
            this.lastResonance = this.player.currentResonance;
        }

        if (this.shatterTimer > 0 && this.shatterDisp) {
            this.shatterTimer -= safeDt;
            // Scale: 0 -> 20 -> 0
            const strength = Math.sin(this.shatterTimer * Math.PI * 4) * 20;
            this.shatterDisp.setAttribute('scale', Math.abs(strength).toString());
        } else if (this.shatterDisp) {
            this.shatterDisp.setAttribute('scale', '0');
        }

        // WAVE LOGIC: Only in Scrapyard (Zone 0)
        // If Zone 1 (Glass Gardens), logic is handled by Boss existence
        const zoneIndex = ZoneSystem.getInstance().currentZoneIndex;

        if (zoneIndex === 0) {
            const enemies = this.entityManager.entities.filter(e => e instanceof SerumBot);
            const boss = this.entityManager.entities.find(e => e instanceof Golgotha);

            if (enemies.length === 0 && !boss) {
                // Spawn with random offset
                const ex = 100 + Math.random() * 600;
                const ey = 100 + Math.random() * 400;
                const bot = new SerumBot(ex, ey, this.player);
                this.entityManager.add(bot);

                this.ui.showBark(ex, ey, "Another rises...");
            }

            // Boss Trigger: If player nears the exit (X > 600) and boss not alive AND NOT PREVIOUSLY DEFEATED
            if (this.player.x > 600 && !boss && !this.bossesDefeated.has('golgotha')) {
                const golgotha = new Golgotha(400, 300, this.player);
                this.entityManager.add(golgotha);
                this.ui.showBark(golgotha.x, golgotha.y, "I AM THE ACCUMULATION.");
            }
        }

        // Boss Health Bar Logic (Example hook)
        if (zoneIndex === 1) {
            this.entityManager.entities.find(e => e instanceof Golgotha) as Golgotha;
            // TODO: Update Boss UI if we had one
        }

        // Update UI
        this.ui.updateResonance(this.player.currentResonance, this.player.maxResonance);
        this.ui.updateHealthEffect(this.player.currentResonance, this.player.maxResonance);

        const prog = ProgressionSystem.getInstance();
        this.ui.updateProgression(prog.level, prog.vibration);

        // Check Game Over
        if (this.player.currentResonance <= 0) {
            this.state = 'OVER';
            this.screens.over.style.display = 'flex';
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    initBackgrounds() {
        if (!this.bgFar || !this.bgMid) return;

        // 1. Far Layer (Giant slow gears)
        this.bgFar.innerHTML = `<rect width="2000" height="2000" x="-500" y="-500" fill="#050505"/>`; // Clear old
        for (let i = 0; i < 5; i++) {
            const cx = Math.random() * 1200 - 200;
            const cy = Math.random() * 1000 - 200;
            const r = 100 + Math.random() * 300;
            // Darkest grey
            this.bgFar.innerHTML += `<path d="${SVGAssets.gear(cx, cy, r, 20)}" fill="#0a0a0a" stroke="#111" stroke-width="20" />`;
        }

        // 2. Mid Layer (Chains and Machinery)
        this.bgMid.innerHTML = ``;
        for (let i = 0; i < 8; i++) {
            const cx = Math.random() * 1200 - 200;
            const cy = Math.random() * 1000 - 200;
            const r = 50 + Math.random() * 100;
            // Dark grey
            this.bgMid.innerHTML += `<path d="${SVGAssets.gear(cx, cy, r, 12)}" fill="#111" stroke="#222" stroke-width="5" />`;
        }
        // Chains
        this.bgMid.innerHTML += `<path d="${SVGAssets.chain(200, -100, 200, 400, 0)}" stroke="#151515" stroke-width="8" fill="none" />`;
        this.bgMid.innerHTML += `<path d="${SVGAssets.chain(600, -100, 600, 300, 0)}" stroke="#151515" stroke-width="8" fill="none" />`;
    }
}
