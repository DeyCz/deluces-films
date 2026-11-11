"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Camera, Video, Film, ArrowLeft, Send, Play, X, Eye, ArrowUp, 
  Sun, Moon, MapPin, Smartphone, Lock, ChevronLeft, ChevronRight, 
  FolderOpen, Images, ArrowRight, LayoutGrid
} from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const infoCategorias = {
  'institucional': {
    titulo: 'Eventos Institucionales',
    subtitulo: 'COBERTURA CORPORATIVA Y OFICIAL',
    desc: 'Registro audiovisual de alta calidad para conferencias, promociones escolares, aniversarios, ceremonias y eventos corporativos.',
    icono: Video,
    accent: 'bg-blue-600/10',
    colorText: 'text-blue-600',
    badgeBg: 'bg-blue-600',
    formulario: 'Eventos Institucionales'
  },
  'parejas': {
    titulo: 'Sesión de Fotos de Pareja',
    subtitulo: 'FOTOGRAFÍA ESPECIALIZADA',
    desc: 'Capturamos la complicidad, la naturalidad y la esencia de su relación en locaciones al aire libre y atardeceres inolvidables.',
    icono: Camera,
    accent: 'bg-amber-600/10',
    colorText: 'text-amber-600',
    badgeBg: 'bg-amber-600',
    formulario: 'Sesión de Fotos de Pareja'
  },
  'publicidad': {
    titulo: 'Publicidad para Negocios',
    subtitulo: 'SPOTS COMERCIALES Y DE MARCA',
    desc: 'Creamos contenido visual estratégico para redes sociales y medios digitales que conecta con tus clientes y eleva tus ventas.',
    icono: Film,
    accent: 'bg-indigo-600/10',
    colorText: 'text-indigo-600',
    badgeBg: 'bg-indigo-600',
    formulario: 'Publicidad para Negocios'
  },
  'revelacion-genero': {
    titulo: 'Revelación de Género',
    subtitulo: 'MOMENTOS FAMILIARES ÚNICOS',
    desc: 'Inmortalizamos la emoción y la alegría de ese gran anuncio familiar con un registro lleno de vida y color.',
    icono: Camera,
    accent: 'bg-pink-600/10',
    colorText: 'text-pink-600',
    badgeBg: 'bg-pink-600',
    formulario: 'Revelación de Género / Sociales'
  },
  'fiestas-patronales': {
    titulo: 'Fiestas Patronales',
    subtitulo: 'TRADICIÓN Y COSTUMBRES',
    desc: 'Cobertura completa de festividades, danzas y comparsas con un manejo impecable de la luz y el movimiento.',
    icono: Video,
    accent: 'bg-orange-600/10',
    colorText: 'text-orange-600',
    badgeBg: 'bg-orange-600',
    formulario: 'Fiestas Patronales'
  },
  'videoclips': {
    titulo: 'Videoclips y Grupos de Baile',
    subtitulo: 'PRODUCCIÓN MUSICAL Y ARTÍSTICA',
    desc: 'Edición rítmica, sincronización precisa y estética cinematográfica para artistas, cantantes y agrupaciones de baile.',
    icono: Film,
    accent: 'bg-purple-600/10',
    colorText: 'text-purple-600',
    badgeBg: 'bg-purple-600',
    formulario: 'Videoclips y Grupos de Baile'
  },
  'invitaciones-virtuales': {
    titulo: 'Invitaciones Virtuales',
    subtitulo: 'ANIMACIÓN Y MOTION GRAPHICS',
    desc: 'Sorprende a tus invitados desde el primer segundo con invitaciones en video animadas, modernas y personalizadas.',
    icono: Film,
    accent: 'bg-cyan-600/10',
    colorText: 'text-cyan-600',
    badgeBg: 'bg-cyan-600',
    formulario: 'Invitaciones Virtuales'
  },
  'personal': {
    titulo: 'Fotos y Videos Personales',
    subtitulo: 'RETRATOS Y COBERTURA ÍNTIMA',
    desc: 'Sesiones individuales, cuadros de promoción, fotografía deportiva y cobertura de momentos especiales con enfoque artístico.',
    icono: Camera,
    accent: 'bg-emerald-600/10',
    colorText: 'text-emerald-600',
    badgeBg: 'bg-emerald-600',
    formulario: 'Fotos y Videos Personales'
  }
};

