// Base System Class for Entity-Component-System
class System {
    constructor() {
        this.entities = new Set();
        this.requiredComponents = [];
        this.priority = 0;
        this.active = true;
        this.name = this.constructor.name;
    }

    // Entity Management
    addEntity(entity) {
        if (this.hasRequiredComponents(entity)) {
            this.entities.add(entity);
            this.onEntityAdded(entity);
        }
    }

    removeEntity(entity) {
        if (this.entities.has(entity)) {
            this.entities.delete(entity);
            this.onEntityRemoved(entity);
        }
    }

    hasRequiredComponents(entity) {
        return this.requiredComponents.every(componentType => 
            entity.hasComponent(componentType)
        );
    }

    // System Lifecycle - override in subclasses
    init() {
        // Override in subclasses
    }

    update(deltaTime) {
        if (!this.active) return;
        
        for (const entity of this.entities) {
            if (entity.active) {
                this.updateEntity(entity, deltaTime);
            }
        }
    }

    render(ctx) {
        if (!this.active) return;
        
        for (const entity of this.entities) {
            if (entity.active) {
                this.renderEntity(entity, ctx);
            }
        }
    }

    // Entity-specific processing - override in subclasses
    updateEntity(entity, deltaTime) {
        // Override in subclasses
    }

    renderEntity(entity, ctx) {
        // Override in subclasses
    }

    // Event handlers - override in subclasses
    onEntityAdded(entity) {
        // Override in subclasses
    }

    onEntityRemoved(entity) {
        // Override in subclasses
    }

    // Utility methods
    getEntitiesByTag(tag) {
        return Array.from(this.entities).filter(entity => entity.hasTag(tag));
    }

    getEntitiesWithComponent(componentType) {
        return Array.from(this.entities).filter(entity => entity.hasComponent(componentType));
    }

    getEntityCount() {
        return this.entities.size;
    }

    clear() {
        this.entities.clear();
    }

    destroy() {
        this.clear();
        this.active = false;
    }
}
