import { EntityManager } from './EntityManager';
import { InputSystem } from './InputSystem';
import { Player } from '../entities/Player';
import { UIManager } from '../ui/UIManager';
import { AudioController } from './AudioController';
import { ScrapyardMap } from '../world/ScrapyardMap';
import { GlassGardensMap } from '../world/GlassGardensMap';
import { Golgotha } from '../entities/enemies/Golgotha';
import { ParticleSystem } from './ParticleSystem';
import { LoreFXSystem } from '../systems/LoreFXSystem';
import { EventManager } from './EventManager';
import { BarkSystem } from '../systems/BarkSystem';
import { ZoneSystem } from '../systems/ZoneSystem';
import { GameMap } from '../world/GameMap';
import { ProgressionSystem } from '../systems/ProgressionSystem';
import { LootSystem } from '../systems/LootSystem';
import { ClockworkArteriesMap } from '../world/ClockworkArteriesMap';
import { HushedHallsMap } from '../world/HushedHallsMap';
import { CrystalBelfryMap } from '../world/CrystalBelfryMap';
import { ReflectionSystem } from '../systems/ReflectionSystem';
import { ItemDatabase } from '../systems/ItemDatabase';
import { NPCDatabase } from '../systems/NPCDatabase';
import { PersistenceManager } from './PersistenceManager';
import { Camera } from './Camera';
import { WebGPURenderer } from './WebGPURenderer';

export class Game {
    lastTime: number = 0;
    entityManager!: EntityManager;
    particles!: ParticleSystem;
    input!: InputSystem;
    ui!: UIManager;
    audio!: AudioController;
    player!: Player;
    map!: GameMap;
    events!: EventManager;
    loreFX!: LoreFXSystem;
    camera!: Camera;

    static instance: Game;

    state: 'MENU' | 'PLAY' | 'OVER' = 'MENU';
    screens!: { start: HTMLElement, over: HTMLElement };

    bossesDefeated: Set<string> = new Set();
    narrativesRead: Set<string> = new Set();

