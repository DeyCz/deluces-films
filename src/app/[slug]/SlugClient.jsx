"use client";

import React, { useState, useEffect } from 'react';
import { Camera, Video, Film, ArrowLeft, Send, Play, X, Eye, ArrowUp, Sun, Moon, MapPin, Smartphone, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
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
    formulario: 'Eventos Institucionales'
  },
  'parejas': {
    titulo: 'Sesión de Fotos de Pareja',
    subtitulo: 'FOTOGRAFÍA ESPECIALIZADA',
    desc: 'Capturamos la complicidad, la naturalidad y la esencia de su relación en locaciones al aire libre y atardeceres inolvidables.',
    icono: Camera,
    accent: 'bg-amber-600/10',
    colorText: 'text-amber-600',
    formulario: 'Sesión de Fotos de Pareja'
  },
  'publicidad': {
    titulo: 'Publicidad para Negocios',
    subtitulo: 'SPOTS COMERCIALES Y DE MARCA',
    desc: 'Creamos contenido visual estratégico para redes sociales y medios digitales que conecta con tus clientes y eleva tus ventas.',
    icono: Film,
    accent: 'bg-indigo-600/10',
    colorText: 'text-indigo-600',
    formulario: 'Publicidad para Negocios'
  },
  'revelacion-genero': {
    titulo: 'Revelación de Género',
    subtitulo: 'MOMENTOS FAMILIARES ÚNICOS',
    desc: 'Inmortalizamos la emoción y la alegría de ese gran anuncio familiar con un registro lleno de vida y color.',
    icono: Camera,
    accent: 'bg-pink-600/10',
    colorText: 'text-pink-600',
    formulario: 'Revelación de Género / Sociales'
  },
  'fiestas-patronales': {
    titulo: 'Fiestas Patronales',
    subtitulo: 'TRADICIÓN Y COSTUMBRES',
    desc: 'Cobertura completa de festividades, danzas y comparsas con un manejo impecable de la luz y el movimiento.',
    icono: Video,
    accent: 'bg-orange-600/10',
    colorText: 'text-orange-600',
    formulario: 'Fiestas Patronales'
  },
  'videoclips': {
    titulo: 'Videoclips y Grupos de Baile',
    subtitulo: 'PRODUCCIÓN MUSICAL Y ARTÍSTICA',
    desc: 'Edición rítmica, sincronización precisa y estética cinematográfica para artistas, cantantes y agrupaciones de baile.',
    icono: Film,
    accent: 'bg-purple-600/10',
    colorText: 'text-purple-600',
    formulario: 'Videoclips y Grupos de Baile'
  },
  'invitaciones-virtuales': {
    titulo: 'Invitaciones Virtuales',
    subtitulo: 'ANIMACIÓN Y MOTION GRAPHICS',
    desc: 'Sorprende a tus invitados desde el primer segundo con invitaciones en video animadas, modernas y personalizadas.',
    icono: Film,
    accent: 'bg-cyan-600/10',
    colorText: 'text-cyan-600',
    formulario: 'Invitaciones Virtuales'
  },
  'personal': {
    titulo: 'Fotos y Videos Personales',
    subtitulo: 'RETRATOS Y COBERTURA ÍNTIMA',
    desc: 'Sesiones individuales, cuadros de promoción, fotografía deportiva y cobertura de momentos especiales con enfoque artístico.',
    icono: Camera,
    accent: 'bg-emerald-600/10',
    colorText: 'text-emerald-600',
    formulario: 'Fotos y Videos Personales'
  }
};

