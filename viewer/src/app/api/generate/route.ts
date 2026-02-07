import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile, readdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

// 禁用 body parser，我們手動處理
export const runtime = 'nodejs';

const UPLOAD_DIR = path.join(process.cwd(), 'tmp', 'uploads');
const OUTPUT_DIR = path.join(process.cwd(), 'tmp', 'outputs');

// Conda 配置
const CONDA_SH = '/Users/akaihuangm1/miniconda3/etc/profile.d/conda.sh';

// 確保目錄存在
async function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

// 執行 SHARP 命令
function runSharp(inputDir: string, outputDir: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // 使用 bash 執行，先 source conda 再執行 sharp
    const command = `source "${CONDA_SH}" && conda activate sharp && sharp predict -i "${inputDir}" -o "${outputDir}"`;
    
    const childProcess = spawn('bash', ['-c', command], {
      env: {
        ...process.env,
        HOME: process.env.HOME || '/Users/akaihuangm1',
      }
    });

    let stdout = '';
    let stderr = '';

    childProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log('[SHARP]', data.toString());
    });

    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error('[SHARP ERROR]', data.toString());
    });

    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`SHARP 執行失敗 (code ${code}): ${stderr}`));
      }
    });

    childProcess.on('error', (err) => {
      reject(err);
    });
  });
}

export async function POST(request: NextRequest) {
  const jobId = uuidv4();
  const inputDir = path.join(UPLOAD_DIR, jobId);
  const outputDir = path.join(OUTPUT_DIR, jobId);

  try {
    await ensureDir(inputDir);
    await ensureDir(outputDir);

    // 解析 FormData
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: '請上傳至少一張圖片' },
        { status: 400 }
      );
    }

    // 保存上傳的圖片
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filePath = path.join(inputDir, file.name);
      await writeFile(filePath, buffer);
      console.log(`已保存: ${filePath}`);
    }

    // 執行 SHARP 生成 3D 模型
    console.log(`開始生成 3D 模型，輸入: ${inputDir}, 輸出: ${outputDir}`);
    await runSharp(inputDir, outputDir);

    // 尋找生成的 .ply 檔案
    const outputFiles = await readdir(outputDir);
    const plyFile = outputFiles.find(f => f.endsWith('.ply'));

    if (!plyFile) {
      throw new Error('找不到生成的 PLY 檔案');
    }

    // 返回 jobId，前端透過 /api/ply/[jobId] 獲取檔案
    // 加上 .ply 副檔名讓 viewer 能正確識別格式
    return NextResponse.json({
      success: true,
      jobId: jobId,
      fileName: plyFile,
      plyUrl: `/api/ply/${jobId}/${plyFile}`,
    });

  } catch (error) {
    console.error('生成失敗:', error);
    
    // 清理失敗的任務檔案
    try {
      await rm(inputDir, { recursive: true, force: true });
      await rm(outputDir, { recursive: true, force: true });
    } catch {}

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成 3D 模型失敗' },
      { status: 500 }
    );
  }
}

// 查詢任務狀態（可擴展為異步處理）
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: '需要 jobId' }, { status: 400 });
  }

  const outputDir = path.join(OUTPUT_DIR, jobId);
  
  if (!existsSync(outputDir)) {
    return NextResponse.json({ status: 'not_found' }, { status: 404 });
  }

  try {
    const files = await readdir(outputDir);
    const plyFile = files.find(f => f.endsWith('.ply'));
    
    if (plyFile) {
      return NextResponse.json({ status: 'completed', file: plyFile });
    } else {
      return NextResponse.json({ status: 'processing' });
    }
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