    constructor() {
        try {
            Game.instance = this;

            this.entityManager = new EntityManager();
            this.particles = new ParticleSystem(); // Kept for logic, renders nothing
            this.input = InputSystem.getInstance();
            this.ui = UIManager.getInstance();
            this.audio = AudioController.getInstance();
            this.events = EventManager.getInstance();
            this.loreFX = new LoreFXSystem();
            this.camera = new Camera(800, 600);

            const barkSystem = BarkSystem.getInstance();
            ZoneSystem.getInstance();
            ReflectionSystem.getInstance();
            ProgressionSystem.getInstance();
            LootSystem.getInstance();

            ItemDatabase.getInstance().init();
            NPCDatabase.getInstance().init();

            const persistence = PersistenceManager.getInstance();
            if (persistence.hasSave()) {
                console.log('[Game] Saved game found. Loading...');
                persistence.load();
            }

            this.events.on('ENTITY_AGGRO', (data: any) => {
                barkSystem.trigger(data.type, 'AGGRO', { x: data.x, y: data.y }, data.id);
            });
            this.events.on('ENTITY_DAMAGED', (data: any) => {
                barkSystem.trigger(data.type, 'DAMAGE', { x: data.x, y: data.y }, data.id);
            });
            this.events.on('ENTITY_DIED', (data: any) => {
                barkSystem.trigger(data.type, 'DEATH', { x: data.x, y: data.y }, data.id);
                if (data.type === 'golgotha') {
                    this.bossesDefeated.add('golgotha');
                }
            });

            this.events.on('NARRATIVE_INTERACTED', (data: any) => {
                this.narrativesRead.add(data.label);
            });

            this.events.on('ZONE_CHANGED', (data: any) => {
                this.handleZoneChange(data.name, data.index);
            });

            this.events.on('LOOT_GAINED', (data: any) => {
                if (data.type === 'vibration' && data.amount > 0) {
                    this.ui.showLootGain(data.x || 400, data.y || 300, data.amount);
                }
            });

            this.events.on('PLAYER_ATTUNED', (data: any) => {
                this.ui.showBark(this.player.x, this.player.y, `RESONANT LEVEL UP: ${data.level}`);
            });

            this.screens = {
                start: this.createScreen('start-screen', '<h1>CHRONOCRYSTAL</h1><p>Press SPACE to Begin</p>'),
                over: this.createScreen('game-over', '<h1>SILENCE</h1><p>The signal is lost.</p><p>Press R to Restart</p>')
            };

            window.addEventListener('keydown', (e) => {
                if (this.state === 'MENU' && e.code === 'Space') {
                    this.startGame();
                }
                if (this.state === 'OVER' && e.code === 'KeyR') {
                    window.location.reload();
                }
            });

            this.map = new ScrapyardMap();

            this.player = null as any;

            requestAnimationFrame((t) => this.loop(t));
            console.log("Game: Initialization successful.");
        } catch (error) {
            console.error("Game: CRITICAL INITIALIZATION ERROR:", error);
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

        this.entityManager.entities = [];

        this.player = new Player(150, 480);
        this.player.state = 'ASLEEP';
        this.entityManager.add(this.player);

        // Re-create the map (clearing any menu-time visual state) and spawn entities
        if (this.map) this.map.destroy();
        this.map = new ScrapyardMap();
        this.map.spawnEntities(this);

        this.camera.follow(this.player);
        if (this.map) {
            this.camera.setBounds(this.map.width, this.map.height);
        }
    }

    handleZoneChange(name: string, _index: number) {
        console.log(`[Game] Switching to ${name}`);
        PersistenceManager.getInstance().save();

        if (this.map) this.map.destroy();

        this.entityManager.entities = this.entityManager.entities.filter(e => e === this.player);
        this.entityManager.enemies = [];
        this.entityManager.narrativeItems = [];

        if (name === "Glass Gardens") {
            this.map = new GlassGardensMap();
        } else if (name === "The Clockwork Arteries") {
            this.map = new ClockworkArteriesMap();
        } else if (name === "The Hushed Halls") {
            this.map = new HushedHallsMap();
        } else if (name === "The Crystal Belfry") {
            this.map = new CrystalBelfryMap();
        } else {
            this.map = new ScrapyardMap();
        }

        // Spawn entities for the new map
        this.map.spawnEntities(this);

        this.camera.setBounds(this.map.width, this.map.height);

        if (this.player.x > 400) {
            this.player.x = 50;
        } else {
            this.player.x = this.map.width - 50;
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

        let dilation = 1.0;
        if (this.player) {
            dilation = ZoneSystem.getInstance().getCurrentTimeDilation(this.player.x, this.player.y);
        }
        const physicsDt = safeDt * dilation;

        this.audio.update(safeDt);
        this.entityManager.update(physicsDt);
        this.particles.update(physicsDt);
        if (this.player) this.loreFX.update(physicsDt, this.player);
        if (this.map) this.map.update(physicsDt, this);

        if (this.player) {
            ZoneSystem.getInstance().checkTransition(this.player.x, this.player.y);
        }

        // --- GRAPHICS UPDATE ---
        this.camera.update();

        // SCROLLING: Update World Layer (SVG) Position
        const worldLayer = document.getElementById('world-layer');
        if (worldLayer) {
            worldLayer.setAttribute('transform', this.camera.getTransform());
        }

        WebGPURenderer.getInstance().render(this.entityManager.entities, this.camera, this.player);

        const bossInstance = this.entityManager.enemies.find(e => e instanceof Golgotha) as Golgotha;
        if (bossInstance) {
            this.ui.updateBossHealth("GOLGOTHA", bossInstance.hp, bossInstance.maxHp);
        } else {
            this.ui.hideBossHealth();
        }

        this.ui.updateResonance(this.player.currentResonance, this.player.maxResonance);
        const prog = ProgressionSystem.getInstance();
        this.ui.updateProgression(prog.level, prog.vibration);

        if (this.player.currentResonance <= 0) {
            this.state = 'OVER';
            this.screens.over.style.display = 'flex';
        }

        requestAnimationFrame((t) => this.loop(t));
    }
}
