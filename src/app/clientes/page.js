"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Lock, LogOut, Download, ArrowLeft, Eye, EyeOff, Play, Film, FolderOpen, X } from 'lucide-react';
import Link from 'next/link';

// Convierte links compartidos de Google Drive en imágenes visibles o reproductores embed
const formatearImagenDrive = (url) => {
  if (!url) return '/institucional.jpg';
  if (url.includes('drive.google.com/file/d/')) {
    const id = url.split('/d/')[1]?.split('/')[0];
    if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w1600`;
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

  // Recuperar sesión guardada o autologin por parámetro ?code=
  useEffect(() => {
    const savedClient = sessionStorage.getItem('deluces_cliente_actual');
    if (savedClient) {
      try {
        setClienteActual(JSON.parse(savedClient));
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
      // 1. Intento de búsqueda exacta rápida
      const qExacto = query(collection(db, "clientes"), where("password", "==", codigoLimpio));
      const snapExacto = await getDocs(qExacto);

      if (!snapExacto.empty) {
        const datos = snapExacto.docs[0].data();
        setClienteActual(datos);
        sessionStorage.setItem('deluces_cliente_actual', JSON.stringify(datos));
        return;
      }

      // 2. Búsqueda insensible a mayúsculas/minúsculas (para evitar errores de teclado en celulares)
      const todosSnap = await getDocs(collection(db, "clientes"));
      const coincidencia = todosSnap.docs.find(
        (d) => (d.data().password || '').trim().toLowerCase() === codigoLimpio.toLowerCase()
      );

      if (coincidencia) {
        const datos = coincidencia.data();
        setClienteActual(datos);
        sessionStorage.setItem('deluces_cliente_actual', JSON.stringify(datos));
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
    sessionStorage.removeItem('deluces_cliente_actual');
  };

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
              aria-label="Mostrar u ocultar código"
            >
              {mostrarPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-xs mb-4 font-semibold">Código incorrecto. Verifica tus datos o escríbenos por WhatsApp.</p>
          )}

          <button type="submit" disabled={cargando} className="w-full bg-amber-600 text-white font-bold py-3.5 rounded-xl hover:bg-amber-700 transition-all cursor-pointer text-sm shadow-md">
            {cargando ? 'Buscando galería...' : 'Ingresar'}
          </button>
        </form>
      </div>
    );
  }

  // Construir lista unificada de entregables (compatible con driveLink único + enlacesExtra múltiples)
  const entregables = [
    ...(clienteActual.driveLink ? [{ titulo: 'Carpeta Principal / Galería Completa', url: clienteActual.driveLink }] : []),
    ...(Array.isArray(clienteActual.enlacesExtra) ? clienteActual.enlacesExtra.filter(item => item?.url) : [])
  ];

  // VISTA DE CLIENTE AUTENTICADO
  return (
    <div className="min-h-screen df-bg pt-12 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex justify-between items-center mb-10">
          <button onClick={cerrarSesionCliente} className="text-sm df-muted hover:df-text flex items-center gap-2 cursor-pointer">
            <ArrowLeft size={16} /> Cambiar código
          </button>
          <button onClick={cerrarSesionCliente} className="text-sm df-muted hover:text-red-500 flex items-center gap-2 cursor-pointer transition-colors">
            <LogOut size={16} /> Salir
          </button>
        </div>

        <div className="mb-8">
          <span className="text-xs uppercase tracking-widest font-bold text-amber-600">Bienvenido/a</span>
          <h1 className="text-3xl md:text-4xl font-black df-text mt-1">{clienteActual.nombreCliente}</h1>
          <p className="df-muted text-sm mt-1">{clienteActual.tipo} • {clienteActual.fecha}</p>
        </div>

        {/* VITRINA DEL PROYECTO */}
        <div className="df-card border df-border rounded-3xl overflow-hidden shadow-2xl">
          <div className="h-64 md:h-80 w-full bg-gray-900 relative">
            <img 
              src={formatearImagenDrive(clienteActual.previewImage)} 
              alt={clienteActual.nombreCliente} 
              className="w-full h-full object-cover opacity-80"
              onError={(e) => { e.currentTarget.src = '/institucional.jpg'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-6 left-6 md:left-8 right-6 text-white">
              <span className="text-[10px] uppercase tracking-widest font-bold bg-amber-600 px-3 py-1 rounded-full">
                Entrega Digital HD
              </span>
              <h2 className="text-2xl md:text-3xl font-bold mt-2">Tu material está listo</h2>
            </div>
          </div>
          
          <div className="p-6 md:p-8 space-y-6">
            <p className="df-muted text-sm">
              Hemos preparado tus archivos en alta definición listos para ver y descargar. Selecciona cualquiera de los enlaces a continuación:
            </p>

            {/* LISTA DE BOTONES DE DESCARGA Y REPRODUCCIÓN */}
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
                        <p className="text-xs df-muted">{embedUrl ? 'Video disponible para reproducir o descargar' : 'Carpeta / Archivo en Google Drive'}</p>
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
                          {videoActivo === embedUrl ? 'Ocultar Video' : 'Ver Aquí'}
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

            {/* REPRODUCTOR INTEGRADO OPCIONAL */}
            {videoActivo && (
              <div className="mt-6 pt-6 border-t df-border animate-fade-in">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Vista Previa del Video</span>
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

      </div>
    </div>
  );
}