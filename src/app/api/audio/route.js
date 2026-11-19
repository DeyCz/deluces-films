import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = (searchParams.get('id') || '').trim();

    if (!id || !/^[a-zA-Z0-9_-]{10,80}$/.test(id)) {
      return NextResponse.json({ error: 'ID de audio inválido' }, { status: 400 });
    }

    const range = request.headers.get('range');
    const fetchHeaders = {
      'User-Agent': 'Mozilla/5.0',
    };
    if (range) fetchHeaders['Range'] = range;

    // Endpoint directo de Google Drive que evita la pantalla intermedia de descarga
    let driveRes = await fetch(
      `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`,
      { headers: fetchHeaders, redirect: 'follow' }
    );

    const contentType = driveRes.headers.get('content-type') || '';
    if (!driveRes.ok || contentType.includes('text/html')) {
      driveRes = await fetch(
        `https://drive.google.com/uc?export=download&id=${id}`,
        { headers: fetchHeaders, redirect: 'follow' }
      );
    }

    const finalType = driveRes.headers.get('content-type') || '';
    if (!driveRes.ok || finalType.includes('text/html')) {
      return NextResponse.json(
        { error: 'No se pudo cargar el audio. Verifica que el MP3 en Drive sea público.' },
        { status: 404 }
      );
    }

    const responseHeaders = new Headers();
    responseHeaders.set(
      'Content-Type',
      finalType.startsWith('audio/') ? finalType : 'audio/mpeg'
    );
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Cache-Control', 'public, max-age=86400');

    const contentLength = driveRes.headers.get('content-length');
    if (contentLength) responseHeaders.set('Content-Length', contentLength);

    const contentRange = driveRes.headers.get('content-range');
    if (contentRange) responseHeaders.set('Content-Range', contentRange);

    return new NextResponse(driveRes.body, {
      status: driveRes.status === 206 ? 206 : 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Error en /api/audio:', error);
    return NextResponse.json({ error: 'Error interno al reproducir audio' }, { status: 500 });
  }
}