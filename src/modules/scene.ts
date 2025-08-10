import * as THREE from 'three'

export function buildCastleScene(scene: THREE.Scene) {
  const raycastables: THREE.Object3D[] = []
  const clickableCharacters: Array<{ name: string; mesh: THREE.Object3D; lines: string[] }> = []
  const clickableBalloons: THREE.Mesh[] = []
  const cannons: THREE.Object3D[] = []

  // Palette
  const COLORS = {
    stone: 0xddd7cc,
    stoneShadow: 0xbfb8ab,
    roofRed: 0xc64a4a,
    roofBlue: 0x4662d6,
    wood: 0x7a5a3a,
    grass: 0x7dc77a,
    sky: 0x87c6ff,
  }

  // Ground mountain peak (gentler top), with grassy cap
  const rock = new THREE.Mesh(
    new THREE.CylinderGeometry(150, 260, 80, 24, 4),
    new THREE.MeshStandardMaterial({ color: 0x8fa3b7, roughness: 0.95 })
  )
  rock.position.set(0, -30, 0)
  rock.receiveShadow = true
  scene.add(rock)

  const grass = new THREE.Mesh(
    new THREE.CylinderGeometry(120, 140, 12, 24, 1),
    new THREE.MeshStandardMaterial({ color: COLORS.grass, roughness: 0.8 })
  )
  grass.position.set(0, 6, 0)
  grass.receiveShadow = true
  scene.add(grass)

  // Stone materials
  const stoneMat = new THREE.MeshStandardMaterial({ color: COLORS.stone, roughness: 0.9, metalness: 0.05 })
  const stoneDark = new THREE.MeshStandardMaterial({ color: COLORS.stoneShadow, roughness: 0.95 })

  // Build castle group
  const castle = new THREE.Group()
  scene.add(castle)

  const wallRadius = 38
  const wallHeight = 16
  const segments = 6
  const towerRadius = 5

  // Towers with colorful roofs
  const towerPositions: THREE.Vector3[] = []
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    towerPositions.push(new THREE.Vector3(Math.cos(angle) * wallRadius, 0, Math.sin(angle) * wallRadius))
  }

  const roofMaterials = [COLORS.roofRed, COLORS.roofBlue].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 }))
  towerPositions.forEach((pos, i) => {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(towerRadius, towerRadius, wallHeight + 6, 16), stoneMat)
    tower.position.copy(pos).setY((wallHeight + 6) / 2)
    tower.castShadow = true
    tower.receiveShadow = true
    castle.add(tower)

    const roof = new THREE.Mesh(new THREE.ConeGeometry(towerRadius + 1.5, 8, 16), roofMaterials[i % roofMaterials.length])
    roof.position.copy(pos).setY(wallHeight + 6 + 4)
    roof.castShadow = true
    castle.add(roof)

    // Flags
    const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 6, 6), new THREE.MeshStandardMaterial({ color: 0xe7e7e7 }))
    flagPole.position.copy(pos).setY(wallHeight + 6 + 8)
    castle.add(flagPole)

    const flag = new THREE.Mesh(new THREE.BoxGeometry(3, 1.2, 0.05), new THREE.MeshStandardMaterial({ color: 0xffffff }))
    flag.position.copy(pos).add(new THREE.Vector3(1.8, wallHeight + 6 + 8, 0))
    flag.userData.wave = Math.random() * 10
    castle.add(flag)
  })

  // Connective walls with crenellations and occasional cannons
  for (let i = 0; i < segments; i++) {
    const a = towerPositions[i]
    const b = towerPositions[(i + 1) % segments]
    const dir = new THREE.Vector3().subVectors(b, a)
    const len = dir.length() - towerRadius * 2
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5)
    const rotY = Math.atan2(dir.x, dir.z)

    const wall = new THREE.Mesh(new THREE.BoxGeometry( len, wallHeight, 3 ), stoneMat)
    wall.position.set(mid.x, wallHeight / 2, mid.z)
    wall.rotation.y = rotY
    wall.castShadow = true
    wall.receiveShadow = true
    castle.add(wall)

    // Crenellations
    const slots = Math.max(6, Math.floor(len / 3))
    for (let s = 0; s < slots; s++) {
      const t = s / (slots - 1)
      const cx = THREE.MathUtils.lerp(a.x, b.x, t)
      const cz = THREE.MathUtils.lerp(a.z, b.z, t)
      const crenel = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2, 2), stoneDark)
      crenel.position.set(cx, wallHeight + 1.2, cz)
      crenel.rotation.y = rotY
      crenel.castShadow = true
      castle.add(crenel)
    }

    // Cannons mounted at midpoints
    const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 6, 12), new THREE.MeshStandardMaterial({ color: 0x222222 }))
    cannon.position.set(mid.x, wallHeight + 1.8, mid.z)
    cannon.rotation.z = Math.PI / 2
    cannon.rotation.y = rotY
    cannon.castShadow = true
    castle.add(cannon)
    cannons.push(cannon)
  }

  // Keep (central tower) with roof
  const keepBase = new THREE.Mesh(new THREE.CylinderGeometry(12, 14, 28, 20), stoneMat)
  keepBase.position.set(0, 14, 0)
  keepBase.castShadow = true
  keepBase.receiveShadow = true
  castle.add(keepBase)
  const keepRoof = new THREE.Mesh(new THREE.ConeGeometry(14, 10, 20), roofMaterials[0])
  keepRoof.position.set(0, 14 + 19, 0)
  keepRoof.castShadow = true
  castle.add(keepRoof)

  // Gatehouse
  const gate = new THREE.Mesh(new THREE.BoxGeometry(10, 14, 6), stoneMat)
  gate.position.set(wallRadius, 7, 0)
  gate.rotation.y = Math.PI / 2
  gate.castShadow = true
  castle.add(gate)
  const door = new THREE.Mesh(new THREE.BoxGeometry(3.5, 6, 0.5), new THREE.MeshStandardMaterial({ color: COLORS.wood, roughness: 0.8 }))
  door.position.set(wallRadius + 0.5, 3, 0)
  castle.add(door)

  // Courtyard bustle
  const crowdGroup = new THREE.Group()
  scene.add(crowdGroup)
  const people: THREE.Mesh[] = []
  for (let i = 0; i < 18; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 0.8), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.1 + 0.7 * Math.random(), 0.55, 0.55) }))
    m.position.set((Math.random() - 0.5) * 40, 0.8, (Math.random() - 0.5) * 40)
    m.castShadow = true
    crowdGroup.add(m)
    people.push(m)
  }
  const horses: THREE.Mesh[] = []
  for (let i = 0; i < 8; i++) {
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.8, 8), new THREE.MeshStandardMaterial({ color: 0x7b4a2f }))
    h.position.set((Math.random() - 0.5) * 40, 0.9, (Math.random() - 0.5) * 40)
    h.rotation.z = Math.PI / 2
    h.castShadow = true
    crowdGroup.add(h)
    horses.push(h)
  }

  // Animate crowd and flags subtly
  const tmpVec = new THREE.Vector3()
  crowdGroup.userData.update = (_dt: number, t: number) => {
    people.forEach((p, i) => {
      const r = 10 + (i % 10)
      const a = 0.22 * t + i * 0.35
      tmpVec.set(Math.cos(a) * r, 0.8, Math.sin(a) * r)
      p.position.lerp(tmpVec, 0.08)
    })
    horses.forEach((h, i) => {
      h.position.y = 0.9 + Math.sin(t * 3 + i) * 0.1
    })
    castle.children.forEach((child) => {
      if ((child as any).userData && (child as any).userData.wave !== undefined) {
        child.position.x += Math.sin(t * 3 + child.userData.wave) * 0.01
      }
    })
  }
  ;(scene as any).crowdGroup = crowdGroup

  // Balloons
  const balloonGeo = new THREE.SphereGeometry(1, 16, 16)
  const balloonMaterials = [0xff5e5e, 0x7ec8e3, 0xffd166, 0x95d27a, 0xd6a2e8].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: 0.15 }))
  for (let i = 0; i < 14; i++) {
    const balloon = new THREE.Mesh(balloonGeo, balloonMaterials[i % balloonMaterials.length])
    balloon.position.set((Math.random() - 0.5) * 70, 10 + Math.random() * 24, (Math.random() - 0.5) * 70)
    balloon.castShadow = true
    scene.add(balloon)
    clickableBalloons.push(balloon)
    raycastables.push(balloon)
  }

  // Characters for dialogue (near gate and keep)
  const characterGeo = new THREE.ConeGeometry(1, 2, 8)
  const char1 = new THREE.Mesh(characterGeo, new THREE.MeshStandardMaterial({ color: 0x3344ff }))
  char1.position.set(wallRadius - 4, 1, -6)
  char1.castShadow = true
  scene.add(char1)
  clickableCharacters.push({
    name: 'Captain Elowen',
    mesh: char1,
    lines: [
      'Welcome to Highspire Keep!'
      , 'Our lookouts and cannons keep the skies safe.'
    ],
  })
  raycastables.push(char1)

  const char2 = new THREE.Mesh(characterGeo, new THREE.MeshStandardMaterial({ color: 0xff3366 }))
  char2.position.set(-8, 1, 8)
  char2.castShadow = true
  scene.add(char2)
  clickableCharacters.push({
    name: 'Stablemaster Brann',
    mesh: char2,
    lines: [
      'The horses are spirited today.',
      'Pop a few balloons to entertain the squires!'
    ],
  })
  raycastables.push(char2)

  // Clouds - billboarded planes
  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 })
  const cloudGeo = new THREE.PlaneGeometry(120, 60)
  for (let i = 0; i < 6; i++) {
    const cl = new THREE.Mesh(cloudGeo, cloudMat)
    cl.position.set((Math.random() - 0.5) * 180, 55 + Math.random() * 20, (Math.random() - 0.5) * 180)
    cl.rotation.x = -Math.PI / 2
    cl.renderOrder = -1
    scene.add(cl)
  }

  // Raycastables include characters and balloons
  return { raycastables, clickableCharacters, clickableBalloons, cannons }
}


