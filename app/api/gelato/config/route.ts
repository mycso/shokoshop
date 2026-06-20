import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.resolve(process.cwd(), '.gelato.config.json');

export async function GET() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return NextResponse.json({});
    const raw = await fs.promises.readFile(CONFIG_PATH, 'utf-8');
    const json = JSON.parse(raw || '{}');
    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json({ error: (err instanceof Error) ? err.message : String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const allowed = {
      catalogUrl: typeof body.catalogUrl === 'string' ? body.catalogUrl : undefined,
    };
    await fs.promises.writeFile(CONFIG_PATH, JSON.stringify(allowed, null, 2), 'utf-8');
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err instanceof Error) ? err.message : String(err) }, { status: 500 });
  }
}
