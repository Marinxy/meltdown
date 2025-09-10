// Event Management System for Arcade Meltdown
class EventManager {
    constructor() {
        this.listeners = new Map();
        this.eventQueue = [];
        this.processing = false;
    }

    // Event Registration
    on(event, callback, context = null) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        
        this.listeners.get(event).push({
            callback,
            context,
            once: false
        });
    }

    once(event, callback, context = null) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        
        this.listeners.get(event).push({
            callback,
            context,
            once: true
        });
    }

    off(event, callback = null, context = null) {
        if (!this.listeners.has(event)) return;

        const listeners = this.listeners.get(event);
        
        if (callback === null) {
            // Remove all listeners for this event
            this.listeners.delete(event);
        } else {
            // Remove specific listener
            for (let i = listeners.length - 1; i >= 0; i--) {
                const listener = listeners[i];
                if (listener.callback === callback && 
                    (context === null || listener.context === context)) {
                    listeners.splice(i, 1);
                }
            }
            
            if (listeners.length === 0) {
                this.listeners.delete(event);
            }
        }
    }

    // Event Emission
    emit(event, ...args) {
        if (!this.listeners.has(event)) return;

        const listeners = this.listeners.get(event).slice(); // Copy to avoid modification during iteration
        const toRemove = [];

        for (let i = 0; i < listeners.length; i++) {
            const listener = listeners[i];
            
            try {
                if (listener.context) {
                    listener.callback.call(listener.context, ...args);
                } else {
                    listener.callback(...args);
                }
            } catch (error) {
                console.error(`Error in event listener for '${event}':`, error);
            }

            if (listener.once) {
                toRemove.push(listener);
            }
        }

        // Remove one-time listeners
        if (toRemove.length > 0) {
            const eventListeners = this.listeners.get(event);
            for (const listener of toRemove) {
                const index = eventListeners.indexOf(listener);
                if (index !== -1) {
                    eventListeners.splice(index, 1);
                }
            }
            
            if (eventListeners.length === 0) {
                this.listeners.delete(event);
            }
        }
    }

    async emitAsync(event, ...args) {
        if (!this.listeners.has(event)) return;

        const listeners = this.listeners.get(event).slice();
        const toRemove = [];
        const promises = [];

        for (const listener of listeners) {
            try {
                let result;
                if (listener.context) {
                    result = listener.callback.call(listener.context, ...args);
                } else {
                    result = listener.callback(...args);
                }

                if (result instanceof Promise) {
                    promises.push(result);
                }

                if (listener.once) {
                    toRemove.push(listener);
                }
            } catch (error) {
                console.error(`Error in async event listener for '${event}':`, error);
            }
        }

        // Wait for all async listeners to complete
        if (promises.length > 0) {
            await Promise.all(promises);
        }

        // Remove one-time listeners
        if (toRemove.length > 0) {
            const eventListeners = this.listeners.get(event);
            for (const listener of toRemove) {
                const index = eventListeners.indexOf(listener);
                if (index !== -1) {
                    eventListeners.splice(index, 1);
                }
            }
            
            if (eventListeners.length === 0) {
                this.listeners.delete(event);
            }
        }
    }

    // Event Queuing
    queue(event, ...args) {
        this.eventQueue.push({ event, args });
    }

    processQueue() {
        if (this.processing) return;
        
        this.processing = true;
        
        while (this.eventQueue.length > 0) {
            const { event, args } = this.eventQueue.shift();
            this.emit(event, ...args);
        }
        
        this.processing = false;
    }

    clearQueue() {
        this.eventQueue.length = 0;
    }

    // Utility methods
    hasListeners(event) {
        return this.listeners.has(event) && this.listeners.get(event).length > 0;
    }

    getListenerCount(event) {
        return this.listeners.has(event) ? this.listeners.get(event).length : 0;
    }

    getAllEvents() {
        return Array.from(this.listeners.keys());
    }

    clear() {
        this.listeners.clear();
        this.clearQueue();
    }
}

// Global event manager instance
window.EventManager = EventManager;
