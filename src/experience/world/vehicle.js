import * as THREE from 'three'

import Experience from '../index.js'

export default class Helicopter
{
    constructor()
    {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.time = this.experience.time
        this.debug = this.experience.debug
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

        this.model.traverse((child) =>
        {
            if(child instanceof THREE.Mesh)
            {
                child.castShadow = true
            }
        })
    }

    update()
    {
       
    }
}
