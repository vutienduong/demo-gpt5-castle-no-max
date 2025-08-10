import * as THREE from 'three'

export class BalloonMinigame {
  private readonly scene: THREE.Scene
  private readonly scoreEl: HTMLSpanElement
  private score = 0

  private readonly floaters: Array<{ mesh: THREE.Object3D; baseY: number; speed: number }> = []

  constructor(scene: THREE.Scene, scoreEl: HTMLSpanElement) {
    this.scene = scene
    this.scoreEl = scoreEl

    // collect balloons that exist at scene build time
    scene.traverse((obj: THREE.Object3D) => {
      if (obj instanceof THREE.Mesh && obj.geometry instanceof THREE.SphereGeometry) {
        if (obj.geometry.parameters && obj.geometry.parameters.widthSegments === 16) {
          this.floaters.push({ mesh: obj, baseY: obj.position.y, speed: 0.6 + Math.random() * 0.6 })
        }
      }
    })

    this.updateScore(0)
  }

  update(_dt: number, t: number) {
    // bob balloons and keep within bounds
    for (const f of this.floaters) {
      f.mesh.position.y = f.baseY + Math.sin(t * f.speed) * 0.6
      f.mesh.position.x += Math.sin((t + f.baseY) * 0.2) * 0.02
      f.mesh.position.z += Math.cos((t + f.baseY) * 0.2) * 0.02
    }
  }

  pop(balloon: THREE.Object3D) {
    // small pop animation
    const mesh = balloon as THREE.Mesh
    if (!mesh.parent) return
    const parent = mesh.parent
    parent.remove(mesh)
    this.updateScore(this.score + 1)

    // confetti
    const confettiGeo = new THREE.BufferGeometry()
    const num = 40
    const positions = new Float32Array(num * 3)
    const colors = new Float32Array(num * 3)
    for (let i = 0; i < num; i++) {
      positions[i * 3 + 0] = mesh.position.x
      positions[i * 3 + 1] = mesh.position.y
      positions[i * 3 + 2] = mesh.position.z
      const c = new THREE.Color().setHSL(Math.random(), 0.9, 0.6)
      colors.set([c.r, c.g, c.b], i * 3)
    }
    confettiGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    confettiGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const points = new THREE.Points(confettiGeo, new THREE.PointsMaterial({ size: 0.1, vertexColors: true }))
    this.scene.add(points)
    setTimeout(() => this.scene.remove(points), 600)
  }

  private updateScore(v: number) {
    this.score = v
    this.scoreEl.textContent = String(v)
  }
}


