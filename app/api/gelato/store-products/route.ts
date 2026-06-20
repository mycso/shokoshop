import { NextResponse } from 'next/server';

const GELATO_API_KEY = process.env.GELATO_API_KEY;
const GELATO_STORE_ID = process.env.GELATO_STORE_ID;

export async function GET(request: Request) {
  if (!GELATO_API_KEY) {
    return NextResponse.json({ error: 'GELATO_API_KEY not configured' }, { status: 400 });
  }
  if (!GELATO_STORE_ID) {
    return NextResponse.json({ error: 'GELATO_STORE_ID not configured' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const order = searchParams.get('order') ?? 'desc';
  const orderBy = searchParams.get('orderBy') ?? 'createdAt';
  const offset = searchParams.get('offset') ?? '0';
  const limit = searchParams.get('limit') ?? '100';

  const params = new URLSearchParams({ order, orderBy, offset, limit });
  const url = `https://ecommerce.gelatoapis.com/v1/stores/${GELATO_STORE_ID}/products?${params}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': GELATO_API_KEY,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
