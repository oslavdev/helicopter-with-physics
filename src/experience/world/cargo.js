import * as THREE from "three";
import * as CANNON from "cannon-es";
import Experience from "../index.js";

const ROPE_SEGMENTS  = 8;
const ROPE_LENGTH    = 6;   // metres (DistanceConstraint)
const ROPE_COLOR     = 0xc8a050;
const INDICATOR_COLOR = 0x4fffb0;

export default class Cargo {
    constructor(index = 0) {
        const exp      = new Experience();
        this.scene     = exp.scene;
        this.world     = exp.world;
        this.resources = exp.resources;

        this.index       = index;
        this.isPickedUp  = false;
        this.isDelivered = false;

        // Unique per-cargo bob variation
        this._bobOffset = Math.random() * Math.PI * 2;
        this._bobSpeed  = 0.6 + Math.random() * 0.4;

        this._ropeLine        = null;
        this._ropePoints      = null;
        this._ropeConstraint  = null;
        this._helicopterBody  = null;

        this._build();
    }

    // ─── Setup ───────────────────────────────────────────────────────────────

    _build() {
        this._buildModel();
        this._buildPhysics();
        this._buildIndicator();
    }

    _buildModel() {
        // Clone so each cargo instance is independent
        this._model = this.resources.items.cargoModel.scene.clone();
        this._model.scale.setScalar(0.08);

        const { x, z } = this._randomSeaPosition();
        this._model.position.set(x, 0.5, z);
        this._spawnX = x;
        this._spawnZ = z;

        this._model.traverse((child) => {
            if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
        });

        this.scene.add(this._model);
    }

    _buildPhysics() {
        this._body = new CANNON.Body({
            mass:           0.5,   // very light — helicopter can lift it easily
            linearDamping:  0.95,  // high drag so it doesn't swing wildly
            angularDamping: 0.99,
        });
        this._body.addShape(new CANNON.Box(new CANNON.Vec3(1.2, 0.8, 1.2)));
        this._body.position.set(this._spawnX, 0.5, this._spawnZ);
        this.world.addBody(this._body);
    }

    _buildIndicator() {
        this._indicator = new THREE.Mesh(
            new THREE.TorusGeometry(2.5, 0.12, 8, 32),
            new THREE.MeshBasicMaterial({ color: INDICATOR_COLOR, transparent: true, opacity: 0.8 }),
        );
        this._indicator.rotation.x = Math.PI / 2;
        this._syncIndicator();
        this.scene.add(this._indicator);
    }

    _randomSeaPosition() {
        const angle = Math.random() * Math.PI * 2;
        const dist  = 30 + Math.random() * 80;
        return { x: Math.cos(angle) * dist, z: Math.sin(angle) * dist };
    }

    // ─── Public API ──────────────────────────────────────────────────────────

    /** Called by Vehicle when E is pressed near this cargo. */
    attachToHelicopter(helicopterBody) {
        if (this.isPickedUp || this.isDelivered) return;
        this.isPickedUp       = true;
        this._helicopterBody  = helicopterBody;

        this._body.linearDamping  = 0.7;
        this._body.angularDamping = 0.99;

        this._ropeConstraint = new CANNON.DistanceConstraint(helicopterBody, this._body, ROPE_LENGTH);
        this.world.addConstraint(this._ropeConstraint);

        this._buildRope();
        this._indicator.visible = false;
    }

    /** Called when the helicopter moves away without delivering. */
    detach() {
        if (!this.isPickedUp) return;
        this.isPickedUp = false;
        this._removeConstraint();
        this._destroyRope();
        this._body.linearDamping  = 0.8;
        this._body.angularDamping = 0.9;
        this._indicator.visible   = true;
    }

    /** Called by Vehicle on successful platform landing. */
    markDelivered() {
        this.isDelivered = true;
        this.isPickedUp  = false;
        this._removeConstraint();
        this._destroyRope();
        this._indicator.visible = false;
        this._fadeAndRemove();
    }

    getPosition() {
        return this._body.position;
    }

    // ─── Per-frame update ────────────────────────────────────────────────────

    update(elapsed) {
        if (this.isDelivered) return;

        if (!this.isPickedUp) {
            // Realistic-ish sea buoyancy: sine bob + gentle rotation sway
            const bob  = Math.sin(elapsed * this._bobSpeed + this._bobOffset) * 0.2;
            const sway = Math.sin(elapsed * 0.4          + this._bobOffset) * 0.04;
            this._body.position.y = 0.5 + bob;
            this._body.quaternion.setFromEuler(sway, 0, sway * 0.7);
            this._syncIndicator(elapsed);
        }

        // Sync mesh → physics
        this._model.position.copy(this._body.position);
        this._model.quaternion.copy(this._body.quaternion);

        this._updateRope();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    _syncIndicator(elapsed = 0) {
        const pos = this._body.position;
        this._indicator.position.set(pos.x, pos.y + 4, pos.z);
        this._indicator.rotation.z += 0.02;
        if (elapsed) {
            this._indicator.material.opacity = 0.4 + Math.sin(elapsed * 2 + this._bobOffset) * 0.3;
        }
    }

    _buildRope() {
        this._ropePoints = Array.from({ length: ROPE_SEGMENTS + 1 }, () => new THREE.Vector3());
        this._ropeLine = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(this._ropePoints),
            new THREE.LineBasicMaterial({ color: ROPE_COLOR }),
        );
        this.scene.add(this._ropeLine);
    }

    _destroyRope() {
        if (!this._ropeLine) return;
        this._ropeLine.geometry.dispose();
        this.scene.remove(this._ropeLine);
        this._ropeLine   = null;
        this._ropePoints = null;
    }

    _updateRope() {
        if (!this._ropeLine || !this._helicopterBody) return;

        const h = this._helicopterBody.position;
        const c = this._body.position;

        for (let i = 0; i <= ROPE_SEGMENTS; i++) {
            const t   = i / ROPE_SEGMENTS;
            const sag = Math.sin(t * Math.PI) * 1.5; // catenary-ish droop
            this._ropePoints[i].set(
                h.x + (c.x - h.x) * t,
                h.y + (c.y - h.y) * t - sag,
                h.z + (c.z - h.z) * t,
            );
        }
        this._ropeLine.geometry.setFromPoints(this._ropePoints);
    }

    _removeConstraint() {
        if (!this._ropeConstraint) return;
        this.world.removeConstraint(this._ropeConstraint);
        this._ropeConstraint = null;
    }

    _fadeAndRemove() {
        let opacity = 1;
        const mat = [];
        this._model.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material = child.material.clone();
                child.material.transparent = true;
                mat.push(child.material);
            }
        });

        const fade = setInterval(() => {
            opacity -= 0.05;
            for (const m of mat) m.opacity = Math.max(0, opacity);
            if (opacity <= 0) {
                clearInterval(fade);
                this.scene.remove(this._model);
            }
        }, 50);
    }

    destroy() {
        this._removeConstraint();
        this._destroyRope();
        if (this._body) this.world.removeBody(this._body);
        this.scene.remove(this._model);
        if (this._indicator) this.scene.remove(this._indicator);
    }
}
