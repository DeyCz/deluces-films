"use client";

import React, { useState, useEffect } from 'react';
import { Camera, Video, Film, ArrowLeft, Send, Play, X, Eye, ArrowUp, Sun, Moon, MapPin, Smartphone } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const infoCategorias = {
  'institucional': {
    titulo: 'Eventos Institucionales',
    subtitulo: 'COBERTURA CORPORATIVA Y OFICIAL',
    desc: 'Registro audiovisual de alta calidad para conferencias, aniversarios, ceremonias y eventos corporativos con acabados formales.',
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
    desc: 'Sesiones individuales, books personales y cobertura de momentos especiales con un enfoque artístico y profesional.',
    icono: Camera,
    accent: 'bg-emerald-600/10',
    colorText: 'text-emerald-600',
    formulario: 'Fotos y Videos Personales'
  }
};

export default function SlugClient({ slug }) {
  const [mounted, setMounted] = useState(false);
  const data = infoCategorias[slug];

  // Estados del formulario (iniciando con el valor de la categoría actual si existe)
  const [nombre, setNombre] = useState('');
  const [tipoEvento, setTipoEvento] = useState(data ? data.formulario : '');
  const [mensaje, setMensaje] = useState('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [trabajoSeleccionado, setTrabajoSeleccionado] = useState(null);
  const [showTopBtn, setShowTopBtn] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('isDarkMode') === 'true';
    setIsDarkMode(saved);
  }, []);

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
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowTopBtn(true);
      } else {
        setShowTopBtn(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const goToTop = (e) => {
    if (e) e.preventDefault();
    const startPosition = window.pageYOffset;
    const duration = 1000;
    let startTime = null;

    const animation = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = ease(timeElapsed, startPosition, -startPosition, duration);
      window.scrollTo(0, run);
      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    const ease = (t, b, c, d) => {
      t /= d / 2;
      if (t < 1) return c / 2 * t * t * t + b;
      t -= 2;
      return c / 2 * (t * t * t + 2) + b;
    };

    requestAnimationFrame(animation);
  };

  const abrirModal = (item) => {
    setTrabajoSeleccionado(item);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setTrabajoSeleccionado(null);
  };

  const handleWhatsAppSubmit = (e) => {
    e.preventDefault();
    const numeroWhatsApp = '51967576214';
    const texto = `Hola Deluces Films, mi nombre es ${nombre}.\nEstoy interesado en cotizar un servicio de: *${tipoEvento}*.\n\nDetalles: ${mensaje}`;
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  // Si se ingresa a una URL que no existe en nuestro objeto
  if (!data) {
    return (
      <div className="min-h-screen df-bg df-text flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-bold mb-4">Servicio no encontrado</h1>
        <p className="df-muted mb-8">El área que buscas no está disponible o la URL es incorrecta.</p>
        <Link href="/" className="btn-shimmer text-white px-6 py-3 rounded-xl font-bold">
          Volver al Inicio
        </Link>
      </div>
    );
  }

  const IconComponent = data.icono;

  return (
    <div className="min-h-screen df-bg df-text font-sans relative">
      
      {/* NAVEGACIÓN SECUNDARIA */}
      <nav className="fixed w-full top-0 z-50 df-bg/90 backdrop-blur-md border-b df-border py-4 px-6 md:px-12 flex justify-between items-center shadow-xs transition-colors duration-300">
        <Link href="/#portafolio" className="flex items-center gap-2 text-sm font-bold df-muted hover:df-text transition-colors">
          <ArrowLeft size={18} /> Volver al Portafolio
        </Link>
        <div className="font-bold tracking-wider text-sm md:text-base df-text hidden sm:block uppercase">
          DELUCES FILMS <span className={data.colorText}>/ {data.titulo}</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleDarkMode}
            className="p-2.5 rounded-full df-card border df-border df-text transition-transform hover:scale-110 cursor-pointer"
            aria-label="Cambiar modo"
          >
            {mounted && (isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />)}
          </button>
          <a href="#contacto-servicio" className="btn-shimmer text-white px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all">
            Cotizar
          </a>
        </div>
      </nav>

      {/* CABEZAL DE LA PÁGINA */}
      <header className="pt-32 pb-16 px-6 md:px-12 text-center max-w-4xl mx-auto animate-fade-in">
        <div className={`inline-flex items-center justify-center w-16 h-16 df-card border df-border rounded-2xl mb-6 shadow-md ${data.colorText}`}>
          <IconComponent size={30} />
        </div>
        <p className={`${data.colorText} text-xs font-bold tracking-[0.25em] uppercase mb-3`}>{data.subtitulo}</p>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 df-text">
          {data.titulo}
        </h1>
        <p className="df-muted text-lg max-w-2xl mx-auto font-normal">
          {data.desc}
        </p>
      </header>

      {/* GALERÍA CON ACTIVACIÓN DE VENTANA EMERGENTE */}
      <section className="py-12 px-6 md:px-12 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 df-text">Galería y Muestras</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((item) => (
            <div 
              key={item} 
              onClick={() => abrirModal({ id: item, titulo: `${data.titulo} - Muestra ${item}` })}
              className="group relative aspect-video df-card rounded-2xl overflow-hidden border df-border shadow-xs cursor-pointer flex items-center justify-center transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
            >
              <div className={`absolute inset-0 ${data.accent} opacity-75 group-hover:scale-105 group-hover:opacity-40 transition-all duration-700`} />
              <div className="w-12 h-12 df-bg df-text rounded-full flex items-center justify-center z-10 transform scale-0 group-hover:scale-100 transition-transform duration-300 shadow-lg border df-border">
                <Eye size={20} />
              </div>
              
              <div className="absolute bottom-4 left-4 z-20">
                <span className={`text-[10px] uppercase tracking-wider font-bold text-white px-2.5 py-1 rounded-md shadow-xs ${data.colorText.replace('text-', 'bg-')}`}>
                  Ampliar
                </span>
                <h3 className="text-base font-bold mt-2 df-text">Producción {item}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* VENTANA EMERGENTE (MODAL) ANIMADA */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="df-card border df-border rounded-3xl max-w-3xl w-full p-6 md:p-8 relative shadow-2xl animate-scale-up">
            
            <button 
              onClick={cerrarModal}
              className={`absolute top-6 right-6 df-bg df-text p-2.5 rounded-full transition-all shadow-xs cursor-pointer hover:text-white ${data.colorText.replace('text-', 'hover:bg-')}`}
              aria-label="Cerrar ventana"
            >
              <X size={20} />
            </button>

            <span className={`text-xs uppercase tracking-widest font-bold ${data.colorText} ${data.accent} px-3 py-1 rounded-md inline-block mb-3`}>
              {data.titulo}
            </span>
            <h3 className="text-2xl font-bold df-text mb-4">
              {trabajoSeleccionado?.titulo}
            </h3>

            <div className="aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center text-white relative shadow-inner mb-6">
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 to-slate-800 opacity-90" />
              <div className="relative z-10 text-center p-6">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                  <Play size={28} className="text-white ml-1" />
                </div>
                <p className="text-sm font-medium text-white/80">Vista previa en alta resolución de Deluces Films</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button 
                onClick={cerrarModal}
                className="px-6 py-3 rounded-xl border df-border text-sm font-bold df-muted hover:df-text transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <a 
                href="#contacto-servicio" 
                onClick={cerrarModal}
                className={`px-6 py-3 rounded-xl text-white text-sm font-bold transition-all shadow-md text-center ${data.colorText.replace('text-', 'bg-')} opacity-90 hover:opacity-100`}
              >
                Cotizar proyecto similar
              </a>
            </div>

          </div>
        </div>
      )}

      {/* FORMULARIO DE CONTACTO */}
      <section id="contacto-servicio" className="py-20 px-6 md:px-12 df-card border-y df-border mt-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16">
          <div>
            <p className={`${data.colorText} text-xs font-bold tracking-widest uppercase mb-3`}>COTIZACIÓN RÁPIDA</p>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6 df-text">¿Te interesa este servicio?</h2>
            <p className="df-muted mb-10 text-sm leading-relaxed">
              Completa el formulario y te responderemos por WhatsApp con disponibilidad, opciones de paquetes y precios exactos para tu evento.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4 transition-transform duration-300 hover:translate-x-1">
                <div className="w-12 h-12 df-bg rounded-xl flex items-center justify-center df-text shadow-xs"><Smartphone size={20}/></div>
                <div><p className="text-xs df-muted">WhatsApp Directo</p><p className="font-semibold df-text">+51 967 576 214</p></div>
              </div>
              <div className="flex items-center gap-4 transition-transform duration-300 hover:translate-x-1">
                <div className="w-12 h-12 df-bg rounded-xl flex items-center justify-center df-text shadow-xs"><MapPin size={20}/></div>
                <div><p className="text-xs df-muted">Ubicación de Cobertura</p><p className="font-semibold df-text">Perú</p></div>
              </div>
            </div>
          </div>

          <div className="df-bg p-8 rounded-2xl border df-border shadow-xl">
            <h2 className="text-xl font-bold mb-6 df-text">Cotiza tu servicio de {data.titulo}</h2>
            
            <form onSubmit={handleWhatsAppSubmit} className="space-y-4">
              
              {/* Selector de Tipo de Evento */}
              <div>
                <label className="text-xs font-bold df-muted mb-1.5 block">Tipo de Evento</label>
                <select 
                  value={tipoEvento}
                  onChange={(e) => setTipoEvento(e.target.value)}
                  required
                  className="w-full df-card border df-border rounded-xl px-4 py-3 focus:outline-none focus:border-amber-600 transition-colors df-text text-sm cursor-pointer"
                >
                  <option value="">Selecciona el tipo de evento</option>
                  <option value="Eventos Institucionales">Eventos Institucionales</option>
                  <option value="Sesión de Fotos de Pareja">Sesión de Fotos de Pareja</option>
                  <option value="Publicidad para Negocios">Publicidad para Negocios</option>
                  <option value="Revelación de Género / Sociales">Revelación de Género / Sociales</option>
                  <option value="Fiestas Patronales">Fiestas Patronales</option>
                  <option value="Videoclips y Grupos de Baile">Videoclips y Grupos de Baile</option>
                  <option value="Invitaciones Virtuales">Invitaciones Virtuales</option>
                  <option value="Fotos y Videos Personales">Fotos y Videos Personales</option>
                </select>
              </div>

              {/* Nombre */}
              <div>
                <label className="text-xs font-bold df-muted mb-1.5 block">Tu Nombre / Empresa</label>
                <input 
                  type="text" 
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  className="w-full df-card border df-border rounded-xl px-4 py-3 focus:outline-none focus:border-amber-600 transition-colors df-text text-sm" 
                  placeholder="Ej. Juan Pérez" 
                />
              </div>
              
              {/* Mensaje */}
              <div>
                <label className="text-xs font-bold df-muted mb-1.5 block">Detalles del proyecto</label>
                <textarea 
                  rows="4" 
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  required
                  className="w-full df-card border df-border rounded-xl px-4 py-3 focus:outline-none focus:border-amber-600 transition-colors resize-none df-text text-sm" 
                  placeholder="Cuéntanos la fecha, lugar o cualquier idea que tengas en mente..."
                ></textarea>
              </div>

              <button type="submit" className="w-full btn-shimmer text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-md hover:shadow-xl flex items-center justify-center gap-2 text-sm active:scale-95 cursor-pointer">
                <Send size={18} /> Solicitar Cotización
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* BOTÓN "VOLVER ARRIBA" */}
      {showTopBtn && (
        <button 
          onClick={goToTop}
          className="fixed bottom-24 right-6 z-40 df-card border df-border df-text p-3.5 rounded-full shadow-lg hover:bg-amber-600 hover:text-white transition-all duration-300 animate-fade-in flex items-center justify-center cursor-pointer"
          aria-label="Volver arriba"
        >
          <ArrowUp size={20} />
        </button>
      )}

      {/* WIDGET WHATSAPP */}
      <a 
        href="https://wa.me/51967576214?text=Hola,%20me%20interesa%20cotizar%20un%20servicio%20audiovisual." 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-3.5 rounded-full shadow-2xl whatsapp-pulse transition-all duration-300 flex items-center justify-center group cursor-pointer"
        aria-label="Escríbenos por WhatsApp"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white" className="flex-shrink-0">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448zM12.002 2.15c-5.436 0-9.851 4.415-9.853 9.852-.001 1.872.518 3.704 1.509 5.31l-1.004 3.673 3.766-.988c1.554.948 3.351 1.447 5.182 1.448 5.436 0 9.851-4.415 9.853-9.852.001-5.303-4.315-9.621-9.653-9.623zm5.367 13.916c-.225.635-1.309 1.181-1.801 1.259-.467.074-1.07.135-3.078-.696-2.613-1.088-4.316-3.76-4.448-3.935-.132-.176-1.066-1.417-1.066-2.703 0-1.286.669-1.916.907-2.174.238-.258.519-.323.691-.323.173 0 .346.001.498.008.161.008.379-.061.594.464.226.553.774 1.887.842 2.025.068.138.113.3.023.482-.09.183-.135.297-.27.458-.135.161-.284.36-.406.484-.135.138-.277.288-.12.56.157.272.698 1.155 1.499 1.871 1.033.921 1.904 1.206 2.176 1.344.272.138.432.115.592-.069.16-.184.686-.798.868-1.072.182-.274.364-.229.614-.138.25.092 1.586.748 1.856.884.27.135.45.203.516.315.066.113.066.653-.159 1.288z"/>
        </svg>
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 transition-all duration-500 ease-in-out text-sm font-bold">
          ¡Escríbenos!
        </span>
      </a>

      {/* FOOTER */}
      <footer className="py-8 px-6 border-t df-border text-center df-muted text-xs df-card">
        <p>© 2026 Deluces Films. {data.titulo}.</p>
      </footer>

    </div>
  );
}