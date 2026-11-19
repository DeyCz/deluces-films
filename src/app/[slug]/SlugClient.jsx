"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  ArrowLeft, Play, X, ChevronLeft, ChevronRight,
  FolderOpen, Camera, Video, Send, Images, Sparkles
} from 'lucide-react';
import Link from 'next/link';

const NUMERO_WHATSAPP = '51967576214';

const infoCategorias = {
  'institucional': {
    titulo: 'Eventos Institucionales',
    subtitulo: 'Cobertura corporativa, promociones escolares, graduaciones y ceremonias oficiales.',
    etiqueta: 'INSTITUCIONAL',
  },
  'parejas': {
    titulo: 'Sesión de Fotos de Pareja',
    subtitulo: 'Retratos naturales, complicidad y atardeceres al aire libre.',
    etiqueta: 'PAREJAS',
  },
  'publicidad': {
    titulo: 'Publicidad para Negocios',
    subtitulo: 'Reels estratégicos y spots comerciales diseñados para elevar tus ventas.',
    etiqueta: 'PUBLICIDAD',
  },
  'revelacion-genero': {
    titulo: 'Revelación de Género & Sociales',
    subtitulo: 'Emoción, 15 años, cumpleaños y momentos inolvidables en familia.',
    etiqueta: 'SOCIALES',
  },
  'fiestas-patronales': {
    titulo: 'Fiestas Patronales',
    subtitulo: 'Tradición, comparsas, color y devoción capturados con estética cinematográfica.',
    etiqueta: 'TRADICIÓN',
  },
  'videoclips': {
    titulo: 'Videoclips y Grupos de Baile',
    subtitulo: 'Producción musical, dirección de cámaras y edición rítmica profesional.',
    etiqueta: 'VIDEOCLIPS',
  },
  'invitaciones-virtuales': {
    titulo: 'Invitaciones Virtuales',
    subtitulo: 'Videos animados y personalizados listos para compartir por WhatsApp.',
    etiqueta: 'INVITACIONES',
  },
  'personal': {
    titulo: 'Fotos y Videos Personales',
    subtitulo: 'Retratos artísticos, cuadros de promoción y fotografía deportiva.',
    etiqueta: 'PERSONAL',
  },
};

// Reescribe cualquier enlace de Drive (incluso los guardados con sz=w1600) al tamaño exacto necesario
const formatearImagenUrl = (url, ancho = 600) => {
  if (!url) return '/institucional.jpg';
  if (url.includes('drive.google.com/file/d/')) {
    const id = url.split('/d/')[1]?.split('/')[0];
    if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w${ancho}`;
  }
  if (url.includes('drive.google.com/thumbnail?id=')) {
    const id = url.split('id=')[1]?.split('&')[0];
    if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w${ancho}`;
  }
  return url;
};

const obtenerLinkEmbed = (url) => {
  if (!url) return null;
  if (url.includes('youtube.com/watch?v=')) {
    const id = url.split('watch?v=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/${id}?rel=0`;
  }
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${id}?rel=0`;
  }
  if (url.includes('youtube.com/shorts/')) {
    const id = url.split('shorts/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${id}?rel=0`;
  }
  if (url.includes('drive.google.com/file/d/')) {
    const id = url.split('/d/')[1]?.split('/')[0];
    return `https://drive.google.com/file/d/${id}/preview`;
  }
  return null;
};

