import * as CANNON from "cannon-es";
import * as THREE from "three";

import CannonDebugger from "cannon-es-debugger";
import Controls from "../controls.js";
import Experience from "../index.js";

const STATIC_ROTOR_2 = "static_rotor2_Mat_maverick012_ec135bmp_0";
const STATIC_ROTOR = "static_rotor_Mat_maverick011_ec1351bmp_0";

export default class Helicopter {
	constructor() {
		this.engineStarted = false;

		// Physical control
		this.delta = 1;
		this.thrust = new CANNON.Vec3(0, 5, 0);
		this.stableLift = 14.7;
		this.clock = new THREE.Clock();
		this.climbing = false;
		this.yawning = false;
		this.banking = false;
		this.pitching = false;
		this.rotationSpeed = 0;

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
		this.cameraVector = new THREE.Vector3();

		// Resource
		this.resource = this.resources.items.helicopterModel;

		// Debug
		if (this.debug.active) {
			this.debugFolder = this.debug.ui.addFolder("helicopter");
			this.cannonDebugger = new CannonDebugger(this.scene, this.world, {});
		}

		this.controls = new Controls();

		this.onCreate();
	}

	onCreate() {
		this.vehicle = this.resource.scene;
		this.vehicle.scale.set(this.scale, this.scale, this.scale);

		this.vehicle.position.x = this.experience.universe.floor.body.position.x;
		this.vehicle.position.y =
			this.experience.universe.floor.body.position.y + 1.9;
		this.vehicle.position.z = this.experience.universe.floor.body.position.z;

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

		this.rotorPshycialBody.position.x = this.vehicle.position.x;
		this.rotorPshycialBody.position.y = this.vehicle.position.y + 1;
		this.rotorPshycialBody.position.z = this.vehicle.position.z;

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
		this.chaseCamPivot.position.set(0, 3, 10);
		this.chaseCamera.add(this.chaseCamPivot);
		this.scene.add(this.chaseCamera);

		this.vehicle.add(this.chaseCamera);

		// Switch controls on
		this.controls.onStart();
	}

	update = () => {
		this.delta = Math.min(this.clock.getDelta(), 0.1);
		this.cameraDirection = this.experience.camera.instance.getWorldDirection(
			this.cameraVector,
		);

		if (this.delta > 0) {
			this.world.step(this.delta);
		}

		if (this.engineStarted && this.rotationSpeed < 40) {
			this.rotationSpeed += 5 * this.delta;
		}

		if (this.controls.keyMap["g"]) {
			this.engineStarted = true;
		}

		if (this.engineStarted) {
			this.rotors["ROTOR"].rotateY(this.rotationSpeed * this.delta * 2);
		}

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

		if (this.debug.active) {
			this.cannonDebugger.update();
		}

		if (this.engineStarted && this.rotationSpeed >= 30) {
			this.climbing = false;

			if (this.controls.keyMap["w"]) {
				if (this.thrust.y < 40) {
					this.thrust.y += 5 * this.delta;
					this.climbing = true;
				}
			}

			if (this.controls.keyMap["s"]) {
				if (this.thrust.y > 0) {
					this.thrust.y -= 5 * this.delta;
					this.climbing = true;
				}
			}

			this.yawing = false;
			if (this.controls.keyMap["a"]) {
				if (this.rotorPshycialBody.angularVelocity.y < 2.0)
					this.rotorPshycialBody.angularVelocity.y += 5 * this.delta;
				this.yawing = true;
			}
			if (this.controls.keyMap["d"]) {
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
			if (this.controls.keyMap["ArrowUp"]) {
				if (this.thrust.z >= -10.0) {
					this.thrust.z -= 5 * this.delta;
				}
				this.pitching = true;
			}
			if (this.controls.keyMap["ArrowDown"]) {
				if (this.thrust.z <= 10.0) {
					this.thrust.z += 5 * this.delta;
				}
				this.pitching = true;
			}

			this.banking = false;
			if (this.controls.keyMap["ArrowLeft"]) {
				if (this.thrust.x >= -10.0) {
					this.thrust.x -= 5 * this.delta;
				}
				this.banking = true;
			}
			if (this.controls.keyMap["ArrowRight"]) {
				if (this.thrust.x <= 10.0) {
					this.thrust.x += 5 * this.delta;
				}
				this.banking = true;
			}

			if (!this.pitching) {
				if (this.thrust.z < 0) {
					this.thrust.z += 2.5 * this.delta;
				}
				if (this.thrust.z > 0) {
					this.thrust.z -= 2.5 * this.delta;
				}
			}
			if (!this.banking) {
				if (this.thrust.x < 0) {
					this.thrust.x += 2.5 * this.delta;
				}
				if (this.thrust.x > 0) {
					this.thrust.x -= 2.5 * this.delta;
				}
			}

			if (!this.climbing && this.vehicle.position.y > 1000) {
				this.thrust.y = this.stableLift;
			}

			this.rotorPshycialBody.applyLocalForce(this.thrust, new CANNON.Vec3());
		}

		this.experience.camera.instance.lookAt(this.vehicle.position);

		this.chaseCamPivot.getWorldPosition(this.v);

		if (this.v.y < 3) {
			this.v.y = 3;
			this.v.z = 6;
		}

		this.experience.camera.instance.position.lerpVectors(
			this.experience.camera.instance.position,
			this.v,
			0.1,
		);

		this.scene.updateMatrixWorld();
	};

	destroy() {
		this.controls.onStop();
	}
}
