import Experience from "../index.js";

export default class Platform {
    
    constructor(){
        this.experience = new Experience();
		this.scene = this.experience.scene;
		this.resources = this.experience.resources;
        this.resource = this.resources.items.oilPlatformModel;

        this.scale = 0.6;


        this.onCreate();
    }

    onCreate(){
        
        this.platform = this.resource.scene;
		this.platform.scale.set(this.scale, this.scale, this.scale);
		this.platform.position.y = -90;

		this.scene.add(this.platform);
       
    }
}
