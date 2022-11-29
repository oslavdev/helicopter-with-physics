import * as THREE from 'three'

import Experience from '../index.js'

const STATIC_ROTOR_2 = 'static_rotor2_Mat_maverick012_ec135bmp_0'
const STATIC_ROTOR = 'static_rotor_Mat_maverick011_ec1351bmp_0'

export default class Helicopter
{
    constructor()
    {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.time = this.experience.time
        this.debug = this.experience.debug
        this.rotors = {}
        this.scale = 0.6

        // Debug
        if(this.debug.active)
        {
            this.debugFolder = this.debug.ui.addFolder('helicopter')
        }

        // Resource
        this.resource = this.resources.items.helicopterModel

        this.setModel()
    }

    setModel()
    {
        this.model = this.resource.scene
        this.model.scale.set(this.scale, this.scale, this.scale)
        this.model.position.y = 1
        this.scene.add(this.model)

        console.log("Set model")
        console.log(this.model)

        this.model.traverse((child) =>
        {
            if(child instanceof THREE.Mesh)
            {
                child.castShadow = true

                if(child.name === STATIC_ROTOR_2){
                    this.rotors["ROTOR_2"] = child
                }

                if(child.name === STATIC_ROTOR){
                    this.rotors["ROTOR"] = child
                }
            }
        })
    }

    update()
    {
        this.rotors["ROTOR"].rotateY(1 * 1 * 2)
    }
}
