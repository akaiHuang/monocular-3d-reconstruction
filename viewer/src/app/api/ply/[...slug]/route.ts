import { NextRequest, NextResponse } from 'next/server';
import { readFile, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'tmp', 'outputs');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  
  if (!slug || slug.length < 1) {
    return NextResponse.json({ error: '無效的路徑' }, { status: 400 });
  }

  const jobId = slug[0];
  const outputDir = path.join(OUTPUT_DIR, jobId);

  if (!existsSync(outputDir)) {
    return NextResponse.json({ error: '找不到指定的任務' }, { status: 404 });
  }

  try {
    const files = await readdir(outputDir);
    const plyFile = files.find(f => f.endsWith('.ply'));

    if (!plyFile) {
      return NextResponse.json({ error: '找不到 PLY 檔案' }, { status: 404 });
    }

    const plyPath = path.join(outputDir, plyFile);
    const plyData = await readFile(plyPath);

    return new NextResponse(plyData, {
      headers: {
        'Content-Type': 'application/x-ply',
        'Content-Disposition': `inline; filename="${plyFile}"`,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('讀取 PLY 失敗:', error);
    return NextResponse.json({ error: '讀取檔案失敗' }, { status: 500 });
  }
}
