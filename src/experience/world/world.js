import Environment from './environment.js'
import Experience from '../index.js'
import Floor from './floor.js'
import Vehicle from './vehicle.js'

export default class World
{
    constructor()
    {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources

        // Wait for resources
        this.resources.on('ready', () =>
        {
            // Setup
            this.floor = new Floor()
            this.vehicle = new Vehicle()
            this.environment = new Environment()
        })
    }

    update()
    {
        // if(this.fox)
        //     this.fox.update()
    }
}
