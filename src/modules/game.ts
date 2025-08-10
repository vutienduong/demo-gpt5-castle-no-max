import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { buildCastleScene } from './scene'
import { BalloonMinigame } from './minigame'
import { DialogueSystem } from './talk'

export function initGame(container: HTMLElement): void {
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.shadowMap.enabled = true
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x87c6ff)
  scene.fog = new THREE.FogExp2(0x87c6ff, 0.012)

  const camera = new THREE.PerspectiveCamera(
    55,
    container.clientWidth / container.clientHeight,
    0.1,
    2000
  )
  camera.position.set(80, 45, 120)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.maxPolarAngle = Math.PI * 0.48
  controls.target.set(0, 12, 0)

  const { clickableCharacters, clickableBalloons, raycastables, cannons } = buildCastleScene(scene)

  const dialogue = new DialogueSystem(
    document.getElementById('dialogue') as HTMLDivElement,
    document.getElementById('speaker-name') as HTMLSpanElement,
    document.getElementById('dialogue-content') as HTMLDivElement,
    document.getElementById('dialogue-actions') as HTMLDivElement,
    document.getElementById('dialogue-close') as HTMLButtonElement
  )

  const scoreboardEl = document.getElementById('score') as HTMLSpanElement
  const minigame = new BalloonMinigame(scene, scoreboardEl)

  // Audio for balloon pop
  const audioListener = new THREE.AudioListener()
  camera.add(audioListener)
  const audio = new THREE.Audio(audioListener)
  const audioLoader = new THREE.AudioLoader()
  audioLoader.load(
    '/pop.mp3',
    (buffer: AudioBuffer) => {
      audio.setBuffer(buffer)
      audio.setVolume(0.7)
    },
    undefined,
    () => {
      // ignore audio load errors silently
    }
  )

  // Simple ambient + directional lighting with clouds illusion
  const hemi = new THREE.HemisphereLight(0xcfe9ff, 0x667788, 0.85)
  scene.add(hemi)
  const dir = new THREE.DirectionalLight(0xfff3d7, 1.2)
  dir.position.set(60, 100, 20)
  dir.castShadow = true
  dir.shadow.mapSize.set(2048, 2048)
  dir.shadow.camera.near = 1
  dir.shadow.camera.far = 300
  scene.add(dir)

  // Projectiles
  const projectiles: Array<{ mesh: THREE.Mesh; velocity: THREE.Vector3; life: number }> = []
  const projectileGeometry = new THREE.SphereGeometry(0.5, 16, 16)
  const projectileMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0x221100 })

  // Raycaster for interactions
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  function onResize() {
    const { clientWidth, clientHeight } = container
    camera.aspect = clientWidth / clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(clientWidth, clientHeight)
  }
  window.addEventListener('resize', onResize)

  function worldDirectionFromScreen(x: number, y: number): THREE.Vector3 {
    mouse.set((x / renderer.domElement.clientWidth) * 2 - 1, -(y / renderer.domElement.clientHeight) * 2 + 1)
    raycaster.setFromCamera(mouse, camera)
    return raycaster.ray.direction.clone()
  }

  function handleClick(ev: MouseEvent) {
    // First, check characters/balloons via raycast
    mouse.set((ev.clientX / renderer.domElement.clientWidth) * 2 - 1, -(ev.clientY / renderer.domElement.clientHeight) * 2 + 1)
    raycaster.setFromCamera(mouse, camera)
    const hits = raycaster.intersectObjects(raycastables, true)
    if (hits.length > 0) {
      const first = hits[0].object
      // Character conversation
      const character = clickableCharacters.find((c) => c.mesh === first || c.mesh.children.includes(first))
      if (character) {
        dialogue.open(character)
        return
      }
      // Balloon pop
      const balloon = clickableBalloons.find((b) => b === first || b.children.includes(first))
      if (balloon) {
        minigame.pop(balloon)
        if (audio.buffer) audio.play()
        return
      }
    }

    // Otherwise shoot a projectile in the click direction
    const origin = camera.position.clone()
    const direction = worldDirectionFromScreen(ev.clientX, ev.clientY)
    const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial)
    projectile.position.copy(origin)
    projectile.castShadow = true
    scene.add(projectile)
    projectiles.push({ mesh: projectile, velocity: direction.multiplyScalar(120), life: 2.5 })
  }
  renderer.domElement.addEventListener('click', handleClick)

  // Cinematic intro pan
  let introTime = 0
  const introDuration = 6

  const clock = new THREE.Clock()
  function tick() {
    const dt = clock.getDelta()
    const t = clock.getElapsedTime()

    // Animate intro camera path
    if (introTime < introDuration) {
      introTime += dt
      const k = Math.min(introTime / introDuration, 1)
      // smoothstep easing
      const e = k * k * (3 - 2 * k)
      const radius = 160 - 50 * e
      const angle = 0.6 + 1.8 * e
      camera.position.set(Math.cos(angle) * radius, 40 + 20 * Math.sin(e * Math.PI), Math.sin(angle) * radius)
      camera.lookAt(0, 12, 0)
      controls.target.set(0, 12, 0)
    } else {
      controls.update()
    }

    // Cannon firing loop
    cannons.forEach((cannon, i) => {
      cannon.userData.cooldown = (cannon.userData.cooldown || 0) - dt
      if (cannon.userData.cooldown <= 0) {
        cannon.userData.cooldown = 2 + (i % 3) * 0.3
        const ball = new THREE.Mesh(projectileGeometry, new THREE.MeshStandardMaterial({ color: 0xdddddd }))
        ball.position.copy(cannon.position).add(new THREE.Vector3(0, 1.5, 0))
        scene.add(ball)
        const dirVec = new THREE.Vector3(Math.random() * 0.6 - 0.3, 0.3 + Math.random() * 0.2, Math.random() * 0.6 - 0.3).normalize()
        projectiles.push({ mesh: ball, velocity: dirVec.multiplyScalar(40), life: 6 })
      }
    })

    // Update projectiles with simple gravity and collisions vs balloons
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i]
      p.velocity.y -= 25 * dt
      p.mesh.position.addScaledVector(p.velocity, dt)
      p.life -= dt
      if (p.life <= 0) {
        scene.remove(p.mesh)
        projectiles.splice(i, 1)
        continue
      }
      // Collision detection
      for (let j = clickableBalloons.length - 1; j >= 0; j--) {
        const b = clickableBalloons[j]
        const dist = p.mesh.position.distanceTo(b.position)
        if (dist < 1.2) {
          minigame.pop(b)
          if (audio.buffer) audio.play()
        }
      }
    }

    // Minigame updaters
    miniggameUpdateSafe(minigame, dt, t)
    // Crowd animation from scene
    const crowd = (scene as any).crowdGroup
    if (crowd && crowd.userData && typeof crowd.userData.update === 'function') {
      try {
        crowd.userData.update(dt, t)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Crowd update error', e)
      }
    }

    renderer.render(scene, camera)
    requestAnimationFrame(tick)
  }
  tick()
}

function miniggameUpdateSafe(minigame: BalloonMinigame, dt: number, t: number) {
  try {
    minigame.update(dt, t)
  } catch (e) {
    // ignore to keep render loop alive
    // eslint-disable-next-line no-console
    console.warn('Minigame update error', e)
  }
}


