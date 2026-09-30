import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Stage, Center } from '@react-three/drei';

function GarmentMesh({ url, scaleModifiers }) {
    const { scene } = useGLTF(url);
    return (
        <primitive
            object={scene}
            scale={[scaleModifiers.scaleX, scaleModifiers.scaleY, scaleModifiers.scaleZ]}
        />
    );
}

export default function ThreeCanvasViewer({ meshUrl, userMeasurements }) {
    if (!meshUrl) {
        return <div className="p-4 text-neutral-400">No 3D asset generated yet.</div>;
    }

    const { calculateAvatarScales } = require('../utils/bodyMath');
    const scales = calculateAvatarScales(userMeasurements);

    return (
        <div style={{ width: '100%', height: '450px', background: '#0d0d0d', borderRadius: '12px' }}>
            <Canvas shadows camera={{ position: [0, 0, 2.5], fov: 45 }}>
                <ambientLight intensity={0.7} />
                <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
                <Suspense fallback={null}>
                    <Stage environment="city" intensity={0.6}>
                        <Center>
                            <GarmentMesh url={meshUrl} scaleModifiers={scales} />
                        </Center>
                    </Stage>
                </Suspense>
                <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
            </Canvas>
        </div>
    );
}