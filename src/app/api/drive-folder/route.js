import { NextResponse } from 'next/server';

const EXTENSIONES_VIDEO = /\.(mp4|mov|webm|mkv|avi|m4v)$/i;
const EXTENSIONES_IMAGEN = /\.(jpg|jpeg|png|webp|gif|heic|heif|bmp|tiff?)$/i;
const EXTENSIONES_IGNORAR = /\.(zip|rar|7z|pdf|mp3|wav|m4a|aac|txt|doc|docx|xls|xlsx|psd|ai|raw|cr2|cr3|arw|dng)$/i;
const REGEX_CARPETA_FOTOS = /foto|photo|imag|galer|album|álbum|sesi[oó]n|retrato/i;
const REGEX_CARPETA_SOLO_VIDEO = /^(videos?|reels?|film|clips?|pel[ií]cula)$/i;

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

function filtrarArchivos(archivos, soloFotos) {
  return soloFotos ? archivos.filter((a) => !a.esVideo) : archivos;
}

function priorizarSubcarpetas(subcarpetas, soloFotos) {
  if (!Array.isArray(subcarpetas) || subcarpetas.length === 0) return [];
  if (!soloFotos) return subcarpetas.slice(0, 5);

  // Si buscamos solo fotos, priorizamos carpetas llamadas "Fotos", "Photos", etc. y evitamos "Videos"
  const deFotos = subcarpetas.filter((s) => REGEX_CARPETA_FOTOS.test(s.nombre || ''));
  if (deFotos.length > 0) return deFotos.slice(0, 4);

  const sinVideos = subcarpetas.filter((s) => !REGEX_CARPETA_SOLO_VIDEO.test((s.nombre || '').trim()));
  return (sinVideos.length > 0 ? sinVideos : subcarpetas).slice(0, 4);
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
        subcarpetas.push({ id: file.id, nombre: file.name || 'Subcarpeta' });
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

async function leerConDriveApi(folderId, resourceKey, apiKey, soloFotos) {
  const raiz = await listarCarpetaApiV3(folderId, resourceKey, apiKey);
  if (!raiz.ok) return raiz;

  let todos = filtrarArchivos(raiz.archivos, soloFotos);
  let carpetaUsada = null;

  if (todos.length === 0 && raiz.subcarpetas.length > 0) {
    const candidatas = priorizarSubcarpetas(raiz.subcarpetas, soloFotos);
    const nombresUsados = [];

    for (const sub of candidatas) {
      const subRes = await listarCarpetaApiV3(sub.id, null, apiKey);
      const encontrados = subRes.ok ? filtrarArchivos(subRes.archivos, soloFotos) : [];
      if (encontrados.length > 0) {
        todos = todos.concat(encontrados);
        nombresUsados.push(sub.nombre);
      }
    }
    if (nombresUsados.length > 0) carpetaUsada = nombresUsados.join(', ');
  }

  return {
    ok: true,
    status: 200,
    archivos: ordenarNatural(todos),
    carpetaUsada,
    teniaSubcarpetas: raiz.subcarpetas.length > 0,
  };
}

// ==========================================================
// CAPA 2: EMBEDDEDFOLDERVIEW + ENTRADA AUTOMÁTICA A SUBCARPETAS
// ==========================================================
async function leerEmbeddedDirecto(folderId, resourceKey) {
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

  if (response.url?.includes('accounts.google.com')) {
    return { ok: false, privada: true, status: 403, archivos: [], subcarpetas: [] };
  }
  if (!response.ok) {
    return { ok: false, privada: false, status: response.status, archivos: [], subcarpetas: [] };
  }

  const html = await response.text();
  if (html.includes('accounts.google.com/ServiceLogin') || html.includes('Sign in - Google Accounts')) {
    return { ok: false, privada: true, status: 403, archivos: [], subcarpetas: [] };
  }

  const archivosMap = new Map();
  const subcarpetas = [];

  const bloques = html.split(/id="entry-/).slice(1);
  for (const bloque of bloques) {
    const idMatch = bloque.match(/^([a-zA-Z0-9_-]+)"/);
    if (!idMatch) continue;
    const fileId = idMatch[1];
    if (!fileId || fileId === folderId) continue;

    const titleMatch = bloque.match(/<div class="flip-entry-title">([^<]+)<\/div>/);
    const nombre = titleMatch ? titleMatch[1].trim() : '';

    if (
      bloque.includes('drive.google.com/drive/folders/') ||
      bloque.includes('drive.google.com/folderview') ||
      bloque.includes('/folders/' + fileId)
    ) {
      subcarpetas.push({ id: fileId, nombre: nombre || 'Subcarpeta' });
      continue;
    }

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
    archivos: Array.from(archivosMap.values()),
    subcarpetas,
  };
}

async function leerConEmbeddedView(folderId, resourceKey, soloFotos) {
  const raiz = await leerEmbeddedDirecto(folderId, resourceKey);
  if (!raiz.ok) return raiz;

  let todos = filtrarArchivos(raiz.archivos, soloFotos);
  let carpetaUsada = null;

  if (todos.length === 0 && raiz.subcarpetas.length > 0) {
    const candidatas = priorizarSubcarpetas(raiz.subcarpetas, soloFotos);
    const nombresUsados = [];

    for (const sub of candidatas) {
      const subRes = await leerEmbeddedDirecto(sub.id, null);
      const encontrados = subRes.ok ? filtrarArchivos(subRes.archivos, soloFotos) : [];
      if (encontrados.length > 0) {
        todos = todos.concat(encontrados);
        nombresUsados.push(sub.nombre);
      }
    }
    if (nombresUsados.length > 0) carpetaUsada = nombresUsados.join(', ');
  }

  return {
    ok: true,
    privada: false,
    status: 200,
    archivos: ordenarNatural(todos),
    carpetaUsada,
    teniaSubcarpetas: raiz.subcarpetas.length > 0,
  };
}

// ==========================================================
// CAPA 3: PÁGINA PÚBLICA /drive/folders/ + SUBCARPETAS
// ==========================================================
async function leerPaginaPublicaDirecta(folderId, resourceKey) {
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
    return { ok: false, privada: true, status: 403, archivos: [], subcarpetas: [] };
  }
  if (!response.ok) {
    return { ok: false, privada: false, status: response.status, archivos: [], subcarpetas: [] };
  }

  const rawHtml = await response.text();
  if (rawHtml.includes('accounts.google.com/ServiceLogin')) {
    return { ok: false, privada: true, status: 403, archivos: [], subcarpetas: [] };
  }

  const decodificado = rawHtml
    .replace(/\\x22/g, '"')
    .replace(/\\u0022/g, '"')
    .replace(/\\"/g, '"')
    .replace(/\\x5b/g, '[')
    .replace(/\\x5d/g, ']')
    .replace(/\\x2f/g, '/')
    .replace(/\\\//g, '/')
    .replace(/\\u0026/g, '&')
    .replace(/\\u003d/g, '=');

  const archivosMap = new Map();
  const subcarpetasMap = new Map();

  const regexDriveMeta =
    /"([a-zA-Z0-9_-]{20,60})"\s*,\s*(?:\[[^\]]*\]|null)\s*,\s*"([^"\\]+)"\s*,\s*"([^"\\]+)"/g;

  let match;
  while ((match = regexDriveMeta.exec(decodificado)) !== null) {
    const fileId = match[1];
    const nombre = match[2].trim();
    const mime = match[3].toLowerCase();

    if (!fileId || fileId === folderId) continue;

    if (mime === 'application/vnd.google-apps.folder') {
      subcarpetasMap.set(fileId, { id: fileId, nombre });
    } else if (mime.startsWith('image/')) {
      archivosMap.set(fileId, construirItem(fileId, nombre, false));
    } else if (mime.startsWith('video/')) {
      archivosMap.set(fileId, construirItem(fileId, nombre, true));
    }
  }

  return {
    ok: true,
    privada: false,
    status: 200,
    archivos: Array.from(archivosMap.values()),
    subcarpetas: Array.from(subcarpetasMap.values()),
  };
}

async function leerConPaginaPublica(folderId, resourceKey, soloFotos) {
  const raiz = await leerPaginaPublicaDirecta(folderId, resourceKey);
  if (!raiz.ok) return raiz;

  let todos = filtrarArchivos(raiz.archivos, soloFotos);
  let carpetaUsada = null;

  if (todos.length === 0 && raiz.subcarpetas.length > 0) {
    const candidatas = priorizarSubcarpetas(raiz.subcarpetas, soloFotos);
    const nombresUsados = [];

    for (const sub of candidatas) {
      const subRes = await leerPaginaPublicaDirecta(sub.id, null);
      const encontrados = subRes.ok ? filtrarArchivos(subRes.archivos, soloFotos) : [];
      if (encontrados.length > 0) {
        todos = todos.concat(encontrados);
        nombresUsados.push(sub.nombre);
      }
    }
    if (nombresUsados.length > 0) carpetaUsada = nombresUsados.join(', ');
  }

  return {
    ok: true,
    privada: false,
    status: 200,
    archivos: ordenarNatural(todos),
    carpetaUsada,
    teniaSubcarpetas: raiz.subcarpetas.length > 0,
  };
}

export async function POST(request) {
  try {
    const { folderUrl, soloFotos = false } = await request.json();
    const { folderId, resourceKey } = extraerInfoCarpeta(folderUrl);

    if (!folderId) {
      return NextResponse.json(
        { error: 'El enlace no parece ser una carpeta válida de Google Drive.' },
        { status: 400 }
      );
    }

    let teniaSubcarpetas = false;
    let bloqueadaPorPrivacidad = false;

    // 1. Capa oficial con GOOGLE_DRIVE_API_KEY (si está configurada en Vercel)
    const apiKey = process.env.GOOGLE_DRIVE_API_KEY?.trim();
    if (apiKey) {
      const resApi = await leerConDriveApi(folderId, resourceKey, apiKey, soloFotos);
      if (resApi.ok && resApi.archivos.length > 0) {
        return NextResponse.json({
          ok: true,
          origen: 'drive-api',
          folderId,
          carpetaUsada: resApi.carpetaUsada,
          total: resApi.archivos.length,
          archivos: resApi.archivos,
        });
      }
      if (resApi.teniaSubcarpetas) teniaSubcarpetas = true;
    }

    // 2. Capa embeddedfolderview (con entrada automática a subcarpetas)
    const resEmbed = await leerConEmbeddedView(folderId, resourceKey, soloFotos);
    if (resEmbed.ok && resEmbed.archivos.length > 0) {
      return NextResponse.json({
        ok: true,
        origen: 'embedded',
        folderId,
        carpetaUsada: resEmbed.carpetaUsada,
        total: resEmbed.archivos.length,
        archivos: resEmbed.archivos,
      });
    }
    if (resEmbed.teniaSubcarpetas) teniaSubcarpetas = true;
    if (resEmbed.privada) bloqueadaPorPrivacidad = true;

    // 3. Capa página pública /drive/folders/ (con entrada automática a subcarpetas)
    const resPublica = await leerConPaginaPublica(folderId, resourceKey, soloFotos);
    if (resPublica.ok && resPublica.archivos.length > 0) {
      return NextResponse.json({
        ok: true,
        origen: 'public-html',
        folderId,
        carpetaUsada: resPublica.carpetaUsada,
        total: resPublica.archivos.length,
        archivos: resPublica.archivos,
      });
    }
    if (resPublica.teniaSubcarpetas) teniaSubcarpetas = true;
    if (resPublica.privada) bloqueadaPorPrivacidad = true;

    if (bloqueadaPorPrivacidad) {
      return NextResponse.json(
        {
          error:
            'La carpeta está restringida en Google Drive. Entra a Drive → Compartir → cambia Acceso General a "Cualquier persona con el enlace" (Lector) y vuelve a intentar.',
        },
        { status: 403 }
      );
    }

    if (teniaSubcarpetas) {
      return NextResponse.json(
        {
          error:
            'Se detectaron subcarpetas pero no se pudieron leer las fotos internas. Pega directamente el link de la subcarpeta de FOTOS en el campo del Álbum Digital y asegúrate de que esté en "Cualquier persona con el enlace".',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: apiKey
          ? 'No se encontraron fotografías en esta carpeta. Verifica que tenga permiso "Cualquier persona con el enlace" y contenga imágenes.'
          : 'Google bloqueó la lectura directa desde Vercel o la carpeta no es pública. Verifica "Cualquier persona con el enlace" (y si persiste, agrega GOOGLE_DRIVE_API_KEY gratuita en Vercel para quitar bloqueos de Google).',
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