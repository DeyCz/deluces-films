import { NextResponse } from 'next/server';

const EXTENSIONES_VIDEO = /\.(mp4|mov|webm|mkv|avi|m4v)$/i;
const EXTENSIONES_IMAGEN = /\.(jpg|jpeg|png|webp|gif|heic|heif|bmp|tiff?)$/i;
const EXTENSIONES_IGNORAR = /\.(zip|rar|7z|pdf|mp3|wav|m4a|aac|txt|doc|docx|xls|xlsx|psd|ai|raw|cr2|cr3|arw|dng)$/i;

function extraerInfoCarpeta(url) {
  if (!url) return { folderId: null, resourceKey: null };
  const limpia = url.trim();

  let folderId = null;
  const matchFolders = limpia.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (matchFolders && matchFolders[1]) {
    folderId = matchFolders[1];
  } else {
    const matchId = limpia.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchId && matchId[1]) folderId = matchId[1];
  }

  const matchRk = limpia.match(/[?&]resourcekey=([a-zA-Z0-9_-]+)/i);
  const resourceKey = matchRk && matchRk[1] ? matchRk[1] : null;

  return { folderId, resourceKey };
}

function ordenarNatural(archivos) {
  return [...archivos].sort((a, b) =>
    (a.nombre || '').localeCompare(b.nombre || '', 'es', {
      numeric: true,
      sensitivity: 'base',
    })
  );
}

function construirItem(fileId, nombre, esVideo) {
  return {
    id: fileId,
    nombre: nombre || 'Archivo',
    esVideo: Boolean(esVideo),
    imagenUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`,
    videoUrl: esVideo ? `https://drive.google.com/file/d/${fileId}/view` : '',
  };
}

// ==========================================================
// CAPA 1: API OFICIAL DE GOOGLE DRIVE v3 (SIN BLOQUEOS + SUBCARPETAS)
// ==========================================================
async function listarCarpetaApiV3(folderId, resourceKey, apiKey) {
  const archivos = [];
  const subcarpetas = [];
  let pageToken = '';

  const headers = {};
  if (resourceKey) {
    headers['X-Goog-Drive-Resource-Keys'] = `${folderId}/${resourceKey}`;
  }

  for (let pagina = 0; pagina < 5; pagina++) {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken,files(id,name,mimeType)',
      pageSize: '1000',
      orderBy: 'name',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
      key: apiKey,
    });
    if (pageToken) params.set('pageToken', pageToken);

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
      { headers, cache: 'no-store' }
    );

    if (!res.ok) {
      return { ok: false, status: res.status, archivos: [], subcarpetas: [] };
    }

    const data = await res.json();
    const files = Array.isArray(data.files) ? data.files : [];

    for (const file of files) {
      const mime = (file.mimeType || '').toLowerCase();
      if (mime === 'application/vnd.google-apps.folder') {
        subcarpetas.push({ id: file.id, nombre: file.name || '' });
      } else if (mime.startsWith('image/')) {
        archivos.push(construirItem(file.id, file.name, false));
      } else if (mime.startsWith('video/')) {
        archivos.push(construirItem(file.id, file.name, true));
      }
    }

    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }

  return { ok: true, status: 200, archivos, subcarpetas };
}

async function leerConDriveApi(folderId, resourceKey, apiKey) {
  const raiz = await listarCarpetaApiV3(folderId, resourceKey, apiKey);
  if (!raiz.ok) return raiz;

  let todos = [...raiz.archivos];

  // Si en la raíz solo hay subcarpetas (ej. "Fotos", "Videos"), entramos automáticamente
  if (todos.length === 0 && raiz.subcarpetas.length > 0) {
    const limiteSubcarpetas = raiz.subcarpetas.slice(0, 6);
    for (const sub of limiteSubcarpetas) {
      const subRes = await listarCarpetaApiV3(sub.id, null, apiKey);
      if (subRes.ok && subRes.archivos.length > 0) {
        todos = todos.concat(subRes.archivos);
      }
    }
  }

  return {
    ok: true,
    status: 200,
    archivos: ordenarNatural(todos),
    teniaSubcarpetas: raiz.subcarpetas.length > 0,
  };
}

