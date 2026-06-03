'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'

function Chair({ data, onSelect }: any) {
  const ref = useRef<any>()
  useFrame(() => {})

  return (
    <mesh
      ref={ref}
      position={[data.positionX / 10, 0, data.positionY / 10]}
      onClick={() => onSelect(data)}
    >
      <boxGeometry args={[0.8, 0.2, 0.8]} />
      <meshStandardMaterial color={data.assignedGuestId ? '#d4af37' : '#1e3a8a'} />
      <Html distanceFactor={10} position={[0, 0.6, 0]}>
        <div className="text-xs text-center text-white">{data.chairNumber}</div>
      </Html>
    </mesh>
  )
}

export default function SeatingEditor({ eventId }: { eventId: string }) {
  const [layout, setLayout] = useState<any>(null)
  const [chairs, setChairs] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => {
    // fetch seating layout
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/seating/${eventId}`)
        const json = await res.json()
        setLayout(json.data)
        setChairs(json.data.chairs || [])
      } catch (err) {
        console.error(err)
      }
    })()
  }, [eventId])

  const onSelect = (chair: any) => {
    setSelected(chair)
  }

  return (
    <div className="w-full h-[600px] bg-white rounded shadow p-4">
      <div className="h-full">
        <Canvas camera={{ position: [0, 10, 20], fov: 50 }}>
          <ambientLight />
          <pointLight position={[10, 10, 10]} />
          <OrbitControls />

          {/* Stage */}
          <mesh position={[0, 0, -10]}>
            <boxGeometry args={[20, 0.5, 4]} />
            <meshStandardMaterial color="#333" />
          </mesh>

          {chairs.map((c) => (
            <Chair key={c.id} data={c} onSelect={onSelect} />
          ))}
        </Canvas>
      </div>

      {selected && (
        <div className="mt-4">
          <h3 className="font-bold">مقعد {selected.chairNumber}</h3>
          <p>الضيوف المعين: {selected.assignedGuestId || 'غير معين'}</p>
        </div>
      )}
    </div>
  )
}
