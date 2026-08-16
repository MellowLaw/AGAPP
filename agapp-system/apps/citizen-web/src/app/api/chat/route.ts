import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, query, lgu_id, lguId, history } = body;

    const actualQuery = query || message || '';
    const actualLguId = lguId || lgu_id || 'liliw-laguna';

    const authHeader = req.headers.get('authorization');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const apiRes = await fetch(`${API_BASE}/api/chatbot/ask`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: actualQuery,
        lguId: actualLguId,
        history: history || [],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!apiRes.ok) {
      return NextResponse.json(
        { error: `Backend returned status ${apiRes.status}` },
        { status: apiRes.status }
      );
    }

    const data = await apiRes.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Chatbot service unavailable' },
      { status: 500 }
    );
  }
}
