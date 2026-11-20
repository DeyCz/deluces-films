"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  ShieldCheck, PlusCircle, ArrowLeft, Image as ImageIcon, 
  Trash2, Edit2, X, RefreshCw, Video, LogOut, Copy, Send, 
  Search, Plus, BookOpen, Star, FolderOpen, Layers, Sparkles,
  Music, Sun, Moon, Users, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

const PRESETS_MUSICA = [
  { id: 'ambiental', label: 'Piano Ambiental (Incluida por defecto)', url: '', titulo: 'Piano Ambiental' },
  { id: 'romantica', label: 'Romántica / Parejas (/musica/romantica.mp3)', url: '/musica/romantica.mp3', titulo: 'Melodía Romántica' },
  { id: 'promocion', label: 'Promoción Escolar (/musica/promocion.mp3)', url: '/musica/promocion.mp3', titulo: 'Recuerdos de Promoción' },
  { id: 'quinceanera', label: '15 Años / Vals (/musica/quinceanera.mp3)', url: '/musica/quinceanera.mp3', titulo: 'Vals de 15 Años' },
  { id: 'fiesta', label: 'Fiesta Patronal (/musica/fiesta.mp3)', url: '/musica/fiesta.mp3', titulo: 'Ambiente Festivo' },
  { id: 'cinematica', label: 'Cinemática / Institucional (/musica/cinematica.mp3)', url: '/musica/cinematica.mp3', titulo: 'Instrumental Cinemático' },
  { id: 'personalizada', label: 'Canción personalizada (Link MP3 o Google Drive)', url: '', titulo: '' },
  { id: 'ninguna', label: 'Sin música de fondo', url: '', titulo: '' },
];

const esLinkCarpetaDrive = (url) => {
  if (!url) return false;
  const limpia = url.trim();
  return (
    limpia.includes('drive.google.com') &&
    (limpia.includes('/folders/') || /[?&]id=[a-zA-Z0-9_-]+/.test(limpia))
  );
};

