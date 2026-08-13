"use client";

import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ShieldCheck, PlusCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const [acceso, setAcceso] = useState(false);
  const [passAdmin, setPassAdmin] = useState('');
  
  const [form, setForm] = useState({
    nombreCliente: '',
    password: '',
    tipo: '',
    fecha: '',
    previewImage: '',
    driveLink: ''
  });
  const [cargando, setCargando] = useState(false);

  // Clave secreta para entrar a tu admin (cámbiala si gustas)
  const handleLoginAdmin = (e) => {
    e.preventDefault();
    if (passAdmin === 'admin2026') {
      setAcceso(true);
    } else {
      alert('Contraseña de administrador incorrecta');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      await addDoc(collection(db, "clientes"), {
        ...form,
        createdAt: new Date()
      });
      alert('¡Cliente guardado exitosamente en la nube!');
      setForm({ nombreCliente: '', password: '', tipo: '', fecha: '', previewImage: '', driveLink: '' });
    } catch (error) {
      console.error("Error al guardar: ", error);
      alert('Hubo un error al guardar el cliente.');
    } finally {
      setCargando(false);
    }
  };

  if (!acceso) {
    return (
      <div className="min-h-screen df-bg flex items-center justify-center p-6 relative">
        <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-sm df-muted hover:df-text transition-all">
          <ArrowLeft size={16} /> Volver al sitio
        </Link>
        <form onSubmit={handleLoginAdmin} className="df-card p-8 rounded-3xl border df-border w-full max-w-md shadow-2xl text-center">
          <ShieldCheck className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold df-text mb-2">Panel Administrativo</h1>
          <p className="df-muted text-sm mb-6">Ingresa tu clave de administración.</p>
          <input 
            type="password" 
            value={passAdmin}
            onChange={(e) => setPassAdmin(e.target.value)}
            className="w-full df-card border df-border rounded-xl px-4 py-3 mb-4 text-center font-bold tracking-widest text-sm outline-none focus:border-amber-600"
            placeholder="Clave de admin"
            required
          />
          <button type="submit" className="w-full bg-amber-600 text-white font-bold py-3.5 rounded-xl hover:bg-amber-700 transition-all cursor-pointer text-sm">
            Entrar al Panel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen df-bg py-16 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-amber-600">Gestión</span>
            <h1 className="text-3xl font-black df-text mt-1">Nuevo Cliente</h1>
          </div>
          <Link href="/" className="text-sm df-muted hover:df-text flex items-center gap-2">
            <ArrowLeft size={16} /> Ver Web
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="df-card border df-border p-8 rounded-3xl shadow-xl space-y-4">
          <div>
            <label className="text-xs font-bold df-muted mb-1 block">Nombre de los Clientes (Ej. Ana & Carlos)</label>
            <input 
              type="text" 
              value={form.nombreCliente}
              onChange={e => setForm({...form, nombreCliente: e.target.value})}
              required
              className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-600 df-text"
              placeholder="Ej. Ana & Carlos"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold df-muted mb-1 block">Contraseña del Cliente</label>
              <input 
                type="text" 
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                required
                className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-600 df-text"
                placeholder="Ej. ana2026"
              />
            </div>
            <div>
              <label className="text-xs font-bold df-muted mb-1 block">Tipo de Evento</label>
              <input 
                type="text" 
                value={form.tipo}
                onChange={e => setForm({...form, tipo: e.target.value})}
                required
                className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-600 df-text"
                placeholder="Ej. Sesión de Boda"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold df-muted mb-1 block">Fecha del Evento</label>
              <input 
                type="text" 
                value={form.fecha}
                onChange={e => setForm({...form, fecha: e.target.value})}
                required
                className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-600 df-text"
                placeholder="Ej. 12 de Agosto, 2026"
              />
            </div>
            <div>
              <label className="text-xs font-bold df-muted mb-1 block">Link de Imagen de Portada</label>
              <input 
                type="url" 
                value={form.previewImage}
                onChange={e => setForm({...form, previewImage: e.target.value})}
                required
                className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-600 df-text"
                placeholder="https://imagen.com/foto.jpg"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold df-muted mb-1 block">Link de la Carpeta de Google Drive</label>
            <input 
              type="url" 
              value={form.driveLink}
              onChange={e => setForm({...form, driveLink: e.target.value})}
              required
              className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-600 df-text"
              placeholder="https://drive.google.com/drive/folders/..."
            />
          </div>

          <button 
            type="submit" 
            disabled={cargando}
            className="w-full bg-amber-600 text-white font-bold py-4 rounded-xl hover:bg-amber-700 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-6 text-sm"
          >
            <PlusCircle size={18} /> {cargando ? 'Guardando...' : 'Registrar Cliente en la Nube'}
          </button>
        </form>
      </div>
    </div>
  );
}