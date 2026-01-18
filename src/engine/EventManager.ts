type EventHandler<T = any> = (data: T) => void;

export class EventManager {
    private static instance: EventManager;
    private listeners: Map<string, EventHandler[]> = new Map();

    private constructor() {
        (window as any).EventManager = this;
    }

    static getInstance(): EventManager {
        if (!EventManager.instance) {
            EventManager.instance = new EventManager();
        }
        return EventManager.instance;
    }

    on<T>(event: string, handler: EventHandler<T>) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(handler);
    }

    off<T>(event: string, handler: EventHandler<T>) {
        const handlers = this.listeners.get(event);
        if (handlers) {
            this.listeners.set(event, handlers.filter(h => h !== handler));
        }
    }

    emit<T>(event: string, data: T) {
        const handlers = this.listeners.get(event);
        if (handlers) {
            // Clone array to prevent modification during iteration
            [...handlers].forEach(h => {
                try {
                    h(data);
                } catch (e) {
                    console.error(`[EventManager] Error in handler for '${event}':`, e);
                }
            });
        }
    }
}
