'use client';

import { useState } from 'react';

interface SuperSplatEmbedProps {
  plyPath: string;
}

export default function SuperSplatEmbed({ plyPath }: SuperSplatEmbedProps) {
  const [showIframe, setShowIframe] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);

  // SuperSplat Viewer 支援 URL 參數載入
  // 但需要 PLY 檔案可被外部訪問（CORS）
  // 由於本地檔案無法直接被 superspl.at 存取，我們提供下載後開啟的方式

  const openInSuperSplat = () => {
    // 開啟 SuperSplat Editor 讓用戶手動拖入檔案
    window.open('https://superspl.at/editor', '_blank');
  };

  const openInViewer = () => {
    // 開啟 SuperSplat Viewer（需要檔案 URL 可公開訪問）
    window.open('https://superspl.at/', '_blank');
  };

  return (
    <div className="space-y-4">
      {/* 主要操作區 */}
      <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-500/30 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span>🎮</span> 使用 SuperSplat 查看 3D 模型
        </h3>
        
        <div className="space-y-4">
          {/* 下載按鈕 */}
          <a
            href={plyPath}
            download
            className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl transition-all font-semibold text-lg shadow-lg hover:shadow-blue-500/25"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            下載 PLY 檔案
          </a>

          {/* 開啟 SuperSplat */}
          <button
            onClick={openInSuperSplat}
            className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl transition-all font-semibold text-lg shadow-lg hover:shadow-green-500/25"
          >
            <span className="text-2xl">🌟</span>
            在 SuperSplat Editor 中開啟
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        </div>

        {/* 使用說明 */}
        <div className="mt-4 p-4 bg-black/30 rounded-lg">
          <p className="text-sm text-gray-300 mb-2">
            <strong className="text-white">使用步驟：</strong>
          </p>
          <ol className="list-decimal list-inside text-sm text-gray-400 space-y-1">
            <li>點擊「下載 PLY 檔案」按鈕</li>
            <li>點擊「在 SuperSplat Editor 中開啟」</li>
            <li>將下載的 PLY 檔案拖拽到 SuperSplat 視窗中</li>
            <li>等待載入完成，即可 360° 查看 3D 模型！</li>
          </ol>
        </div>
      </div>

      {/* 檔案資訊 */}
      <div className="bg-gray-800/50 rounded-xl p-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>📁</span>
          <span>檔案路徑：</span>
          <code className="bg-gray-700 px-2 py-1 rounded text-gray-300 flex-1 truncate">
            {plyPath}
          </code>
        </div>
      </div>

      {/* SuperSplat 介紹 */}
      <details className="bg-gray-800/50 rounded-xl">
        <summary className="p-4 cursor-pointer hover:bg-gray-700/50 rounded-xl transition-colors font-medium">
          ℹ️ 關於 SuperSplat
        </summary>
        <div className="px-4 pb-4 text-sm text-gray-400 space-y-2">
          <p>
            <strong className="text-white">SuperSplat</strong> 是由 PlayCanvas 開發的開源 3D Gaussian Splatting 編輯器，
            支援檢視、編輯、優化和發布 3DGS 模型。
          </p>
          <p>
            <strong className="text-green-400">✓</strong> 完全免費、開源 (MIT License)
          </p>
          <p>
            <strong className="text-green-400">✓</strong> 支援 SHARP 模型的 PLY 格式
          </p>
          <p>
            <strong className="text-green-400">✓</strong> 瀏覽器直接運行，無需安裝
          </p>
          <div className="pt-2 flex gap-4">
            <a
              href="https://github.com/playcanvas/supersplat"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              GitHub →
            </a>
            <a
              href="https://developer.playcanvas.com/user-manual/gaussian-splatting/editing/supersplat/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              使用指南 →
            </a>
          </div>
        </div>
      </details>
    </div>
  );
}
