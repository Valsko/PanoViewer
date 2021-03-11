//Code and commentary by : Valentin MELUSSON, vmelusson@gmail.com

const container = document.body
const tooltip = document.querySelector('.tooltip')
let spriteActive = false


// Déclaration des vecteurs tooltips
const enFace = new THREE.Vector3(-49.51030370049486, -2.258552714991792, 3.845421290837066)
const aDroite = new THREE.Vector3(-6.440504273960047, -4.216269294422489, -49.15853395137174)
const derriere = new THREE.Vector3(49.27742438050022, -6.512806966352836, -2.464187213162462)
const aGauche = new THREE.Vector3(-1.611562517221224, -4.543220948612879, 49.618080128037164)






class Scene {
    constructor(image, camera, exits, position) {
        this.image = image
        this.points = []
        this.sprites = []
        this.scene = null
        this.camera = camera
        this.exits = exits
        this.position = position
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

    // Automatically add the exits tooltips thanks the the array you give in arguments of the constructor
    // For example : [1,1,0,0] Will add a go forward tooltip and a go to the right tooltip
    autoAddTooltips() {

        let posY = this.position.y
        let posX = this.position.x


        if (this.exits[0] == 1) {
            this.addPoint({
                position: enFace,
                name: "Avancer",
                scene: trouverScene(posX, posY + 1)
            })
        }
        if (this.exits[1] == 1) {
            this.addPoint({
                position: aDroite,
                name: "Aller à droite",
                scene: trouverScene(posX + 1, posY)
            })
        }
        if (this.exits[2] == 1) {
            this.addPoint({
                position: posX === 1 ? aGauche : derriere,
                name: "Reculer",
                scene: posX === 1 ? trouverScene(posX - 1, posY) : trouverScene(posX, posY - 1)
            })
        }
        if (this.exits[3] == 1) {
            this.addPoint({
                position: aGauche,
                name: "Aller à gauche",
                scene: trouverScene(posX - 1, posY)
            })

        }
    }
    addPoint(point) {
        this.points.push(point)
    }

    // Create the informations tooltips
    addTooltip(point) {
        let spriteMap = new THREE.TextureLoader().load('img/info5.jpg')
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
            point.scene.autoAddTooltips()
            point.scene.createScene(scene)
            point.scene.appear()
        }
    }

    destroy() {
        /*TweenLite.to(this.camera, 0.8, {
            //Pour rajouter l 'effet zoom, à voir avec les collègues
            zoom: 1.5,
            onUpdate: () => {
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
    //controls.autoRotate = true  If we want the image to spin on its own, uncomment this line + add controls.update() before every renderer.render -->(2) 


// To constrain the verticals camera movements
controls.minPolarAngle = 1.5
controls.maxPolarAngle = 0

/*
// To constrain the camera horizontal movements
controls.minAzimuthAngle = 5
controls.maxAzimuthAngle = 10

*/
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

    // Use this code to get (in the console) the coordinates of your click
    /*
    if (intersects.length > 0) {
        console.log(intersects[0].point)
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
            // TweenLite.to(spriteActive.scale, 0.3, { x: 1.5, y: 1.5, z: 1.5 })  For the style, but block the destroy() :-(
        spriteActive = false;
    }

}

window.addEventListener('resize', onResize)
container.addEventListener('click', onClick)
container.addEventListener('mousemove', onMouseMove)


// Scenes declarations

// Initial scene
let s = new Scene("img/360.jpg", camera, [1, 1, 0, 0], { x: 0, y: 0 })

// Other scenes
let s2 = new Scene("img/marche2.jpeg", camera, [1, 1, 1, 0], { x: 0, y: 1 })
let s3 = new Scene("img/unnamed.jpg", camera, [1, 1, 1, 0], { x: 0, y: 2 })
let s4 = new Scene("img/panoFonc.jpg", camera, [1, 1, 1, 0], { x: 0, y: 3 })
let s5 = new Scene("img/pano.jpg", camera, [0, 1, 1, 0], { x: 0, y: 4 })
let s6 = new Scene("img/test.jpg", camera, [0, 0, 1, 0], { x: 1, y: 0 })
let s7 = new Scene("img/unnamed.jpg", camera, [0, 0, 1, 0], { x: 1, y: 1 })
let s8 = new Scene("img/panoFonc.jpg", camera, [0, 0, 1, 0], { x: 1, y: 2 })
let s9 = new Scene("img/unnamed.jpg", camera, [0, 0, 1, 0], { x: 1, y: 3 })
let s10 = new Scene("img/panoFonc.jpg", camera, [0, 0, 1, 0], { x: 1, y: 4 })

// Scenes array
let scenes = [s, s2, s3, s4, s5, s6, s7, s8, s9, s10]


function trouverScene(x, y) { //return the scene which have the good coordinates
    for (var i = 0; i < scenes.length; i++) {
        if (scenes[i].position.x == x && scenes[i].position.y == y)
            return scenes[i];
    }
}


s.autoAddTooltips()
s.createScene(scene)
s.appear()