// ==========================================================
// CAPA 2: EMBEDDEDFOLDERVIEW MEJORADO (FILTRA SUBCARPETAS Y ZIPS)
// ==========================================================
async function leerConEmbeddedView(folderId, resourceKey) {
  const rk = resourceKey ? `&resourcekey=${encodeURIComponent(resourceKey)}` : '';
  const embedUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}${rk}`;

  const response = await fetch(embedUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-PE,es;q=0.9,en;q=0.8',
    },
    redirect: 'follow',
    cache: 'no-store',
  });

  const esLogin = response.url?.includes('accounts.google.com');
  if (esLogin) {
    return { ok: false, privada: true, status: 403, archivos: [] };
  }
  if (!response.ok) {
    return { ok: false, privada: false, status: response.status, archivos: [] };
  }

  const html = await response.text();
  if (html.includes('accounts.google.com/ServiceLogin') || html.includes('Sign in - Google Accounts')) {
    return { ok: false, privada: true, status: 403, archivos: [] };
  }

  const archivosMap = new Map();
  let encontroSubcarpetas = false;

  // Divide por cada bloque de entrada para saber con precisión si es carpeta o archivo
  const bloques = html.split(/id="entry-/).slice(1);
  for (const bloque of bloques) {
    const idMatch = bloque.match(/^([a-zA-Z0-9_-]+)"/);
    if (!idMatch) continue;
    const fileId = idMatch[1];
    if (!fileId || fileId === folderId) continue;

    // Saltar subcarpetas para no meter links rotos en el álbum
    if (
      bloque.includes('drive.google.com/drive/folders/') ||
      bloque.includes('drive.google.com/folderview') ||
      bloque.includes('/folders/' + fileId)
    ) {
      encontroSubcarpetas = true;
      continue;
    }

    const titleMatch = bloque.match(/<div class="flip-entry-title">([^<]+)<\/div>/);
    const nombre = titleMatch ? titleMatch[1].trim() : '';

    if (nombre && EXTENSIONES_IGNORAR.test(nombre)) continue;

    const esVideo = EXTENSIONES_VIDEO.test(nombre);
    const esImagen = !nombre || EXTENSIONES_IMAGEN.test(nombre) || !esVideo;

    if (esVideo || esImagen) {
      archivosMap.set(fileId, construirItem(fileId, nombre || `Archivo ${archivosMap.size + 1}`, esVideo));
    }
  }

  return {
    ok: true,
    privada: false,
    status: 200,
    archivos: ordenarNatural(Array.from(archivosMap.values())),
    teniaSubcarpetas: encontroSubcarpetas,
  };
}

// ==========================================================
// CAPA 3: RESPALDO CON LA PÁGINA PÚBLICA /drive/folders/
// ==========================================================
async function leerConPaginaPublica(folderId, resourceKey) {
  const rk = resourceKey ? `&resourcekey=${encodeURIComponent(resourceKey)}` : '';
  const publicUrl = `https://drive.google.com/drive/folders/${folderId}?usp=sharing${rk}`;

  const response = await fetch(publicUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-PE,es;q=0.9,en;q=0.8',
    },
    redirect: 'follow',
    cache: 'no-store',
  });

  if (response.url?.includes('accounts.google.com')) {
    return { ok: false, privada: true, status: 403, archivos: [] };
  }
  if (!response.ok) {
    return { ok: false, privada: false, status: response.status, archivos: [] };
  }

  const rawHtml = await response.text();
  if (rawHtml.includes('accounts.google.com/ServiceLogin')) {
    return { ok: false, privada: true, status: 403, archivos: [] };
  }

  // Decodifica escapes hexadecimales del payload interno _DRIVE_ivd de Google Drive
  const decodificado = rawHtml
    .replace(/\\x22/g, '"')
    .replace(/\\x5b/g, '[')
    .replace(/\\x5d/g, ']')
    .replace(/\\x2f/g, '/')
    .replace(/\\\//g, '/')
    .replace(/\\u0026/g, '&');

  const archivosMap = new Map();
  let encontroSubcarpetas = false;

  // Patrón de metadatos reales de Drive: ["FILE_ID",["PARENT_ID"],"NOMBRE","MIME_TYPE"
  const regexDriveMeta =
    /"([a-zA-Z0-9_-]{20,50})"\s*,\s*\["[^"]*"\]\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"/g;

  let match;
  while ((match = regexDriveMeta.exec(decodificado)) !== null) {
    const fileId = match[1];
    const nombre = match[2].trim();
    const mime = match[3].toLowerCase();

    if (!fileId || fileId === folderId) continue;

    if (mime === 'application/vnd.google-apps.folder') {
      encontroSubcarpetas = true;
      continue;
    }

    if (mime.startsWith('image/')) {
      archivosMap.set(fileId, construirItem(fileId, nombre, false));
    } else if (mime.startsWith('video/')) {
      archivosMap.set(fileId, construirItem(fileId, nombre, true));
    }
  }

  return {
    ok: true,
    privada: false,
    status: 200,
    archivos: ordenarNatural(Array.from(archivosMap.values())),
    teniaSubcarpetas: encontroSubcarpetas,
  };
}

