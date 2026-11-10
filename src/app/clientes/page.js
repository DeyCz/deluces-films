"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { 
  Lock, LogOut, Download, ArrowLeft, Eye, EyeOff, Play, Pause,
  Film, FolderOpen, X, Heart, ChevronLeft, ChevronRight, Share2, Send, Sparkles
} from 'lucide-react';
import Link from 'next/link';

const formatearImagenDrive = (url) => {
  if (!url) return '/institucional.jpg';
  if (url.includes('drive.google.com/file/d/')) {
    const id = url.split('/d/')[1]?.split('/')[0];
    if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w1600`;
  }
  return url;
};

// Genera link de descarga directa si la foto viene de Google Drive
const obtenerLinkDescargaFoto = (url) => {
  if (!url) return '#';
  if (url.includes('drive.google.com/thumbnail?id=')) {
    const id = url.split('id=')[1]?.split('&')[0];
    if (id) return `https://drive.google.com/uc?export=download&id=${id}`;
  }
  if (url.includes('drive.google.com/file/d/')) {
    const id = url.split('/d/')[1]?.split('/')[0];
    if (id) return `https://drive.google.com/uc?export=download&id=${id}`;
  }
  return url;
};

const obtenerEmbedVideo = (url) => {
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

export default function AreaClientes() {
  const [passwordInput, setPasswordInput] = useState('');
  const [mostrarPass, setMostrarPass] = useState(false);
  const [clienteActual, setClienteActual] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);
  const [videoActivo, setVideoActivo] = useState(null);

  // Estados del Álbum Digital Interactivo
  const [favoritas, setFavoritas] = useState([]);
  const [soloFavoritas, setSoloFavoritas] = useState(false);
  const [fotoModalIndex, setFotoModalIndex] = useState(null);
  const [modoPresentacion, setModoPresentacion] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);

  // Cargar sesión o autologin desde ?code=
  useEffect(() => {
    const savedClient = sessionStorage.getItem('deluces_cliente_actual');
    if (savedClient) {
      try {
        const parsed = JSON.parse(savedClient);
        setClienteActual(parsed);
        const savedFavs = localStorage.getItem(`favs_${parsed.password}`);
        if (savedFavs) setFavoritas(JSON.parse(savedFavs));
      } catch (e) {
        sessionStorage.removeItem('deluces_cliente_actual');
      }
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const codeParam = params.get('code');
      if (codeParam) {
        setPasswordInput(codeParam);
        buscarClientePorCodigo(codeParam);
      }
    }
  }, []);

  const buscarClientePorCodigo = async (codigo) => {
    const codigoLimpio = codigo.trim();
    if (!codigoLimpio) return;

    setCargando(true);
    setError(false);

    try {
      const qExacto = query(collection(db, "clientes"), where("password", "==", codigoLimpio));
      const snapExacto = await getDocs(qExacto);

      let datosEncontrados = null;
      if (!snapExacto.empty) {
        datosEncontrados = snapExacto.docs[0].data();
      } else {
        const todosSnap = await getDocs(collection(db, "clientes"));
        const coincidencia = todosSnap.docs.find(
          (d) => (d.data().password || '').trim().toLowerCase() === codigoLimpio.toLowerCase()
        );
        if (coincidencia) datosEncontrados = coincidencia.data();
      }

      if (datosEncontrados) {
        setClienteActual(datosEncontrados);
        sessionStorage.setItem('deluces_cliente_actual', JSON.stringify(datosEncontrados));
        const savedFavs = localStorage.getItem(`favs_${datosEncontrados.password}`);
        setFavoritas(savedFavs ? JSON.parse(savedFavs) : []);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Error buscando cliente:", err);
      setError(true);
    } finally {
      setCargando(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    await buscarClientePorCodigo(passwordInput);
  };

  const cerrarSesionCliente = () => {
    setClienteActual(null);
    setVideoActivo(null);
    setFotoModalIndex(null);
    setModoPresentacion(false);
    sessionStorage.removeItem('deluces_cliente_actual');
  };

  const fotosDelAlbum = Array.isArray(clienteActual?.albumFotos) ? clienteActual.albumFotos : [];

  // Guardar / quitar foto favorita (❤️)
  const toggleFavorita = (indexFoto, e) => {
    if (e) e.stopPropagation();
    const nuevasFavs = favoritas.includes(indexFoto)
      ? favoritas.filter(i => i !== indexFoto)
      : [...favoritas, indexFoto].sort((a, b) => a - b);
    
    setFavoritas(nuevasFavs);
    if (clienteActual?.password) {
      localStorage.setItem(`favs_${clienteActual.password}`, JSON.stringify(nuevasFavs));
    }
  };

  // Enviar selección de fotos favoritas por WhatsApp (ideal para Cuadros / Álbum físico)
  const enviarFavoritasWhatsApp = () => {
    const numerosFotos = favoritas.map(idx => `Foto #${idx + 1}`).join(', ');
    const texto = `¡Hola Deluces Films! 📸✨ Soy de *${clienteActual.nombreCliente}*.\nHe revisado mi Álbum Digital y estas son mis *${favoritas.length} fotos favoritas* seleccionadas (para cuadro / impresión / retoque):\n\n❤️ *Selección:* ${numerosFotos}`;
    window.open(`https://wa.me/51967576214?text=${encodeURIComponent(texto)}`, '_blank');
  };

  // Compartir galería con familiares por WhatsApp
  const compartirConFamilia = () => {
    const urlDirecta = `https://deluces-films.vercel.app/clientes?code=${encodeURIComponent(clienteActual.password)}`;
    const texto = `¡Mira las fotos y videos de *${clienteActual.nombreCliente}* capturados por Deluces Films! 📸🎬\n\nIngresa aquí para ver el álbum digital:\n👉 ${urlDirecta}\n🔑 Código: ${clienteActual.password}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  // Navegación del Visor de Álbum (Lightbox)
  const irFotoSiguiente = (e) => {
    if (e) e.stopPropagation();
    if (fotosDelAlbum.length === 0) return;
    setFotoModalIndex(prev => (prev + 1) % fotosDelAlbum.length);
  };

  const irFotoAnterior = (e) => {
    if (e) e.stopPropagation();
    if (fotosDelAlbum.length === 0) return;
    setFotoModalIndex(prev => (prev - 1 + fotosDelAlbum.length) % fotosDelAlbum.length);
  };

  // Efecto Modo Presentación Automática (Slideshow)
  useEffect(() => {
    if (!modoPresentacion || fotoModalIndex === null || fotosDelAlbum.length <= 1) return;
    const timer = setInterval(() => {
      setFotoModalIndex(prev => (prev + 1) % fotosDelAlbum.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [modoPresentacion, fotoModalIndex, fotosDelAlbum.length]);

  // Teclado en el Álbum
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (fotoModalIndex === null) return;
      if (e.key === 'ArrowRight') irFotoSiguiente();
      if (e.key === 'ArrowLeft') irFotoAnterior();
      if (e.key === 'Escape') {
        setFotoModalIndex(null);
        setModoPresentacion(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fotoModalIndex, fotosDelAlbum.length]);

  // VISTA DE LOGIN
  if (!clienteActual) {
    return (
      <div className="min-h-screen df-bg flex items-center justify-center p-6 relative">
        <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-sm df-muted hover:df-text transition-all">
          <ArrowLeft size={16} /> Volver al sitio
        </Link>

        <form onSubmit={handleLogin} className="df-card p-8 rounded-3xl border df-border w-full max-w-md shadow-2xl text-center">
          <div className="w-16 h-16 bg-amber-600/10 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold df-text mb-2">Acceso a Tu Galería</h1>
          <p className="df-muted text-sm mb-6">Ingresa el código proporcionado por Deluces Films.</p>
          
          <div className="relative mb-4">
            <input 
              type={mostrarPass ? "text" : "password"} 
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setError(false); }}
              className="w-full df-card border df-border rounded-xl px-10 py-3 text-center font-bold tracking-widest text-lg focus:border-amber-600 outline-none df-text"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setMostrarPass(!mostrarPass)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 df-muted hover:df-text transition-colors cursor-pointer"
            >
              {mostrarPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-xs mb-4 font-semibold">Código incorrecto. Verifica tus datos o escríbenos por WhatsApp.</p>
          )}

          <button type="submit" disabled={cargando} className="w-full bg-amber-600 text-white font-bold py-3.5 rounded-xl hover:bg-amber-700 transition-all cursor-pointer text-sm shadow-md">
            {cargando ? 'Abriendo tu álbum...' : 'Ingresar'}
          </button>
        </form>
      </div>
    );
  }

  const entregables = [
    ...(clienteActual.driveLink ? [{ titulo: 'Carpeta Principal / Archivos en Alta Definición', url: clienteActual.driveLink }] : []),
    ...(Array.isArray(clienteActual.enlacesExtra) ? clienteActual.enlacesExtra.filter(item => item?.url) : [])
  ];

  // VISTA DE CLIENTE AUTENTICADO
  return (
    <div className="min-h-screen df-bg pt-12 pb-20 px-6">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* BARRA SUPERIOR */}
        <div className="flex justify-between items-center">
          <button onClick={cerrarSesionCliente} className="text-sm df-muted hover:df-text flex items-center gap-2 cursor-pointer">
            <ArrowLeft size={16} /> Cambiar código
          </button>
          <div className="flex items-center gap-4">
            <button onClick={compartirConFamilia} className="text-xs font-bold text-amber-600 hover:text-amber-500 flex items-center gap-1.5 cursor-pointer">
              <Share2 size={15} /> Compartir con familia
            </button>
            <button onClick={cerrarSesionCliente} className="text-sm df-muted hover:text-red-500 flex items-center gap-1.5 cursor-pointer transition-colors">
              <LogOut size={16} /> Salir
            </button>
          </div>
        </div>

        {/* ENCABEZADO */}
        <div>
          <span className="text-xs uppercase tracking-widest font-bold text-amber-600">Bienvenido/a a tu Entrega Digital</span>
          <h1 className="text-3xl md:text-5xl font-black df-text mt-1">{clienteActual.nombreCliente}</h1>
          <p className="df-muted text-sm mt-1">{clienteActual.tipo} • {clienteActual.fecha}</p>
        </div>

        {/* VITRINA DE DESCARGAS Y VIDEOS */}
        <div className="df-card border df-border rounded-3xl overflow-hidden shadow-2xl">
          <div className="h-64 md:h-80 w-full bg-gray-900 relative">
            <img 
              src={formatearImagenDrive(clienteActual.previewImage)} 
              alt={clienteActual.nombreCliente} 
              className="w-full h-full object-cover opacity-80"
              onError={(e) => { e.currentTarget.src = '/institucional.jpg'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <div className="absolute bottom-6 left-6 md:left-8 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold bg-amber-600 px-3 py-1 rounded-full">
                  Deluces Films • HD
                </span>
                <h2 className="text-2xl md:text-3xl font-bold mt-2">Tu material está listo</h2>
              </div>
              {fotosDelAlbum.length > 0 && (
                <button
                  onClick={() => { setFotoModalIndex(0); setModoPresentacion(true); }}
                  className="bg-white/15 hover:bg-amber-600 backdrop-blur-md text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer w-fit"
                >
                  <Play size={14} fill="currentColor" /> Reproducir Álbum ({fotosDelAlbum.length} fotos)
                </button>
              )}
            </div>
          </div>
          
          <div className="p-6 md:p-8 space-y-6">
            <p className="df-muted text-sm">
              Accede a tus carpetas completas y videos en máxima resolución listos para ver o descargar:
            </p>

            <div className="grid grid-cols-1 gap-4">
              {entregables.map((item, idx) => {
                const embedUrl = obtenerEmbedVideo(item.url);
                return (
                  <div key={idx} className="df-bg border df-border p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-amber-600/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-600/10 text-amber-600 flex items-center justify-center flex-shrink-0">
                        {embedUrl ? <Film size={20} /> : <FolderOpen size={20} />}
                      </div>
                      <div>
                        <h3 className="font-bold df-text text-sm md:text-base">{item.titulo || `Archivo #${idx + 1}`}</h3>
                        <p className="text-xs df-muted">{embedUrl ? 'Video disponible para ver aquí o descargar' : 'Carpeta completa en Google Drive'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {embedUrl && (
                        <button
                          type="button"
                          onClick={() => setVideoActivo(videoActivo === embedUrl ? null : embedUrl)}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 df-card border df-border df-text px-4 py-3 rounded-xl font-bold text-xs hover:border-amber-600 transition-all cursor-pointer"
                        >
                          <Play size={15} className="text-amber-600" />
                          {videoActivo === embedUrl ? 'Ocultar Video' : 'Ver Video'}
                        </button>
                      )}
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-700 transition-all shadow-md cursor-pointer text-xs md:text-sm"
                      >
                        <Download size={17} /> Descargar
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {videoActivo && (
              <div className="mt-6 pt-6 border-t df-border animate-fade-in">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Reproductor de Video</span>
                  <button onClick={() => setVideoActivo(null)} className="text-xs df-muted hover:df-text flex items-center gap-1 cursor-pointer">
                    <X size={14} /> Cerrar reproductor
                  </button>
                </div>
                <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden border df-border shadow-xl">
                  <iframe
                    src={videoActivo}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ==================================================== */}
        {/* NUEVA SECCIÓN: ÁLBUM DIGITAL INTERACTIVO DE FOTOS    */}
        {/* ==================================================== */}
        {fotosDelAlbum.length > 0 && (
          <div className="df-card border df-border rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b df-border pb-5">
              <div>
                <span className="text-xs uppercase tracking-widest font-bold text-amber-600 flex items-center gap-1.5">
                  <Sparkles size={14} /> Álbum Digital Interactivo
                </span>
                <h2 className="text-2xl font-extrabold df-text mt-1">Selección de Fotografías ({fotosDelAlbum.length})</h2>
                <p className="text-xs df-muted mt-1">
                  Toca cualquier foto para verla en pantalla completa o marca con el corazón (❤️) tus favoritas para tu cuadro o impresión.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setSoloFavoritas(!soloFavoritas)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                    soloFavoritas 
                      ? 'bg-rose-600 text-white border-rose-600' 
                      : 'df-bg df-border df-text hover:border-amber-600'
                  }`}
                >
                  <Heart size={14} fill={soloFavoritas ? "currentColor" : "none"} className={soloFavoritas ? "text-white" : "text-rose-500"} />
                  Mis Favoritas ({favoritas.length})
                </button>

                {favoritas.length > 0 && (
                  <button
                    onClick={enviarFavoritasWhatsApp}
                    className="bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <Send size={14} /> Enviar mis {favoritas.length} favoritas a Deluces
                  </button>
                )}
              </div>
            </div>

            {/* CUADRÍCULA DEL ÁLBUM */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
              {fotosDelAlbum.map((fotoUrl, index) => {
                const esFav = favoritas.includes(index);
                if (soloFavoritas && !esFav) return null;

                return (
                  <div 
                    key={index}
                    onClick={() => { setFotoModalIndex(index); setModoPresentacion(false); }}
                    className="group relative aspect-[4/5] rounded-2xl overflow-hidden df-bg border df-border cursor-pointer shadow-xs hover:shadow-xl transition-all duration-300"
                  >
                    <img 
                      src={formatearImagenDrive(fotoUrl)} 
                      alt={`Foto ${index + 1}`} 
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />

                    {/* Número de Foto */}
                    <span className="absolute bottom-2.5 left-3 text-[11px] font-bold text-white/90 drop-shadow">
                      #{index + 1}
                    </span>

                    {/* Botón Corazón (Favorita) */}
                    <button
                      type="button"
                      onClick={(e) => toggleFavorita(index, e)}
                      className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-transform active:scale-90 cursor-pointer ${
                        esFav ? 'bg-rose-600 text-white shadow-md' : 'bg-black/40 text-white/80 hover:text-white'
                      }`}
                      title="Marcar como favorita"
                    >
                      <Heart size={15} fill={esFav ? "currentColor" : "none"} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* ==================================================== */}
      {/* VISOR DE PANTALLA COMPLETA (LIGHTBOX DEL ÁLBUM)      */}
      {/* ==================================================== */}
      {fotoModalIndex !== null && fotosDelAlbum[fotoModalIndex] && (
        <div 
          onClick={() => { setFotoModalIndex(null); setModoPresentacion(false); }}
          onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStartX === null) return;
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (diff > 50) irFotoSiguiente();
            if (diff < -50) irFotoAnterior();
            setTouchStartX(null);
          }}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in"
        >
          {/* Barra Superior del Visor */}
          <div onClick={(e) => e.stopPropagation()} className="absolute top-4 left-4 right-4 flex justify-between items-center z-50">
            <span className="text-xs font-bold text-white/80 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
              Foto #{fotoModalIndex + 1} de {fotosDelAlbum.length}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setModoPresentacion(!modoPresentacion)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  modoPresentacion ? 'bg-amber-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {modoPresentacion ? <Pause size={14} /> : <Play size={14} />}
                {modoPresentacion ? 'Pausar' : 'Presentación'}
              </button>

              <button
                onClick={(e) => toggleFavorita(fotoModalIndex, e)}
                className={`p-2 rounded-full cursor-pointer transition-all ${
                  favoritas.includes(fotoModalIndex) ? 'bg-rose-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                title="Marcar favorita"
              >
                <Heart size={18} fill={favoritas.includes(fotoModalIndex) ? "currentColor" : "none"} />
              </button>

              <a
                href={obtenerLinkDescargaFoto(fotosDelAlbum[fotoModalIndex])}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/10 text-white hover:bg-amber-600 transition-colors"
                title="Descargar esta foto"
              >
                <Download size={18} />
              </a>

              <button
                onClick={() => { setFotoModalIndex(null); setModoPresentacion(false); }}
                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Botones Anterior / Siguiente */}
          {fotosDelAlbum.length > 1 && (
            <>
              <button onClick={irFotoAnterior} className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white cursor-pointer">
                <ChevronLeft size={26} />
              </button>
              <button onClick={irFotoSiguiente} className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white cursor-pointer">
                <ChevronRight size={26} />
              </button>
            </>
          )}

          {/* Imagen Principal */}
          <div onClick={(e) => e.stopPropagation()} className="max-w-4xl max-h-[80vh] flex items-center justify-center">
            <img
              src={formatearImagenDrive(fotosDelAlbum[fotoModalIndex])}
              alt={`Foto ${fotoModalIndex + 1}`}
              className="max-h-[78vh] w-auto max-w-full object-contain rounded-xl shadow-2xl select-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}