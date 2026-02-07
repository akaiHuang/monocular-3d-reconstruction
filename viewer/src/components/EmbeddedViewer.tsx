'use client';

import { useState, useEffect } from 'react';

interface EmbeddedViewerProps {
  plyPath: string;
}

export default function EmbeddedViewer({ plyPath }: EmbeddedViewerProps) {
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [simpleMode, setSimpleMode] = useState(false);

  useEffect(() => {
    if (!plyPath) return;
    
    // 使用真正的 SuperSplat Viewer（從 GitHub 開源專案構建）
    const params = new URLSearchParams();
    params.set('ply', plyPath);
    // 精簡模式：使用統一渲染以加快載入
    if (simpleMode) {
      params.set('unified', '');
    }
    const url = `/supersplat/index.html?${params.toString()}`;
    setViewerUrl(url);
    setIsLoading(true);
  }, [plyPath, simpleMode]);

  const toggleFullscreen = () => {
    const iframe = document.getElementById('viewer-iframe') as HTMLIFrameElement;
    if (iframe) {
      if (!document.fullscreenElement) {
        iframe.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const openInNewTab = () => {
    if (viewerUrl) {
      window.open(viewerUrl, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-[700px] bg-slate-950 relative group/viewer rounded-3xl overflow-hidden">
      {/* 頂部控制列 */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <button
            onClick={() => setSimpleMode(!simpleMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-xs font-bold backdrop-blur-md border ${
              simpleMode 
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' 
                : 'bg-white/10 border-white/10 text-white/70 hover:bg-white/20'
            }`}
            title={simpleMode ? '切換至高品質模式' : '切換至快速模式'}
          >
            <div className={`w-2 h-2 rounded-full ${simpleMode ? 'bg-amber-500 animate-pulse' : 'bg-blue-500'}`} />
            {simpleMode ? '快速模式' : '高品質模式'}
          </button>
        </div>

        <div className="flex gap-2 pointer-events-auto">
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white/70 transition-all backdrop-blur-md"
            title="全螢幕"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
          <button
            onClick={openInNewTab}
            className="p-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white/70 transition-all backdrop-blur-md"
            title="在新分頁開啟"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        </div>
      </div>

      {/* 載入中狀態 */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-20">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl animate-pulse">📦</span>
            </div>
          </div>
          <p className="mt-6 text-slate-400 font-medium animate-pulse">正在初始化 3D 渲染引擎...</p>
        </div>
      )}

      {/* Iframe 容器 */}
      <div className="flex-1 relative">
        {viewerUrl && (
          <iframe
            id="viewer-iframe"
            src={viewerUrl}
            className="w-full h-full border-none"
            onLoad={() => setIsLoading(false)}
            allow="fullscreen; accelerometer; gyroscope"
            title="3D Gaussian Splats Viewer"
          />
        )}
      </div>

      {/* 底部操作列 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover/viewer:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-2 p-1.5 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
          <a
            href={plyPath}
            download
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl transition-all text-sm font-bold shadow-lg shadow-primary/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            下載模型 (.ply)
          </a>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <div className="px-3 py-1 text-[10px] text-slate-500 font-mono uppercase tracking-wider">
            SHARP Renderer v1.0
          </div>
        </div>
      </div>

      {/* 互動提示 */}
      <div className="absolute bottom-4 right-4 pointer-events-none">
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 text-[10px] text-white/30 font-medium">
            <span>左鍵旋轉</span>
            <div className="w-1 h-1 bg-white/20 rounded-full" />
            <span>右鍵平移</span>
            <div className="w-1 h-1 bg-white/20 rounded-full" />
            <span>滾輪縮放</span>
          </div>
        </div>
      </div>
    </div>
  );
}