export async function POST(request) {
  try {
    const { folderUrl } = await request.json();
    const { folderId, resourceKey } = extraerInfoCarpeta(folderUrl);

    if (!folderId) {
      return NextResponse.json(
        { error: 'El enlace no parece ser una carpeta válida de Google Drive.' },
        { status: 400 }
      );
    }

    let teniaSubcarpetas = false;
    let bloqueadaPorPrivacidad = false;

    // 1. Intentar con API Oficial de Google Drive (si existe GOOGLE_DRIVE_API_KEY en Vercel)
    const apiKey = process.env.GOOGLE_DRIVE_API_KEY?.trim();
    if (apiKey) {
      const resApi = await leerConDriveApi(folderId, resourceKey, apiKey);
      if (resApi.ok && resApi.archivos.length > 0) {
        return NextResponse.json({
          ok: true,
          origen: 'drive-api',
          folderId,
          total: resApi.archivos.length,
          archivos: resApi.archivos,
        });
      }
      if (resApi.teniaSubcarpetas) teniaSubcarpetas = true;
    }

    // 2. Intentar con embeddedfolderview mejorado
    const resEmbed = await leerConEmbeddedView(folderId, resourceKey);
    if (resEmbed.ok && resEmbed.archivos.length > 0) {
      return NextResponse.json({
        ok: true,
        origen: 'embedded',
        folderId,
        total: resEmbed.archivos.length,
        archivos: resEmbed.archivos,
      });
    }
    if (resEmbed.teniaSubcarpetas) teniaSubcarpetas = true;
    if (resEmbed.privada) bloqueadaPorPrivacidad = true;

    // 3. Respaldo con página pública /drive/folders/
    const resPublica = await leerConPaginaPublica(folderId, resourceKey);
    if (resPublica.ok && resPublica.archivos.length > 0) {
      return NextResponse.json({
        ok: true,
        origen: 'public-html',
        folderId,
        total: resPublica.archivos.length,
        archivos: resPublica.archivos,
      });
    }
    if (resPublica.teniaSubcarpetas) teniaSubcarpetas = true;
    if (resPublica.privada) bloqueadaPorPrivacidad = true;

    // Mensajes de diagnóstico claros según el motivo real
    if (teniaSubcarpetas) {
      return NextResponse.json(
        {
          error:
            'Esta carpeta contiene subcarpetas (ej. "Fotos" o "Videos") y no fotos sueltas. Copia y pega el link de la subcarpeta donde están las fotos directamente dentro de la caja del Álbum Digital y vuelve a tocar "Extraer de Drive".',
        },
        { status: 404 }
      );
    }

    if (bloqueadaPorPrivacidad) {
      return NextResponse.json(
        {
          error:
            'La carpeta está restringida en Google Drive. Entra a Drive → Compartir → cambia Acceso General a "Cualquier persona con el enlace" (Lector) y vuelve a intentar.',
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: apiKey
          ? 'No se encontraron fotos o videos en esta carpeta. Verifica que sea pública ("Cualquier persona con el enlace") y que contenga imágenes.'
          : 'Google bloqueó la lectura directa desde el servidor o la carpeta no tiene fotos sueltas. Verifica que esté en "Cualquier persona con el enlace" (o agrega tu GOOGLE_DRIVE_API_KEY gratuita en Vercel para extracción sin límites).',
      },
      { status: 403 }
    );
  } catch (error) {
    console.error('Error leyendo carpeta de Drive:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error al conectar con Google Drive. Inténtalo nuevamente.' },
      { status: 500 }
    );
  }
}