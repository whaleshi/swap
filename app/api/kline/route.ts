import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chain, contract, market, size } = body;

    // 验证必要参数
    if (!chain || !contract || !market) {
      return NextResponse.json(
        { status: 1, message: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // 创建表单数据
    const formData = new URLSearchParams();
    formData.append('chain', chain);
    formData.append('contract', contract);
    formData.append('market', market);
    formData.append('size', size || '100');

    // 代理请求到Bitget API
    const response = await fetch('https://web3.bitget.com/bgwapi/market/quotev2/getKline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (compatible)',
      },
      body: formData,
    });

    const data = await response.json();

    // 返回数据，添加CORS头
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { status: 1, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}