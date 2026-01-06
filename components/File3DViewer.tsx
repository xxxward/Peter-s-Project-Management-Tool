import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { X, Loader2, Box, Download, AlertCircle, Maximize2 } from 'lucide-react';
import { Attachment } from '../types';

interface File3DViewerProps {
  file: Attachment;
  isOpen?: boolean;
  onClose: () => void;
  isEmbedded?: boolean;
}

export const File3DViewer: React.FC<File3DViewerProps> = ({ file, isOpen = true, onClose, isEmbedded = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Fix: The `useRef` hook requires an initial value. Provided `undefined` as the initial value.
  const requestRef = useRef<number | undefined>(undefined);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    // Reset state
    setIsLoading(true);
    setError(null);

    // Unsupported formats check
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'step' || extension === 'stp' || extension === 'sldprt' || extension === 'sldasm') {
        setIsLoading(false);
        return; // Don't init Three.js for unsupported formats
    }

    // Scene Setup
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f4f6); // Gray-50 equivalent
    
    // Grid Helper
    const gridHelper = new THREE.GridHelper(500, 50);
    scene.add(gridHelper);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(100, 100, 50);
    scene.add(dirLight);
    
    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-50, 50, -100);
    scene.add(backLight);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(50, 50, 50);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 500;

    // Load Model
    const loadModel = () => {
      const loader = extension === 'stl' ? new STLLoader() : new OBJLoader();
      
      loader.load(
        file.url,
        (geometryOrGroup) => {
          let mesh;
          const material = new THREE.MeshPhongMaterial({ 
            color: 0x4f46e5, // Nexus Primary
            specular: 0x111111,
            shininess: 200 
          });

          if (extension === 'stl') {
             // STL loader returns BufferGeometry
             mesh = new THREE.Mesh(geometryOrGroup as THREE.BufferGeometry, material);
          } else {
             // OBJ loader returns Group
             mesh = geometryOrGroup as THREE.Group;
             mesh.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                   (child as THREE.Mesh).material = material;
                }
             });
          }

          // Center and Scale
          const box = new THREE.Box3().setFromObject(mesh);
          const size = new THREE.Vector3();
          box.getSize(size);
          const center = new THREE.Vector3();
          box.getCenter(center);

          // Auto-centering
          mesh.position.sub(center); // Center at 0,0,0
          mesh.position.y += size.y / 2; // Move up to sit on grid

          // Auto-scaling (Fit to view approx size 40)
          const maxDim = Math.max(size.x, size.y, size.z);
          if (maxDim > 0) {
             const scale = 40 / maxDim;
             mesh.scale.setScalar(scale);
          }

          scene.add(mesh);
          setIsLoading(false);
        },
        (xhr) => {
          // Progress could be handled here
        },
        (err) => {
          console.error(err);
          setError("Failed to load model structure. File may be corrupted or format mismatch.");
          setIsLoading(false);
        }
      );
    };

    loadModel();

    // Animation Loop
    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [isOpen, file]);

  if (!isOpen) return null;

  const isSupported = ['stl', 'obj'].includes(file.name.split('.').pop()?.toLowerCase() || '');
  const extension = file.name.split('.').pop()?.toLowerCase();

  const ViewerContent = (
    <div className={`flex flex-col overflow-hidden relative bg-white dark:bg-gray-900 ${isEmbedded ? 'w-full h-full rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm' : 'w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl'}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-nexus-primary/10 rounded-lg text-nexus-primary">
                <Box size={20} />
            </div>
            <div>
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {file.name}
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-500 uppercase">{extension}</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isSupported ? 'Interactive 3D Preview' : 'CAD File Preview'}
                </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href={file.url} 
              download={file.name}
              className="p-2 text-gray-500 hover:text-nexus-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Download Original"
            >
                <Download size={20} />
            </a>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                <X size={20} />
            </button>
          </div>
      </div>

      {/* Viewer Area */}
      <div className="flex-1 relative bg-gray-50 dark:bg-gray-900">
          
          {/* Canvas Container */}
          {isSupported ? (
              <div ref={containerRef} className="w-full h-full cursor-move" />
          ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                      <Box size={48} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Native Preview Unavailable</h3>
                  <p className="text-gray-500 max-w-md mb-8">
                      Browser rendering for <strong>.{extension?.toUpperCase()}</strong> files requires heavy processing. 
                      Please download the file to view it in your CAD software (SolidWorks, Fusion 360, etc).
                  </p>
                  <a 
                    href={file.url}
                    download 
                    className="px-6 py-3 bg-nexus-primary text-white rounded-xl shadow-lg hover:bg-indigo-600 transition-colors flex items-center gap-2 font-medium"
                  >
                      <Download size={18} /> Download File
                  </a>
              </div>
          )}

          {/* Loading State */}
          {isSupported && isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-20">
                  <Loader2 size={40} className="text-nexus-primary animate-spin mb-4" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Loading Geometry...</p>
              </div>
          )}

          {/* Error State */}
          {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-gray-900/90 z-20 p-8 text-center">
                  <AlertCircle size={40} className="text-red-500 mb-4" />
                  <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Render Error</h4>
                  <p className="text-sm text-gray-500 max-w-sm">{error}</p>
              </div>
          )}

          {/* Controls Hint */}
          {isSupported && !isLoading && !error && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-gray-800/90 backdrop-blur border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-full shadow-lg flex items-center gap-4 text-xs font-medium text-gray-600 dark:text-gray-300 pointer-events-none">
                  <span className="flex items-center gap-1"><Maximize2 size={12}/> Rotate</span>
                  <span className="w-px h-3 bg-gray-300 dark:bg-gray-600"></span>
                  <span>Scroll to Zoom</span>
                  <span className="w-px h-3 bg-gray-300 dark:bg-gray-600"></span>
                  <span>Right-click Pan</span>
              </div>
          )}
      </div>
    </div>
  );

  if (isEmbedded) {
    return ViewerContent;
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      {ViewerContent}
    </div>
  );
};
