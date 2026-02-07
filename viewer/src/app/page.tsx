'use client';

import { useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';

// 動態載入避免 SSR 問題
const EmbeddedViewer = dynamic(
  () => import('@/components/EmbeddedViewer'),
  { ssr: false }
);

type Tab = 'generate' | 'view';
type GenerateStatus = 'idle' | 'uploading' | 'generating' | 'done' | 'error';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('generate');
  const [plyPath, setPlyPath] = useState<string>('');
  
  // 生成相關狀態
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [generateStatus, setGenerateStatus] = useState<GenerateStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [progress, setProgress] = useState(0);
  
  // 檢視相關狀態
  const [isDragging, setIsDragging] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const plyInputRef = useRef<HTMLInputElement>(null);

  // 處理圖片選擇
  const handleImageSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const imageFiles = Array.from(files).filter(f => 
      f.type.startsWith('image/') || 
      /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(f.name)
    );
    
    if (imageFiles.length === 0) {
      alert('請選擇圖片檔案');
      return;
    }
    
    // 清理舊的預覽 URL
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    
    const newUrls = imageFiles.map(f => URL.createObjectURL(f));
    setSelectedImages(imageFiles);
    setPreviewUrls(newUrls);
    setGenerateStatus('idle');
  }, [previewUrls]);

  // 生成 3D 模型
  const handleGenerate = useCallback(async () => {
    if (selectedImages.length === 0) {
      alert('請先選擇圖片');
      return;
    }

    setGenerateStatus('uploading');
    setStatusMessage('上傳圖片中...');
    setProgress(10);

    try {
      const formData = new FormData();
      selectedImages.forEach(file => {
        formData.append('images', file);
      });

      setGenerateStatus('generating');
      setStatusMessage('正在生成 3D 模型，這可能需要幾秒到幾分鐘...');
      setProgress(30);

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '生成失敗');
      }

      setProgress(90);
      setStatusMessage('處理完成，載入模型中...');

      // 使用伺服器端 URL 而不是 blob URL
      // 這樣庫可以從 URL 副檔名判斷格式
      setPlyPath(data.plyUrl);
      setGenerateStatus('done');
      setStatusMessage('生成完成！');
      setProgress(100);
      
      // 自動切換到檢視頁籤
      setTimeout(() => setActiveTab('view'), 500);

    } catch (error) {
      console.error('生成錯誤:', error);
      setGenerateStatus('error');
      setStatusMessage(error instanceof Error ? error.message : '生成失敗');
      setProgress(0);
    }
  }, [selectedImages]);

  // 處理 PLY 檔案選擇（檢視模式）
  const handlePlySelect = useCallback((file: File) => {
    if (file && file.name.endsWith('.ply')) {
      const url = URL.createObjectURL(file);
      setPlyPath(url);
    } else {
      alert('請選擇 .ply 格式的檔案');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handlePlySelect(file);
  }, [handlePlySelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 重置
  const handleReset = useCallback(() => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    if (plyPath) URL.revokeObjectURL(plyPath);
    
    setSelectedImages([]);
    setPreviewUrls([]);
    setPlyPath('');
    setGenerateStatus('idle');
    setStatusMessage('');
    setProgress(0);
    
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (plyInputRef.current) plyInputRef.current.value = '';
  }, [previewUrls, plyPath]);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-2xl">🎯</span>
            </div>
            <h1 className="text-2xl font-bold gradient-text tracking-tight">
              SHARP 3D
            </h1>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-xl transition-all text-sm font-medium border border-white/5"
          >
            重新開始
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Hero Section */}
        <section className="text-center py-12 space-y-4">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            從圖片生成 <span className="gradient-text">3D 高斯潑濺</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            上傳單張或多張圖片，利用 SHARP 技術在幾秒鐘內生成高品質的 3D 模型。
          </p>
        </section>

        {/* Tab 切換 */}
        <div className="flex justify-center">
          <div className="flex gap-1 bg-secondary/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-sm">
            <button
              onClick={() => setActiveTab('generate')}
              className={`px-8 py-2.5 rounded-xl transition-all text-sm font-semibold flex items-center gap-2 ${
                activeTab === 'generate'
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              📸 生成模型
            </button>
            <button
              onClick={() => setActiveTab('view')}
              className={`px-8 py-2.5 rounded-xl transition-all text-sm font-semibold flex items-center gap-2 ${
                activeTab === 'view'
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              👁️ 檢視器
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* 生成模式 */}
          {activeTab === 'generate' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* 圖片上傳區 */}
              <div
                onClick={() => generateStatus === 'idle' && imageInputRef.current?.click()}
                className={`
                  relative group border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300
                  ${generateStatus === 'idle' 
                    ? 'border-white/10 hover:border-primary/50 hover:bg-primary/5 cursor-pointer' 
                    : 'border-white/5 bg-white/5'
                  }
                `}
              >
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*,.heic,.heif"
                  multiple
                  onChange={(e) => handleImageSelect(e.target.files)}
                  className="hidden"
                  disabled={generateStatus !== 'idle'}
                />
                
                {previewUrls.length === 0 ? (
                  <div className="space-y-4">
                    <div className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold">上傳圖片</h3>
                    <p className="text-gray-400 max-w-xs mx-auto">
                      點擊或拖放圖片到此處，支援 JPG, PNG, WebP, HEIC
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {previewUrls.map((url, i) => (
                        <div key={i} className="relative aspect-square rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-xl group/item">
                          <img
                            src={url}
                            alt={`Preview ${i + 1}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity" />
                          <div className="absolute bottom-2 left-2 right-2 truncate text-[10px] font-medium text-white/90">
                            {selectedImages[i]?.name}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
                      <span>已選擇 {selectedImages.length} 張圖片</span>
                      {generateStatus === 'idle' && (
                        <span className="px-2 py-0.5 bg-primary/10 rounded-full">點擊更換</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 生成按鈕和狀態 */}
              <div className="flex flex-col items-center gap-6">
                {generateStatus === 'idle' && selectedImages.length > 0 && (
                  <button
                    onClick={handleGenerate}
                    className="group relative px-12 py-4 bg-primary hover:bg-primary/90 rounded-2xl text-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-primary/20 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    <span className="relative flex items-center gap-2">
                      🚀 開始生成 3D 模型
                    </span>
                  </button>
                )}

                {(generateStatus === 'uploading' || generateStatus === 'generating') && (
                  <div className="w-full max-w-xl glass p-8 rounded-3xl border border-white/10 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                          </div>
                        </div>
                        <div>
                          <p className="font-bold text-lg">{generateStatus === 'uploading' ? '上傳中' : '生成中'}</p>
                          <p className="text-sm text-gray-400">{statusMessage}</p>
                        </div>
                      </div>
                      <span className="text-2xl font-mono font-bold text-primary">{progress}%</span>
                    </div>
                    <div className="relative h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-stripe_1s_linear_infinite]" />
                      </div>
                    </div>
                  </div>
                )}

                {generateStatus === 'done' && (
                  <div className="text-center space-y-4 animate-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-green-400">生成完成！</h3>
                    <button
                      onClick={() => setActiveTab('view')}
                      className="px-8 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold transition-all shadow-lg shadow-green-900/20"
                    >
                      立即查看 3D 模型 →
                    </button>
                  </div>
                )}

                {generateStatus === 'error' && (
                  <div className="text-center space-y-4 animate-in shake duration-500">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="text-xl font-bold text-red-400">{statusMessage}</p>
                    <button
                      onClick={() => setGenerateStatus('idle')}
                      className="px-8 py-3 bg-secondary hover:bg-secondary/80 rounded-xl font-bold transition-all"
                    >
                      重試
                    </button>
                  </div>
                )}
              </div>

              {/* 說明 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                {[
                  { title: '單圖生成', desc: 'SHARP 模型可以從單張圖片生成完整的 3D Gaussian Splats。', icon: '🖼️' },
                  { title: '高效運算', desc: '支援 CPU 和 MPS (Apple Silicon) 運算，優化生成速度。', icon: '⚡' },
                  { title: '即時預覽', desc: '生成完成後可直接在瀏覽器中進行 360° 互動式查看。', icon: '🌐' }
                ].map((item, i) => (
                  <div key={i} className="glass p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                    <div className="text-3xl mb-4">{item.icon}</div>
                    <h4 className="text-lg font-bold mb-2">{item.title}</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 檢視模式 */}
          {activeTab === 'view' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {!plyPath ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => plyInputRef.current?.click()}
                  className={`
                    border-2 border-dashed rounded-3xl p-20 text-center transition-all cursor-pointer
                    ${isDragging 
                      ? 'border-primary bg-primary/10' 
                      : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                    }
                  `}
                >
                  <input
                    ref={plyInputRef}
                    type="file"
                    accept=".ply"
                    onChange={(e) => e.target.files?.[0] && handlePlySelect(e.target.files[0])}
                    className="hidden"
                  />
                  
                  <div className="w-24 h-24 bg-secondary rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold mb-4">
                    載入 3D 模型
                  </h2>
                  <p className="text-gray-400 mb-8 max-w-md mx-auto">
                    拖放 <code className="bg-white/10 px-2 py-1 rounded text-primary font-mono">.ply</code> 檔案到此處，或點擊選擇本地檔案
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-sm text-gray-500">
                    <span className="w-2 h-2 bg-gray-600 rounded-full animate-pulse" />
                    等待模型輸入...
                  </div>
                </div>
              ) : (
                <div className="glass rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                  <EmbeddedViewer plyPath={plyPath} />
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <span className="text-xl">🎯</span>
            <span className="font-bold">SHARP 3D</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2026 SHARP 3D Gaussian Splats. Built with Next.js & Tailwind CSS.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">GitHub</a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">Documentation</a>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes progress-stripe {
          from { background-position: 0 0; }
          to { background-position: 40px 0; }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
