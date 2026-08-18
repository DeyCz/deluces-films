"use client";

import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Lock, FolderOpen, ExternalLink, LogOut, Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AreaClientes() {
  const [passwordInput, setPasswordInput] = useState('');
  const [clienteActual, setClienteActual] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError(false);

    try {
      const q = query(collection(db, "clientes"), where("password", "==", passwordInput.trim()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Obtenemos los datos del primer documento encontrado que coincida
        const datosCliente = querySnapshot.docs[0].data();
        setClienteActual(datosCliente);
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
          <p className="df-muted text-sm mb-6">Ingresa el código proporcionado en tu contrato.</p>
          
          <input 
            type="password" 
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className="w-full df-card border df-border rounded-xl px-4 py-3 mb-4 text-center font-bold tracking-widest text-lg focus:border-amber-600 outline-none df-text"
            placeholder="••••••••"
            required
          />

          {error && (
            <p className="text-red-500 text-xs mb-4 font-semibold">Código incorrecto. Verifica tus datos.</p>
          )}

          <button type="submit" disabled={cargando} className="w-full bg-amber-600 text-white font-bold py-3.5 rounded-xl hover:bg-amber-700 transition-all cursor-pointer text-sm">
            {cargando ? 'Buscando galería...' : 'Ingresar'}
          </button>
        </form>
      </div>
    );
  }

  // VISTA DE CLIENTE AUTENTICADO
  return (
    <div className="min-h-screen df-bg pt-12 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex justify-between items-center mb-10">
          <button onClick={() => setClienteActual(null)} className="text-sm df-muted hover:df-text flex items-center gap-2 cursor-pointer">
            <ArrowLeft size={16} /> Volver al acceso
          </button>
          <button onClick={() => setClienteActual(null)} className="text-sm df-muted hover:df-text flex items-center gap-2 cursor-pointer">
            <LogOut size={16} /> Salir
          </button>
        </div>

        <div className="mb-8">
            <span className="text-xs uppercase tracking-widest font-bold text-amber-600">Bienvenido/a</span>
            <h1 className="text-4xl font-black df-text mt-1">{clienteActual.nombreCliente}</h1>
            <p className="df-muted text-sm mt-1">{clienteActual.tipo} • {clienteActual.fecha}</p>
        </div>

        {/* VITRINA DEL PROYECTO */}
        <div className="df-card border df-border rounded-3xl overflow-hidden shadow-2xl">
          <div className="h-64 w-full bg-gray-800 relative">
             <img src={clienteActual.previewImage} alt="Preview" className="w-full h-full object-cover opacity-70" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
             <div className="absolute bottom-6 left-8 text-white">
                <h2 className="text-2xl font-bold">Tu material está listo</h2>
             </div>
          </div>
          
          <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="df-muted text-sm max-w-md">Hemos preparado una carpeta exclusiva con toda la selección en alta definición lista para descargar.</p>
            
            <a href={clienteActual.driveLink} target="_blank" rel="noopener noreferrer" className="w-full md:w-auto flex items-center justify-center gap-2 bg-amber-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-amber-700 transition-all shadow-lg cursor-pointer">
              <Download size={20} /> Descargar Archivos
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}