export default function SlugClient({ slug }) {
  const [trabajos, setTrabajos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [carpetaActiva, setCarpetaActiva] = useState(null);
  const [indiceModal, setIndiceModal] = useState(null);
  const [touchStartX, setTouchStartX] = useState(null);

  // Formulario de cotización rápida
  const [nombre, setNombre] = useState('');
  const [mensaje, setMensaje] = useState('');

  const info = infoCategorias[slug] || {
    titulo: 'Portafolio Deluces Films',
    subtitulo: 'Producción fotográfica y audiovisual en alta definición.',
    etiqueta: 'PORTAFOLIO',
  };

  useEffect(() => {
    let activo = true;
    const cargarGaleria = async () => {
      setCargando(true);
      try {
        const q = query(collection(db, 'galerias'), where('slug', '==', slug));
        const snapshot = await getDocs(q);
        if (!activo) return;

        const items = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0));

        setTrabajos(items);
      } catch (error) {
        console.error('Error cargando galería:', error);
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargarGaleria();
    return () => {
      activo = false;
    };
  }, [slug]);

  // Agrupar trabajos por carpeta (institución / evento) si existen carpetas definidas
  const { tieneCarpetas, gruposCarpetas } = useMemo(() => {
    const hayNombradas = trabajos.some((t) => t.carpeta && t.carpeta.trim() !== '');
    if (!hayNombradas) {
      return { tieneCarpetas: false, gruposCarpetas: [] };
    }

    const mapa = new Map();
    trabajos.forEach((item) => {
      const nombreCarpeta =
        item.carpeta && item.carpeta.trim() !== ''
          ? item.carpeta.trim()
          : 'Galería General';
      if (!mapa.has(nombreCarpeta)) {
        mapa.set(nombreCarpeta, []);
      }
      mapa.get(nombreCarpeta).push(item);
    });

    const grupos = Array.from(mapa.entries()).map(([nombreCarpeta, items]) => ({
      nombre: nombreCarpeta,
      items,
      portada: items[0]?.imagenUrl || '/institucional.jpg',
      totalFotos: items.filter((i) => !i.videoUrl).length,
      totalVideos: items.filter((i) => Boolean(i.videoUrl)).length,
      miniaturas: items.slice(0, 4).map((i) => i.imagenUrl),
    }));

    return { tieneCarpetas: true, gruposCarpetas: grupos };
  }, [trabajos]);

  // Lista visible actualmente (o todos si no hay carpetas, o los de la carpeta abierta)
  const trabajosVisibles = useMemo(() => {
    if (!tieneCarpetas) return trabajos;
    if (!carpetaActiva) return [];
    const grupo = gruposCarpetas.find((g) => g.nombre === carpetaActiva);
    return grupo ? grupo.items : [];
  }, [tieneCarpetas, carpetaActiva, gruposCarpetas, trabajos]);

  const trabajoSeleccionado =
    indiceModal !== null ? trabajosVisibles[indiceModal] || null : null;

  const irSiguiente = (e) => {
    if (e) e.stopPropagation();
    if (trabajosVisibles.length <= 1) return;
    setIndiceModal((prev) => (prev + 1) % trabajosVisibles.length);
  };

  const irAnterior = (e) => {
    if (e) e.stopPropagation();
    if (trabajosVisibles.length <= 1) return;
    setIndiceModal((prev) => (prev - 1 + trabajosVisibles.length) % trabajosVisibles.length);
  };

  // Precargar la siguiente imagen en HD (w1600) cuando el visor está abierto
  useEffect(() => {
    if (indiceModal === null || trabajosVisibles.length <= 1) return;
    const siguiente = trabajosVisibles[(indiceModal + 1) % trabajosVisibles.length];
    if (siguiente && !siguiente.videoUrl && siguiente.imagenUrl) {
      const img = new window.Image();
      img.src = formatearImagenUrl(siguiente.imagenUrl, 1600);
    }
  }, [indiceModal, trabajosVisibles]);

  // Controles de teclado en el visor modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (indiceModal === null) return;
      if (e.key === 'ArrowRight') irSiguiente();
      if (e.key === 'ArrowLeft') irAnterior();
      if (e.key === 'Escape') setIndiceModal(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [indiceModal, trabajosVisibles.length]);

  const handleCotizarWhatsApp = (e) => {
    e.preventDefault();
    const texto = `Hola Deluces Films ✨, mi nombre es *${nombre}*.\nVi su portafolio de *${info.titulo}* y me gustaría cotizar este servicio.\n\nDetalles: ${mensaje}`;
    window.open(
      `https://api.whatsapp.com/send?phone=${NUMERO_WHATSAPP}&text=${encodeURIComponent(texto)}`,
      '_blank'
    );
  };

  const mostrarGridCarpetas = tieneCarpetas && !carpetaActiva;

  return (
    <div className="min-h-screen df-bg df-text pb-24">
      {/* BARRA SUPERIOR */}
      <header className="sticky top-0 z-40 df-bg/90 backdrop-blur-md border-b df-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {carpetaActiva ? (
            <button
              type="button"
              onClick={() => {
                setCarpetaActiva(null);
                setIndiceModal(null);
              }}
              className="text-sm font-bold df-text hover:text-amber-600 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} /> Volver a carpetas
            </button>
          ) : (
            <Link
              href="/#portafolio"
              className="text-sm font-bold df-muted hover:df-text flex items-center gap-2 transition-colors"
            >
              <ArrowLeft size={16} /> Volver al Portafolio
            </Link>
          )}

          <a
            href="#cotizar-categoria"
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
          >
            Cotizar Servicio
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-12 space-y-14">
        {/* ENCABEZADO DE LA CATEGORÍA O CARPETA ACTIVA */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-600 bg-amber-600/10 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5">
            <Sparkles size={12} /> {carpetaActiva ? info.titulo : info.etiqueta}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black df-text leading-tight">
            {carpetaActiva || info.titulo}
          </h1>
          <p className="df-muted text-sm sm:text-base">
            {carpetaActiva
              ? `Explora la galería completa de ${carpetaActiva} (${trabajosVisibles.length} archivos). Toca cualquier elemento para verlo en HD.`
              : info.subtitulo}
          </p>
        </div>

        {/* ESTADO DE CARGA (SKELETON LIGERO) */}
        {cargando ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/5] rounded-2xl df-card border df-border animate-pulse"
              />
            ))}
          </div>
        ) : trabajos.length === 0 ? (
          <div className="df-card border df-border rounded-3xl p-12 text-center space-y-3 max-w-xl mx-auto">
            <Images size={36} className="text-amber-600 mx-auto opacity-80" />
            <h2 className="text-xl font-bold df-text">Próximamente nuevos trabajos</h2>
            <p className="text-sm df-muted">
              Estamos actualizando nuestra galería de {info.titulo}. Escríbenos por WhatsApp si deseas ver muestras recientes.
            </p>
          </div>
        ) : mostrarGridCarpetas ? (
          /* ==================================================== */
          /* VISTA 1: TARJETAS DE CARPETAS / INSTITUCIONES        */
          /* ==================================================== */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gruposCarpetas.map((grupo) => (
              <button
                key={grupo.nombre}
                type="button"
                onClick={() => setCarpetaActiva(grupo.nombre)}
                className="group text-left df-card border df-border rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:border-amber-600/50 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col"
              >
                <div className="relative aspect-[4/3] w-full bg-black overflow-hidden">
                  <img
                    src={formatearImagenUrl(grupo.portada, 600)}
                    alt={grupo.nombre}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
                    onError={(e) => {
                      e.currentTarget.src = '/institucional.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                  <div className="absolute top-3.5 left-3.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/15">
                    <FolderOpen size={12} className="text-amber-400" />
                    {grupo.items.length} {grupo.items.length === 1 ? 'archivo' : 'archivos'}
                  </div>

                  {/* Miniaturas circulares rápidas (w120) */}
                  <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between gap-2">
                    <div className="flex -space-x-2">
                      {grupo.miniaturas.map((thumb, idx) => (
                        <div
                          key={idx}
                          className="w-8 h-8 rounded-full overflow-hidden border-2 border-zinc-900 bg-black flex-shrink-0"
                        >
                          <img
                            src={formatearImagenUrl(thumb, 120)}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    <span className="text-[11px] font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
                      Abrir álbum →
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between gap-2">
                  <h2 className="text-lg font-extrabold df-text group-hover:text-amber-600 transition-colors line-clamp-2">
                    {grupo.nombre}
                  </h2>
                  <div className="flex items-center gap-3 text-xs df-muted">
                    {grupo.totalFotos > 0 && (
                      <span className="flex items-center gap-1">
                        <Camera size={13} className="text-amber-600" /> {grupo.totalFotos} fotos
                      </span>
                    )}
                    {grupo.totalVideos > 0 && (
                      <span className="flex items-center gap-1">
                        <Video size={13} className="text-amber-600" /> {grupo.totalVideos} videos
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* ==================================================== */
          /* VISTA 2: CUADRÍCULA DE FOTOS Y VIDEOS (w600)         */
          /* ==================================================== */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {trabajosVisibles.map((trabajo, idx) => {
              const esVideo = Boolean(trabajo.videoUrl);
              return (
                <div
                  key={trabajo.id}
                  onClick={() => setIndiceModal(idx)}
                  className="group relative aspect-[4/5] rounded-2xl overflow-hidden df-card border df-border cursor-pointer shadow-xs hover:shadow-xl transition-all duration-300"
                >
                  <img
                    src={formatearImagenUrl(trabajo.imagenUrl, 600)}
                    alt={trabajo.titulo || `${info.titulo} ${idx + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = '/institucional.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />

                  {esVideo && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-amber-600/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform backdrop-blur-sm">
                        <Play size={20} fill="currentColor" className="ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Insignia limpia sin duplicar nombre de institución */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-black/55 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                      {esVideo ? `VIDEO #${idx + 1}` : `FOTOGRAFÍA #${idx + 1}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FORMULARIO DE COTIZACIÓN PRE-SELECCIONADO */}
        <section
          id="cotizar-categoria"
          className="df-card border df-border rounded-3xl p-6 sm:p-10 shadow-xl max-w-3xl mx-auto"
        >
          <div className="text-center mb-6">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-600">
              Reserva tu fecha
            </span>
            <h2 className="text-2xl sm:text-3xl font-black df-text mt-1">
              ¿Te gustó nuestro trabajo en {info.titulo}?
            </h2>
            <p className="text-xs sm:text-sm df-muted mt-1">
              Escríbenos directamente y te enviamos una propuesta a medida para tu evento.
            </p>
          </div>

          <form onSubmit={handleCotizarWhatsApp} className="space-y-4">
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              placeholder="Tu nombre o institución"
              className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm df-text outline-none focus:border-amber-600"
            />
            <textarea
              rows="3"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              required
              placeholder="Cuéntanos la fecha tentativa, lugar y qué servicio necesitas..."
              className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm df-text outline-none focus:border-amber-600 resize-none"
            />
            <button
              type="submit"
              className="w-full btn-shimmer text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-xl transition-all cursor-pointer"
            >
              <Send size={16} /> Cotizar {info.titulo} por WhatsApp
            </button>
          </form>
        </section>
      </main>

      {/* ==================================================== */}
      {/* VISOR MODAL PANTALLA COMPLETA (HD w1600 + VIDEO 3x)  */}
      {/* ==================================================== */}
      {trabajoSeleccionado && (
        <div
          onClick={() => setIndiceModal(null)}
          onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStartX === null) return;
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (diff > 50) irSiguiente();
            if (diff < -50) irAnterior();
            setTouchStartX(null);
          }}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in"
        >
          {/* Barra superior */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-4 left-4 right-4 flex justify-between items-center z-50"
          >
            <span className="text-xs font-bold text-white/85 bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md">
              {trabajoSeleccionado.videoUrl ? 'Video' : 'Fotografía'} #{indiceModal + 1} de{' '}
              {trabajosVisibles.length}
            </span>

            <button
              type="button"
              onClick={() => setIndiceModal(null)}
              className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Cerrar visor"
            >
              <X size={20} />
            </button>
          </div>

          {/* Botones Anterior / Siguiente */}
          {trabajosVisibles.length > 1 && (
            <>
              <button
                type="button"
                onClick={irAnterior}
                className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/55 hover:bg-black/85 text-white/85 hover:text-white cursor-pointer"
                aria-label="Anterior"
              >
                <ChevronLeft size={26} />
              </button>
              <button
                type="button"
                onClick={irSiguiente}
                className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/55 hover:bg-black/85 text-white/85 hover:text-white cursor-pointer"
                aria-label="Siguiente"
              >
                <ChevronRight size={26} />
              </button>
            </>
          )}

          {/* Contenido Principal: Video (Escalado 300%) o Foto en HD (w1600) */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full flex items-center justify-center px-2 sm:px-10"
          >
            {trabajoSeleccionado.videoUrl && obtenerLinkEmbed(trabajoSeleccionado.videoUrl) ? (
              <div
                className={
                  trabajoSeleccionado.formatoVideo === 'horizontal'
                    ? 'w-full max-w-4xl aspect-video bg-black rounded-2xl sm:rounded-3xl overflow-hidden border border-white/15 shadow-2xl relative'
                    : 'w-full max-w-[330px] sm:max-w-[380px] aspect-[9/16] max-h-[82vh] bg-black rounded-2xl sm:rounded-3xl overflow-hidden border border-white/15 shadow-2xl relative'
                }
              >
                <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
                  <iframe
                    src={obtenerLinkEmbed(trabajoSeleccionado.videoUrl)}
                    style={{
                      position: 'absolute',
                      top: '0%',
                      left: '0%',
                      width: '300%',
                      height: '300%',
                      transform: 'scale(0.333333)',
                      transformOrigin: 'top left',
                    }}
                    className="border-0 bg-black"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="absolute top-0 right-0 z-30 bg-zinc-950/95 backdrop-blur-md border-b border-l border-white/15 px-3.5 py-2 rounded-bl-2xl flex items-center gap-1.5 select-none pointer-events-auto shadow-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[9px] font-bold tracking-widest uppercase text-white/95">
                    Deluces HD
                  </span>
                </div>
              </div>
            ) : (
              <img
                src={formatearImagenUrl(trabajoSeleccionado.imagenUrl, 1600)}
                alt={trabajoSeleccionado.titulo || `Fotografía ${indiceModal + 1}`}
                decoding="async"
                className="max-h-[82vh] w-auto max-w-full object-contain rounded-xl shadow-2xl select-none"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}