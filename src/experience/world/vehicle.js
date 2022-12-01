import * as CANNON from "cannon-es";
import * as THREE from "three";

import CannonDebugger from "cannon-es-debugger";
import Experience from "../index.js";

const STATIC_ROTOR_2 = "static_rotor2_Mat_maverick012_ec135bmp_0";
const STATIC_ROTOR = "static_rotor_Mat_maverick011_ec1351bmp_0";

export default class Helicopter {
	constructor() {
		// Key controller
		this.keyMap = {
			w: false,
			s: false,
			a: false,
			d: false,
			ArrowUp: false,
			ArrowDown: false,
			ArrowLeft: false,
			ArrowRight: false,
		};

		// Physical control
		this.delta = 1;
		this.thrust = new CANNON.Vec3(0, 0, 0);
		this.stableLift = 14.7;
		this.clock = new THREE.Clock();
		this.climbing = false;
		this.yawning = false;
		this.banking = false;
		this.pitching = false;

		// Model settings
		this.rotors = {};
		this.experience = new Experience();
		this.scene = this.experience.scene;
		this.resources = this.experience.resources;
		this.time = this.experience.time;
		this.debug = this.experience.debug;
		this.world = this.experience.world;
		this.scale = 0.6;

		// Camera
		this.chaseCamera = new THREE.Object3D();
		this.chaseCamPivot = new THREE.Object3D();
		this.v = new THREE.Vector3();
		this.v.z = 8;
		this.v.y = 4;

		// Debug
		if (this.debug.active) {
			this.debugFolder = this.debug.ui.addFolder("helicopter");
			this.cannonDebugger = new CannonDebugger(this.scene, this.world, {});
		}

		// Resource
		this.resource = this.resources.items.helicopterModel;

		this.onCreate();
	}

	onDocumentKey = (e) => {
		this.keyMap[e.key] = e.type === "keydown";
	};

