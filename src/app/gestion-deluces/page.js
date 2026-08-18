"use client";

import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { ShieldCheck, PlusCircle, ArrowLeft, Image as ImageIcon, Trash2, Edit2, X, RefreshCw, Video, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargandoAuth, setCargandoAuth] = useState(false);

  const [refrescando, setRefrescando] = useState(false);
  
  // ESTADOS CLIENTES
  const clienteInicial = { nombreCliente: '', password: '', tipo: '', fecha: '', previewImage: '', driveLink: '' };
  const [formCliente, setFormCliente] = useState(clienteInicial);
  const [cargandoCliente, setCargandoCliente] = useState(false);
  const [listaClientes, setListaClientes] = useState([]);
  const [editandoClienteId, setEditandoClienteId] = useState(null);

  // ESTADOS GALERÍA (Se añade videoUrl)
  const galeriaInicial = { slug: 'institucional', titulo: '', orden: 1, imagenUrl: '', videoUrl: '' };
  const [formGaleria, setFormGaleria] = useState(galeriaInicial);
  const [cargandoGaleria, setCargandoGaleria] = useState(false);
  const [listaGaleria, setListaGaleria] = useState([]);
  const [editandoFotoId, setEditandoFotoId] = useState(null);

  // VERIFICAR SESIÓN DE FIREBASE AUTH
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        cargarDatos();
      }
    });
    return () => unsubscribe();
  }, []);

  // CARGAR DATOS
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

  // AUTO-CALCULAR ORDEN
  useEffect(() => {
    if (!editandoFotoId && user) {
      const fotosCategoria = listaGaleria.filter(foto => foto.slug === formGaleria.slug);
      const siguienteOrden = fotosCategoria.length > 0 
        ? Math.max(...fotosCategoria.map(f => Number(f.orden) || 0)) + 1 
        : 1;
      setFormGaleria(prev => ({ ...prev, orden: siguienteOrden }));
    }
  }, [formGaleria.slug, listaGaleria, editandoFotoId, user]);

  // LOGIN CON FIREBASE AUTH
  const handleLogin = async (e) => {
    e.preventDefault();
    setCargandoAuth(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error de autenticación:", error);
      alert('Correo o contraseña de administrador incorrectos');
    } finally {
      setCargandoAuth(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // LÓGICA CLIENTES
  const handleSubmitCliente = async (e) => {
    e.preventDefault();
    setCargandoCliente(true);
    try {
      if (editandoClienteId) {
        await updateDoc(doc(db, "clientes", editandoClienteId), { ...formCliente });
        alert('¡Cliente actualizado correctamente!');
        setEditandoClienteId(null);
      } else {
        await addDoc(collection(db, "clientes"), { ...formCliente, createdAt: new Date() });
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
    setFormCliente(cliente);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // LÓGICA GALERÍA
  const handleSubmitGaleria = async (e) => {
    e.preventDefault();
    setCargandoGaleria(true);
    try {
      const cleanVideoUrl = formGaleria.videoUrl?.trim() || "";
      const dataToSave = { 
        ...formGaleria, 
        orden: Number(formGaleria.orden) || 1,
        videoUrl: cleanVideoUrl
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
    setFormGaleria({ ...foto, videoUrl: foto.videoUrl || '' });
    window.scrollTo({ top: 500, behavior: 'smooth' });
  };

  // UI LOGIN (FIREBASE AUTHENTICATION)
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
          
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full df-card border df-border rounded-xl px-4 py-3 mb-3 text-sm outline-none focus:border-amber-600 df-text" 
            placeholder="Correo electrónico" 
            required 
          />
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full df-card border df-border rounded-xl px-4 py-3 mb-6 text-sm outline-none focus:border-amber-600 df-text" 
            placeholder="Contraseña" 
            required 
          />
          
          <button 
            type="submit" 
            disabled={cargandoAuth} 
            className="w-full bg-amber-600 text-white font-bold py-3.5 rounded-xl hover:bg-amber-700 transition-all cursor-pointer text-sm shadow-md"
          >
            {cargandoAuth ? 'Verificando...' : 'Entrar al Panel'}
          </button>
        </form>
      </div>
    );
  }

  // UI ADMIN (AUTENTICADO)
  return (
    <div className="min-h-screen df-bg py-16 px-6">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-amber-600">Gestión General</span>
            <h1 className="text-3xl font-black df-text mt-1">Panel de Control</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={cargarDatos} 
              disabled={refrescando}
              className={`text-sm flex items-center gap-2 transition-all cursor-pointer ${refrescando ? 'text-amber-500' : 'df-muted hover:text-amber-500'}`} 
              title="Refrescar Datos"
            >
              <RefreshCw size={16} className={refrescando ? "animate-spin" : ""} /> 
              {refrescando ? 'Actualizando...' : 'Actualizar'}
            </button>
            <Link href="/" className="text-sm df-muted hover:df-text flex items-center gap-2 ml-4 border-l df-border pl-4">
              <ArrowLeft size={16} /> Ver Web
            </Link>
            <button 
              onClick={handleLogout} 
              className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1.5 ml-2 transition-colors cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut size={16} /> Salir
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            
            {/* FORMULARIO CLIENTES */}
            <div className="df-card border df-border p-8 rounded-3xl shadow-xl transition-all">
              <div className="mb-6 flex justify-between items-center">
                <div><span className="text-xs uppercase tracking-widest font-bold text-amber-600">Acceso Privado</span><h2 className="text-xl font-bold df-text mt-1">{editandoClienteId ? 'Editar Cliente' : 'Registrar Cliente'}</h2></div>
                {editandoClienteId && (<button onClick={() => { setEditandoClienteId(null); setFormCliente(clienteInicial); }} className="p-2 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/20"><X size={16} /></button>)}
              </div>
              <form onSubmit={handleSubmitCliente} className="space-y-4">
                <input type="text" value={formCliente.nombreCliente} onChange={e => setFormCliente({...formCliente, nombreCliente: e.target.value})} required className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm focus:border-amber-600 df-text outline-none" placeholder="Nombre (Ej. Ana & Carlos)" />
                <input type="text" value={formCliente.password} onChange={e => setFormCliente({...formCliente, password: e.target.value})} required className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm focus:border-amber-600 df-text outline-none" placeholder="Contraseña (Ej. ana2026)" />
                <input type="text" value={formCliente.tipo} onChange={e => setFormCliente({...formCliente, tipo: e.target.value})} required className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm focus:border-amber-600 df-text outline-none" placeholder="Tipo de Evento" />
                <input type="text" value={formCliente.fecha} onChange={e => setFormCliente({...formCliente, fecha: e.target.value})} required className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm focus:border-amber-600 df-text outline-none" placeholder="Fecha (Ej. 12 Agosto)" />
                <input type="url" value={formCliente.previewImage} onChange={e => setFormCliente({...formCliente, previewImage: e.target.value})} required className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm focus:border-amber-600 df-text outline-none" placeholder="URL Foto de Portada" />
                <input type="url" value={formCliente.driveLink} onChange={e => setFormCliente({...formCliente, driveLink: e.target.value})} required className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm focus:border-amber-600 df-text outline-none" placeholder="Link de Google Drive" />
                <button type="submit" disabled={cargandoCliente} className={`w-full text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 mt-6 text-sm ${editandoClienteId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
                  {editandoClienteId ? <Edit2 size={18} /> : <PlusCircle size={18} />} {cargandoCliente ? 'Guardando...' : (editandoClienteId ? 'Actualizar Cliente' : 'Registrar Cliente')}
                </button>
              </form>
            </div>

            {/* FORMULARIO GALERÍA (CON OPCIÓN DE VIDEO) */}
            <div className="df-card border df-border p-8 rounded-3xl shadow-xl transition-all">
              <div className="mb-6 flex justify-between items-center">
                <div><span className="text-xs uppercase tracking-widest font-bold text-amber-600">Portafolio Web</span><h2 className="text-xl font-bold df-text mt-1">{editandoFotoId ? 'Editar Contenido' : 'Subir Contenido'}</h2></div>
                {editandoFotoId && (<button onClick={() => { setEditandoFotoId(null); setFormGaleria({ ...galeriaInicial, slug: formGaleria.slug }); }} className="p-2 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/20"><X size={16} /></button>)}
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
                  <input type="url" value={formGaleria.imagenUrl} onChange={e => setFormGaleria({...formGaleria, imagenUrl: e.target.value})} required className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm focus:border-amber-600 df-text outline-none" placeholder="Enlace directo de la miniatura" />
                </div>

                <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5">
                  <label className="text-[10px] font-bold uppercase text-blue-500 ml-1 flex items-center gap-1 mb-1"><Video size={12}/> Link de Video (Opcional)</label>
                  <input type="url" value={formGaleria.videoUrl} onChange={e => setFormGaleria({...formGaleria, videoUrl: e.target.value})} className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm focus:border-blue-500 df-text outline-none" placeholder="Enlace de YouTube o Drive..." />
                  <p className="text-[10px] text-blue-500/70 mt-2 leading-tight">Si dejas esto en blanco, se subirá como fotografía normal. Si pones un link, la web le agregará un botón de Play (▶).</p>
                </div>

                <button type="submit" disabled={cargandoGaleria} className={`w-full text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 mt-6 text-sm ${editandoFotoId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
                  {editandoFotoId ? <Edit2 size={18} /> : (formGaleria.videoUrl ? <Video size={18} /> : <ImageIcon size={18} />)} 
                  {cargandoGaleria ? 'Procesando...' : (editandoFotoId ? 'Actualizar Contenido' : (formGaleria.videoUrl ? 'Subir Video' : 'Subir Foto'))}
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-8">
            {/* LISTA CLIENTES */}
            <div className="df-card border df-border p-6 rounded-3xl shadow-md">
              <h3 className="font-bold df-text mb-4">Gestión de Clientes ({listaClientes.length})</h3>
              <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {listaClientes.length === 0 && <p className="text-xs df-muted">No hay clientes registrados.</p>}
                {listaClientes.map(cliente => (
                  <div key={cliente.id} className="flex justify-between items-center p-3 df-bg rounded-xl border df-border group hover:border-amber-500/50 transition-colors">
                    <div>
                      <p className="text-sm font-bold df-text line-clamp-1">{cliente.nombreCliente}</p>
                      <p className="text-xs df-muted">Pass: {cliente.password}</p>
                    </div>
                    <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => prepararEdicionCliente(cliente)} className="p-1.5 bg-blue-500/10 text-blue-500 rounded-md hover:bg-blue-500 hover:text-white transition-colors" title="Editar"><Edit2 size={14}/></button>
                      <button onClick={() => eliminarCliente(cliente.id)} className="p-1.5 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500 hover:text-white transition-colors" title="Eliminar"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LISTA GALERÍA */}
            <div className="df-card border df-border p-6 rounded-3xl shadow-md">
              <h3 className="font-bold df-text mb-4">Portafolio Web ({listaGaleria.length})</h3>
              <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {listaGaleria.length === 0 && <p className="text-xs df-muted">No hay contenido en la galería.</p>}
                {listaGaleria.map(foto => (
                  <div key={foto.id} className="flex justify-between items-center p-3 df-bg rounded-xl border df-border group hover:border-amber-500/50 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden w-full">
                      <div className="w-12 h-12 rounded-lg bg-black overflow-hidden flex-shrink-0 relative border df-border">
                        <img src={foto.imagenUrl} alt="miniatura" className="w-full h-full object-cover opacity-80" />
                        {foto.videoUrl && <div className="absolute inset-0 flex items-center justify-center"><Video size={14} className="text-white drop-shadow-md"/></div>}
                      </div>
                      <div className="flex-1 pr-2">
                        <p className="text-sm font-bold df-text line-clamp-1">{foto.titulo || 'Sin título'}</p>
                        <p className="text-[10px] font-bold text-amber-600 tracking-wider">/{foto.slug} <span className="df-muted font-normal">(Orden: {foto.orden})</span></p>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => prepararEdicionFoto(foto)} className="p-1.5 bg-blue-500/10 text-blue-500 rounded-md hover:bg-blue-500 hover:text-white transition-colors" title="Editar"><Edit2 size={14}/></button>
                      <button onClick={() => eliminarFoto(foto.id)} className="p-1.5 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500 hover:text-white transition-colors" title="Eliminar"><Trash2 size={14}/></button>
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