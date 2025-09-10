// Health Component - HP management and damage handling
class Health extends Component {
    constructor(maxHealth = 100) {
        super();
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
        this.invulnerable = false;
        this.invulnerabilityTime = 0;
        this.invulnerabilityDuration = 0;
        this.regeneration = 0; // HP per second
        this.lastDamageTime = 0;
        this.damageHistory = [];
        this.onDamageCallbacks = [];
        this.onHealCallbacks = [];
        this.onDeathCallbacks = [];
    }

    update(deltaTime) {
        // Handle invulnerability timer
        if (this.invulnerable && this.invulnerabilityTime > 0) {
            this.invulnerabilityTime -= deltaTime;
            if (this.invulnerabilityTime <= 0) {
                this.invulnerable = false;
            }
        }

        // Handle regeneration
        if (this.regeneration > 0 && this.currentHealth < this.maxHealth) {
            this.heal(this.regeneration * deltaTime);
        }

        // Clean up old damage history (keep last 5 seconds)
        const currentTime = Date.now();
        this.damageHistory = this.damageHistory.filter(
            entry => currentTime - entry.time < 5000
        );
    }

    // Damage handling
    takeDamage(damage, source = null, damageType = 'normal') {
        if (this.invulnerable || this.isDead() || damage <= 0) {
            return false;
        }

        const actualDamage = Math.min(damage, this.currentHealth);
        this.currentHealth -= actualDamage;
        this.lastDamageTime = Date.now();

        // Record damage for statistics
        this.damageHistory.push({
            amount: actualDamage,
            source: source,
            type: damageType,
            time: this.lastDamageTime
        });

        // Trigger damage callbacks
        this.onDamageCallbacks.forEach(callback => {
            try {
                callback(actualDamage, source, damageType);
            } catch (error) {
                console.error('Error in damage callback:', error);
            }
        });

        // Check for death
        if (this.currentHealth <= 0) {
            this.currentHealth = 0;
            this.onDeath(source);
        }

        return true;
    }

    // Healing
    heal(amount) {
        if (this.isDead() || amount <= 0) {
            return false;
        }

        const actualHeal = Math.min(amount, this.maxHealth - this.currentHealth);
        this.currentHealth += actualHeal;

        // Trigger heal callbacks
        this.onHealCallbacks.forEach(callback => {
            try {
                callback(actualHeal);
            } catch (error) {
                console.error('Error in heal callback:', error);
            }
        });

        return actualHeal > 0;
    }

    // Full heal
    fullHeal() {
        const healAmount = this.maxHealth - this.currentHealth;
        this.currentHealth = this.maxHealth;
        
        if (healAmount > 0) {
            this.onHealCallbacks.forEach(callback => {
                try {
                    callback(healAmount);
                } catch (error) {
                    console.error('Error in heal callback:', error);
                }
            });
        }
        
        return healAmount;
    }

    // Invulnerability
    setInvulnerable(duration) {
        this.invulnerable = true;
        this.invulnerabilityTime = duration;
        this.invulnerabilityDuration = duration;
    }

    // Status checks
    isDead() {
        return this.currentHealth <= 0;
    }

    isAlive() {
        return this.currentHealth > 0;
    }

    isCritical(threshold = 0.25) {
        return this.getHealthPercentage() <= threshold;
    }

    isHealthy(threshold = 0.75) {
        return this.getHealthPercentage() >= threshold;
    }

    // Health percentage
    getHealthPercentage() {
        return this.maxHealth > 0 ? this.currentHealth / this.maxHealth : 0;
    }

    // Health modification
    setMaxHealth(newMaxHealth) {
        const ratio = this.getHealthPercentage();
        this.maxHealth = newMaxHealth;
        this.currentHealth = this.maxHealth * ratio;
    }

    increaseMaxHealth(amount) {
        this.maxHealth += amount;
        this.currentHealth += amount; // Also increase current health
    }

    // Death handling
    onDeath(source) {
        this.onDeathCallbacks.forEach(callback => {
            try {
                callback(source);
            } catch (error) {
                console.error('Error in death callback:', error);
            }
        });

        // Emit death event
        if (this.entity && window.gameInstance) {
            EventManager.emit('entity_death', this.entity, source);
        }
    }

    // Callback management
    onDamage(callback) {
        this.onDamageCallbacks.push(callback);
    }

    onHeal(callback) {
        this.onHealCallbacks.push(callback);
    }

    onDeath(callback) {
        this.onDeathCallbacks.push(callback);
    }

    // Damage statistics
    getTotalDamageReceived() {
        return this.damageHistory.reduce((total, entry) => total + entry.amount, 0);
    }

    getRecentDamage(timeWindow = 1000) {
        const currentTime = Date.now();
        return this.damageHistory
            .filter(entry => currentTime - entry.time <= timeWindow)
            .reduce((total, entry) => total + entry.amount, 0);
    }

    getDamageFromSource(source) {
        return this.damageHistory
            .filter(entry => entry.source === source)
            .reduce((total, entry) => total + entry.amount, 0);
    }

    // Serialization
    serialize() {
        return {
            ...super.serialize(),
            maxHealth: this.maxHealth,
            currentHealth: this.currentHealth,
            invulnerable: this.invulnerable,
            invulnerabilityTime: this.invulnerabilityTime,
            regeneration: this.regeneration
        };
    }

    static deserialize(data) {
        const health = new Health(data.maxHealth);
        health.active = data.active !== undefined ? data.active : true;
        health.currentHealth = data.currentHealth || data.maxHealth;
        health.invulnerable = data.invulnerable || false;
        health.invulnerabilityTime = data.invulnerabilityTime || 0;
        health.regeneration = data.regeneration || 0;
        return health;
    }
}