	onCreate() {
		this.vehicle = this.resource.scene;
		this.vehicle.scale.set(this.scale, this.scale, this.scale);
		this.vehicle.position.y = 1;
		this.scene.add(this.vehicle);

		this.vehicle.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				child.castShadow = true;

				if (child.name === STATIC_ROTOR_2) {
					this.rotors["ROTOR_2"] = child;
				}

				if (child.name === STATIC_ROTOR) {
					this.rotors["ROTOR"] = child;
				}
			}
		});

		// Apply physical object to helicopter model
		this.vehiclePhysicalBodyShape = new CANNON.Box(new CANNON.Vec3(0.7, 1, 2));
		this.vehiclePhysicalBody = new CANNON.Body({ mass: 0.5 });
		this.vehiclePhysicalBody.addShape(this.vehiclePhysicalBodyShape);
		this.vehiclePhysicalBody.position.x = this.vehicle.position.x;
		this.vehiclePhysicalBody.position.y = this.vehicle.position.y;
		this.vehiclePhysicalBody.position.z = this.vehicle.position.z;
		this.vehiclePhysicalBody.angularDamping = 0.9; //so it doesn't pendulum so much
		this.world.addBody(this.vehiclePhysicalBody);

		this.rotorShape = new CANNON.Sphere(0.2);
		this.rotorPshycialBody = new CANNON.Body({ mass: 1 });
		this.rotorPshycialBody.addShape(this.rotorShape);

		this.rotors["ROTOR"].geometry.computeBoundingBox();

		this.boundingBox = this.rotors["ROTOR"].geometry.boundingBox;
		this.position = new THREE.Vector3();
		this.position.subVectors(this.boundingBox.max, this.boundingBox.min);
		this.position.multiplyScalar(0.5);
		this.position.add(this.boundingBox.min);
		this.position.applyMatrix4(this.rotors["ROTOR"].matrixWorld);

		this.rotorPshycialBody.position.x = this.position.x;
		this.rotorPshycialBody.position.y = this.position.y;
		this.rotorPshycialBody.position.z = this.position.z;

		this.rotorPshycialBody.linearDamping = 0.5; //simulates auto altitude
		this.world.addBody(this.rotorPshycialBody);

		this.rotorConstraint = new CANNON.PointToPointConstraint(
			this.vehiclePhysicalBody,
			new CANNON.Vec3(0, 1, 0),
			this.rotorPshycialBody,
			new CANNON.Vec3(),
		);

		this.rotorConstraint.collideConnected = false;
		this.world.addConstraint(this.rotorConstraint);

		this.chaseCamera.position.set(0, 0, 0);
		this.chaseCamPivot.position.set(0, 2, 4);
		this.chaseCamera.add(this.chaseCamPivot);
		this.scene.add(this.chaseCamera);

		this.vehicle.add(this.chaseCamera);

		document.addEventListener("keydown", this.onDocumentKey, false);
		document.addEventListener("keyup", this.onDocumentKey, false);
	}

	update = () => {
		this.delta = Math.min(this.clock.getDelta(), 0.1);

		if (this.delta > 0) {
			this.world.step(this.delta);
		}

		this.rotors["ROTOR"].rotateY(this.thrust.y * this.delta * 2);

		this.vehicle.position.set(
			this.vehiclePhysicalBody.position.x,
			this.vehiclePhysicalBody.position.y,
			this.vehiclePhysicalBody.position.z,
		);
		this.vehicle.quaternion.set(
			this.vehiclePhysicalBody.quaternion.x,
			this.vehiclePhysicalBody.quaternion.y,
			this.vehiclePhysicalBody.quaternion.z,
			this.vehiclePhysicalBody.quaternion.w,
		);

		this.climbing = false;
		if (this.debug.active) {
			this.cannonDebugger.update();
		}

		if (this.keyMap["w"]) {
			if (this.thrust.y < 40) {
				this.thrust.y += 5 * this.delta;
				this.climbing = true;
			}
		}

		if (this.keyMap["s"]) {
			if (this.thrust.y > 0) {
				this.thrust.y -= 5 * this.delta;
				this.climbing = true;
			}
		}

		this.yawing = false;
		if (this.keyMap["a"]) {
			if (this.rotorPshycialBody.angularVelocity.y < 2.0)
				this.rotorPshycialBody.angularVelocity.y += 5 * this.delta;
			this.yawing = true;
		}
		if (this.keyMap["d"]) {
			if (this.rotorPshycialBody.angularVelocity.y > -2.0)
				this.rotorPshycialBody.angularVelocity.y -= 5 * this.delta;
			this.yawing = true;
		}

		if (!this.yawing) {
			if (this.rotorPshycialBody.angularVelocity.y < 0)
				this.rotorPshycialBody.angularVelocity.y += 1 * this.delta;
			if (this.rotorPshycialBody.angularVelocity.y > 0)
				this.rotorPshycialBody.angularVelocity.y -= 1 * this.delta;
		}

		this.vehiclePhysicalBody.angularVelocity.y =
			this.rotorPshycialBody.angularVelocity.y;

		this.pitching = false;
		if (this.keyMap["ArrowUp"]) {
			if (this.thrust.z >= -10.0) {this.thrust.z -= 5 * this.delta};
			this.pitching = true;
		}
		if (this.keyMap["ArrowDown"]) {
			if (this.thrust.z <= 10.0) {this.thrust.z += 5 * this.delta};
			this.pitching = true;
		}

		this.banking = false;
		if (this.keyMap["ArrowLeft"]) {
			if (this.thrust.x >= -10.0) {this.thrust.x -= 5 * this.delta};
			this.banking = true;
		}
		if (this.keyMap["ArrowRight"]) {
			if (this.thrust.x <= 10.0) {this.thrust.x += 5 * this.delta};
			this.banking = true;
		}

		if (!this.pitching) {
			if (this.thrust.z < 0) {this.thrust.z += 2.5 * this.delta};
			if (this.thrust.z > 0) {this.thrust.z -= 2.5 * this.delta};
		}
		if (!this.banking) {
			if (this.thrust.x < 0) {this.thrust.x += 2.5 * this.delta};
			if (this.thrust.x > 0) {this.thrust.x -= 2.5 * this.delta};
		}

		if (!this.climbing && this.vehicle.position.y > 2) {
			this.thrust.y = this.stableLift;
		}

		this.rotorPshycialBody.applyForce(this.thrust, new CANNON.Vec3());

		this.experience.camera.instance.lookAt(this.vehicle.position);

		this.chaseCamPivot.getWorldPosition(this.v);
		if (this.v.y < 3 || this.v.y > 5) {
			this.v.y = 3;
		}

		if (this.v.z < 6 || this.v.z > 8) {
			this.v.z = 6;
		}

		this.experience.camera.instance.position.lerpVectors(
			this.experience.camera.instance.position,
			this.v,
			0.05,
		);
	};

	destroy() {
		document.removeEventListener("keydown", onDocumentKey, false);
		document.removeEventListener("keyup", onDocumentKey, false);
	}
}