const formatearImagenUrl = (url) => {
  if (!url) return '/institucional.jpg';
  if (url.includes('drive.google.com/file/d/')) {
    const id = url.split('/d/')[1]?.split('/')[0];
    if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w1600`;
  }
  return url;
};

// Elimina el texto redundante cuando el título de la foto repite el nombre de la carpeta
const obtenerTituloLimpio = (foto) => {
  if (!foto) return '';
  const titulo = (foto.titulo || '').trim();
  const carpeta = (foto.carpeta || '').trim();
  if (!titulo) return '';

  if (carpeta && titulo.toLowerCase().startsWith(carpeta.toLowerCase())) {
    const resto = titulo.slice(carpeta.length).trim().replace(/^[-–—•:]+\s*/, '');
    if (!resto || /^#?\d+$/.test(resto)) return '';
    return resto;
  }

  if (/^(fotograf[ií]a|foto|video)\s*#?\d*$/i.test(titulo)) {
    return '';
  }

  return titulo;
};

export default function SlugClient({ slug }) {
  const [mounted, setMounted] = useState(false);
  const data = infoCategorias[slug] || infoCategorias['institucional'];

  const [galeriaFotos, setGaleriaFotos] = useState([]);
  const [cargandoFotos, setCargandoFotos] = useState(true);

  const [carpetaActiva, setCarpetaActiva] = useState(null);

  const [nombre, setNombre] = useState('');
  const [tipoEvento, setTipoEvento] = useState(data ? data.formulario : '');
  const [mensaje, setMensaje] = useState('');

  // Estados del Modal, Navegación y Swipe Táctil
  const [modalAbierto, setModalAbierto] = useState(false);
  const [trabajoSeleccionado, setTrabajoSeleccionado] = useState(null);
  const [indiceActual, setIndiceActual] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('isDarkMode') === 'true';
    setIsDarkMode(saved);

    const fetchGaleria = async () => {
      try {
        const q = query(collection(db, "galerias"), where("slug", "==", slug));
        const querySnapshot = await getDocs(q);
        const fotosList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          orden: Number(doc.data().orden) || 1
        }));
        
        fotosList.sort((a, b) => a.orden - b.orden);
        setGaleriaFotos(fotosList);
      } catch (error) {
        console.error("Error al cargar la galería:", error);
      } finally {
        setCargandoFotos(false);
      }
    };

    if (slug) fetchGaleria();
  }, [slug]);

  useEffect(() => {
    if (!mounted) return;
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('isDarkMode', 'true');
      document.documentElement.classList.add('dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('isDarkMode', 'false');
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode, mounted]);

  useEffect(() => {
    const handleScroll = () => setShowTopBtn(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ==========================================================
  // LÓGICA DE AGRUPACIÓN POR CARPETAS / INSTITUCIONES
  // ==========================================================
  const { usaCarpetas, listaCarpetas } = useMemo(() => {
    const tieneAlgunaCarpeta = galeriaFotos.some(item => item.carpeta && item.carpeta.trim() !== '');
    if (!tieneAlgunaCarpeta) {
      return { usaCarpetas: false, listaCarpetas: [] };
    }

    const mapa = new Map();
    galeriaFotos.forEach(item => {
      const nombreCarpeta = (item.carpeta && item.carpeta.trim() !== '') 
        ? item.carpeta.trim() 
        : 'Galería Destacada';

      if (!mapa.has(nombreCarpeta)) {
        mapa.set(nombreCarpeta, []);
      }
      mapa.get(nombreCarpeta).push(item);
    });

    const arregloCarpetas = Array.from(mapa.entries()).map(([nombre, items]) => {
      const totalVideos = items.filter(i => i.videoUrl).length;
      const totalFotos = items.length - totalVideos;
      return {
        nombre,
        items,
        portada: items[0]?.imagenUrl || '/institucional.jpg',
        miniaturas: items.slice(0, 4).map(i => i.imagenUrl),
        total: items.length,
        totalFotos,
        totalVideos
      };
    });

    return { usaCarpetas: true, listaCarpetas: arregloCarpetas };
  }, [galeriaFotos]);

  const itemsVisibles = useMemo(() => {
    if (!usaCarpetas) return galeriaFotos;
    if (!carpetaActiva) return [];
    const carpetaEncontrada = listaCarpetas.find(c => c.nombre === carpetaActiva);
    return carpetaEncontrada ? carpetaEncontrada.items : [];
  }, [usaCarpetas, carpetaActiva, listaCarpetas, galeriaFotos]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!modalAbierto) return;
      if (e.key === 'ArrowRight') irSiguiente(e);
      if (e.key === 'ArrowLeft') irAnterior(e);
      if (e.key === 'Escape') cerrarModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalAbierto, indiceActual, itemsVisibles]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const goToTop = (e) => {
    if (e) e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const abrirModal = (index) => {
    setIndiceActual(index);
    setTrabajoSeleccionado(itemsVisibles[index]);
    setModalAbierto(true);
  };
  
  const cerrarModal = () => {
    setModalAbierto(false);
    setTrabajoSeleccionado(null);
  };

  const irSiguiente = (e) => {
    if (e) e.stopPropagation();
    if (itemsVisibles.length === 0) return;
    const nuevoIndice = (indiceActual + 1) % itemsVisibles.length;
    setIndiceActual(nuevoIndice);
    setTrabajoSeleccionado(itemsVisibles[nuevoIndice]);
  };

  const irAnterior = (e) => {
    if (e) e.stopPropagation();
    if (itemsVisibles.length === 0) return;
    const nuevoIndice = (indiceActual - 1 + itemsVisibles.length) % itemsVisibles.length;
    setIndiceActual(nuevoIndice);
    setTrabajoSeleccionado(itemsVisibles[nuevoIndice]);
  };

  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStartX === null || itemsVisibles.length <= 1) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 50) irSiguiente();
    if (diff < -50) irAnterior();
    setTouchStartX(null);
  };

  const handleWhatsAppSubmit = (e) => {
    e.preventDefault();
    const texto = `Hola Deluces Films ✨, mi nombre es *${nombre}*.\nEstoy interesado en cotizar un servicio de: *${tipoEvento}*.\n\nDetalles: ${mensaje}`;
    window.open(`https://api.whatsapp.com/send?phone=51967576214&text=${encodeURIComponent(texto)}`, '_blank');
  };

  const obtenerLinkEmbed = (url) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      const id = url.split('watch?v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
    }
    if (url.includes('youtube.com/shorts/')) {
      const id = url.split('shorts/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
    }
    if (url.includes('drive.google.com/file/d/')) {
      const fileId = url.split('/d/')[1]?.split('/')[0];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    return url;
  };

  const IconComponent = data.icono;
  const esVideoHorizontal = trabajoSeleccionado?.formatoVideo === 'horizontal';
  const badgeColorBg = data.badgeBg || 'bg-amber-600';
  const tituloModalLimpio = obtenerTituloLimpio(trabajoSeleccionado);

  return (
    <div className="min-h-screen df-bg df-text font-sans relative">
      <nav className="fixed w-full top-0 z-50 df-bg/90 backdrop-blur-md border-b df-border py-4 px-6 md:px-12 flex justify-between items-center shadow-xs transition-colors duration-300">
        <Link href="/#portafolio" className="flex items-center gap-2 text-sm font-bold df-muted hover:df-text transition-colors">
          <ArrowLeft size={18} /> Volver al Portafolio
        </Link>
        <div className="font-bold tracking-wider text-sm md:text-base df-text hidden sm:block uppercase">
          DELUCES FILMS <span className={data.colorText}>/ {data.titulo}</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleDarkMode} className="p-2.5 rounded-full df-card border df-border df-text transition-transform hover:scale-110 cursor-pointer">
            {mounted && (isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />)}
          </button>
          <a href="#contacto-servicio" className="btn-shimmer text-white px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all">Cotizar</a>
        </div>
      </nav>

      <header className="pt-32 pb-12 px-6 md:px-12 text-center max-w-4xl mx-auto animate-fade-in">
        <div className={`inline-flex items-center justify-center w-16 h-16 df-card border df-border rounded-2xl mb-6 shadow-md ${data.colorText}`}>
          <IconComponent size={30} />
        </div>
        <p className={`${data.colorText} text-xs font-bold tracking-[0.25em] uppercase mb-3`}>{data.subtitulo}</p>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 df-text">{data.titulo}</h1>
        <p className="df-muted text-lg max-w-2xl mx-auto font-normal">{data.desc}</p>
      </header>

      <section className="py-8 px-6 md:px-12 max-w-6xl mx-auto">
        {/* ENCABEZADO DINÁMICO DE SECCIÓN */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold df-text flex items-center gap-2.5">
              {usaCarpetas && !carpetaActiva ? (
                <>
                  <FolderOpen size={24} className="text-amber-600" />
                  Álbumes por Institución / Evento
                </>
              ) : usaCarpetas && carpetaActiva ? (
                <>
                  <FolderOpen size={24} className="text-amber-600 flex-shrink-0" />
                  <span>{carpetaActiva}</span>
                </>
              ) : (
                'Muestras del Servicio'
              )}
            </h2>
            <p className="text-xs df-muted mt-1">
              {usaCarpetas && !carpetaActiva 
                ? 'Selecciona una carpeta para explorar las fotografías de cada institución.'
                : usaCarpetas && carpetaActiva 
                  ? `${itemsVisibles.length} archivos en este álbum • Toca cualquiera para ampliar.`
                  : 'Haz clic en cualquier elemento para visualizarlo en pantalla completa.'}
            </p>
          </div>

          {usaCarpetas && carpetaActiva ? (
            <button
              onClick={() => setCarpetaActiva(null)}
              className="df-card border df-border hover:border-amber-600 df-text px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer w-fit flex-shrink-0"
            >
              <LayoutGrid size={15} className="text-amber-600" />
              Ver todas las carpetas ({listaCarpetas.length})
            </button>
          ) : (
            <span className="text-xs df-muted uppercase tracking-wider font-semibold">
              {usaCarpetas ? `${listaCarpetas.length} Carpetas Disponibles` : 'Portafolio Web'}
            </span>
          )}
        </div>

        {/* BARRA RÁPIDA DE PESTAÑAS DE CARPETAS */}
        {usaCarpetas && carpetaActiva && listaCarpetas.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 custom-scrollbar">
            <button
              onClick={() => setCarpetaActiva(null)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold df-card border df-border df-muted hover:df-text flex items-center gap-1.5 flex-shrink-0 cursor-pointer transition-all"
            >
              <ArrowLeft size={14} /> Todas
            </button>
            {listaCarpetas.map((carpeta) => {
              const activa = carpeta.nombre === carpetaActiva;
              return (
                <button
                  key={carpeta.nombre}
                  onClick={() => setCarpetaActiva(carpeta.nombre)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 flex-shrink-0 cursor-pointer transition-all ${
                    activa 
                      ? 'bg-amber-600 text-white border-amber-600 shadow-md' 
                      : 'df-card df-border df-text hover:border-amber-600/50'
                  }`}
                >
                  <FolderOpen size={14} />
                  <span>{carpeta.nombre}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activa ? 'bg-black/25 text-white' : 'df-bg df-muted'}`}>
                    {carpeta.total}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* CONTENIDO PRINCIPAL */}
        {cargandoFotos ? (
          <div className="text-center py-12 df-muted text-sm">Cargando portafolio desde la nube...</div>
        ) : galeriaFotos.length === 0 ? (
          <div className="df-card border df-border p-12 rounded-3xl text-center">
            <p className="df-muted text-sm">Pronto agregaremos muestras exclusivas para esta categoría.</p>
          </div>
        ) : usaCarpetas && !carpetaActiva ? (
          /* ========================================================== */
          /* DISEÑO DE CARPETAS / ÁLBUMES APILADOS                      */
          /* ========================================================== */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
            {listaCarpetas.map((carpeta, idx) => (
              <div
                key={idx}
                onClick={() => setCarpetaActiva(carpeta.nombre)}
                className="group relative cursor-pointer pt-3"
              >
                <div className="absolute top-0 left-6 right-6 h-40 rounded-3xl df-card border df-border opacity-50 transform -translate-y-2 scale-95 group-hover:-translate-y-4 group-hover:rotate-2 transition-all duration-500 z-0 shadow-sm overflow-hidden">
                  {carpeta.miniaturas[2] && (
                    <img src={formatearImagenUrl(carpeta.miniaturas[2])} alt="" className="w-full h-full object-cover opacity-40" />
                  )}
                </div>
                <div className="absolute top-1.5 left-3 right-3 h-40 rounded-3xl df-card border df-border opacity-75 transform -translate-y-1 scale-[0.98] group-hover:-translate-y-2.5 group-hover:-rotate-1 transition-all duration-500 z-0 shadow-md overflow-hidden">
                  {carpeta.miniaturas[1] && (
                    <img src={formatearImagenUrl(carpeta.miniaturas[1])} alt="" className="w-full h-full object-cover opacity-50" />
                  )}
                </div>

                <div className="relative h-[330px] df-card rounded-3xl overflow-hidden border df-border shadow-lg group-hover:shadow-2xl group-hover:border-amber-600/60 transition-all duration-500 z-10 flex flex-col justify-between bg-black">
                  <img
                    src={formatearImagenUrl(carpeta.portada)}
                    alt={carpeta.nombre}
                    className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 z-0"
                    loading="lazy"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/20 z-10" />

                  <div className="relative z-20 p-5 flex justify-between items-start">
                    <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-amber-400 bg-black/60 border border-amber-500/40 px-3 py-1.5 rounded-full backdrop-blur-md shadow-sm">
                      <FolderOpen size={13} className="text-amber-400" />
                      Álbum
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/15 border border-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                      <Images size={13} />
                      {carpeta.total} {carpeta.total === 1 ? 'foto' : 'fotos'}
                    </span>
                  </div>

                  <div className="relative z-20 p-6">
                    <p className="text-[10px] uppercase tracking-widest text-amber-400 font-bold mb-1">
                      {data.titulo}
                    </p>
                    <h3 className="text-lg md:text-xl font-extrabold text-white leading-snug drop-shadow-md group-hover:text-amber-400 transition-colors line-clamp-2">
                      {carpeta.nombre}
                    </h3>

                    <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between">
                      <div className="flex items-center -space-x-2 overflow-hidden">
                        {carpeta.miniaturas.slice(0, 3).map((thumb, i) => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-black overflow-hidden bg-gray-800 flex-shrink-0">
                            <img src={formatearImagenUrl(thumb)} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {carpeta.total > 3 && (
                          <div className="w-8 h-8 rounded-full border-2 border-black bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            +{carpeta.total - 3}
                          </div>
                        )}
                      </div>

                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white group-hover:translate-x-1 transition-transform">
                        Abrir álbum <ArrowRight size={15} className="text-amber-400" />
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ========================================================== */
          /* CUADRÍCULA DE FOTOS LIMPIA                                 */
          /* ========================================================== */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {itemsVisibles.map((foto, index) => {
              const tituloPersonalizado = obtenerTituloLimpio(foto);
              return (
                <div 
                  key={foto.id} 
                  onClick={() => abrirModal(index)}
                  className="group relative h-[280px] df-card rounded-2xl overflow-hidden border df-border shadow-xs cursor-pointer flex items-center justify-center transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 bg-black"
                >
                  <img 
                    src={formatearImagenUrl(foto.imagenUrl)} 
                    alt={tituloPersonalizado || `Fotografía #${index + 1}`} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 z-0 opacity-90 group-hover:opacity-100" 
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300 z-10" />
                  
                  {foto.videoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                      <div className="w-14 h-14 bg-amber-600/90 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                        <Play fill="currentColor" size={24} className="ml-1" />
                      </div>
                    </div>
                  )}
                  
                  <div className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Eye size={18} />
                  </div>
                  
                  <div className="absolute bottom-4 left-4 right-4 z-20">
                    <span className={`text-[10px] uppercase tracking-wider font-bold text-white px-2.5 py-1 rounded-md shadow-xs ${badgeColorBg}`}>
                      {foto.videoUrl ? `Video #${index + 1}` : `Fotografía #${index + 1}`}
                    </span>
                    {tituloPersonalizado && (
                      <h3 className="text-base font-bold mt-2 text-white drop-shadow-md line-clamp-1">
                        {tituloPersonalizado}
                      </h3>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================== */}
      {/* MODAL DE VIDEO Y FOTO PROFESIONAL (OPTIMIZADO PARA MÓVIL)  */}
      {/* ========================================================== */}
      {modalAbierto && (
        <div 
          onClick={cerrarModal}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between md:justify-center p-3 sm:p-6 animate-fade-in overflow-y-auto"
        >
          {/* Barra Superior en Celular / Botón Cerrar */}
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="w-full max-w-4xl flex items-center justify-between md:justify-end z-50 pt-1 pb-2 md:pb-0 md:absolute md:top-5 md:right-6"
          >
            <div className="flex items-center gap-2 md:hidden bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[11px] font-bold text-white/90 tracking-wide">
                {indiceActual + 1} de {itemsVisibles.length}
              </span>
            </div>

            <button 
              onClick={cerrarModal} 
              className="text-white/80 hover:text-white p-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full transition-colors cursor-pointer"
              aria-label="Cerrar visor"
            >
              <X size={20} strokeWidth={2} />
            </button>
          </div>

          {/* Flechas Laterales en PC / Pantallas grandes */}
          {itemsVisibles.length > 1 && (
            <>
              <button 
                onClick={irAnterior}
                className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 z-50 text-white/80 hover:text-white p-3 bg-white/10 hover:bg-amber-600 border border-white/15 rounded-full backdrop-blur-md transition-all cursor-pointer"
              >
                <ChevronLeft size={26} strokeWidth={2} />
              </button>
              <button 
                onClick={irSiguiente}
                className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-50 text-white/80 hover:text-white p-3 bg-white/10 hover:bg-amber-600 border border-white/15 rounded-full backdrop-blur-md transition-all cursor-pointer"
              >
                <ChevronRight size={26} strokeWidth={2} />
              </button>
            </>
          )}

          {/* Contenedor Central Multimedia */}
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative w-full max-w-sm md:max-w-4xl mx-auto flex flex-col items-center justify-center my-auto"
          >
            <div className="w-full flex justify-center items-center">
              {trabajoSeleccionado?.videoUrl ? (
                <div 
                  className={
                    esVideoHorizontal 
                      ? "w-full max-w-3xl aspect-video rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] ring-1 ring-white/20 bg-black relative"
                      : "w-[80vw] max-w-[320px] md:max-w-[350px] aspect-[9/16] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.95)] ring-1 ring-white/20 bg-black relative"
                  }
                >
                  {/* Escalado Virtual 2x -> 0.5x: Hace que Google Drive dibuje controles finos y proporcionales sin recortar ni tapar el centro del video */}
                  <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
                    <iframe 
                      key={trabajoSeleccionado.id || indiceActual}
                      src={obtenerLinkEmbed(trabajoSeleccionado.videoUrl)} 
                      style={{
                        position: 'absolute',
                        top: '-1%',
                        left: '-2%',
                        width: '204%',
                        height: '202%',
                        transform: 'scale(0.5)',
                        transformOrigin: 'top left',
                      }}
                      className="border-0 bg-black"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>

                  {/* Insignia superior derecha que cubre el botón gris [↗] de Google Drive */}
                  <div className="absolute top-2.5 right-2.5 z-30 bg-black/85 backdrop-blur-md border border-white/15 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 select-none pointer-events-auto">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[9px] font-bold tracking-widest uppercase text-white/90">
                      Deluces HD
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative flex items-center justify-center">
                  <img 
                    src={formatearImagenUrl(trabajoSeleccionado?.imagenUrl)} 
                    alt={tituloModalLimpio || trabajoSeleccionado?.carpeta || data.titulo} 
                    className="max-h-[62vh] md:max-h-[72vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl ring-1 ring-white/15 select-none"
                  />
                </div>
              )}
            </div>

            {/* Tarjeta Inferior Elegante con Navegación Móvil y Botón Sólido */}
            <div className="mt-4 w-full max-w-[340px] md:max-w-2xl bg-zinc-900/90 border border-white/10 p-4 rounded-2xl backdrop-blur-md shadow-2xl flex flex-col md:flex-row items-center justify-between gap-3.5">
              
              <div className="w-full md:w-auto flex items-center justify-between md:block text-left">
                {itemsVisibles.length > 1 && (
                  <button
                    onClick={irAnterior}
                    className="md:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer flex-shrink-0"
                    aria-label="Anterior"
                  >
                    <ChevronLeft size={18} />
                  </button>
                )}

                <div className="text-center md:text-left px-2 md:px-0 min-w-0 flex-1">
                  {tituloModalLimpio && trabajoSeleccionado?.carpeta && (
                    <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold block mb-0.5 truncate">
                      📁 {trabajoSeleccionado.carpeta}
                    </span>
                  )}
                  <h3 className="text-sm md:text-lg font-bold text-white tracking-wide truncate">
                    {tituloModalLimpio || trabajoSeleccionado?.carpeta || data.titulo}
                  </h3>
                  <div className="flex items-center justify-center md:justify-start gap-2 mt-0.5">
                    <p className="text-[10px] text-amber-400/90 uppercase tracking-widest font-semibold">
                      {trabajoSeleccionado?.videoUrl ? (esVideoHorizontal ? 'Video Horizontal HD' : 'Reel / Video Vertical') : `Fotografía #${indiceActual + 1}`}
                    </p>
                    <span className="text-xs text-white/30">•</span>
                    <p className="text-[10px] text-white/60 font-medium">
                      {indiceActual + 1} de {itemsVisibles.length}
                    </p>
                  </div>
                </div>

                {itemsVisibles.length > 1 && (
                  <button
                    onClick={irSiguiente}
                    className="md:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer flex-shrink-0"
                    aria-label="Siguiente"
                  >
                    <ChevronRight size={18} />
                  </button>
                )}
              </div>
              
              <a 
                href="#contacto-servicio" 
                onClick={cerrarModal} 
                className="w-full md:w-auto btn-shimmer bg-amber-600 hover:bg-amber-500 px-6 py-3 rounded-xl text-white text-xs md:text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
              >
                <Send size={15} /> Cotizar este servicio
              </a>
            </div>

          </div>

          <div className="h-1 md:hidden" />
        </div>
      )}

      {/* FORMULARIO CONTACTO */}
      <section id="contacto-servicio" className="py-20 px-6 md:px-12 df-card border-y df-border mt-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16">
          <div>
            <p className={`${data.colorText} text-xs font-bold tracking-widest uppercase mb-3`}>COTIZACIÓN RÁPIDA</p>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6 df-text">¿Te interesa este servicio?</h2>
            <p className="df-muted mb-10 text-sm leading-relaxed">Completa el formulario y te responderemos por WhatsApp con disponibilidad, opciones de paquetes y precios exactos para tu evento.</p>
            <div className="space-y-6">
              <div className="flex items-center gap-4 transition-transform duration-300 hover:translate-x-1">
                <div className="w-12 h-12 df-bg rounded-xl flex items-center justify-center df-text shadow-xs"><Smartphone size={20}/></div>
                <div><p className="text-xs df-muted">WhatsApp Directo</p><p className="font-semibold df-text">+51 967 576 214</p></div>
              </div>
              <div className="flex items-center gap-4 transition-transform duration-300 hover:translate-x-1">
                <div className="w-12 h-12 df-bg rounded-xl flex items-center justify-center df-text shadow-xs"><MapPin size={20}/></div>
                <div><p className="text-xs df-muted">Ubicación de Cobertura</p><p className="font-semibold df-text">Cerro de Pasco · Lima · Todo el Perú</p></div>
              </div>
            </div>
          </div>

          <div className="df-bg p-8 rounded-2xl border df-border shadow-xl">
            <h2 className="text-xl font-bold mb-6 df-text">Cotiza tu servicio de {data.titulo}</h2>
            <form onSubmit={handleWhatsAppSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold df-muted mb-1.5 block">Tipo de Evento</label>
                <select value={tipoEvento} onChange={(e) => setTipoEvento(e.target.value)} required className="w-full df-card border df-border rounded-xl px-4 py-3 focus:outline-none focus:border-amber-600 transition-colors df-text text-sm cursor-pointer">
                  <option value="">Selecciona el tipo de evento</option>
                  <option value="Eventos Institucionales">Eventos Institucionales</option>
                  <option value="Promociones y Eventos Escolares">Promociones y Eventos Escolares</option>
                  <option value="Eventos Sociales / 15 Años / Cumpleaños">Eventos Sociales / 15 Años / Cumpleaños</option>
                  <option value="Sesión de Fotos de Pareja">Sesión de Fotos de Pareja</option>
                  <option value="Publicidad para Negocios">Publicidad para Negocios</option>
                  <option value="Fotografía Deportiva">Fotografía Deportiva</option>
                  <option value="Revelación de Género / Sociales">Revelación de Género / Sociales</option>
                  <option value="Fiestas Patronales">Fiestas Patronales</option>
                  <option value="Videoclips y Grupos de Baile">Videoclips y Grupos de Baile</option>
                  <option value="Invitaciones Virtuales">Invitaciones Virtuales</option>
                  <option value="Fotos y Videos Personales">Fotos y Videos Personales</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold df-muted mb-1.5 block">Tu Nombre / Institución / Empresa</label>
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="w-full df-card border df-border rounded-xl px-4 py-3 focus:outline-none focus:border-amber-600 transition-colors df-text text-sm" placeholder="Ej. Juan Pérez / I.E. Almirante Grau" />
              </div>
              <div>
                <label className="text-xs font-bold df-muted mb-1.5 block">Detalles del proyecto</label>
                <textarea rows="4" value={mensaje} onChange={(e) => setMensaje(e.target.value)} required className="w-full df-card border df-border rounded-xl px-4 py-3 focus:outline-none focus:border-amber-600 transition-colors resize-none df-text text-sm" placeholder="Cuéntanos la fecha, lugar o cualquier idea..."></textarea>
              </div>
              <button type="submit" className="w-full btn-shimmer text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-2 text-sm cursor-pointer"><Send size={18} /> Solicitar Cotización</button>
            </form>
          </div>
        </div>
      </section>

      {showTopBtn && (
        <button onClick={goToTop} className="fixed bottom-24 right-6 z-40 df-card border df-border df-text p-3.5 rounded-full shadow-lg hover:bg-amber-600 hover:text-white transition-all duration-300 flex items-center justify-center cursor-pointer">
          <ArrowUp size={20} />
        </button>
      )}

      {/* BOTÓN FLOTANTE: ÁREA PRIVADA */}
      <Link 
        href="/clientes" 
        className="fixed bottom-6 left-6 z-50 bg-black/95 dark:bg-white/95 backdrop-blur-md border border-white/20 dark:border-black/20 pl-2 pr-4 py-2 rounded-full shadow-2xl flex items-center gap-3 transition-transform duration-300 hover:scale-105 cursor-pointer"
      >
        <div className="bg-amber-600 rounded-full p-2 relative">
          <span className="absolute inset-0 rounded-full bg-amber-600 animate-ping opacity-50"></span>
          <Lock size={16} className="text-white relative z-10" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[9px] text-amber-500 font-bold uppercase tracking-widest leading-none mb-0.5">
            ¿TIENES UN CÓDIGO?
          </span>
          <span className="text-xs font-bold text-white dark:text-black tracking-wide leading-none">
            Descarga tu material
          </span>
        </div>
      </Link>

      <a href="https://api.whatsapp.com/send?phone=51967576214&text=Hola,%20me%20interesa%20cotizar%20un%20servicio%20audiovisual." target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-3.5 rounded-full shadow-2xl whatsapp-pulse transition-all duration-300 flex items-center justify-center group cursor-pointer">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white" className="flex-shrink-0"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448zM12.002 2.15c-5.436 0-9.851 4.415-9.853 9.852-.001 1.872.518 3.704 1.509 5.31l-1.004 3.673 3.766-.988c1.554.948 3.351 1.447 5.182 1.448 5.436 0 9.851-4.415 9.853-9.852.001-5.303-4.315-9.621-9.653-9.623zm5.367 13.916c-.225.635-1.309 1.181-1.801 1.259-.467.074-1.07.135-3.078-.696-2.613-1.088-4.316-3.76-4.448-3.935-.132-.176-1.066-1.417-1.066-2.703 0-1.286.669-1.916.907-2.174.238-.258.519-.323.691-.323.173 0 .346.001.498.008.161.008.379-.061.594.464.226.553.774 1.887.842 2.025.068.138.113.3.023.482-.09.183-.135.297-.27.458-.135.161-.284.36-.406.484-.135.138-.277.288-.12.56.157.272.698 1.155 1.499 1.871 1.033.921 1.904 1.206 2.176 1.344.272.138.432.115.592-.069.16-.184.686-.798.868-1.072.182-.274.364-.229.614-.138.25.092 1.586.748 1.856.884.27.135.45.203.516.315.066.113.066.653-.159 1.288z"/></svg>
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 transition-all duration-500 text-sm font-bold">¡Escríbenos!</span>
      </a>

      {/* FOOTER CON BOTÓN SECRETO */}
      <footer className="py-8 px-6 border-t df-border text-center df-muted text-xs df-card">
        <p 
          onClick={() => {
            window.adminClicks = (window.adminClicks || 0) + 1;
            if (window.adminClicks === 3) {
              window.adminClicks = 0;
              window.location.href = '/gestion-deluces';
            }
            setTimeout(() => { window.adminClicks = 0; }, 1500);
          }}
          className="cursor-default select-none inline-block hover:text-amber-500/80 transition-colors"
        >
          © 2026 Deluces Films. {data.titulo}.
        </p>
      </footer>
    </div>
  );
}