const normalizarImagenUrl = (url, ancho = 1600) => {
  if (!url) return '';
  const limpia = url.trim();
  if (limpia.includes('drive.google.com/file/d/')) {
    const fileId = limpia.split('/d/')[1]?.split('/')[0];
    if (fileId) return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${ancho}`;
  }
  if (limpia.includes('drive.google.com/thumbnail?id=')) {
    const fileId = limpia.split('id=')[1]?.split('&')[0];
    if (fileId) return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${ancho}`;
  }
  if (limpia.includes('drive.google.com') && /[?&]id=([a-zA-Z0-9_-]+)/.test(limpia) && !limpia.includes('/folders/')) {
    const match = limpia.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match?.[1]) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w${ancho}`;
  }
  return limpia;
};

const obtenerSrcPruebaAudio = (tipo, url) => {
  if (tipo === 'ninguna' || tipo === 'ambiental') return null;
  const limpia = (url || '').trim();
  if (!limpia) return null;
  if (limpia.includes('drive.google.com/file/d/')) {
    const id = limpia.split('/d/')[1]?.split('/')[0];
    if (id) return `/api/audio?id=${id}`;
  }
  if (limpia.includes('drive.google.com') && limpia.includes('id=')) {
    const id = limpia.split('id=')[1]?.split('&')[0];
    if (id) return `/api/audio?id=${id}`;
  }
  return limpia;
};

const obtenerUrlWhatsAppEntrega = (cliente) => {
  const texto = `¡Hola! 👋✨ Espero que se encuentren muy bien.\n\nMe emociona avisarles que ya están listos los archivos y el Álbum Digital de *${cliente.nombreCliente}* (${cliente.tipo}). 📸🎥🎉\n\nPara ver su álbum interactivo y descargar todo su material en alta calidad, pueden ingresar directamente a nuestra plataforma web:\n\n🌐 *Enlace directo:* https://deluces-films.vercel.app/clientes?code=${encodeURIComponent(cliente.password)}\n🔑 *Contraseña:* ${cliente.password}\n\nDe parte de *Deluces Films*, muchas gracias por confiar en nosotros para capturar estos recuerdos. ¡Que lo disfruten muchísimo! 🥂🎬`;
  
  const textoCodificado = encodeURIComponent(texto);
  let fono = (cliente.telefonoCliente || '').replace(/\D/g, '');
  if (fono.length === 9) fono = `51${fono}`;

  if (fono) {
    return `https://api.whatsapp.com/send?phone=${fono}&text=${textoCodificado}`;
  }
  return `https://api.whatsapp.com/send?text=${textoCodificado}`;
};

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargandoAuth, setCargandoAuth] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [erroresCarga, setErroresCarga] = useState([]);

  // Tema y Navegación por Pestañas
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [tabActiva, setTabActiva] = useState('clientes');
  
  // ESTADOS CLIENTES
  const clienteInicial = { 
    nombreCliente: '', 
    password: '', 
    telefonoCliente: '',
    tipo: '', 
    fecha: '', 
    previewImage: '', 
    driveLink: '',
    enlacesExtra: [],
    albumFotosTexto: '',
    musicaTipo: 'ambiental',
    musicaUrl: '',
    musicaTitulo: ''
  };
  const [formCliente, setFormCliente] = useState(clienteInicial);
  const [cargandoCliente, setCargandoCliente] = useState(false);
  const [extrayendoAlbumCliente, setExtrayendoAlbumCliente] = useState(false);
  const [listaClientes, setListaClientes] = useState([]);
  const [editandoClienteId, setEditandoClienteId] = useState(null);
  const [busquedaCliente, setBusquedaCliente] = useState('');

  // ESTADOS GALERÍA PORTAFOLIO
  const galeriaInicial = { 
    slug: 'institucional', 
    carpeta: '', 
    titulo: '', 
    orden: 1, 
    modoSubida: 'carpetaDrive',
    carpetaDriveUrl: '',
    imagenUrl: '', 
    loteImagenesTexto: '',
    videoUrl: '', 
    formatoVideo: 'vertical' 
  };
  const [formGaleria, setFormGaleria] = useState(galeriaInicial);
  const [cargandoGaleria, setCargandoGaleria] = useState(false);
  const [listaGaleria, setListaGaleria] = useState([]);
  const [editandoFotoId, setEditandoFotoId] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState('todas');

  // ESTADOS TESTIMONIOS RECIBIDOS
  const [listaTestimonios, setListaTestimonios] = useState([]);

  // Sincronización de Modo Oscuro / Claro
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('isDarkMode');
    const dark = saved === null ? true : saved === 'true';
    setIsDarkMode(dark);
    document.documentElement.classList.toggle('dark', dark);
    document.body.classList.toggle('dark-mode', dark);
  }, []);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem('isDarkMode', String(next));
    document.documentElement.classList.toggle('dark', next);
    document.body.classList.toggle('dark-mode', next);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) cargarDatos();
    });
    return () => unsubscribe();
  }, []);

  // CARGA BLINDADA: Cada colección carga independientemente
  const cargarDatos = async () => {
    setRefrescando(true);
    setErroresCarga([]);

    const [resClientes, resGaleria, resTestimonios] = await Promise.allSettled([
      getDocs(collection(db, "clientes")),
      getDocs(collection(db, "galerias")),
      getDocs(collection(db, "testimonios")),
    ]);

    const nuevosErrores = [];

    if (resClientes.status === 'fulfilled') {
      setListaClientes(resClientes.value.docs.map(d => ({ id: d.id, ...d.data() })));
    } else {
      console.error("Error cargando clientes:", resClientes.reason);
      nuevosErrores.push(`Clientes: ${resClientes.reason?.code || resClientes.reason?.message || 'Error de lectura'}`);
    }

    if (resGaleria.status === 'fulfilled') {
      const fotosCargadas = resGaleria.value.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0));
      setListaGaleria(fotosCargadas);
    } else {
      console.error("Error cargando galerias:", resGaleria.reason);
      nuevosErrores.push(`Portafolio: ${resGaleria.reason?.code || resGaleria.reason?.message || 'Error de lectura'}`);
    }

    if (resTestimonios.status === 'fulfilled') {
      const testimoniosOrdenados = resTestimonios.value.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setListaTestimonios(testimoniosOrdenados);
    } else {
      console.error("Error cargando testimonios:", resTestimonios.reason);
      nuevosErrores.push(`Reseñas (testimonios): ${resTestimonios.reason?.code || resTestimonios.reason?.message || 'Error de lectura'}`);
    }

    setErroresCarga(nuevosErrores);
    setTimeout(() => setRefrescando(false), 300);
  };

  const carpetasExistentesEnCategoria = useMemo(() => {
    const nombres = listaGaleria
      .filter(f => f.slug === formGaleria.slug && f.carpeta && f.carpeta.trim() !== '')
      .map(f => f.carpeta.trim());
    return [...new Set(nombres)];
  }, [listaGaleria, formGaleria.slug]);

  const totalCarpetasUnicas = useMemo(() => {
    const setCarpetas = new Set(
      listaGaleria
        .filter(f => f.carpeta && f.carpeta.trim() !== '')
        .map(f => `${f.slug}::${f.carpeta.trim()}`)
    );
    return setCarpetas.size;
  }, [listaGaleria]);

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

  const extraerArchivosDeCarpetaDrive = async (folderUrl) => {
    const res = await fetch('/api/drive-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderUrl })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'No se pudo leer la carpeta de Drive.');
    }
    return data.archivos;
  };

  // Extrae fotos desde el link pegado en la caja del álbum (si es carpeta) o desde el driveLink principal
  const importarCarpetaAlAlbumCliente = async () => {
    const textoCaja = (formCliente.albumFotosTexto || '').trim();
    const usarCajaComoOrigen =
      textoCaja.split('\n').length === 1 && esLinkCarpetaDrive(textoCaja);

    const urlAExtraer = usarCajaComoOrigen ? textoCaja : formCliente.driveLink.trim();

    if (!esLinkCarpetaDrive(urlAExtraer)) {
      alert(
        'Primero pega el enlace de una carpeta de Google Drive en el campo "Link de la Carpeta de Google Drive" (o pega el link de tu subcarpeta de fotos dentro de la caja del Álbum Digital).'
      );
      return;
    }

    setExtrayendoAlbumCliente(true);
    try {
      const archivos = await extraerArchivosDeCarpetaDrive(urlAExtraer);
      const soloFotos = archivos.filter(a => !a.esVideo).map(a => a.imagenUrl);
      const cantVideos = archivos.filter(a => a.esVideo).length;

      if (soloFotos.length === 0) {
        alert(
          cantVideos > 0
            ? `Se encontraron ${cantVideos} videos en esa carpeta, pero ninguna fotografía. Si las fotos están en otra subcarpeta, pega ese link aquí y vuelve a extraer.`
            : 'No se encontraron fotografías en esa carpeta.'
        );
        return;
      }

      setFormCliente(prev => ({
        ...prev,
        previewImage: prev.previewImage || soloFotos[0],
        albumFotosTexto: soloFotos.join('\n')
      }));

      alert(
        `¡Listo! Se extrajeron ${soloFotos.length} fotos automáticamente para el Álbum Digital.`
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setExtrayendoAlbumCliente(false);
    }
  };

  const handleCambiarTipoMusica = (nuevoTipo) => {
    const preset = PRESETS_MUSICA.find(p => p.id === nuevoTipo);
    if (!preset) return;

    if (nuevoTipo === 'personalizada') {
      setFormCliente(prev => ({
        ...prev,
        musicaTipo: 'personalizada',
        musicaUrl: prev.musicaTipo === 'personalizada' ? prev.musicaUrl : '',
        musicaTitulo: prev.musicaTipo === 'personalizada' ? prev.musicaTitulo : '',
      }));
    } else {
      setFormCliente(prev => ({
        ...prev,
        musicaTipo: nuevoTipo,
        musicaUrl: preset.url,
        musicaTitulo: preset.titulo,
      }));
    }
  };

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

  const handleSubmitCliente = async (e) => {
    e.preventDefault();
    setCargandoCliente(true);
    try {
      let textoAlbum = (formCliente.albumFotosTexto || '').trim();

      // Si pegó un link de carpeta de Drive (incluyendo /u/0/folders/) dentro del álbum, lo expandimos
      if (textoAlbum.split('\n').length === 1 && esLinkCarpetaDrive(textoAlbum)) {
        const archivos = await extraerArchivosDeCarpetaDrive(textoAlbum);
        textoAlbum = archivos.filter(a => !a.esVideo).map(a => a.imagenUrl).join('\n');
      }

      const listaFotosAlbum = textoAlbum
        .split('\n')
        .map(linea => normalizarImagenUrl(linea))
        .filter(url => url !== '');

      const portadaFinal =
        normalizarImagenUrl(formCliente.previewImage) ||
        listaFotosAlbum[0] ||
        '/institucional.jpg';

      const datosLimpios = {
        nombreCliente: formCliente.nombreCliente.trim(),
        password: formCliente.password.trim(),
        telefonoCliente: (formCliente.telefonoCliente || '').trim(),
        tipo: formCliente.tipo.trim(),
        fecha: formCliente.fecha.trim(),
        previewImage: portadaFinal,
        driveLink: formCliente.driveLink.trim(),
        enlacesExtra: (formCliente.enlacesExtra || []).filter(item => item.url?.trim() !== ''),
        albumFotos: listaFotosAlbum,
        musicaTipo: formCliente.musicaTipo || 'ambiental',
        musicaUrl: (formCliente.musicaUrl || '').trim(),
        musicaTitulo: (formCliente.musicaTitulo || '').trim(),
      };

      if (editandoClienteId) {
        await updateDoc(doc(db, "clientes", editandoClienteId), datosLimpios);
        alert('¡Cliente, Álbum Digital y Música actualizados correctamente!');
        setEditandoClienteId(null);
      } else {
        await addDoc(collection(db, "clientes"), { ...datosLimpios, createdAt: new Date() });
        alert('¡Cliente registrado en la nube!');
      }
      setFormCliente(clienteInicial);
      cargarDatos();
    } catch (error) {
      alert(error.message || 'Hubo un error al guardar el cliente.');
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

  const eliminarTestimonio = async (id) => {
    if (window.confirm("¿Seguro de eliminar esta reseña?")) {
      await deleteDoc(doc(db, "testimonios", id));
      cargarDatos();
    }
  };

  const prepararEdicionCliente = (cliente) => {
    setTabActiva('clientes');
    setEditandoClienteId(cliente.id);
    const tipoGuardado = cliente.musicaTipo || (cliente.musicaUrl ? 'personalizada' : 'ambiental');
    setFormCliente({
      ...clienteInicial,
      ...cliente,
      telefonoCliente: cliente.telefonoCliente || '',
      enlacesExtra: Array.isArray(cliente.enlacesExtra) ? cliente.enlacesExtra : [],
      albumFotosTexto: Array.isArray(cliente.albumFotos) ? cliente.albumFotos.join('\n') : '',
      musicaTipo: tipoGuardado,
      musicaUrl: cliente.musicaUrl || '',
      musicaTitulo: cliente.musicaTitulo || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copiarMensajeCliente = (cliente) => {
    const texto = `¡Hola! 👋✨ Espero que se encuentren muy bien.\n\nMe emociona avisarles que ya están listos los archivos y el Álbum Digital de *${cliente.nombreCliente}* (${cliente.tipo}). 📸🎥🎉\n\nPara ver su álbum interactivo y descargar todo su material en alta calidad, pueden ingresar directamente a nuestra plataforma web:\n\n🌐 *Enlace directo:* https://deluces-films.vercel.app/clientes?code=${encodeURIComponent(cliente.password)}\n🔑 *Contraseña:* ${cliente.password}\n\nDe parte de *Deluces Films*, muchas gracias por confiar en nosotros para capturar estos recuerdos. ¡Que lo disfruten muchísimo! 🥂🎬`;
    navigator.clipboard.writeText(texto);
    alert(`¡Mensaje de entrega para "${cliente.nombreCliente}" copiado al portapapeles!`);
  };

  const handleSubmitGaleria = async (e) => {
    e.preventDefault();
    setCargandoGaleria(true);
    try {
      const carpetaLimpia = (formGaleria.carpeta || '').trim();
      const ordenBase = Number(formGaleria.orden) || 1;

      if (!editandoFotoId && formGaleria.modoSubida === 'carpetaDrive') {
        if (!carpetaLimpia) {
          alert('Por favor escribe el nombre de la Institución / Asociación en el campo Carpeta.');
          setCargandoGaleria(false);
          return;
        }

        const archivos = await extraerArchivosDeCarpetaDrive(formGaleria.carpetaDriveUrl);
        await Promise.all(
          archivos.map((archivo, idx) =>
            addDoc(collection(db, "galerias"), {
              slug: formGaleria.slug,
              carpeta: carpetaLimpia,
              titulo: formGaleria.titulo.trim() 
                ? `${formGaleria.titulo.trim()} #${idx + 1}` 
                : `${carpetaLimpia} #${idx + 1}`,
              orden: ordenBase + idx,
              imagenUrl: archivo.imagenUrl,
              videoUrl: archivo.videoUrl || '',
              formatoVideo: 'vertical',
              createdAt: new Date()
            })
          )
        );
        alert(`¡Espectacular! Se importaron automáticamente ${archivos.length} archivos desde Google Drive hacia "${carpetaLimpia}".`);
      } 
      else if (!editandoFotoId && formGaleria.modoSubida === 'lote') {
        const urls = (formGaleria.loteImagenesTexto || '')
          .split('\n')
          .map(linea => normalizarImagenUrl(linea))
          .filter(u => u !== '');

        if (urls.length === 0) {
          alert('Pega al menos un enlace de foto en la lista.');
          setCargandoGaleria(false);
          return;
        }

        await Promise.all(
          urls.map((imgUrl, idx) =>
            addDoc(collection(db, "galerias"), {
              slug: formGaleria.slug,
              carpeta: carpetaLimpia,
              titulo: formGaleria.titulo.trim() || `${carpetaLimpia || 'Fotografía'} #${idx + 1}`,
              orden: ordenBase + idx,
              imagenUrl: imgUrl,
              videoUrl: '',
              formatoVideo: 'vertical',
              createdAt: new Date()
            })
          )
        );
        alert(`¡${urls.length} fotografías agregadas a la carpeta "${carpetaLimpia || formGaleria.slug}"!`);
      } 
      else {
        const cleanVideoUrl = formGaleria.videoUrl?.trim() || "";
        const dataToSave = { 
          slug: formGaleria.slug,
          carpeta: carpetaLimpia,
          titulo: formGaleria.titulo.trim() || carpetaLimpia || 'Fotografía',
          imagenUrl: normalizarImagenUrl(formGaleria.imagenUrl),
          orden: ordenBase,
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
      }
      
      setFormGaleria({ 
        ...galeriaInicial, 
        slug: formGaleria.slug, 
        carpeta: carpetaLimpia,
        modoSubida: formGaleria.modoSubida
      }); 
      cargarDatos();
    } catch (error) {
      console.error(error);
      alert(error.message || 'Hubo un error al subir el archivo.');
    } finally {
      setCargandoGaleria(false);
    }
  };

  const agruparFotosSueltasEnCarpeta = async (slugCategoria) => {
    const fotosSueltas = listaGaleria.filter(
      f => f.slug === slugCategoria && (!f.carpeta || f.carpeta.trim() === '')
    );
    if (fotosSueltas.length === 0) return;

    const nombreNuevaCarpeta = window.prompt(
      `Tienes ${fotosSueltas.length} fotos sin carpeta en /${slugCategoria}.\n\nEscribe el nombre de la Institución, Colegio o Asociación para agruparlas todas en esa carpeta (Ej: I.E. Almirante Grau):`
    );

    if (!nombreNuevaCarpeta || !nombreNuevaCarpeta.trim()) return;

    setRefrescando(true);
    try {
      await Promise.all(
        fotosSueltas.map(foto =>
          updateDoc(doc(db, "galerias", foto.id), { carpeta: nombreNuevaCarpeta.trim() })
        )
      );
      alert(`¡Listo! Las ${fotosSueltas.length} fotos ahora están dentro de la carpeta "${nombreNuevaCarpeta.trim()}".`);
      cargarDatos();
    } catch (err) {
      alert('Error al agrupar las fotos.');
    } finally {
      setRefrescando(false);
    }
  };

  const renombrarCarpetaCompleta = async (slugCategoria, nombreActual) => {
    const nuevoNombre = window.prompt(`Cambiar el nombre de la carpeta "${nombreActual}" por:`, nombreActual);
    if (!nuevoNombre || nuevoNombre.trim() === nombreActual) return;

    const fotosDeCarpeta = listaGaleria.filter(
      f => f.slug === slugCategoria && (f.carpeta || '').trim() === nombreActual
    );

    setRefrescando(true);
    try {
      await Promise.all(
        fotosDeCarpeta.map(foto =>
          updateDoc(doc(db, "galerias", foto.id), { carpeta: nuevoNombre.trim() })
        )
      );
      cargarDatos();
    } catch (err) {
      alert('Error al renombrar carpeta.');
    } finally {
      setRefrescando(false);
    }
  };

  const eliminarCarpetaCompleta = async (slugCategoria, nombreCarpeta) => {
    const fotosDeCarpeta = listaGaleria.filter(
      f => f.slug === slugCategoria && (f.carpeta || '').trim() === nombreCarpeta
    );
    if (!window.confirm(`¿Seguro que deseas eliminar toda la carpeta "${nombreCarpeta}" (${fotosDeCarpeta.length} archivos)?`)) return;

    setRefrescando(true);
    try {
      await Promise.all(fotosDeCarpeta.map(foto => deleteDoc(doc(db, "galerias", foto.id))));
      cargarDatos();
    } catch (err) {
      alert('Error al eliminar la carpeta.');
    } finally {
      setRefrescando(false);
    }
  };

  const eliminarFoto = async (id) => {
    if (window.confirm("¿Seguro de borrar este elemento de la web?")) {
      await deleteDoc(doc(db, "galerias", id));
      cargarDatos();
    }
  };

  const prepararEdicionFoto = (foto) => {
    setTabActiva('portafolio');
    setEditandoFotoId(foto.id);
    setFormGaleria({ 
      ...galeriaInicial,
      ...foto, 
      carpeta: foto.carpeta || '',
      modoSubida: 'individual',
      videoUrl: foto.videoUrl || '',
      formatoVideo: foto.formatoVideo || 'vertical'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!user) {
    return (
      <div className="min-h-screen df-bg flex items-center justify-center p-6 relative">
        <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-sm df-muted hover:df-text transition-all">
          <ArrowLeft size={16} /> Volver al sitio
        </Link>
        <button
          type="button"
          onClick={toggleDarkMode}
          className="absolute top-8 right-8 p-2.5 rounded-full df-card border df-border df-text hover:border-amber-600 transition-all cursor-pointer"
          aria-label="Cambiar tema"
        >
          {mounted && (isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />)}
        </button>

        <form onSubmit={handleLogin} className="df-card p-8 rounded-3xl border df-border w-full max-w-md shadow-2xl text-center">
          <div className="w-16 h-16 bg-amber-600/15 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-black df-text mb-1">Deluces Studio Admin</h1>
          <p className="df-muted text-sm mb-6">Ingresa tus credenciales de administrador.</p>
          
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full df-bg border df-border rounded-xl px-4 py-3 mb-3 text-sm outline-none focus:border-amber-600 df-text" placeholder="Correo electrónico" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full df-bg border df-border rounded-xl px-4 py-3 mb-6 text-sm outline-none focus:border-amber-600 df-text" placeholder="Contraseña" required />
          
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

  const fotosSueltasEnFiltro = filtroCategoria !== 'todas'
    ? galeriaFiltrada.filter(f => !f.carpeta || f.carpeta.trim() === '')
    : [];

  const carpetasEnFiltro = filtroCategoria !== 'todas'
    ? [...new Set(galeriaFiltrada.filter(f => f.carpeta && f.carpeta.trim() !== '').map(f => f.carpeta.trim()))]
    : [];

  const audioPruebaSrc = obtenerSrcPruebaAudio(formCliente.musicaTipo, formCliente.musicaUrl);

  return (
    <div className="min-h-screen df-bg pb-20">
      <header className="sticky top-0 z-40 df-bg/90 backdrop-blur-md border-b df-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md">
              <ShieldCheck size={20} />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-amber-600 block leading-none">
                Deluces Films • Studio
              </span>
              <h1 className="text-xl sm:text-2xl font-black df-text leading-tight">
                Panel de Control
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-xl df-card border df-border df-text hover:border-amber-600 transition-all cursor-pointer"
              title="Cambiar modo oscuro / claro"
            >
              {mounted && (isDarkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />)}
            </button>

            <button
              type="button"
              onClick={cargarDatos}
              disabled={refrescando}
              className={`px-3 py-2 rounded-xl df-card border df-border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                refrescando ? 'text-amber-500 border-amber-500/50' : 'df-text hover:border-amber-600'
              }`}
            >
              <RefreshCw size={14} className={refrescando ? "animate-spin" : ""} /> 
              {refrescando ? 'Cargando...' : 'Actualizar'}
            </button>

            <Link
              href="/"
              className="px-3 py-2 rounded-xl df-card border df-border text-xs font-bold df-text hover:border-amber-600 flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft size={14} /> Ver Web
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <LogOut size={14} /> Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-8 space-y-8">
        {erroresCarga.length > 0 && (
          <div className="p-4 rounded-2xl border border-red-500/40 bg-red-500/10 flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-bold text-red-500">
                Aviso de Firebase (algunas colecciones no pudieron leerse):
              </p>
              <ul className="list-disc pl-4 space-y-0.5 df-text">
                {erroresCarga.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
              <p className="df-muted pt-1">
                Revisa tus <strong>Reglas de Firestore</strong> en Firebase Console para permitir lectura/escritura en esa colección.
              </p>
            </div>
          </div>
        )}

        {/* TARJETAS RESUMEN */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => setTabActiva('clientes')}
            className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${
              tabActiva === 'clientes'
                ? 'df-card border-amber-600 shadow-lg'
                : 'df-card df-border hover:border-amber-600/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider df-muted">Clientes</span>
              <Users size={16} className="text-amber-600" />
            </div>
            <p className="text-3xl font-black df-text">{listaClientes.length}</p>
            <p className="text-[11px] df-muted mt-0.5">Accesos activos</p>
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('portafolio')}
            className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${
              tabActiva === 'portafolio'
                ? 'df-card border-amber-600 shadow-lg'
                : 'df-card df-border hover:border-amber-600/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider df-muted">Portafolio</span>
              <ImageIcon size={16} className="text-amber-600" />
            </div>
            <p className="text-3xl font-black df-text">{listaGaleria.length}</p>
            <p className="text-[11px] df-muted mt-0.5">Fotos y videos</p>
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('portafolio')}
            className="text-left p-5 rounded-2xl df-card border df-border hover:border-amber-600/50 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider df-muted">Carpetas</span>
              <FolderOpen size={16} className="text-amber-600" />
            </div>
            <p className="text-3xl font-black df-text">{totalCarpetasUnicas}</p>
            <p className="text-[11px] df-muted mt-0.5">Álbumes creados</p>
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('resenas')}
            className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${
              tabActiva === 'resenas'
                ? 'df-card border-amber-600 shadow-lg'
                : 'df-card df-border hover:border-amber-600/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider df-muted">Reseñas</span>
              <Star size={16} className="text-amber-500" fill="currentColor" />
            </div>
            <p className="text-3xl font-black df-text">{listaTestimonios.length}</p>
            <p className="text-[11px] df-muted mt-0.5">Testimonios reales</p>
          </button>
        </div>

        {/* BARRA DE PESTAÑAS */}
        <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl df-card border df-border w-fit">
          <button
            type="button"
            onClick={() => setTabActiva('clientes')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              tabActiva === 'clientes' ? 'bg-amber-600 text-white shadow-md' : 'df-muted hover:df-text'
            }`}
          >
            <Users size={15} /> Clientes y Álbumes ({listaClientes.length})
          </button>
          <button
            type="button"
            onClick={() => setTabActiva('portafolio')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              tabActiva === 'portafolio' ? 'bg-amber-600 text-white shadow-md' : 'df-muted hover:df-text'
            }`}
          >
            <FolderOpen size={15} /> Portafolio Web ({listaGaleria.length})
          </button>
          <button
            type="button"
            onClick={() => setTabActiva('resenas')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              tabActiva === 'resenas' ? 'bg-amber-600 text-white shadow-md' : 'df-muted hover:df-text'
            }`}
          >
            <Star size={15} /> Reseñas ({listaTestimonios.length})
          </button>
        </div>

        {/* PESTAÑA 1: CLIENTES */}
        {tabActiva === 'clientes' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 df-card border df-border p-6 sm:p-8 rounded-3xl shadow-xl">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <span className="text-[11px] uppercase tracking-widest font-bold text-amber-600">Acceso Privado & Álbum</span>
                  <h2 className="text-xl font-bold df-text mt-1">{editandoClienteId ? 'Editar Cliente' : 'Registrar Cliente'}</h2>
                </div>
                {editandoClienteId && (
                  <button type="button" onClick={() => { setEditandoClienteId(null); setFormCliente(clienteInicial); }} className="p-2 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/20 cursor-pointer">
                    <X size={16} />
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmitCliente} className="space-y-4">
                <input type="text" value={formCliente.nombreCliente} onChange={e => setFormCliente({...formCliente, nombreCliente: e.target.value})} required className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm focus:border-amber-600 df-text outline-none" placeholder="Nombre del Cliente o Evento" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={formCliente.password} onChange={e => setFormCliente({...formCliente, password: e.target.value})} required className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm focus:border-amber-600 df-text outline-none" placeholder="Contraseña (Ej. 6A2026)" />
                  <input type="tel" value={formCliente.telefonoCliente} onChange={e => setFormCliente({...formCliente, telefonoCliente: e.target.value})} className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm focus:border-amber-600 df-text outline-none" placeholder="WhatsApp Cliente (Opcional)" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={formCliente.tipo} onChange={e => setFormCliente({...formCliente, tipo: e.target.value})} required className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm focus:border-amber-600 df-text outline-none" placeholder="Tipo de Evento" />
                  <input type="text" value={formCliente.fecha} onChange={e => setFormCliente({...formCliente, fecha: e.target.value})} required className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm focus:border-amber-600 df-text outline-none" placeholder="Fecha (Ej. 15 Octubre)" />
                </div>
                <input type="url" value={formCliente.driveLink} onChange={e => setFormCliente({...formCliente, driveLink: e.target.value})} required className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm focus:border-amber-600 df-text outline-none" placeholder="1. Pega aquí el Link de la Carpeta de Google Drive" />
                <input type="url" value={formCliente.previewImage} onChange={e => setFormCliente({...formCliente, previewImage: e.target.value})} className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm focus:border-amber-600 df-text outline-none" placeholder="URL Foto de Portada (Opcional: usa la 1ra foto si queda vacío)" />

                <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-[11px] font-bold uppercase text-amber-600 flex items-center gap-1.5">
                      <BookOpen size={14}/> Álbum Digital Interactivo
                    </label>
                    <button
                      type="button"
                      onClick={importarCarpetaAlAlbumCliente}
                      disabled={extrayendoAlbumCliente}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                    >
                      <Sparkles size={12} />
                      {extrayendoAlbumCliente ? 'Extrayendo...' : 'Extraer de Drive (1 clic)'}
                    </button>
                  </div>
                  <textarea 
                    rows="3"
                    value={formCliente.albumFotosTexto}
                    onChange={e => setFormCliente({...formCliente, albumFotosTexto: e.target.value})}
                    placeholder="Toca 'Extraer de Drive' para jalar del Link Principal, o pega aquí el link de la subcarpeta de Fotos y toca el botón."
                    className="w-full df-bg border df-border rounded-xl px-3 py-2 text-xs focus:border-amber-600 df-text outline-none resize-y"
                  />
                </div>

                {/* MÚSICA POR CLIENTE */}
                <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                  <label className="text-[11px] font-bold uppercase text-emerald-500 flex items-center gap-1.5">
                    <Music size={14} /> Música del Álbum para este Cliente
                  </label>

                  <select
                    value={formCliente.musicaTipo}
                    onChange={e => handleCambiarTipoMusica(e.target.value)}
                    className="w-full df-bg border df-border rounded-xl px-3 py-2.5 text-xs df-text outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {PRESETS_MUSICA.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>

                  {formCliente.musicaTipo === 'personalizada' && (
                    <input
                      type="url"
                      value={formCliente.musicaUrl}
                      onChange={e => setFormCliente({ ...formCliente, musicaUrl: e.target.value })}
                      placeholder="Link de Google Drive del MP3 o URL directa .mp3"
                      className="w-full df-bg border df-border rounded-xl px-3 py-2.5 text-xs focus:border-emerald-500 df-text outline-none"
                    />
                  )}

                  {formCliente.musicaTipo !== 'ninguna' && (
                    <input
                      type="text"
                      value={formCliente.musicaTitulo}
                      onChange={e => setFormCliente({ ...formCliente, musicaTitulo: e.target.value })}
                      placeholder="Nombre visible (Ej. Perfect - Instrumental)"
                      className="w-full df-bg border df-border rounded-xl px-3 py-2.5 text-xs focus:border-emerald-500 df-text outline-none"
                    />
                  )}

                  {audioPruebaSrc && (
                    <div className="pt-1 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-500 block">Vista previa:</span>
                      <audio key={audioPruebaSrc} controls preload="none" className="w-full h-8">
                        <source src={audioPruebaSrc} type="audio/mpeg" />
                      </audio>
                    </div>
                  )}
                </div>

                {/* ENLACES ADICIONALES */}
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

                <button type="submit" disabled={cargandoCliente} className={`w-full text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 mt-4 text-sm cursor-pointer ${editandoClienteId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
                  {editandoClienteId ? <Edit2 size={18} /> : <PlusCircle size={18} />} {cargandoCliente ? 'Guardando...' : (editandoClienteId ? 'Actualizar Cliente' : 'Registrar Cliente')}
                </button>
              </form>
            </div>

            <div className="lg:col-span-6 df-card border df-border p-6 rounded-3xl shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b df-border">
                <div>
                  <h3 className="font-bold df-text text-lg">Clientes Registrados ({clientesFiltrados.length})</h3>
                  <p className="text-xs df-muted">Gestiona accesos, música y envíos por WhatsApp.</p>
                </div>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 df-muted" />
                  <input 
                    type="text" 
                    value={busquedaCliente}
                    onChange={e => setBusquedaCliente(e.target.value)}
                    placeholder="Buscar cliente o código..."
                    className="df-bg border df-border rounded-xl pl-8 pr-3 py-2 text-xs df-text outline-none focus:border-amber-600 w-full sm:w-52"
                  />
                </div>
              </div>

              <div className="max-h-[680px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {clientesFiltrados.length === 0 && (
                  <div className="py-12 text-center df-muted text-xs">
                    {refrescando ? 'Cargando clientes desde Firebase...' : 'No se encontraron clientes.'}
                  </div>
                )}
                {clientesFiltrados.map(cliente => (
                  <div key={cliente.id} className="flex justify-between items-center p-3.5 df-bg rounded-2xl border df-border hover:border-amber-500/50 transition-colors gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-black border df-border flex-shrink-0">
                        <img
                          src={normalizarImagenUrl(cliente.previewImage, 120) || '/institucional.jpg'}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.src = '/institucional.jpg'; }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold df-text truncate">{cliente.nombreCliente}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="text-xs df-muted">Pass: <strong className="text-amber-600">{cliente.password}</strong></span>
                          {Array.isArray(cliente.albumFotos) && cliente.albumFotos.length > 0 && (
                            <span className="text-[10px] bg-amber-600/10 text-amber-600 px-1.5 py-0.5 rounded font-semibold">
                              📸 {cliente.albumFotos.length}
                            </span>
                          )}
                          {cliente.musicaUrl && cliente.musicaTipo !== 'ninguna' && (
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-semibold truncate max-w-[110px]">
                              🎵 {cliente.musicaTitulo || 'MP3'}
                            </span>
                          )}
                          {Array.isArray(cliente.enlacesExtra) && cliente.enlacesExtra.length > 0 && (
                            <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded font-semibold">
                              +{cliente.enlacesExtra.length} links
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button type="button" onClick={() => copiarMensajeCliente(cliente)} className="p-2 bg-amber-500/10 text-amber-600 rounded-lg hover:bg-amber-600 hover:text-white transition-colors cursor-pointer" title="Copiar mensaje"><Copy size={14}/></button>
                      <a href={obtenerUrlWhatsAppEntrega(cliente)} target="_blank" rel="noopener noreferrer" className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer inline-flex items-center justify-center" title="Enviar por WhatsApp"><Send size={14}/></a>
                      <button type="button" onClick={() => prepararEdicionCliente(cliente)} className="p-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-colors cursor-pointer" title="Editar"><Edit2 size={14}/></button>
                      <button type="button" onClick={() => eliminarCliente(cliente.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors cursor-pointer" title="Eliminar"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: PORTAFOLIO */}
        {tabActiva === 'portafolio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 df-card border df-border p-6 sm:p-8 rounded-3xl shadow-xl">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <span className="text-[11px] uppercase tracking-widest font-bold text-amber-600">Portafolio Web & Carpetas</span>
                  <h2 className="text-xl font-bold df-text mt-1">{editandoFotoId ? 'Editar Contenido' : 'Subir al Portafolio'}</h2>
                </div>
                {editandoFotoId && (
                  <button type="button" onClick={() => { setEditandoFotoId(null); setFormGaleria({ ...galeriaInicial, slug: formGaleria.slug }); }} className="p-2 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/20 cursor-pointer">
                    <X size={16} />
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmitGaleria} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-amber-600 ml-1">1. Categoría del Portafolio</label>
                  <select 
                    value={formGaleria.slug} 
                    onChange={e => {
                      setFormGaleria({...formGaleria, slug: e.target.value, carpeta: ''});
                      setFiltroCategoria(e.target.value);
                    }} 
                    required 
                    className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm focus:border-amber-600 df-text outline-none"
                  >
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

                <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-2.5">
                  <label className="text-[11px] font-bold uppercase text-amber-600 flex items-center gap-1.5">
                    <FolderOpen size={14} /> 2. Nombre de la Carpeta / Institución
                  </label>
                  <input 
                    type="text" 
                    value={formGaleria.carpeta} 
                    onChange={e => setFormGaleria({...formGaleria, carpeta: e.target.value})} 
                    className="w-full df-bg border df-border rounded-xl px-4 py-2.5 text-sm focus:border-amber-600 df-text outline-none" 
                    placeholder="Ej. I.E. Almirante Grau / Asociación Jauja Pasco" 
                  />

                  {carpetasExistentesEnCategoria.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] df-muted block">Carpetas existentes en /{formGaleria.slug}:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {carpetasExistentesEnCategoria.map((nombreCarp) => (
                          <button
                            key={nombreCarp}
                            type="button"
                            onClick={() => setFormGaleria({...formGaleria, carpeta: nombreCarp})}
                            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                              formGaleria.carpeta === nombreCarp 
                                ? 'bg-amber-600 text-white border-amber-600 font-bold' 
                                : 'df-bg df-border df-text hover:border-amber-600'
                            }`}
                          >
                            <FolderOpen size={11} /> {nombreCarp}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {!editandoFotoId && (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setFormGaleria({...formGaleria, modoSubida: 'carpetaDrive', videoUrl: ''})}
                      className={`py-2.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        formGaleria.modoSubida === 'carpetaDrive' ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'df-bg df-border df-muted'
                      }`}
                    >
                      <FolderOpen size={13} /> 1 Link Carpeta
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormGaleria({...formGaleria, modoSubida: 'individual'})}
                      className={`py-2.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        formGaleria.modoSubida === 'individual' ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'df-bg df-border df-muted'
                      }`}
                    >
                      <ImageIcon size={13} /> 1 Foto / Video
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormGaleria({...formGaleria, modoSubida: 'lote', videoUrl: ''})}
                      className={`py-2.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        formGaleria.modoSubida === 'lote' ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'df-bg df-border df-muted'
                      }`}
                    >
                      <Layers size={13} /> Varios Links
                    </button>
                  </div>
                )}

                {!editandoFotoId && formGaleria.modoSubida === 'carpetaDrive' && (
                  <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                    <label className="text-[11px] font-bold uppercase text-emerald-500 flex items-center gap-1.5">
                      <Sparkles size={14} /> 3. Pega el Link de la Carpeta de Google Drive
                    </label>
                    <input
                      type="url"
                      value={formGaleria.carpetaDriveUrl}
                      onChange={e => setFormGaleria({...formGaleria, carpetaDriveUrl: e.target.value})}
                      required
                      placeholder="https://drive.google.com/drive/folders/1ABCdef..."
                      className="w-full df-bg border df-border rounded-xl px-4 py-3 text-sm focus:border-emerald-500 df-text outline-none"
                    />
                    <p className="text-[10px] df-muted leading-relaxed">
                      ✨ Extrae automáticamente todas las fotos públicas de la carpeta y las agrupa en <strong>{formGaleria.carpeta || '(escribe el nombre arriba)'}</strong>.
                    </p>
                  </div>
                )}

                {!editandoFotoId && formGaleria.modoSubida === 'lote' && (
                  <div>
                    <label className="text-[10px] font-bold uppercase text-amber-600 ml-1 flex items-center gap-1 mb-1">
                      <Layers size={12}/> Pega varios enlaces de fotos (1 link por línea)
                    </label>
                    <textarea
                      rows="4"
                      value={formGaleria.loteImagenesTexto}
                      onChange={e => setFormGaleria({...formGaleria, loteImagenesTexto: e.target.value})}
                      required
                      placeholder={"https://drive.google.com/file/d/.../view\nhttps://drive.google.com/file/d/.../view"}
                      className="w-full df-bg border df-border rounded-xl px-4 py-3 text-xs focus:border-amber-600 df-text outline-none resize-y"
                    />
                  </div>
                )}

                {(editandoFotoId || formGaleria.modoSubida === 'individual') && (
                  <>
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
                  </>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold uppercase df-muted ml-1">Título (Opcional en carpeta)</label>
                    <input 
                      type="text" 
                      value={formGaleria.titulo} 
                      onChange={e => setFormGaleria({...formGaleria, titulo: e.target.value})} 
                      className="w-full df-bg border df-border rounded-xl px-4 py-2.5 text-xs focus:border-amber-600 df-text outline-none" 
                      placeholder="Si lo dejas vacío usará el nombre de la carpeta" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase df-muted ml-1">Orden Inicial</label>
                    <input type="number" value={formGaleria.orden} onChange={e => setFormGaleria({...formGaleria, orden: e.target.value})} required className="w-full df-bg border df-border rounded-xl px-4 py-2.5 text-xs focus:border-amber-600 df-text outline-none text-center" />
                  </div>
                </div>

                <button type="submit" disabled={cargandoGaleria} className={`w-full text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 mt-4 text-sm cursor-pointer ${editandoFotoId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
                  {editandoFotoId ? <Edit2 size={18} /> : <FolderOpen size={18} />} 
                  {cargandoGaleria 
                    ? 'Extrayendo y subiendo fotos...' 
                    : editandoFotoId 
                      ? 'Actualizar Contenido' 
                      : formGaleria.modoSubida === 'carpetaDrive' 
                        ? 'Importar Carpeta Completa de Drive' 
                        : 'Subir al Portafolio'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-6 df-card border df-border p-6 rounded-3xl shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b df-border">
                <h3 className="font-bold df-text text-lg">Portafolio Web ({galeriaFiltrada.length})</h3>
                <select 
                  value={filtroCategoria} 
                  onChange={e => setFiltroCategoria(e.target.value)}
                  className="df-bg border df-border rounded-xl px-3 py-2 text-xs df-text outline-none focus:border-amber-600"
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

              {filtroCategoria !== 'todas' && fotosSueltasEnFiltro.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-amber-600">
                      {fotosSueltasEnFiltro.length} fotos sin carpeta en /{filtroCategoria}
                    </p>
                    <p className="text-[11px] df-muted">
                      Agrúpalas en 1 clic bajo el nombre de su institución.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => agruparFotosSueltasEnCarpeta(filtroCategoria)}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 flex-shrink-0 cursor-pointer shadow-sm"
                  >
                    <FolderOpen size={14} /> Agrupar
                  </button>
                </div>
              )}

              {carpetasEnFiltro.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {carpetasEnFiltro.map(c => (
                    <div key={c} className="inline-flex items-center gap-1.5 text-[11px] df-bg border df-border px-2.5 py-1 rounded-lg">
                      <FolderOpen size={12} className="text-amber-600" />
                      <span className="font-semibold df-text">{c}</span>
                      <button type="button" onClick={() => renombrarCarpetaCompleta(filtroCategoria, c)} className="text-blue-500 ml-1 cursor-pointer" title="Renombrar"><Edit2 size={11} /></button>
                      <button type="button" onClick={() => eliminarCarpetaCompleta(filtroCategoria, c)} className="text-red-500 cursor-pointer" title="Eliminar carpeta"><Trash2 size={11} /></button>
                    </div>
                  ))}
                </div>
              )}

              <div className="max-h-[580px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {galeriaFiltrada.length === 0 && (
                  <div className="py-12 text-center df-muted text-xs">
                    {refrescando ? 'Cargando portafolio desde Firebase...' : 'No hay contenido en esta categoría.'}
                  </div>
                )}
                {galeriaFiltrada.map(foto => (
                  <div key={foto.id} className="flex justify-between items-center p-3 df-bg rounded-2xl border df-border hover:border-amber-500/50 transition-colors gap-2">
                    <div className="flex items-center gap-3 overflow-hidden w-full">
                      <div className="w-12 h-12 rounded-xl bg-black overflow-hidden flex-shrink-0 relative border df-border">
                        <img
                          src={normalizarImagenUrl(foto.imagenUrl, 160)}
                          alt="miniatura"
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover opacity-85"
                          onError={(e) => { e.currentTarget.src = '/institucional.jpg'; }}
                        />
                        {foto.videoUrl && <div className="absolute inset-0 flex items-center justify-center"><Video size={14} className="text-white drop-shadow-md"/></div>}
                      </div>
                      <div className="flex-1 pr-2 min-w-0">
                        <p className="text-sm font-bold df-text truncate">{foto.titulo || 'Sin título'}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-bold text-amber-600 tracking-wider">/{foto.slug}</span>
                          {foto.carpeta ? (
                            <span className="text-[10px] bg-amber-600/15 text-amber-600 px-2 py-0.5 rounded font-bold">
                              📁 {foto.carpeta}
                            </span>
                          ) : (
                            <span className="text-[10px] df-muted italic">(Sin carpeta)</span>
                          )}
                          <span className="text-[10px] df-muted">#{foto.orden}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button type="button" onClick={() => prepararEdicionFoto(foto)} className="p-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-colors cursor-pointer" title="Editar"><Edit2 size={14}/></button>
                      <button type="button" onClick={() => eliminarFoto(foto.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors cursor-pointer" title="Eliminar"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 3: RESEÑAS */}
        {tabActiva === 'resenas' && (
          <div className="df-card border df-border p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b df-border">
              <div>
                <h2 className="text-xl font-bold df-text flex items-center gap-2">
                  <Star size={18} className="text-amber-500" fill="currentColor" /> Reseñas de Clientes ({listaTestimonios.length})
                </h2>
                <p className="text-xs df-muted mt-0.5">
                  Las reseñas que tus clientes envían desde /clientes aparecen aquí y automáticamente en tu portada principal.
                </p>
              </div>
            </div>

            {listaTestimonios.length === 0 ? (
              <div className="py-12 text-center df-muted text-sm">
                Aún no hay reseñas registradas.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {listaTestimonios.map(item => (
                  <div key={item.id} className="p-5 df-bg rounded-2xl border df-border flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-amber-500 text-xs">{'★'.repeat(item.estrellas || 5)}</span>
                        <button type="button" onClick={() => eliminarTestimonio(item.id)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer" title="Eliminar reseña">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-xs df-text italic leading-relaxed">&ldquo;{item.comentario}&rdquo;</p>
                    </div>
                    <div className="pt-3 border-t df-border">
                      <p className="text-xs font-bold df-text">{item.nombreCliente}</p>
                      <p className="text-[10px] df-muted">{item.evento} • {item.fecha}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}