// Convierte links compartidos de Drive en miniatura directa si fuera necesario
const formatearImagenUrl = (url) => {
  if (!url) return '/institucional.jpg';
  if (url.includes('drive.google.com/file/d/')) {
    const id = url.split('/d/')[1]?.split('/')[0];
    if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w1600`;
  }
  return url;
};

export default function SlugClient({ slug }) {
  const [mounted, setMounted] = useState(false);
  const data = infoCategorias[slug] || infoCategorias['institucional'];

  const [galeriaFotos, setGaleriaFotos] = useState([]);
  const [cargandoFotos, setCargandoFotos] = useState(true);

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

  // Control por teclado para la galería (Izquierda, Derecha, Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!modalAbierto) return;
      if (e.key === 'ArrowRight') irSiguiente(e);
      if (e.key === 'ArrowLeft') irAnterior(e);
      if (e.key === 'Escape') cerrarModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalAbierto, indiceActual, galeriaFotos]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const goToTop = (e) => {
    if (e) e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Funciones de la Galería
  const abrirModal = (index) => {
    setIndiceActual(index);
    setTrabajoSeleccionado(galeriaFotos[index]);
    setModalAbierto(true);
  };
  
  const cerrarModal = () => {
    setModalAbierto(false);
    setTrabajoSeleccionado(null);
  };

  const irSiguiente = (e) => {
    if (e) e.stopPropagation();
    const nuevoIndice = (indiceActual + 1) % galeriaFotos.length;
    setIndiceActual(nuevoIndice);
    setTrabajoSeleccionado(galeriaFotos[nuevoIndice]);
  };

  const irAnterior = (e) => {
    if (e) e.stopPropagation();
    const nuevoIndice = (indiceActual - 1 + galeriaFotos.length) % galeriaFotos.length;
    setIndiceActual(nuevoIndice);
    setTrabajoSeleccionado(galeriaFotos[nuevoIndice]);
  };

  // Soporte para deslizar con el dedo en celulares (Swipe)
  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStartX === null || galeriaFotos.length <= 1) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 50) irSiguiente();
    if (diff < -50) irAnterior();
    setTouchStartX(null);
  };

  const handleWhatsAppSubmit = (e) => {
    e.preventDefault();
    const texto = `Hola Deluces Films ✨, mi nombre es *${nombre}*.\nEstoy interesado en cotizar un servicio de: *${tipoEvento}*.\n\nDetalles: ${mensaje}`;
    window.open(`https://wa.me/51967576214?text=${encodeURIComponent(texto)}`, '_blank');
  };

  // FUNCIÓN DE EMBED COMPATIBLE CON YOUTUBE, SHORTS Y GOOGLE DRIVE
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

      <header className="pt-32 pb-16 px-6 md:px-12 text-center max-w-4xl mx-auto animate-fade-in">
        <div className={`inline-flex items-center justify-center w-16 h-16 df-card border df-border rounded-2xl mb-6 shadow-md ${data.colorText}`}>
          <IconComponent size={30} />
        </div>
        <p className={`${data.colorText} text-xs font-bold tracking-[0.25em] uppercase mb-3`}>{data.subtitulo}</p>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 df-text">{data.titulo}</h1>
        <p className="df-muted text-lg max-w-2xl mx-auto font-normal">{data.desc}</p>
      </header>

      <section className="py-12 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold df-text">Muestras del Servicio</h2>
          <span className="text-xs df-muted uppercase tracking-wider">Portafolio Web</span>
        </div>

        {cargandoFotos ? (
          <div className="text-center py-12 df-muted text-sm">Cargando portafolio desde la nube...</div>
        ) : galeriaFotos.length === 0 ? (
          <div className="df-card border df-border p-12 rounded-3xl text-center">
            <p className="df-muted text-sm">Pronto agregaremos muestras exclusivas para esta categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galeriaFotos.map((foto, index) => (
              <div 
                key={foto.id} 
                onClick={() => abrirModal(index)}
                className="group relative h-[280px] df-card rounded-2xl overflow-hidden border df-border shadow-xs cursor-pointer flex items-center justify-center transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 bg-black"
              >
                <img 
                  src={formatearImagenUrl(foto.imagenUrl)} 
                  alt={foto.titulo} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 z-0 opacity-80 group-hover:opacity-100" 
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300 z-10" />
                
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
                  <span className={`text-[10px] uppercase tracking-wider font-bold text-white px-2.5 py-1 rounded-md shadow-xs ${data.colorText.replace('text-', 'bg-')}`}>
                    {foto.videoUrl ? 'Video' : 'Fotografía'}
                  </span>
                  <h3 className="text-base font-bold mt-2 text-white drop-shadow-md">{foto.titulo}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODAL MULTIMEDIA OPTIMIZADO (Soporta Vertical 9:16 y Horizontal 16:9 sin recortar controles) */}
      {modalAbierto && (
        <div 
          onClick={cerrarModal}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 md:p-6 animate-fade-in overflow-y-auto"
        >
          <button onClick={cerrarModal} className="absolute top-4 right-4 z-50 text-white/70 hover:text-white p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer">
            <X size={20} strokeWidth={2} />
          </button>

          {galeriaFotos.length > 1 && (
            <>
              <button 
                onClick={irAnterior}
                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-50 text-white/70 hover:text-white p-2.5 bg-black/50 hover:bg-black/80 rounded-full backdrop-blur-sm transition-all cursor-pointer"
              >
                <ChevronLeft size={24} strokeWidth={2} />
              </button>
              <button 
                onClick={irSiguiente}
                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-50 text-white/70 hover:text-white p-2.5 bg-black/50 hover:bg-black/80 rounded-full backdrop-blur-sm transition-all cursor-pointer"
              >
                <ChevronRight size={24} strokeWidth={2} />
              </button>
            </>
          )}

          <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-sm md:max-w-4xl mx-auto flex flex-col items-center my-auto">
            
            <div className="w-full flex justify-center items-center">
              {trabajoSeleccionado?.videoUrl ? (
                <div 
                  className={
                    esVideoHorizontal 
                      ? "w-full max-w-3xl aspect-video rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/15 bg-black relative"
                      : "w-full max-w-[290px] md:max-w-[360px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/15 bg-black relative"
                  }
                >
                  <iframe 
                    src={obtenerLinkEmbed(trabajoSeleccionado.videoUrl)} 
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : (
                <div className="relative">
                  <img 
                    src={formatearImagenUrl(trabajoSeleccionado?.imagenUrl)} 
                    alt={trabajoSeleccionado?.titulo} 
                    className="max-h-[65vh] md:max-h-[72vh] w-auto max-w-full object-contain rounded-lg shadow-2xl ring-1 ring-white/10 select-none"
                  />
                </div>
              )}
            </div>

            <div className="mt-4 md:mt-6 w-full flex flex-col md:flex-row items-center justify-between gap-4 px-2 bg-black/40 md:bg-transparent p-3 md:p-0 rounded-xl backdrop-blur-sm md:backdrop-blur-none">
              <div className="text-center md:text-left">
                <h3 className="text-base md:text-xl font-bold text-white tracking-wide">
                  {trabajoSeleccionado?.titulo}
                </h3>
                <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                  <p className="text-[10px] text-white/50 uppercase tracking-[0.15em] font-medium">
                    {trabajoSeleccionado?.videoUrl ? (esVideoHorizontal ? 'Video Horizontal HD' : 'Reel / Video Vertical') : 'Fotografía'}
                  </p>
                  <span className="text-xs text-white/30">•</span>
                  <p className="text-[10px] text-white/50 font-medium">
                    {indiceActual + 1} / {galeriaFotos.length}
                  </p>
                </div>
              </div>
              
              <a 
                href="#contacto-servicio" 
                onClick={cerrarModal} 
                className={`px-5 py-2.5 rounded-xl text-white text-xs md:text-sm font-bold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 cursor-pointer ${data.colorText.replace('text-', 'bg-')}`}
              >
                Cotizar este servicio
              </a>
            </div>

          </div>
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
                <label className="text-xs font-bold df-muted mb-1.5 block">Tu Nombre / Empresa</label>
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="w-full df-card border df-border rounded-xl px-4 py-3 focus:outline-none focus:border-amber-600 transition-colors df-text text-sm" placeholder="Ej. Juan Pérez" />
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

      <a href="https://wa.me/51967576214?text=Hola,%20me%20interesa%20cotizar%20un%20servicio%20audiovisual." target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-3.5 rounded-full shadow-2xl whatsapp-pulse transition-all duration-300 flex items-center justify-center group cursor-pointer">
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