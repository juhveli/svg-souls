export abstract class State {
    name: string;
    fsm: StateMachine | null = null;

    constructor(name: string) {
        this.name = name;
    }

    abstract enter(): void;
    abstract exit(): void;
    abstract update(dt: number): void;
}

export class StateMachine {
    currentState: State | null = null;
    states: Map<string, State> = new Map();
    onStateChanged: ((oldName: string, newName: string) => void) | null = null;

    addState(state: State) {
        state.fsm = this;
        this.states.set(state.name, state);
    }

    changeState(limitToStateName: string) {
        const newState = this.states.get(limitToStateName);
        if (!newState) {
            console.warn(`[StateMachine] State '${limitToStateName}' not found.`);
            return;
        }

        const oldName = this.currentState ? this.currentState.name : '';

        if (this.currentState) {
            this.currentState.exit();
        }

        this.currentState = newState;
        this.currentState.enter();

        if (this.onStateChanged) {
            this.onStateChanged(oldName, newState.name);
        }
    }

    update(dt: number) {
        if (this.currentState) {
            this.currentState.update(dt);
        }
    }
}
