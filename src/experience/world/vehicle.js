import * as CANNON from "cannon-es";
import * as THREE from "three";
import CannonDebugger from "cannon-es-debugger";
import Controls from "../controls.js";
import Experience from "../index.js";

const ROTOR_MAIN    = "static_rotor_Mat_maverick011_ec1351bmp_0";
const ROTOR_TAIL    = "static_rotor2_Mat_maverick012_ec135bmp_0";
const PICKUP_DIST   = 20;
const DELIVERY_DIST = 12;
const SPAWN_GRACE   = 2.5; // seconds before collision damage is enabled

export default class Vehicle {
    constructor() {
        const exp      = new Experience();
        this.scene     = exp.scene;
        this.resources = exp.resources;
        this.debug     = exp.debug;
        this.world     = exp.world;
        this.camera    = exp.camera;
        this.universe  = exp.universe;

        this._thrust        = new CANNON.Vec3(0, 5, 0);
        this._stableLift    = 14.7;
        this._rotationSpeed = 0;
        this._visualYaw     = 0;   // radians, accumulated manually
        this._yawRate       = 0;   // current yaw angular velocity

        this._camTarget     = new THREE.Vector3();

        this.engineStarted  = false;
        this.health         = 100;
        this._rotors        = {};
        this._clock         = new THREE.Clock();
        this._spawnTime     = null; // set after build so grace timer is accurate

        this.attachedCargo  = null;
        this._eWasDown      = false;
        this.gameManager    = null;
        this._platformPos   = new CANNON.Vec3();

        this.controls       = new Controls();
        this._hitSound      = new Audio("/sounds/hit.mp3");

        if (this.debug.active) {
            this._cannonDebugger = new CannonDebugger(this.scene, this.world, {});
        }

        this._build();
    }

    // ─── Setup ───────────────────────────────────────────────────────────────

    _build() {
        this._buildModel();
        this._buildPhysics();
        this._buildLandingZone();
        this.controls.onStart();
        // Grace starts after everything is constructed
        this._spawnTime = performance.now();
    }

    _buildModel() {
        this._model = this.resources.items.helicopterModel.scene;
        this._model.scale.setScalar(0.6);

        const fp = this.universe.floor.body.position;
        // Floor box half-extent=1 → top surface at fp.y+1
        // Heli body half-extent Y=1 → needs centre at fp.y+1+1+0.3 gap = fp.y+2.3
        this._model.position.set(fp.x, fp.y + 2.3, fp.z);

        this._model.traverse((child) => {
            if (!child.isMesh) return;
            child.castShadow = true;
            if (child.name === ROTOR_MAIN) this._rotors.main = child;
            if (child.name === ROTOR_TAIL) this._rotors.tail = child;
        });

        this.scene.add(this._model);
    }

    _buildPhysics() {
        const sp = this._model.position;

        this._body = new CANNON.Body({ mass: 0.5 });
        this._body.addShape(new CANNON.Box(new CANNON.Vec3(0.7, 1, 2)));
        this._body.position.copy(sp);
        this._body.angularDamping = 1;    // we control rotation ourselves
        this._body.linearDamping  = 0.4;
        this._body.fixedRotation  = true; // never tip — physics can't rotate it
        this._body.updateMassProperties();
        this._body.addEventListener("collide", this._onCollide);
        this.world.addBody(this._body);
    }

    _buildLandingZone() {
        const fp = this.universe.floor.body.position;
        this._platformPos.set(fp.x, fp.y, fp.z);

        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(4, 0.2, 8, 32),
            new THREE.MeshBasicMaterial({ color: 0xffdd00, transparent: true, opacity: 0.7 }),
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.set(fp.x, fp.y + 1.5, fp.z);
        this.scene.add(ring);
        this._landingRing = ring;
    }

    // ─── Collision ───────────────────────────────────────────────────────────

    _onCollide = (event) => {
        // Ignore collisions during spawn grace period
        if (performance.now() - this._spawnTime < SPAWN_GRACE * 1000) return;

        const impact = event.contact.getImpactVelocityAlongNormal();
        if (impact <= 1.7) return;

        this._hitSound.volume      = Math.min(1, Math.random());
        this._hitSound.currentTime = 0;
        this._hitSound.play().catch(() => {});
        this.health = Math.max(0, this.health - impact);
        this._flashDamage();
    };

