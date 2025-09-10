// Entity-Component-System Base Entity Class
class Entity {
    constructor(id = null) {
        this.id = id || this.generateId();
        this.active = true;
        this.components = new Map();
        this.tags = new Set();
        this.transform = null; // Cache transform component for performance
    }

    generateId() {
        return 'entity_' + Math.random().toString(36).substr(2, 9);
    }

    // Component Management
    addComponent(component) {
        const componentType = component.constructor.name;
        this.components.set(componentType, component);
        component.entity = this;
        
        // Cache transform component for performance
        if (componentType === 'Transform') {
            this.transform = component;
        }
        
        return this;
    }

    removeComponent(componentType) {
        const component = this.components.get(componentType);
        if (component) {
            component.entity = null;
            this.components.delete(componentType);
            
            // Clear transform cache
            if (componentType === 'Transform') {
                this.transform = null;
            }
        }
        return this;
    }

    getComponent(componentType) {
        if (typeof componentType === 'string') {
            return this.components.get(componentType);
        }
        // If passed a constructor function
        return this.components.get(componentType.name);
    }

    hasComponent(componentType) {
        if (typeof componentType === 'string') {
            return this.components.has(componentType);
        }
        return this.components.has(componentType.name);
    }

    hasAllComponents(componentTypes) {
        return componentTypes.every(type => this.hasComponent(type));
    }

    hasAnyComponent(componentTypes) {
        return componentTypes.some(type => this.hasComponent(type));
    }

    // Tag Management
    addTag(tag) {
        this.tags.add(tag);
        return this;
    }

    removeTag(tag) {
        this.tags.delete(tag);
        return this;
    }

    hasTag(tag) {
        return this.tags.has(tag);
    }

    hasAllTags(tags) {
        return tags.every(tag => this.tags.has(tag));
    }

    hasAnyTag(tags) {
        return tags.some(tag => this.tags.has(tag));
    }

    // Lifecycle
    update(deltaTime) {
        if (!this.active) return;
        
        for (const component of this.components.values()) {
            if (component.update && component.active) {
                component.update(deltaTime);
            }
        }
    }

    render(ctx) {
        if (!this.active) return;
        
        for (const component of this.components.values()) {
            if (component.render && component.active) {
                component.render(ctx);
            }
        }
    }

    destroy() {
        // Notify all components they're being destroyed
        for (const component of this.components.values()) {
            if (component.onDestroy) {
                component.onDestroy();
            }
            component.entity = null;
        }
        
        this.components.clear();
        this.tags.clear();
        this.active = false;
        this.transform = null;
    }

    // Convenience methods for common operations
    getPosition() {
        return this.transform ? { x: this.transform.x, y: this.transform.y } : { x: 0, y: 0 };
    }

    setPosition(x, y) {
        if (this.transform) {
            this.transform.x = x;
            this.transform.y = y;
        }
        return this;
    }

    getRotation() {
        return this.transform ? this.transform.rotation : 0;
    }

    setRotation(rotation) {
        if (this.transform) {
            this.transform.rotation = rotation;
        }
        return this;
    }

    // Serialization
    serialize() {
        const data = {
            id: this.id,
            active: this.active,
            tags: Array.from(this.tags),
            components: {}
        };

        for (const [type, component] of this.components) {
            if (component.serialize) {
                data.components[type] = component.serialize();
            }
        }

        return data;
    }

    static deserialize(data, componentRegistry) {
        const entity = new Entity(data.id);
        entity.active = data.active;
        
        // Restore tags
        if (data.tags) {
            data.tags.forEach(tag => entity.addTag(tag));
        }

        // Restore components
        if (data.components && componentRegistry) {
            for (const [type, componentData] of Object.entries(data.components)) {
                const ComponentClass = componentRegistry.get(type);
                if (ComponentClass && ComponentClass.deserialize) {
                    const component = ComponentClass.deserialize(componentData);
                    entity.addComponent(component);
                }
            }
        }

        return entity;
    }

    // Debug information
    toString() {
        const componentTypes = Array.from(this.components.keys());
        const tagList = Array.from(this.tags);
        return `Entity(${this.id}) - Components: [${componentTypes.join(', ')}] - Tags: [${tagList.join(', ')}]`;
    }
}
