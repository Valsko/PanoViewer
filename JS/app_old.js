//Code and commentary by : Valentin MELUSSON, vmelusson@gmail.com

const container = document.body
const tooltip = document.querySelector('.tooltip')
let spriteActive = false

class Scene {
    constructor(image, camera) {
        this.image = image
        this.points = []
        this.sprites = []
        this.scene = null
        this.camera = camera
    }

    // Create the sphere and put the photo on its side to see it in 360
    createScene(scene) {
        this.scene = scene
        const geometry = new THREE.SphereGeometry(50, 32, 32)
        const texture = new THREE.TextureLoader().load(this.image)
        texture.wrapS = THREE.RepeatWrapping
        texture.repeat.x = -1 // To re-invert the image because we are in the sphere and so its inverted
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide
        })
        material.transparent = true
        this.sphere = new THREE.Mesh(geometry, material)
        this.scene.add(this.sphere)
        this.points.forEach(this.addTooltip.bind(this))
    }

    addPoint(point) {
        this.points.push(point)
    }

    // Create the informations tooltips
    addTooltip(point) {
        let spriteMap = new THREE.TextureLoader().load('info3.png')
        let spriteMaterial = new THREE.SpriteMaterial({
            map: spriteMap
        })

        let sprite = new THREE.Sprite(spriteMaterial)
        sprite.name = point.name

        sprite.position.copy(point.position.clone().normalize().multiplyScalar(30))
        sprite.scale.multiplyScalar(1.5)
        this.scene.add(sprite)
        this.sprites.push(sprite)

        sprite.onClick = () => {
            this.destroy()
            point.scene.createScene(scene)
            point.scene.appear()
        }
    }

    destroy() {
        /*TweenLite.to(this.camera, 0.5, {  Pour rajouter l'effet zoom, à voir avec les collègues
            zoom: 2,
            onUpdate: ()=> {
                this.camera.updateProjectionMatrix()
            } 
         })*/

        TweenLite.to(this.sphere.material, 1, {
            opacity: 0,
            onComplete: () => {
                this.scene.remove(this.sphere)
            }
        })
        this.sprites.forEach((sprite) => {
            TweenLite.to(sprite.scale, 1, {
                x: 0,
                y: 0,
                z: 0,
                onComplete: () => {
                    this.scene.remove(sprite)
                }
            })
        })
    }


    appear() {

        TweenLite.to(this.camera, 0.5, {
            zoom: 1,
            onUpdate: () => {
                this.camera.updateProjectionMatrix()
            }
        }).delay(0.5)
        this.sphere.material.opacity = 0
        TweenLite.to(this.sphere.material, 1, {
            opacity: 1
        })

        this.sprites.forEach((sprite) => {
            sprite.scale.set(0, 0, 0)
            TweenLite.to(sprite.scale, 1, {
                x: 1.5,
                y: 1.5,
                z: 1.5
            })
        })
    }
}
// Create the scene and the camera
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer()


// Create the controllers to navigate in the panorama
const controls = new THREE.OrbitControls(camera, renderer.domElement)
controls.rotateSpeed = 0.3
controls.enableZoom = false
    //controls.autoRotate = true  Si on veut que l'image tourne d'elle même, uncomment la ligne + controls.update() avnt chaque renderer.render  -->(2) 


// To constrain the verticals camera movements
controls.minPolarAngle = 1.5
controls.maxPolarAngle = 0


camera.position.set(1, 0, 0)
controls.update();



// Prepare the render
renderer.setSize(window.innerWidth, window.innerHeight)
container.appendChild(renderer.domElement)

// Animate
function animate() {

    requestAnimationFrame(animate)
        // controls.update()     (2)
    renderer.render(scene, camera)

}
animate()

// To adapt the size when the user resize the window
function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
}

const rayCaster = new THREE.Raycaster()

// To check if the user click on the tooltip
function onClick(e) {

    let mouse = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)

    rayCaster.setFromCamera(mouse, camera)

    let intersects = rayCaster.intersectObjects(scene.children)

    intersects.forEach(function(intersect) {
        if (intersect.object.type === 'Sprite') {
            intersect.object.onClick()
        }
    })

    // Ce code permet d'obtenir des coordonnées sur la sphère pour placer les (i)
    /*
    if (intersects.length > 0) {
        console.log(intersects[0].point)
        addTooltip(intersects[0].point)
    }*/
}


function onMouseMove(e) {

    let mouse = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)

    rayCaster.setFromCamera(mouse, camera)

    let foundSprite = false

    let intersects = rayCaster.intersectObjects(scene.children)

    intersects.forEach(function(intersect) {
        if (intersect.object.type === 'Sprite') {
            let p = intersect.object.position.clone().project(camera)
            tooltip.style.top = ((-1 * p.y + 1) * window.innerHeight / 2) + 'px'
            tooltip.style.left = (p.x + 1) * innerWidth / 2 + 'px'
            tooltip.classList.add('is-active')
            spriteActive = intersect.object
            tooltip.innerHTML = intersect.object.name
            foundSprite = true
                //TweenLite.to(intersect.object.scale, 0.3, { x: 2, y: 2, z: 2 })
        }
    })

    if (foundSprite === false && spriteActive != false) {
        tooltip.classList.remove('is-active')
            // TweenLite.to(spriteActive.scale, 0.3, { x: 1.5, y: 1.5, z: 1.5 })  Pour le style mais block le destroy()
        spriteActive = false;
    }

}


window.addEventListener('resize', onResize)
container.addEventListener('click', onClick)
container.addEventListener('mousemove', onMouseMove)


//CREATION SCENES
let s = new Scene("360.jpg", camera)
let s2 = new Scene("marche.jpg", camera)
let s3 = new Scene("unnamed.jpg", camera)

s.addPoint({
    position: new THREE.Vector3(-49.51030370049486, -2.258552714991792, 3.845421290837066),
    name: "Avancer",
    scene: s2
})

s2.addPoint({
    position: new THREE.Vector3(49.51030370049486, -2.258552714991792, 3.845421290837066),
    name: "Reculer",
    scene: s
})

s2.addPoint({
    position: new THREE.Vector3(-49.51030370049486, -2.258552714991792, 3.845421290837066),
    name: "Avancer",
    scene: s3
})

s3.addPoint({
    position: new THREE.Vector3(49.51030370049486, -2.258552714991792, 3.845421290837066),
    name: "Reculer",
    scene: s2
})
s.createScene(scene)
s.appear()