    _flashDamage() {
        let el = document.getElementById("damage-flash");
        if (!el) {
            el = document.createElement("div");
            el.id = "damage-flash";
            el.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9998;background:rgba(255,30,0,0.35);opacity:0;transition:opacity 0.08s ease-in";
            document.body.appendChild(el);
        }
        el.style.transition = "opacity 0.08s ease-in";
        el.style.opacity = "1";
        clearTimeout(this._flashTimeout);
        this._flashTimeout = setTimeout(() => {
            el.style.transition = "opacity 0.5s ease-out";
            el.style.opacity = "0";
        }, 80);
    }

    // ─── Cargo ───────────────────────────────────────────────────────────────

    _checkPickup(cargos) {
        if (this.attachedCargo) return;
        let nearest = null, nearestDist = PICKUP_DIST;
        for (const cargo of cargos) {
            if (cargo.isDelivered || cargo.isPickedUp) continue;
            const d = this._body.position.distanceTo(cargo.getPosition());
            if (d < nearestDist) { nearestDist = d; nearest = cargo; }
        }
        this.gameManager?.showPickupHint(!!nearest);
        if (nearest && this.controls.keyMap.e && !this._eWasDown) {
            nearest.attachToHelicopter(this._body);
            this.attachedCargo = nearest;
            this.gameManager?.showPickupHint(false);
            this.gameManager?.showDeliverHint(true);
        }
    }

    _checkDelivery() {
        if (!this.attachedCargo?.isPickedUp) return;
        const dist = this._body.position.distanceTo(this._platformPos);
        if (this._landingRing) {
            this._landingRing.material.opacity = 0.4 + Math.sin(Date.now() * 0.004) * 0.3;
        }
        if (dist < DELIVERY_DIST) {
            const cargo = this.attachedCargo;
            this.attachedCargo = null;
            cargo.markDelivered();
            this.gameManager?.showDeliverHint(false);
            this.gameManager?.deliverCargo(100 + Math.floor((DELIVERY_DIST - dist) * 20));
        }
    }

    // ─── Update ──────────────────────────────────────────────────────────────

    update(cargos) {
        const delta = Math.min(this._clock.getDelta(), 0.1);
        if (delta > 0) this.world.step(delta);

        if (this.controls.keyMap.g) this.engineStarted = true;

        if (this.engineStarted && this._rotationSpeed < 40) {
            this._rotationSpeed += 5 * delta;
        }
        if (this.engineStarted && this._rotors.main) {
            this._rotors.main.rotateY(this._rotationSpeed * delta * 2);
        }

        // Sync mesh position from physics body
        this._model.position.copy(this._body.position);

        // Tilt forward when pitching, sideways when strafing — cosmetic only
        const forwardSpeed = -(this._body.velocity.x * Math.sin(this._visualYaw) + this._body.velocity.z * Math.cos(this._visualYaw));
        const strafeSpeed  =  (this._body.velocity.x * Math.cos(this._visualYaw) - this._body.velocity.z * Math.sin(this._visualYaw));
        const tiltPitch = THREE.MathUtils.clamp(-forwardSpeed * 0.04, -0.25, 0.25);
        const tiltRoll  = THREE.MathUtils.clamp(strafeSpeed  * 0.04, -0.2,  0.2);
        this._model.rotation.set(tiltPitch, this._visualYaw, tiltRoll, 'YXZ');

        if (this._cannonDebugger) this._cannonDebugger.update();

        if (this.engineStarted && this._rotationSpeed >= 30) {
            this._applyControls(delta);

            if (cargos?.length) {
                this._checkPickup(cargos);
                if (this.attachedCargo) this._checkDelivery();
            }
        }

        this._eWasDown = !!this.controls.keyMap.e;

        // Respawn if helicopter hits the sea
        if (this._body.position.y < 0) {
            this._respawn();
        }

        this._updateCamera();
        this.scene.updateMatrixWorld();
    }

