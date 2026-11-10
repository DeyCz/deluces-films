"use client";

import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  ShieldCheck, PlusCircle, ArrowLeft, Image as ImageIcon, 
  Trash2, Edit2, X, RefreshCw, Video, LogOut, Copy, Send, Search, Plus, BookOpen
} from 'lucide-react';
import Link from 'next/link';

// Convierte automáticamente un link compartido de Google Drive en un link de imagen directa
const normalizarImagenUrl = (url) => {
  if (!url) return '';
  const limpia = url.trim();
  if (limpia.includes('drive.google.com/file/d/')) {
    const fileId = limpia.split('/d/')[1]?.split('/')[0];
    if (fileId) return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
  }
  return limpia;
};

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargandoAuth, setCargandoAuth] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  
  // ESTADOS CLIENTES (Soporta múltiples enlaces extra + Álbum Digital de fotos)
  const clienteInicial = { 
    nombreCliente: '', 
    password: '', 
    tipo: '', 
    fecha: '', 
    previewImage: '', 
    driveLink: '',
    enlacesExtra: [],
    albumFotosTexto: '' // Campo de texto rápido (1 link por línea) para el formulario
  };
  const [formCliente, setFormCliente] = useState(clienteInicial);
  const [cargandoCliente, setCargandoCliente] = useState(false);
  const [listaClientes, setListaClientes] = useState([]);
  const [editandoClienteId, setEditandoClienteId] = useState(null);
  const [busquedaCliente, setBusquedaCliente] = useState('');

  // ESTADOS GALERÍA PORTAFOLIO
  const galeriaInicial = { slug: 'institucional', titulo: '', orden: 1, imagenUrl: '', videoUrl: '', formatoVideo: 'vertical' };
  const [formGaleria, setFormGaleria] = useState(galeriaInicial);
  const [cargandoGaleria, setCargandoGaleria] = useState(false);
  const [listaGaleria, setListaGaleria] = useState([]);
  const [editandoFotoId, setEditandoFotoId] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState('todas');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) cargarDatos();
    });
    return () => unsubscribe();
  }, []);

  const cargarDatos = async () => {
    setRefrescando(true);
    try {
      const clientesSnapshot = await getDocs(collection(db, "clientes"));
      setListaClientes(clientesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const galeriaSnapshot = await getDocs(collection(db, "galerias"));
      let fotosCargadas = galeriaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fotosCargadas.sort((a, b) => Number(a.orden) - Number(b.orden));
      setListaGaleria(fotosCargadas);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setTimeout(() => setRefrescando(false), 500); 
    }
  };

  useEffect(() => {
    if (!editandoFotoId && user) {
      const fotosCategoria = listaGaleria.filter(foto => foto.slug === formGaleria.slug);
      const siguienteOrden = fotosCategoria.length > 0 
        ? Math.max(...fotosCategoria.map(f => Number(f.orden) || 0)) + 1 
        : 1;
      setFormGaleria(prev => ({ ...prev, orden: siguienteOrden }));
    }
  }, [formGaleria.slug, listaGaleria, editandoFotoId, user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setCargandoAuth(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert('Correo o contraseña de administrador incorrectos');
    } finally {
      setCargandoAuth(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // ENLACES EXTRA DEL CLIENTE
  const agregarEnlaceExtra = () => {
    setFormCliente(prev => ({
      ...prev,
      enlacesExtra: [...(prev.enlacesExtra || []), { titulo: '', url: '' }]
    }));
  };

  const actualizarEnlaceExtra = (index, campo, valor) => {
    const copia = [...(formCliente.enlacesExtra || [])];
    copia[index] = { ...copia[index], [campo]: valor };
    setFormCliente(prev => ({ ...prev, enlacesExtra: copia }));
  };

  const eliminarEnlaceExtra = (index) => {
    const copia = (formCliente.enlacesExtra || []).filter((_, i) => i !== index);
    setFormCliente(prev => ({ ...prev, enlacesExtra: copia }));
  };

  // GUARDAR CLIENTE (Procesa las líneas del Álbum Digital)
  const handleSubmitCliente = async (e) => {
    e.preventDefault();
    setCargandoCliente(true);
    try {
      const listaFotosAlbum = (formCliente.albumFotosTexto || '')
        .split('\n')
        .map(linea => normalizarImagenUrl(linea))
        .filter(url => url !== '');

      const datosLimpios = {
        nombreCliente: formCliente.nombreCliente.trim(),
        password: formCliente.password.trim(),
        tipo: formCliente.tipo.trim(),
        fecha: formCliente.fecha.trim(),
        previewImage: normalizarImagenUrl(formCliente.previewImage),
        driveLink: formCliente.driveLink.trim(),
        enlacesExtra: (formCliente.enlacesExtra || []).filter(item => item.url?.trim() !== ''),
        albumFotos: listaFotosAlbum
      };

      if (editandoClienteId) {
        await updateDoc(doc(db, "clientes", editandoClienteId), datosLimpios);
        alert('¡Cliente y Álbum Digital actualizados correctamente!');
        setEditandoClienteId(null);
      } else {
        await addDoc(collection(db, "clientes"), { ...datosLimpios, createdAt: new Date() });
        alert('¡Cliente registrado en la nube!');
      }
      setFormCliente(clienteInicial);
      cargarDatos();
    } catch (error) {
      alert('Hubo un error al guardar el cliente.');
    } finally {
      setCargandoCliente(false);
    }
  };

  const eliminarCliente = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.")) {
      await deleteDoc(doc(db, "clientes", id));
      cargarDatos();
    }
  };

  const prepararEdicionCliente = (cliente) => {
    setEditandoClienteId(cliente.id);
    setFormCliente({
      ...clienteInicial,
      ...cliente,
      enlacesExtra: Array.isArray(cliente.enlacesExtra) ? cliente.enlacesExtra : [],
      albumFotosTexto: Array.isArray(cliente.albumFotos) ? cliente.albumFotos.join('\n') : ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const armarMensajeEntrega = (cliente) => {
    return `¡Hola! 👋✨ Espero que se encuentren muy bien.\n\nMe emociona avisarles que ya están listos los archivos y el Álbum Digital de *${cliente.nombreCliente}* (${cliente.tipo}). 📸🎥🎉\n\nPara ver su álbum interactivo y descargar todo su material en alta calidad, pueden ingresar directamente a nuestra plataforma web:\n\n🌐 *Enlace directo:* https://deluces-films.vercel.app/clientes?code=${encodeURIComponent(cliente.password)}\n🔑 *Contraseña:* ${cliente.password}\n\nDe parte de *Deluces Films*, muchas gracias por confiar en nosotros para capturar estos recuerdos. ¡Que lo disfruten muchísimo! 🥂🎬`;
  };

  const copiarMensajeCliente = (cliente) => {
    navigator.clipboard.writeText(armarMensajeEntrega(cliente));
    alert(`¡Mensaje de entrega para "${cliente.nombreCliente}" copiado!`);
  };

  const enviarWhatsAppCliente = (cliente) => {
    const texto = armarMensajeEntrega(cliente);
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  // LÓGICA GALERÍA PORTAFOLIO
  const handleSubmitGaleria = async (e) => {
    e.preventDefault();
    setCargandoGaleria(true);
    try {
      const cleanVideoUrl = formGaleria.videoUrl?.trim() || "";
      const dataToSave = { 
        ...formGaleria, 
        imagenUrl: normalizarImagenUrl(formGaleria.imagenUrl),
        orden: Number(formGaleria.orden) || 1,
        videoUrl: cleanVideoUrl,
        formatoVideo: formGaleria.formatoVideo || 'vertical'
      };

      if (editandoFotoId) {
        await updateDoc(doc(db, "galerias", editandoFotoId), dataToSave);
        alert('¡Contenido actualizado correctamente!');
        setEditandoFotoId(null);
      } else {
        await addDoc(collection(db, "galerias"), { ...dataToSave, createdAt: new Date() });
        alert('¡Contenido agregado al portafolio!');
      }
      
      setFormGaleria({ ...galeriaInicial, slug: formGaleria.slug }); 
      cargarDatos();
    } catch (error) {
      alert('Hubo un error al subir el archivo.');
    } finally {
      setCargandoGaleria(false);
    }
  };

  const eliminarFoto = async (id) => {
    if (window.confirm("¿Seguro de borrar este elemento de la web?")) {
      await deleteDoc(doc(db, "galerias", id));
      cargarDatos();
    }
  };

  const prepararEdicionFoto = (foto) => {
    setEditandoFotoId(foto.id);
    setFormGaleria({ 
      ...galeriaInicial,
      ...foto, 
      videoUrl: foto.videoUrl || '',
      formatoVideo: foto.formatoVideo || 'vertical'
    });
    window.scrollTo({ top: 600, behavior: 'smooth' });
  };

  if (!user) {
    return (
      <div className="min-h-screen df-bg flex items-center justify-center p-6 relative">
        <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-sm df-muted hover:df-text transition-all">
          <ArrowLeft size={16} /> Volver al sitio
        </Link>
        <form onSubmit={handleLogin} className="df-card p-8 rounded-3xl border df-border w-full max-w-md shadow-2xl text-center">
          <ShieldCheck className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold df-text mb-2">Panel Administrativo</h1>
          <p className="df-muted text-sm mb-6">Ingresa tus credenciales seguras.</p>
          
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full df-card border df-border rounded-xl px-4 py-3 mb-3 text-sm outline-none focus:border-amber-600 df-text" placeholder="Correo electrónico" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full df-card border df-border rounded-xl px-4 py-3 mb-6 text-sm outline-none focus:border-amber-600 df-text" placeholder="Contraseña" required />
          
          <button type="submit" disabled={cargandoAuth} className="w-full bg-amber-600 text-white font-bold py-3.5 rounded-xl hover:bg-amber-700 transition-all cursor-pointer text-sm shadow-md">
            {cargandoAuth ? 'Verificando...' : 'Entrar al Panel'}
          </button>
        </form>
      </div>
    );
  }

  const clientesFiltrados = listaClientes.filter(c => 
    (c.nombreCliente || '').toLowerCase().includes(busquedaCliente.toLowerCase()) ||
    (c.password || '').toLowerCase().includes(busquedaCliente.toLowerCase())
  );

  const galeriaFiltrada = filtroCategoria === 'todas' 
    ? listaGaleria 
    : listaGaleria.filter(f => f.slug === filtroCategoria);

  return (
    <div className="min-h-screen df-bg py-16 px-6">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-amber-600">Gestión General</span>
            <h1 className="text-3xl font-black df-text mt-1">Panel de Control</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={cargarDatos} disabled={refrescando} className={`text-sm flex items-center gap-2 transition-all cursor-pointer ${refrescando ? 'text-amber-500' : 'df-muted hover:text-amber-500'}`}>
              <RefreshCw size={16} className={refrescando ? "animate-spin" : ""} /> 
              {refrescando ? 'Actualizando...' : 'Actualizar'}
            </button>
            <Link href="/" className="text-sm df-muted hover:df-text flex items-center gap-2 ml-2 border-l df-border pl-4">
              <ArrowLeft size={16} /> Ver Web
            </Link>
            <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1.5 ml-2 transition-colors cursor-pointer">
              <LogOut size={16} /> Salir
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            
            {/* FORMULARIO CLIENTES + ÁLBUM DIGITAL */}
            <div className="df-card border df-border p-8 rounded-3xl shadow-xl transition-all">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <span className="text-xs uppercase tracking-widest font-bold text-amber-600">Acceso Privado & Álbum</span>
                  <h2 className="text-xl font-bold df-text mt-1">{editandoClienteId ? 'Editar Cliente' : 'Registrar Cliente'}</h2>
                </div>
                {editandoClienteId && (
                  <button onClick={() => { setEditandoClienteId(null); setFormCliente(clienteInicial); }} className="p-2 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/20 cursor-pointer">
                    <X size={16} />
                  </button>
                )}
              </div>
              <form onSubmit={handleSubmitCliente} className="space-y-4">
                <input type="text" value={formCliente.nombreCliente} onChange={e => setFormCliente({...formCliente, nombreCliente: e.target.value})} required className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm focus:border-amber-600 df-text outline-none" placeholder="Nombre del Cliente o Evento" />
                <input type="text" value={formCliente.password} onChange={e => setFormCliente({...formCliente, password: e.target.value})} required className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm focus:border-amber-600 df-text outline-none" placeholder="Contraseña (Ej. 6A2026)" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={formCliente.tipo} onChange={e => setFormCliente({...formCliente, tipo: e.target.value})} required className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm focus:border-amber-600 df-text outline-none" placeholder="Tipo de Evento" />
                  <input type="text" value={formCliente.fecha} onChange={e => setFormCliente({...formCliente, fecha: e.target.value})} required className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm focus:border-amber-600 df-text outline-none" placeholder="Fecha (Ej. 15 Octubre)" />
                </div>
                <input type="url" value={formCliente.previewImage} onChange={e => setFormCliente({...formCliente, previewImage: e.target.value})} required className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm focus:border-amber-600 df-text outline-none" placeholder="URL Foto de Portada (acepta link de Drive)" />
                <input type="url" value={formCliente.driveLink} onChange={e => setFormCliente({...formCliente, driveLink: e.target.value})} required className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm focus:border-amber-600 df-text outline-none" placeholder="Link Principal de Google Drive (Carpeta completa)" />

                {/* NUEVA SECCIÓN: ÁLBUM DIGITAL INTERACTIVO */}
                <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                  <label className="text-[11px] font-bold uppercase text-amber-600 flex items-center gap-1.5">
                    <BookOpen size={14}/> Álbum Digital Interactivo (Opcional)
                  </label>
                  <textarea 
                    rows="4"
                    value={formCliente.albumFotosTexto}
                    onChange={e => setFormCliente({...formCliente, albumFotosTexto: e.target.value})}
                    placeholder={"Pega aquí los enlaces de las mejores fotos (1 link por línea).\nAcepta links compartidos de Google Drive o enlaces directos."}
                    className="w-full df-bg border df-border rounded-xl px-3 py-2.5 text-xs focus:border-amber-600 df-text outline-none resize-y"
                  />
                  <p className="text-[10px] df-muted leading-tight">
                    El cliente verá estas fotos en un álbum elegante dentro de la web, podrá abrirlas en pantalla completa, elegir sus favoritas (❤️) y enviarte su selección por WhatsApp.
                  </p>
                </div>

                {/* ENLACES EXTRA (Ej: Video Parte 1, Parte 2, Reel) */}
                <div className="pt-1 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider df-muted">Videos o Carpetas Adicionales</span>
                    <button type="button" onClick={agregarEnlaceExtra} className="text-xs font-bold text-amber-600 hover:text-amber-500 flex items-center gap-1 cursor-pointer">
                      <Plus size={14} /> Añadir enlace
                    </button>
                  </div>
                  {(formCliente.enlacesExtra || []).map((item, idx) => (
                    <div key={idx} className="p-3 df-bg border df-border rounded-xl space-y-2">
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          value={item.titulo} 
                          onChange={e => actualizarEnlaceExtra(idx, 'titulo', e.target.value)}
                          placeholder={`Título (Ej. Video Parte ${idx + 1} o Reel)`}
                          className="w-full df-card border df-border rounded-lg px-3 py-2 text-xs df-text outline-none focus:border-amber-600"
                        />
                        <button type="button" onClick={() => eliminarEnlaceExtra(idx)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <input 
                        type="url" 
                        value={item.url} 
                        onChange={e => actualizarEnlaceExtra(idx, 'url', e.target.value)}
                        placeholder="Link de Drive o YouTube..."
                        className="w-full df-card border df-border rounded-lg px-3 py-2 text-xs df-text outline-none focus:border-amber-600"
                      />
                    </div>
                  ))}
                </div>

                <button type="submit" disabled={cargandoCliente} className={`w-full text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 mt-6 text-sm cursor-pointer ${editandoClienteId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
                  {editandoClienteId ? <Edit2 size={18} /> : <PlusCircle size={18} />} {cargandoCliente ? 'Guardando...' : (editandoClienteId ? 'Actualizar Cliente' : 'Registrar Cliente')}
                </button>
              </form>
            </div>

            {/* FORMULARIO GALERÍA PORTAFOLIO */}
            <div className="df-card border df-border p-8 rounded-3xl shadow-xl transition-all">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <span className="text-xs uppercase tracking-widest font-bold text-amber-600">Portafolio Web</span>
                  <h2 className="text-xl font-bold df-text mt-1">{editandoFotoId ? 'Editar Contenido' : 'Subir Contenido'}</h2>
                </div>
                {editandoFotoId && (
                  <button onClick={() => { setEditandoFotoId(null); setFormGaleria({ ...galeriaInicial, slug: formGaleria.slug }); }} className="p-2 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/20 cursor-pointer">
                    <X size={16} />
                  </button>
                )}
              </div>
              <form onSubmit={handleSubmitGaleria} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-amber-600 ml-1">Categoría</label>
                  <select value={formGaleria.slug} onChange={e => setFormGaleria({...formGaleria, slug: e.target.value})} required className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm focus:border-amber-600 df-text outline-none">
                    <option value="institucional">Eventos Institucionales</option>
                    <option value="parejas">Sesión de Fotos de Pareja</option>
                    <option value="publicidad">Publicidad para Negocios</option>
                    <option value="revelacion-genero">Revelación de Género</option>
                    <option value="fiestas-patronales">Fiestas Patronales</option>
                    <option value="videoclips">Videoclips y Grupos de Baile</option>
                    <option value="invitaciones-virtuales">Invitaciones Virtuales</option>
                    <option value="personal">Fotos y Videos Personales</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold uppercase df-muted ml-1">Título</label>
                    <input type="text" value={formGaleria.titulo} onChange={e => setFormGaleria({...formGaleria, titulo: e.target.value})} required className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm focus:border-amber-600 df-text outline-none" placeholder="Ej. Spot Comercial" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase df-muted ml-1">Orden</label>
                    <input type="number" value={formGaleria.orden} onChange={e => setFormGaleria({...formGaleria, orden: e.target.value})} required className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm focus:border-amber-600 df-text outline-none text-center" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase df-muted ml-1 flex items-center gap-1"><ImageIcon size={12}/> Foto Portada (Obligatorio)</label>
                  <input type="url" value={formGaleria.imagenUrl} onChange={e => setFormGaleria({...formGaleria, imagenUrl: e.target.value})} required className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm focus:border-amber-600 df-text outline-none" placeholder="Enlace de la imagen o link compartido de Drive" />
                </div>

                <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-blue-500 ml-1 flex items-center gap-1 mb-1"><Video size={12}/> Link de Video (Opcional)</label>
                    <input type="url" value={formGaleria.videoUrl} onChange={e => setFormGaleria({...formGaleria, videoUrl: e.target.value})} className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm focus:border-blue-500 df-text outline-none" placeholder="Enlace de YouTube o Google Drive..." />
                  </div>

                  {formGaleria.videoUrl && (
                    <div>
                      <label className="text-[10px] font-bold uppercase text-blue-500 ml-1 block mb-1">Formato del Video</label>
                      <select 
                        value={formGaleria.formatoVideo || 'vertical'} 
                        onChange={e => setFormGaleria({...formGaleria, formatoVideo: e.target.value})}
                        className="w-full df-bg border df-border rounded-xl px-3 py-2 text-xs df-text outline-none focus:border-blue-500"
                      >
                        <option value="vertical">Vertical 9:16 (Reel / TikTok)</option>
                        <option value="horizontal">Horizontal 16:9 (Video Completo / YouTube)</option>
                      </select>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={cargandoGaleria} className={`w-full text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 mt-6 text-sm cursor-pointer ${editandoFotoId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
                  {editandoFotoId ? <Edit2 size={18} /> : (formGaleria.videoUrl ? <Video size={18} /> : <ImageIcon size={18} />)} 
                  {cargandoGaleria ? 'Procesando...' : (editandoFotoId ? 'Actualizar Contenido' : (formGaleria.videoUrl ? 'Subir Video' : 'Subir Foto'))}
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-8">
            {/* LISTA CLIENTES */}
            <div className="df-card border df-border p-6 rounded-3xl shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <h3 className="font-bold df-text">Gestión de Clientes ({clientesFiltrados.length})</h3>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 df-muted" />
                  <input 
                    type="text" 
                    value={busquedaCliente}
                    onChange={e => setBusquedaCliente(e.target.value)}
                    placeholder="Buscar cliente o código..."
                    className="df-bg border df-border rounded-lg pl-8 pr-3 py-1.5 text-xs df-text outline-none focus:border-amber-600 w-full sm:w-48"
                  />
                </div>
              </div>

              <div className="max-h-[380px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {clientesFiltrados.length === 0 && <p className="text-xs df-muted">No se encontraron clientes.</p>}
                {clientesFiltrados.map(cliente => (
                  <div key={cliente.id} className="flex justify-between items-center p-3 df-bg rounded-xl border df-border group hover:border-amber-500/50 transition-colors gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold df-text truncate">{cliente.nombreCliente}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-xs df-muted">Pass: <strong className="text-amber-600">{cliente.password}</strong></span>
                        {Array.isArray(cliente.albumFotos) && cliente.albumFotos.length > 0 && (
                          <span className="text-[10px] bg-amber-600/10 text-amber-600 px-1.5 py-0.5 rounded font-semibold">
                            📸 {cliente.albumFotos.length} fotos
                          </span>
                        )}
                        {Array.isArray(cliente.enlacesExtra) && cliente.enlacesExtra.length > 0 && (
                          <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded font-semibold">
                            +{cliente.enlacesExtra.length} links
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => copiarMensajeCliente(cliente)} className="p-1.5 bg-amber-500/10 text-amber-600 rounded-md hover:bg-amber-600 hover:text-white transition-colors cursor-pointer" title="Copiar mensaje de entrega"><Copy size={14}/></button>
                      <button onClick={() => enviarWhatsAppCliente(cliente)} className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-md hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer" title="Enviar acceso por WhatsApp"><Send size={14}/></button>
                      <button onClick={() => prepararEdicionCliente(cliente)} className="p-1.5 bg-blue-500/10 text-blue-500 rounded-md hover:bg-blue-500 hover:text-white transition-colors cursor-pointer" title="Editar"><Edit2 size={14}/></button>
                      <button onClick={() => eliminarCliente(cliente.id)} className="p-1.5 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500 hover:text-white transition-colors cursor-pointer" title="Eliminar"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LISTA GALERÍA PORTAFOLIO */}
            <div className="df-card border df-border p-6 rounded-3xl shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <h3 className="font-bold df-text">Portafolio Web ({galeriaFiltrada.length})</h3>
                <select 
                  value={filtroCategoria} 
                  onChange={e => setFiltroCategoria(e.target.value)}
                  className="df-bg border df-border rounded-lg px-3 py-1.5 text-xs df-text outline-none focus:border-amber-600"
                >
                  <option value="todas">Todas las categorías</option>
                  <option value="institucional">/institucional</option>
                  <option value="parejas">/parejas</option>
                  <option value="publicidad">/publicidad</option>
                  <option value="revelacion-genero">/revelacion-genero</option>
                  <option value="fiestas-patronales">/fiestas-patronales</option>
                  <option value="videoclips">/videoclips</option>
                  <option value="invitaciones-virtuales">/invitaciones-virtuales</option>
                  <option value="personal">/personal</option>
                </select>
              </div>

              <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {galeriaFiltrada.length === 0 && <p className="text-xs df-muted">No hay contenido en esta categoría.</p>}
                {galeriaFiltrada.map(foto => (
                  <div key={foto.id} className="flex justify-between items-center p-3 df-bg rounded-xl border df-border group hover:border-amber-500/50 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden w-full">
                      <div className="w-12 h-12 rounded-lg bg-black overflow-hidden flex-shrink-0 relative border df-border">
                        <img src={normalizarImagenUrl(foto.imagenUrl)} alt="miniatura" className="w-full h-full object-cover opacity-80" />
                        {foto.videoUrl && <div className="absolute inset-0 flex items-center justify-center"><Video size={14} className="text-white drop-shadow-md"/></div>}
                      </div>
                      <div className="flex-1 pr-2 min-w-0">
                        <p className="text-sm font-bold df-text truncate">{foto.titulo || 'Sin título'}</p>
                        <p className="text-[10px] font-bold text-amber-600 tracking-wider">/{foto.slug} <span className="df-muted font-normal">(Orden: {foto.orden})</span></p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => prepararEdicionFoto(foto)} className="p-1.5 bg-blue-500/10 text-blue-500 rounded-md hover:bg-blue-500 hover:text-white transition-colors cursor-pointer" title="Editar"><Edit2 size={14}/></button>
                      <button onClick={() => eliminarFoto(foto.id)} className="p-1.5 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500 hover:text-white transition-colors cursor-pointer" title="Eliminar"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}