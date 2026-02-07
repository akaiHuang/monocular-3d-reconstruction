'use client';

import { useEffect, useRef, useState } from 'react';

interface SuperSplatViewerProps {
  plyPath: string;
}

export default function SuperSplatViewer({ plyPath }: SuperSplatViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const appRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current || !plyPath) return;

    let mounted = true;

    const initViewer = async () => {
      try {
        // 動態載入 PlayCanvas
        const pc = await import('playcanvas');
        
        if (!mounted || !canvasRef.current) return;

        const canvas = canvasRef.current;
        
        // 清理之前的應用
        if (appRef.current) {
          appRef.current.destroy();
          appRef.current = null;
        }

        // 創建 PlayCanvas 應用
        const app = new pc.Application(canvas, {
          graphicsDeviceOptions: {
            preferWebGl2: true,
            antialias: true,
            preserveDrawingBuffer: true,
          },
        });

        appRef.current = app;

        // 設置畫布填滿容器
        app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
        app.setCanvasResolution(pc.RESOLUTION_AUTO);

        // 創建相機
        const camera = new pc.Entity('camera');
        camera.addComponent('camera', {
          clearColor: new pc.Color(0.1, 0.1, 0.1),
          farClip: 1000,
          nearClip: 0.1,
        });
        camera.setPosition(0, 0, 5);
        app.root.addChild(camera);

        // 創建光源
        const light = new pc.Entity('light');
        light.addComponent('light', {
          type: 'directional',
        });
        light.setEulerAngles(45, 45, 0);
        app.root.addChild(light);

        // 啟動應用
        app.start();

        // 嘗試載入 PLY
        setLoading(true);
        setProgress(10);

        // 使用 fetch 載入 PLY 數據
        const response = await fetch(plyPath);
        if (!response.ok) {
          throw new Error(`無法載入 PLY 檔案: ${response.status}`);
        }

        setProgress(50);

        // 處理 PLY 數據 - 這裡需要 GSplat 擴展
        // PlayCanvas 原生需要 GSplat 擴展來渲染 Gaussian Splats
        
        setProgress(100);
        setLoading(false);
        setError('PlayCanvas 基礎框架已載入，但 SHARP PLY 格式需要額外的 GSplat 解析器。建議使用下載後在 SuperSplat Editor 中開啟。');

      } catch (err) {
        if (mounted) {
          console.error('SuperSplat Viewer 錯誤:', err);
          setError(err instanceof Error ? err.message : '載入失敗');
          setLoading(false);
        }
      }
    };

    initViewer();

    return () => {
      mounted = false;
      if (appRef.current) {
        appRef.current.destroy();
        appRef.current = null;
      }
    };
  }, [plyPath]);

  // 處理視窗大小變化
  useEffect(() => {
    const handleResize = () => {
      if (appRef.current) {
        appRef.current.resizeCanvas();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[400px] bg-gray-900 rounded-lg overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
      
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <div className="text-white text-lg mb-2">載入中... {progress}%</div>
          <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 z-10 p-6">
          <div className="text-yellow-400 text-4xl mb-4">⚠️</div>
          <div className="text-yellow-300 text-lg mb-2">瀏覽器預覽受限</div>
          <div className="text-gray-300 text-sm text-center max-w-md">{error}</div>
        </div>
      )}
    </div>
  );
}
