// Weapon Manager - Handles weapon creation and management
class WeaponManager {
    constructor() {
        this.weaponClasses = {
            'flamethrower': Flamethrower,
            'smg': SMG,
            'shotgun': Shotgun,
            'heal_beam': HealBeam
        };
    }

    createWeapon(weaponType, owner) {
        const WeaponClass = this.weaponClasses[weaponType];
        if (!WeaponClass) {
            console.warn(`Unknown weapon type: ${weaponType}`);
            return null;
        }
        
        return new WeaponClass(owner);
    }

    getWeaponForPlayerClass(playerClass) {
        const weaponMap = {
            'heavy': 'flamethrower',
            'scout': 'smg',
            'engineer': 'shotgun',
            'medic': 'heal_beam'
        };
        
        return weaponMap[playerClass] || 'smg';
    }

    // Get weapon stats for UI display
    getWeaponStats(weaponType) {
        const tempWeapon = this.createWeapon(weaponType, null);
        if (!tempWeapon) return null;
        
        return {
            damage: tempWeapon.damage,
            fireRate: tempWeapon.fireRate,
            range: tempWeapon.range,
            spread: tempWeapon.spread,
            ammo: tempWeapon.maxAmmo,
            reloadTime: tempWeapon.reloadTime
        };
    }

    // Register custom weapon types
    registerWeapon(name, weaponClass) {
        this.weaponClasses[name] = weaponClass;
    }
}

// Global weapon manager instance
window.weaponManager = new WeaponManager();
