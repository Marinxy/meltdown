// Base Component Class for Entity-Component-System
class Component {
    constructor() {
        this.entity = null;
        this.active = true;
        this.initialized = false;
    }

    // Lifecycle methods - override in subclasses
    init() {
        this.initialized = true;
    }

    update(deltaTime) {
        // Override in subclasses
    }

    render(ctx) {
        // Override in subclasses
    }

    onDestroy() {
        // Override in subclasses for cleanup
    }

    // Utility methods
    getEntity() {
        return this.entity;
    }

    getComponent(componentType) {
        return this.entity ? this.entity.getComponent(componentType) : null;
    }

    hasComponent(componentType) {
        return this.entity ? this.entity.hasComponent(componentType) : false;
    }

    // Serialization - override in subclasses if needed
    serialize() {
        return {
            active: this.active
        };
    }

    static deserialize(data) {
        const component = new this();
        component.active = data.active !== undefined ? data.active : true;
        return component;
    }
}
