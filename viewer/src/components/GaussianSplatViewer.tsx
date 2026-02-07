'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';

interface GaussianSplatViewerProps {
  plyPath: string;
}

export default function GaussianSplatViewer({ plyPath }: GaussianSplatViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<GaussianSplats3D.Viewer | null>(null);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);
  const currentPathRef = useRef<string>('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const cleanup = useCallback(() => {
    if (viewerRef.current) {
      try {
        viewerRef.current.dispose();
      } catch (e) {
        // 忽略清理錯誤
      }
      viewerRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  useEffect(() => {
    if (!containerRef.current || !plyPath) return;
    if (loadingRef.current && currentPathRef.current === plyPath) return;
    
    currentPathRef.current = plyPath;
    loadingRef.current = true;
    
    const container = containerRef.current;
    
    // 清理先前的 viewer
    cleanup();

    // 清空容器
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    setLoading(true);
    setError(null);
    setProgress(0);

    // 延遲初始化以確保 DOM 準備好
    const initTimeout = setTimeout(async () => {
      if (!mountedRef.current) return;

      try {
        // 建立 Gaussian Splats Viewer
        const viewer = new GaussianSplats3D.Viewer({
          cameraUp: [0, -1, 0],
          initialCameraPosition: [0, 0, 5],
          initialCameraLookAt: [0, 0, 0],
          rootElement: container,
          sharedMemoryForWorkers: false,
          dynamicScene: false,
          selfDrivenMode: true,
          useBuiltInControls: true,
          ignoreDevicePixelRatio: false,
          gpuAcceleratedSort: true,
          enableSIMDInSort: true,
          sceneRevealMode: GaussianSplats3D.SceneRevealMode.Instant,
          antialiased: true,
          focalAdjustment: 1.0,
          logLevel: GaussianSplats3D.LogLevel.Warning,
        });

        viewerRef.current = viewer;

        // 載入 PLY 檔案
        await viewer.addSplatScene(plyPath, {
          splatAlphaRemovalThreshold: 1,
          showLoadingUI: false,
          progressiveLoad: false,
          format: GaussianSplats3D.SceneFormat.Ply,
          onProgress: (percent: number) => {
            if (mountedRef.current) {
              setProgress(Math.round(percent));
            }
          },
        });

        if (mountedRef.current) {
          setLoading(false);
          loadingRef.current = false;
          viewer.start();
        }
      } catch (err) {
        console.error('載入失敗:', err);
        if (mountedRef.current) {
          // 忽略 abort 錯誤
          const errMsg = err instanceof Error ? err.message : String(err);
          if (!errMsg.includes('abort') && !errMsg.includes('Abort')) {
            setError(errMsg || '載入 3D 模型失敗');
          }
          setLoading(false);
          loadingRef.current = false;
        }
      }
    }, 100);

    return () => {
      clearTimeout(initTimeout);
    };
  }, [plyPath, cleanup]);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ minHeight: '500px' }}
      />
      
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white">
          <div className="mb-4">
            <svg className="animate-spin h-10 w-10" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" cy="12" r="10" 
                stroke="currentColor" 
                strokeWidth="4" 
                fill="none"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
          <p className="text-lg">載入 3D 模型中... {progress}%</p>
          <div className="w-64 h-2 bg-gray-700 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-red-400">
          <div className="text-center p-4">
            <p className="text-xl mb-2">❌ 錯誤</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="absolute bottom-4 left-4 text-white/70 text-sm bg-black/50 px-3 py-2 rounded">
          🖱️ 拖曳旋轉 | 滾輪縮放 | 右鍵平移
        </div>
      )}
    </div>
  );
}
