import * as THREE from "three";

import Experience from "../index.js";

const STATIC_ROTOR_2 = "static_rotor2_Mat_maverick012_ec135bmp_0";
const STATIC_ROTOR = "static_rotor_Mat_maverick011_ec1351bmp_0";

export default class Helicopter {
  constructor() {
      
    // Key controller
    this.keyMap = {
        "w":false,
        "s":false
    }

    // Physical control
    this.delta = 0;
    this.thrust = { y:0, x: 1, z: 1 }
    this.clock = new THREE.Clock()
    this.climbing = false

    // Model settings
    this.rotors = {};
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;
    this.time = this.experience.time;
    this.debug = this.experience.debug;
    this.scale = 0.6;

    // Debug
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder("helicopter");
    }

    // Resource
    this.resource = this.resources.items.helicopterModel;

    this.onCreate();
  }

  onDocumentKey = (e) => {
    this.keyMap[e.key] = e.type === "keydown";
  }

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

    document.addEventListener("keydown", this.onDocumentKey, false);
    document.addEventListener("keyup", this.onDocumentKey, false);
  }

  update = () => {

   
    this.delta = Math.min(this.clock.getDelta(), 0.1)

    this.rotors["ROTOR"].rotateY(this.thrust.y * this.delta * 2);

    if (this.keyMap["w"]) {
        if (this.thrust.y < 40) {
            this.thrust.y += 5 * this.delta
            this.climbing = true
        }
    }
    
    if (this.keyMap["s"]) {
        if (this.thrust.y > 0) {
            this.thrust.y -= 5 * this.delta
            this.climbing = true
        }
    }
  }

  destroy() {
    document.removeEventListener("keydown", onDocumentKey, false);
    document.removeEventListener("keyup", onDocumentKey, false);
  }
}
