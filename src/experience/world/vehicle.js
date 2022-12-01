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
      d: false
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

    // Debug
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder("helicopter");
      this.cannonDebugger = new CannonDebugger(
        this.scene,
        this.world,
        {}
      );
    }

    // Resource
    this.resource = this.resources.items.helicopterModel;

    this.onCreate();
  }

  onDocumentKey = (e) => {
    this.keyMap[e.key] = e.type === "keydown";
  };

  onCreate() {
    this.model = this.resource.scene;
    this.model.scale.set(this.scale, this.scale, this.scale);
    this.model.position.y = 1;
    this.scene.add(this.model);

    this.model.traverse((child) => {
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
    this.heliBodyShape = new CANNON.Box(new CANNON.Vec3(0.7, 1, 2));
    this.heliBody = new CANNON.Body({ mass: 0.5 });
    this.heliBody.addShape(this.heliBodyShape);
    this.heliBody.position.x = this.model.position.x;
    this.heliBody.position.y = this.model.position.y;
    this.heliBody.position.z = this.model.position.z;
    this.heliBody.angularDamping = 0.9; //so it doesn't pendulum so much
    this.world.addBody(this.heliBody);


    this.rotorShape = new CANNON.Sphere(0.2);
    this.rotorBody = new CANNON.Body({ mass: 1 });
    this.rotorBody.addShape(this.rotorShape);

    this.rotors["ROTOR"].geometry.computeBoundingBox();

    this.boundingBox = this.rotors["ROTOR"].geometry.boundingBox;
    this.position = new THREE.Vector3();
    this.position.subVectors( this.boundingBox.max, this.boundingBox.min );
    this.position.multiplyScalar( 0.5 );
    this.position.add( this.boundingBox.min );
    this.position.applyMatrix4( this.rotors["ROTOR"].matrixWorld );

    this.rotorBody.position.x = this.position.x;
    this.rotorBody.position.y = this.position.y;
    this.rotorBody.position.z = this.position.z;

    console.log(this.position)

    this.rotorBody.linearDamping = 0.5; //simulates auto altitude
    this.world.addBody(this.rotorBody);

    this.rotorConstraint = new CANNON.PointToPointConstraint(
      this.heliBody,
      new CANNON.Vec3(0, 1, 0),
      this.rotorBody,
      new CANNON.Vec3()
    );

    this.rotorConstraint.collideConnected = false;
    this.world.addConstraint(this.rotorConstraint);

    document.addEventListener("keydown", this.onDocumentKey, false);
    document.addEventListener("keyup", this.onDocumentKey, false);

  }

  update = () => {
    this.delta = Math.min(this.clock.getDelta(), 0.1);

    if(this.delta > 0){
      this.world.step(this.delta)
    }

    this.rotors["ROTOR"].rotateY(this.thrust.y * this.delta * 2);

    this.model.position.set(
      this.heliBody.position.x,
      this.heliBody.position.y,
      this.heliBody.position.z
    );
    this.model.quaternion.set(
      this.heliBody.quaternion.x,
      this.heliBody.quaternion.y,
      this.heliBody.quaternion.z,
      this.heliBody.quaternion.w
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


    this.yawing = false
    if (this.keyMap['a']) {
        if (this.rotorBody.angularVelocity.y < 2.0)
            this.rotorBody.angularVelocity.y += 5 * this.delta
        this.yawing = true
    }
    if (this.keyMap['d']) {
        if (this.rotorBody.angularVelocity.y > -2.0)
            this.rotorBody.angularVelocity.y -= 5 * this.delta
        this.yawing = true
    }

    if (!this.yawing) {
      if (this.rotorBody.angularVelocity.y < 0)
        this.rotorBody.angularVelocity.y += 1 * this.delta;
      if (this.rotorBody.angularVelocity.y > 0)
        this.rotorBody.angularVelocity.y -= 1 * this.delta;
    }

    this.heliBody.angularVelocity.y = this.rotorBody.angularVelocity.y;

    this.banking = false
    this.pitching = false;

    if (!this.pitching) {
      if (this.thrust.z < 0) this.thrust.z += 2.5 * this.delta
      if (this.thrust.z > 0) this.thrust.z -= 2.5 * this.delta
  }
  if (!this.banking) {
      if (this.thrust.x < 0) this.thrust.x += 2.5 * this.delta
      if (this.thrust.x > 0) this.thrust.x -= 2.5 * this.delta
  }

    if (!this.climbing && this.model.position.y > 2) {
      this.thrust.y = this.stableLift;
    }

    this.rotorBody.applyForce(this.thrust, new CANNON.Vec3());
  };

  destroy() {
    document.removeEventListener("keydown", onDocumentKey, false);
    document.removeEventListener("keyup", onDocumentKey, false);
  }
}
