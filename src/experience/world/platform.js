import * as CANNON from "cannon-es";
import * as THREE from "three";

import Experience from "../index.js";

export default class Platform {
	constructor() {
		this.experience = new Experience();
		this.world = this.experience.world;
		this.scene = this.experience.scene;
		this.resources = this.experience.resources;
		this.resource = this.resources.items.oilPlatformModel;
		this.platformBody = new CANNON.Body({ mass: 1 });

		this.scale = 0.6;

		this.onCreate();
	}

	onCreate() {
		this.platform = this.resource.scene;
		this.platform.scale.set(this.scale, this.scale, this.scale);
		this.platform.position.y = -90;

		this.platform.traverse((child) => {
			// console.log(child)
			if (child.geometry) {
				const pos = child.geometry.attributes.position;
				const vertex = new THREE.Vector3().fromBufferAttribute(pos, 0);

				// this.world.addBody(physcialBody)
			}
		});

		// for (let i = 0; i < this.vertexes.length; i++) {
		//   const rawVertices = bunny[i].vertices
		//   const rawFaces = bunny[i].faces
		//   const rawOffset = bunny[i].offset

		//   // Get vertices
		//   const vertices = []
		//   for (let j = 0; j < rawVertices.length; j += 3) {
		//     vertices.push(new CANNON.Vec3(rawVertices[j], rawVertices[j + 1], rawVertices[j + 2]))
		//   }

		//   // Get faces
		//   const faces = []
		//   for (let j = 0; j < rawFaces.length; j += 3) {
		//     faces.push([rawFaces[j], rawFaces[j + 1], rawFaces[j + 2]])
		//   }

		//   // Get offset
		//   const offset = new CANNON.Vec3(rawOffset[0], rawOffset[1], rawOffset[2])

		//   // Construct polyhedron
		//   const bunnyPart = new CANNON.ConvexPolyhedron({ vertices, faces })

		//   // Add to compound
		//   bunnyBody.addShape(bunnyPart, offset)
		// }

		// // Create body
		// bunnyBody.quaternion.setFromEuler(Math.PI, 0, 0)
		// world.addBody(bunnyBody)

		this.scene.add(this.platform);
	}
}
