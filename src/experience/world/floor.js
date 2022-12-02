import * as CANNON from "cannon-es";
import * as THREE from "three";

import Experience from "../index.js";

export default class Floor {
	constructor() {
		this.experience = new Experience();
		this.scene = this.experience.scene;
		this.resources = this.experience.resources;

		this.setGeometry();
		this.setTextures();
		this.setMaterial();
		this.setMesh();
		this.setPhysicalBody();
	}

	setGeometry() {
		this.geometry = new THREE.CircleGeometry(25, 64);
	}

	setTextures() {
		this.textures = {};

		this.textures.color = this.resources.items.grassColorTexture;
		this.textures.color.encoding = THREE.sRGBEncoding;
		this.textures.color.repeat.set(1.5, 1.5);
		this.textures.color.wrapS = THREE.RepeatWrapping;
		this.textures.color.wrapT = THREE.RepeatWrapping;

		this.textures.normal = this.resources.items.grassNormalTexture;
		this.textures.normal.repeat.set(1.5, 1.5);
		this.textures.normal.wrapS = THREE.RepeatWrapping;
		this.textures.normal.wrapT = THREE.RepeatWrapping;
	}

	setMaterial() {
		this.material = new THREE.MeshStandardMaterial({
			map: this.textures.color,
			normalMap: this.textures.normal,
		});
	}

	setMesh() {
		this.mesh = new THREE.Mesh(this.geometry, this.material);
		this.mesh.rotation.x = -Math.PI * 0.5;
		this.mesh.receiveShadow = true;
		this.scene.add(this.mesh);
	}

	setPhysicalBody() {
		this.groundMaterial = new CANNON.Material("groundMaterial");
		this.groundMaterial.friction = 0.25;
		this.groundMaterial.restitution = 0.25;

		this.shape = new CANNON.Box(new CANNON.Vec3(50, 1, 50));
		this.body = new CANNON.Body({ mass: 0, material: this.groundMaterial });
		this.body.addShape(this.shape);
		this.body.position.set(0, -1, 0);

		this.experience.world.addBody(this.body);
	}
}
