import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Sphere, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'

/* ─── Floating Orbs ─────────────────────────────── */
function FloatingOrb({ position, color, scale = 1, speed = 1 }: {
  position: [number, number, number]
  color: string
  scale?: number
  speed?: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame((state: any) => {
    if (!meshRef.current) return
    meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed + position[0]) * 0.4
    meshRef.current.rotation.z += 0.003 * speed
  })
  return (
    <Float speed={speed * 1.5} rotationIntensity={0.4} floatIntensity={0.6}>
      <Sphere ref={meshRef} args={[scale, 64, 64]} position={position}>
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          distort={0.45}
          speed={2.5}
          roughness={0}
          metalness={0.1}
          transparent
          opacity={0.75}
        />
      </Sphere>
    </Float>
  )
}

/* ─── Aurora Ribbon ──────────────────────────────── */
function AuroraRibbon({ color, emissive, offset = 0, thickness = 0.35 }: {
  color: string; emissive: string; offset?: number; thickness?: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  const curve = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 40; i++) {
      const t = i / 40
      pts.push(new THREE.Vector3(
        (t - 0.5) * 32,
        Math.sin(t * Math.PI * 2.5 + offset) * 3.5 + Math.cos(t * Math.PI + offset * 0.5) * 1.2,
        Math.cos(t * Math.PI * 1.5 + offset) * 2 - 8
      ))
    }
    return new THREE.CatmullRomCurve3(pts)
  }, [offset])

  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 120, thickness, 12, false), [curve, thickness])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    meshRef.current.position.y = Math.sin(t * 0.25 + offset) * 0.8
    meshRef.current.rotation.x = Math.sin(t * 0.1 + offset) * 0.06
    const mat = meshRef.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 0.7 + Math.sin(t * 0.9 + offset) * 0.4
  })

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={0.9}
        transparent
        opacity={0.7}
        roughness={0.1}
        metalness={0.15}
      />
    </mesh>
  )
}

/* ─── Particle Field ─────────────────────────────── */
function ParticleField() {
  const count = 2000
  const ref = useRef<THREE.Points>(null)

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const palette = [
      [1.0, 0.6, 0.15],   // warm orange
      [0.98, 0.76, 0.15],  // amber
      [1.0, 0.5, 0.2],     // peach
      [0.98, 0.85, 0.3],   // gold
      [0.95, 0.35, 0.35],  // rose
    ]
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 40
      pos[i * 3 + 1] = (Math.random() - 0.5) * 22
      pos[i * 3 + 2] = (Math.random() - 0.5) * 16 - 4
      const c = palette[Math.floor(Math.random() * palette.length)]
      col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2]
    }
    return [pos, col]
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.elapsedTime * 0.015
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.07) * 0.04
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.07} vertexColors transparent opacity={0.8} sizeAttenuation />
    </points>
  )
}

/* ─── Dynamic Lights ─────────────────────────────── */
function SceneLights() {
  const l1 = useRef<THREE.PointLight>(null)
  const l2 = useRef<THREE.PointLight>(null)
  const l3 = useRef<THREE.PointLight>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (l1.current) { l1.current.position.set(Math.sin(t * 0.4) * 10, Math.cos(t * 0.3) * 4 + 3, 2) }
    if (l2.current) { l2.current.position.set(Math.cos(t * 0.35) * 10, Math.sin(t * 0.25) * 4 - 2, 3) }
    if (l3.current) { l3.current.position.set(Math.sin(t * 0.55 + 2) * 8, Math.cos(t * 0.45 + 1) * 3, 1) }
  })

  return (
    <>
      <ambientLight intensity={0.6} color="#fff4e0" />
      <pointLight ref={l1} color="#f97316" intensity={25} distance={22} />
      <pointLight ref={l2} color="#fbbf24" intensity={20} distance={20} />
      <pointLight ref={l3} color="#fb923c" intensity={15} distance={18} />
    </>
  )
}

/* ─── Mouse Parallax Camera ──────────────────────── */
function ParallaxCamera() {
  const { camera } = useThree()
  const mouse = useRef({ x: 0, y: 0 })

  useMemo(() => {
    const handler = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  useFrame(() => {
    camera.position.x += (mouse.current.x * 1.5 - camera.position.x) * 0.04
    camera.position.y += (mouse.current.y * 0.8 - camera.position.y) * 0.04
  })

  return null
}

/* ─── Main Scene ─────────────────────────────────── */
export function AuroraScene() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 9], fov: 65 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <SceneLights />
        <ParallaxCamera />

        {/* Large aurora ribbons */}
        <AuroraRibbon color="#f97316" emissive="#fbbf24" offset={0}   thickness={0.45} />
        <AuroraRibbon color="#fbbf24" emissive="#f97316" offset={1.8} thickness={0.35} />
        <AuroraRibbon color="#fb923c" emissive="#fcd34d" offset={3.5} thickness={0.3}  />
        <AuroraRibbon color="#f43f5e" emissive="#fb923c" offset={5.2} thickness={0.22} />

        {/* Floating 3D orbs scattered around */}
        <FloatingOrb position={[-5.5,  2.5, -3]} color="#f97316" scale={1.2} speed={0.7} />
        <FloatingOrb position={[ 5.5,  1.5, -4]} color="#fbbf24" scale={0.9} speed={0.9} />
        <FloatingOrb position={[ 0,   -3,   -5]} color="#fb923c" scale={1.5} speed={0.5} />
        <FloatingOrb position={[-3.5, -2,   -2]} color="#fcd34d" scale={0.7} speed={1.1} />
        <FloatingOrb position={[ 4,    3.5, -3]} color="#f43f5e" scale={0.6} speed={1.3} />
        <FloatingOrb position={[-7,    0,   -6]} color="#fb923c" scale={1.8} speed={0.4} />
        <FloatingOrb position={[ 7,   -1,   -6]} color="#fbbf24" scale={1.4} speed={0.6} />

        <ParticleField />
      </Canvas>
    </div>
  )
}
