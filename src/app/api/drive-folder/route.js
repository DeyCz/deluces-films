import { NextResponse } from 'next/server';

// Extrae el ID de cualquier enlace de carpeta de Google Drive
function extraerFolderId(url) {
  if (!url) return null;
  const matchFolders = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (matchFolders && matchFolders[1]) return matchFolders[1];

  const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId && matchId[1]) return matchId[1];

  return null;
}

export async function POST(request) {
  try {
    const { folderUrl } = await request.json();
    const folderId = extraerFolderId(folderUrl);

    if (!folderId) {
      return NextResponse.json(
        { error: 'El enlace no parece ser una carpeta válida de Google Drive.' },
        { status: 400 }
      );
    }

    // Consultamos la vista ligera de carpetas públicas de Google Drive
    const embedUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;
    const response = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'No se pudo acceder a la carpeta. Asegúrate de que tenga permiso "Cualquier persona con el enlace".' },
        { status: 403 }
      );
    }

    const html = await response.text();
    const archivosMap = new Map();

    // 1. Extraer cada entrada con su ID y nombre de archivo
    const regexEntries = /id="entry-([a-zA-Z0-9_-]+)"[\s\S]*?<div class="flip-entry-title">([^<]+)<\/div>/g;
    let match;
    while ((match = regexEntries.exec(html)) !== null) {
      const fileId = match[1];
      const nombre = match[2].trim();
      if (fileId && fileId !== folderId) {
        const esVideo = /\.(mp4|mov|webm|mkv|avi)$/i.test(nombre);
        archivosMap.set(fileId, {
          id: fileId,
          nombre,
          esVideo,
          imagenUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`,
          videoUrl: esVideo ? `https://drive.google.com/file/d/${fileId}/view` : ''
        });
      }
    }

    // 2. Respaldo por si Google cambia las clases del título
    if (archivosMap.size === 0) {
      const regexSimple = /id="entry-([a-zA-Z0-9_-]+)"/g;
      let idx = 1;
      while ((match = regexSimple.exec(html)) !== null) {
        const fileId = match[1];
        if (fileId && fileId !== folderId && !archivosMap.has(fileId)) {
          archivosMap.set(fileId, {
            id: fileId,
            nombre: `Fotografía #${idx}`,
            esVideo: false,
            imagenUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`,
            videoUrl: ''
          });
          idx++;
        }
      }
    }

    const archivos = Array.from(archivosMap.values());

    if (archivos.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron fotos o la carpeta está privada. Verifica que esté en "Cualquier persona con el enlace".' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      folderId,
      total: archivos.length,
      archivos
    });
  } catch (error) {
    console.error('Error leyendo carpeta de Drive:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error al leer la carpeta de Google Drive.' },
      { status: 500 }
    );
  }
}