import { Entity } from './Entity';
import { Player } from './Player';
import { UIManager } from '../ui/UIManager';
import { InputSystem } from '../engine/InputSystem';
import { NPCDatabase } from '../systems/NPCDatabase';

export class NPCEntity extends Entity {
    private name: string = "Unknown";
    private dialogueLines: string[] = [];
    private currentLine: number = 0;
    private interactRadius: number = 50;
    private target: Player;
    private canInteract: boolean = true;
    private interactCooldown: number = 0;
    private npcID: string;
    private dataLoaded: boolean = false;

    constructor(x: number, y: number, id: string, target: Player) {
        super(x, y);
        this.target = target;
        this.npcID = id;

        this.loadData();
    }

    private loadData() {
        const db = NPCDatabase.getInstance();
        const data = db.get(this.npcID);

        if (data) {
            this.name = data.name;
            this.dialogueLines = data.dialogue;
            this.typeID = data.typeID;
            this.dataLoaded = true;
        } else {
            this.name = "Unknown";
            this.dialogueLines = ["..."];
            this.typeID = 0;
            this.dataLoaded = false;
        }
    }

    update(dt: number) {
        if (!this.dataLoaded) {
            this.loadData();
        }

        // Cooldown management
        if (this.interactCooldown > 0) {
            this.interactCooldown -= dt;
            if (this.interactCooldown <= 0) {
                this.canInteract = true;
            }
        }

        // Distance check
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const inRange = dist < this.interactRadius;

        // Interaction
        if (inRange && this.canInteract) {
            const input = InputSystem.getInstance();
            if (input.isKeyDown('KeyE')) {
                this.interact();
            }
        }
    }

    private interact() {
        if (this.dialogueLines.length === 0) return;

        // Show current line
        const line = this.dialogueLines[this.currentLine];
        UIManager.getInstance().showBark(this.x, this.y - 20, `${this.name}: "${line}"`);

        // Advance dialogue
        this.currentLine = (this.currentLine + 1) % this.dialogueLines.length;

        // Cooldown to prevent spam
        this.canInteract = false;
        this.interactCooldown = 1.0; // 1 second between interactions
    }
}