    _applyControls(delta) {
        // ── Altitude (Y thrust) ──
        if (this.controls.keyMap.w) {
            if (this._thrust.y < 40) this._thrust.y += 5 * delta;
        } else if (this.controls.keyMap.s) {
            if (this._thrust.y > 0)  this._thrust.y -= 5 * delta;
        }

        // ── Yaw (A/D) — rotate the visual model and track _visualYaw ──
        const YAW_SPEED = 1.5; // radians per second
        if (this.controls.keyMap.a) {
            this._yawRate = Math.min(this._yawRate + 4 * delta, YAW_SPEED);
        } else if (this.controls.keyMap.d) {
            this._yawRate = Math.max(this._yawRate - 4 * delta, -YAW_SPEED);
        } else {
            // Dampen back to zero
            if (this._yawRate > 0) this._yawRate = Math.max(0, this._yawRate - 3 * delta);
            if (this._yawRate < 0) this._yawRate = Math.min(0, this._yawRate + 3 * delta);
        }
        this._visualYaw += this._yawRate * delta;

        // ── Forward/back thrust (Arrow Up/Down) — in helicopter's facing direction ──
        const sinYaw = Math.sin(this._visualYaw);
        const cosYaw = Math.cos(this._visualYaw);

        if (this.controls.keyMap.ArrowUp) {
            // Accelerate forward along facing direction
            const speed = 5 * delta;
            this._body.velocity.x -= sinYaw * speed;
            this._body.velocity.z -= cosYaw * speed;
        }
        if (this.controls.keyMap.ArrowDown) {
            const speed = 5 * delta;
            this._body.velocity.x += sinYaw * speed;
            this._body.velocity.z += cosYaw * speed;
        }

        // ── Strafe (Arrow Left/Right) — perpendicular to facing ──
        if (this.controls.keyMap.ArrowLeft) {
            const speed = 5 * delta;
            this._body.velocity.x -= cosYaw * speed;
            this._body.velocity.z += sinYaw * speed;
        }
        if (this.controls.keyMap.ArrowRight) {
            const speed = 5 * delta;
            this._body.velocity.x += cosYaw * speed;
            this._body.velocity.z -= sinYaw * speed;
        }

        // ── Apply vertical thrust in world space ──
        this._body.applyForce(
            new CANNON.Vec3(0, this._thrust.y, 0),
            this._body.position
        );
    }

    _respawn() {
        const fp = this.universe.floor.body.position;
        // Reset physics body to spawn position, zero velocity
        this._body.position.set(fp.x, fp.y + 2.3, fp.z);
        this._body.velocity.set(0, 0, 0);
        this._body.angularVelocity.set(0, 0, 0);
        // Reset controls state
        this._thrust.set(0, 5, 0);
        this._visualYaw = 0;
        this._yawRate   = 0;
        // Drop attached cargo
        if (this.attachedCargo) {
            this.attachedCargo.detach();
            this.attachedCargo = null;
            this.gameManager?.showDeliverHint(false);
        }
        // Reset spawn grace so landing doesn't trigger damage
        this._spawnTime = performance.now();
        // Brief red flash to signal respawn
        this._flashDamage();
    }

    _updateCamera() {
        const p = this._model.position;

        // Camera sits BEHIND and above the helicopter.
        // "Behind" = opposite of where helicopter faces.
        // Facing direction: (-sinYaw, 0, -cosYaw), so behind = (+sinYaw, 0, +cosYaw)
        const BACK  = 8;
        const HEIGHT = 3;

        const tx = p.x + Math.sin(this._visualYaw) * BACK;
        const ty = Math.max(p.y + HEIGHT, 3);
        const tz = p.z + Math.cos(this._visualYaw) * BACK;

        this._camTarget.set(tx, ty, tz);
        this.camera.instance.position.lerp(this._camTarget, 0.07);
        this.camera.instance.lookAt(p.x, p.y + 1, p.z);
    }

    destroy() {
        this.controls.onStop();
        this.world.removeBody(this._body);
        this.scene.remove(this._model);
        if (this._landingRing) this.scene.remove(this._landingRing);
    }
}
