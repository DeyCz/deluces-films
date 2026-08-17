"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Video, Film, CheckCircle2, MapPin, Mail, 
  Smartphone, Send, Menu, X, ArrowRight, ArrowUp, 
  ChevronDown, Sun, Moon, Clapperboard 
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

// ==========================================
// COMPONENTE DE TARJETA 3D
// ==========================================
function CategoryCard({ trabajo }) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    
    const dx = x - xc;
    const dy = y - yc;
    
    const tiltX = -(dy / yc) * 7;
    const tiltY = (dx / xc) * 7;
    
    card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-6px)`;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
  };

  return (
    <Link 
      href={trabajo.href || "#"}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="card-3d-spotlight group relative w-full h-[320px] df-card rounded-3xl overflow-hidden border df-border shadow-sm cursor-pointer flex flex-col justify-end p-6 transition-all duration-300 block"
    >
      {/* 1. Imagen de fondo principal OPTIMIZADA */}
      <Image 
        src={trabajo.image} 
        alt={trabajo.titulo} 
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover transition-transform duration-700 group-hover:scale-110 z-0"
        priority={trabajo.id <= 3} // Carga rápido las 3 primeras, el resto espera al scroll
      />

      {/* 2. Gradiente inferior para legibilidad del texto (Siempre visible para asegurar contraste) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 pointer-events-none" />

      {/* 3. Capa de color acentuado */}
      <div className={`absolute inset-0 ${trabajo.accent || 'bg-amber-600'} opacity-20 group-hover:opacity-10 transition-all duration-700 ease-out z-10 pointer-events-none`} />

      {/* 4. Efecto Spotlight del cursor (Solo visible en PC) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-10"
        style={{
          background: 'radial-gradient(280px circle at var(--mouse-x) var(--mouse-y), rgba(217, 119, 6, 0.25), transparent 80%)'
        }}
      />

      {/* 5. Botón flotante: En celulares se muestra siempre con opacidad parcial, y en PC hace efecto hover */}
      <div className="absolute top-4 right-4 w-10 h-10 bg-white/20 md:bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-sm transform md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-300 z-20">
        <ArrowRight size={18} />
      </div>

      {/* 6. Textos */}
      <div className="relative z-20">
        <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 bg-amber-500/20 px-2.5 py-1 rounded-md border border-amber-500/30 backdrop-blur-md">
          {trabajo.categoria}
        </span>
        <h3 className="text-xl font-bold mt-3 leading-tight text-white drop-shadow-md">
          {trabajo.titulo}
        </h3>
        <p className="text-xs text-gray-300 mt-1 line-clamp-1 drop-shadow-sm">
          {trabajo.desc}
        </p>
      </div>
    </Link>
  );
}


// ==========================================
// ARREGLO ÚNICO DE DATOS (CON ENLACES CORREGIDOS)
// ==========================================
const categoriasTrabajos = [
  {
    id: 1,
    titulo: "Eventos Institucionales",
    categoria: "INSTITUCIONAL",
    desc: "Cobertura corporativa y actos oficiales.",
    href: "/institucional", // <--- Redirige a la página correspondiente
    accent: "bg-blue-600",
    image: "/institucional.jpg"
  },
  {
    id: 2,
    titulo: "Sesión de Fotos de Pareja",
    categoria: "PAREJAS",
    desc: "Complicidad y atardeceres al aire libre.",
    href: "/parejas",
    accent: "bg-amber-600",
    image: "/pareja.jpg"
  },
  {
    id: 3,
    titulo: "Publicidad para Negocios",
    categoria: "PUBLICIDAD",
    desc: "Spots comerciales que potencian tu marca.",
    href: "/publicidad",
    accent: "bg-indigo-600",
    image: "/publicidad.jpg"
  },
  {
    id: 4,
    titulo: "Revelación de Género",
    categoria: "SOCIALES",
    desc: "Emoción y momentos inolvidables en familia.",
    href: "/revelacion-genero",
    accent: "bg-purple-600",
    image: "/revelacion.jpg"
  },
  {
    id: 5,
    titulo: "Fiestas Patronales",
    categoria: "SOCIALES",
    desc: "Tradición, color y alegría capturados en alta definición.",
    href: "/fiestas-patronales",
    accent: "bg-orange-600",
    image: "/patronales.jpg"
  },
  {
    id: 6,
    titulo: "Videoclips y Grupos de Baile",
    categoria: "VIDEOCLIPS",
    desc: "Edición rítmica y estética musical profesional.",
    href: "/videoclips",
    accent: "bg-pink-600",
    image: "/videoclips.jpg"
  },
  {
    id: 7,
    titulo: "Invitaciones Virtuales",
    categoria: "VIDEOCLIPS",
    desc: "Animaciones personalizadas para tus invitados.",
    href: "/invitaciones-virtuales",
    accent: "bg-rose-600",
    image: "/invitaciones.jpg"
  },
  {
    id: 8,
    titulo: "Fotos y Videos Personales",
    categoria: "PERSONAL",
    desc: "Retratos individuales y cobertura íntima.",
    href: "/personal",
    accent: "bg-emerald-600",
    image: "/personal.jpg"
  }
];


const serviciosGenerales = [
  {
    titulo: "Fotografía Profesional",
    desc: "Capturamos tus mejores momentos con imágenes nítidas, cuidando la luz y resaltando las emociones reales de cada instante.",
    icono: Camera
  },
  {
    titulo: "Filmación Cinematográfica",
    desc: "Creamos videos de alta calidad que se ven y se sienten como una película, perfectos para contar tu historia.",
    icono: Clapperboard
  },
  {
    titulo: "Post-Producción & Edición",
    desc: "Pulimos cada detalle de tus fotos y videos. Ajustamos colores, sonido y ritmo para que el resultado final sea impactante.",
    icono: Film
  }
];

const preguntasFrecuentes = [
  {
    pregunta: '¿Con cuánta anticipación debo separar la fecha para mi evento?',
    respuesta: 'Recomendamos reservar con un mínimo de 2 a 3 meses de anticipación, especialmente para bodas, quince años y fechas de alta demanda.'
  },
  {
    pregunta: '¿Realizan coberturas en todo el Perú?',
    respuesta: 'Sí, cubrimos eventos, fiestas patronales y proyectos audiovisuales en todo el Perú. Los detalles de transporte se coordinan de forma personalizada.'
  },
  {
    pregunta: '¿Cuál es el tiempo de entrega del material final?',
    respuesta: 'Las fotografías editadas se entregan digitalmente en un plazo de 7 a 10 días hábiles. Los videos cinematográficos toman entre 15 y 25 días hábiles.'
  },
  {
    pregunta: '¿Cómo se realiza el pago de los servicios?',
    respuesta: 'La fecha se aparta con el 50% de adelanto mediante transferencia o billeteras digitales, y el 50% restante se cancela el mismo día de la cobertura.'
  }
];

// ==========================================
// COMPONENTE PRINCIPAL (HOME)
// ==========================================
export default function Home() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [faqAbierto, setFaqAbierto] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Estados del Formulario
  const [nombre, setNombre] = useState('');
  const [tipoEvento, setTipoEvento] = useState('Eventos Institucionales');
  const [mensaje, setMensaje] = useState('');

  // Efecto de inicialización de Tema Oscuro
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('isDarkMode') === 'true';
    setIsDarkMode(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme);
  }, []);

  // Efecto para aplicar clases del Tema
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

  // Manejo de Scroll para el botón "Volver arriba"
  useEffect(() => {
    const handleScroll = () => {
      setShowTopBtn(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Funciones de navegación fluida (Scroll Lento)
  const scrollToSection = (e, targetId) => {
    e.preventDefault();
    setMenuAbierto(false);

    const targetElement = document.querySelector(targetId);
    if (!targetElement) return;

    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition; 
    const duration = 1000; 
    let startTime = null;

    const animation = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = ease(timeElapsed, startPosition, distance, duration);
      window.scrollTo(0, run);
      if (timeElapsed < duration) requestAnimationFrame(animation);
    };

    const ease = (t, b, c, d) => {
      t /= d / 2;
      if (t < 1) return c / 2 * t * t * t + b;
      t -= 2;
      return c / 2 * (t * t * t + 2) + b;
    };

    requestAnimationFrame(animation);
  };

  const goToTop = (e) => {
    if (e) e.preventDefault();
    setMenuAbierto(false);

    const startPosition = window.pageYOffset;
    const duration = 1000;
    let startTime = null;

    const animation = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = ease(timeElapsed, startPosition, -startPosition, duration);
      window.scrollTo(0, run);
      if (timeElapsed < duration) requestAnimationFrame(animation);
    };

    const ease = (t, b, c, d) => {
      t /= d / 2;
      if (t < 1) return c / 2 * t * t * t + b;
      t -= 2;
      return c / 2 * (t * t * t + 2) + b;
    };

    requestAnimationFrame(animation);
  };

  // Interacciones de UI
  const toggleFaq = (index) => setFaqAbierto(faqAbierto === index ? null : index);
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // Envío del Formulario a WhatsApp
  const handleWhatsAppSubmit = (e) => {
    e.preventDefault();
    const numeroWhatsApp = '51967576214';
    const texto = `Hola, mi nombre es ${nombre}. Me interesa cotizar un servicio de "${tipoEvento}". Detalles: ${mensaje}`;
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen df-text selection:bg-amber-600 selection:text-white font-sans overflow-x-hidden relative">
      <div className="relative z-10">
        
        {/* NAVEGACIÓN */}
        <nav className="fixed w-full top-0 z-50 df-bg/90 backdrop-blur-md border-b df-border py-4 px-6 md:px-12 flex justify-between items-center transition-all shadow-xs">
          <Link href="/" onClick={goToTop} className="font-bold tracking-wider text-lg df-text flex items-center gap-2 cursor-pointer">
            <span className="w-2.5 h-2.5 bg-amber-600 rounded-full animate-pulse"></span>
            {mounted && (
              <img 
                src={isDarkMode ? "/Logo Cam.png" : "/Logo Cam.png"} 
                alt="Deluces Films" 
                className="h-7 md:h-8 w-auto object-contain"
              />
            )}
          </Link>
          
          <div className="hidden md:flex gap-8 text-sm items-center">
            <a href="#servicios" onClick={(e) => scrollToSection(e, '#servicios')} className="nav-link cursor-pointer">Servicios</a>
            <a href="#portafolio" onClick={(e) => scrollToSection(e, '#portafolio')} className="nav-link cursor-pointer">Portafolio</a>
            <a href="#proceso" onClick={(e) => scrollToSection(e, '#proceso')} className="nav-link cursor-pointer">Proceso</a>
            <a href="#precios" onClick={(e) => scrollToSection(e, '#precios')} className="nav-link cursor-pointer">Precios</a>
            <a href="#faq" onClick={(e) => scrollToSection(e, '#faq')} className="nav-link cursor-pointer">FAQ</a>
            <Link href="/clientes" className="nav-link cursor-pointer text-amber-600 font-semibold">Clientes</Link>
            
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full df-card border df-border df-text hover:scale-110 transition-all cursor-pointer"
              aria-label="Cambiar modo de visualización"
            >
              {mounted && (isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />)}
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a href="#contacto" onClick={(e) => scrollToSection(e, '#contacto')} className="btn-shimmer text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 inline-block cursor-pointer">
              Cotizar evento
            </a>
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full df-card border df-border df-text"
            >
              {mounted && (isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />)}
            </button>
            <button 
              onClick={() => setMenuAbierto(!menuAbierto)} 
              className="df-text focus:outline-none"
              aria-label="Abrir menú"
            >
              {menuAbierto ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>

        {/* MENÚ MÓVIL */}
        {menuAbierto && (
          <div className="fixed inset-0 z-40 df-bg pt-24 px-6 flex flex-col gap-6 md:hidden animate-fade-in shadow-2xl">
            <a href="#servicios" onClick={(e) => scrollToSection(e, '#servicios')} className="text-xl font-bold df-text border-b df-border pb-3 cursor-pointer">Servicios</a>
            <a href="#portafolio" onClick={(e) => scrollToSection(e, '#portafolio')} className="text-xl font-bold df-text border-b df-border pb-3 cursor-pointer">Portafolio</a>
            <a href="#proceso" onClick={(e) => scrollToSection(e, '#proceso')} className="text-xl font-bold df-text border-b df-border pb-3 cursor-pointer">Proceso</a>
            <a href="#precios" onClick={(e) => scrollToSection(e, '#precios')} className="text-xl font-bold df-text border-b df-border pb-3 cursor-pointer">Precios</a>
            <a href="#faq" onClick={(e) => scrollToSection(e, '#faq')} className="text-xl font-bold df-text border-b df-border pb-3 cursor-pointer">FAQ</a>
            <Link href="/clientes" onClick={() => setMenuAbierto(false)} className="text-xl font-bold text-amber-600 border-b df-border pb-3 cursor-pointer">Área de Clientes</Link>
            <a href="#contacto" onClick={(e) => scrollToSection(e, '#contacto')} className="btn-shimmer text-center text-white py-3.5 rounded-xl font-bold mt-4 shadow-md cursor-pointer">Cotizar evento</a>
          </div>
        )}

        {/* HERO SECTION */}
        <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden df-bg">
          <div className="absolute inset-0 pointer-events-none hero-pattern" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/5 rounded-full blur-[120px] pointer-events-none animate-float" />
          
          <div className="relative z-10 text-center max-w-4xl px-6 animate-fade-in">
            <p className="text-amber-600 text-xs md:text-sm font-semibold tracking-[0.25em] uppercase mb-6 flex items-center justify-center gap-3">
              <span className="w-10 h-[1.5px] bg-amber-600 transition-all duration-500 hover:w-16"></span>
              FOTOGRAFÍA · FILMACIÓN · PRODUCCIÓN
              <span className="w-10 h-[1.5px] bg-amber-600 transition-all duration-500 hover:w-16"></span>
            </p>

            <div className="mb-8 w-80 md:w-[480px] lg:w-[540px] relative group transition-all duration-700 mx-auto">
              <div className="absolute inset-0 bg-amber-600/10 rounded-full blur-3xl pointer-events-none -z-10 group-hover:bg-amber-600/20 transition-all duration-700"></div>
              {mounted && (
                <img 
                  src={isDarkMode ? "/LOGO 2026 N.png" : "/LOGO 2026 B.png"} 
                  alt="Deluces Films" 
                  className="w-full h-auto object-contain drop-shadow-lg transition-transform duration-700 hover:scale-105"
                />
              )}
            </div>

            <p className="df-muted text-lg md:text-xl max-w-2xl mx-auto mb-10 font-normal">
              Capturamos momentos con creatividad, estilo y calidad. 
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="#portafolio" onClick={(e) => scrollToSection(e, '#portafolio')} className="btn-shimmer text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-1 active:scale-95 inline-block cursor-pointer">
                Explorar Portafolio
              </a>
            </div>
          </div>
        </section>

        {/* SERVICIOS */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }} 
          viewport={{ once: true }} 
          id="servicios" 
          className="py-24 px-6 md:px-12 df-card border-t df-border"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-amber-600 text-xs font-bold tracking-widest uppercase mb-3">LO QUE HACEMOS</p>
              <h2 className="text-4xl md:text-5xl font-extrabold df-text">Nuestros Servicios Principales</h2>
              <p className="df-muted text-sm mt-2 max-w-xl mx-auto">Soluciones audiovisuales y fotográficas de alto nivel, diseñadas para destacar la estética y el mensaje de cada producción.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {serviciosGenerales.map((srv, idx) => {
                const IconSrv = srv.icono;
                return (
                  <div key={idx} className="df-bg p-8 rounded-2xl border df-border shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group flex flex-col justify-between">
                    <div>
                      <div className="w-14 h-14 bg-amber-600/10 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <IconSrv size={28} />
                      </div>
                      <h3 className="text-xl font-bold mb-3 df-text">{srv.titulo}</h3>
                      <p className="df-muted text-sm leading-relaxed">{srv.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.section>

        {/* PORTAFOLIO / CATÁLOGO */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }} 
          viewport={{ once: true }} 
          id="portafolio" 
          className="py-24 px-6 md:px-12 df-card border-y df-border"
        >
          <div className="max-w-6xl mx-auto">
            <div className="mb-16 text-center md:text-left">
              <p className="text-amber-600 text-xs font-bold tracking-widest uppercase mb-3">NUESTROS TRABAJOS</p>
              <h2 className="text-4xl md:text-5xl font-extrabold df-text">Selecciona un área para ver más</h2>
              <p className="df-muted text-sm mt-2">Haz clic en cualquier categoría para explorar galerías exclusivas y detalles de cada servicio.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoriasTrabajos.map((trabajo) => (
                <CategoryCard key={trabajo.id} trabajo={trabajo} />
              ))}
            </div>
          </div>
        </motion.section>

        {/* METODOLOGÍA / PROCESO */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }} 
          viewport={{ once: true }} 
          id="proceso" 
          className="py-24 px-6 md:px-12"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-amber-600 text-xs font-bold tracking-widest uppercase mb-3">METODOLOGÍA</p>
              <h2 className="text-4xl font-extrabold df-text">Proceso de Producción</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { num: '01', title: 'Brief & Consulta', desc: 'Analizamos requerimientos, fecha y expectativas del proyecto.' },
                { num: '02', title: 'Planificación', desc: 'Definición de equipo técnico, locaciones y cronograma.' },
                { num: '03', title: 'Rodaje', desc: 'Cobertura impecable con cámaras, iluminación y audio dedicados.' },
                { num: '04', title: 'Entrega Final', desc: 'Post-producción rigurosa y entrega en formatos profesionales.' }
              ].map((paso, idx) => (
                <div key={idx} className="relative df-card p-6 rounded-2xl border df-border hover:border-amber-600/40 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl group">
                  <div className="text-3xl font-black text-amber-600 mb-3 transition-transform duration-300 group-hover:scale-110">{paso.num}</div>
                  <h3 className="text-base font-bold mb-2 df-text">{paso.title}</h3>
                  <p className="df-muted text-xs leading-relaxed">{paso.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* PRECIOS */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }} 
          viewport={{ once: true }} 
          id="precios" 
          className="py-24 px-6 md:px-12 df-card border-y df-border"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-amber-600 text-xs font-bold tracking-widest uppercase mb-3">INVERSIÓN</p>
              <h2 className="text-4xl md:text-5xl font-extrabold df-text">Planes de Cobertura</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 items-stretch">
              {/* PLAN ESENCIAL */}
              <div className="p-8 rounded-2xl border df-border df-bg shadow-xs hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between">
                <div>
                  <p className="df-muted text-xs font-bold tracking-widest uppercase mb-2">Esencial</p>
                  <span className="text-xs md:text-sm font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-500">desde</span>
                  <div className="text-4xl font-black mb-6 df-text">S/ 400</div>
                  <ul className="space-y-4 mb-8 text-sm df-muted">
                    <li className="flex gap-3"><CheckCircle2 className="text-slate-500 w-5 h-5 flex-shrink-0"/> 4 horas de cobertura</li>
                    <li className="flex gap-3"><CheckCircle2 className="text-slate-500 w-5 h-5 flex-shrink-0"/> 40 fotos editadas</li>
                    <li className="flex gap-3"><CheckCircle2 className="text-slate-500 w-5 h-5 flex-shrink-0"/> Galería digital privada</li>
                  </ul>
                </div>
              </div>
              
              {/* PLAN CINEMÁTICO */}
              <div className="p-8 rounded-2xl border-2 border-amber-600 df-bg relative transform md:-translate-y-4 shadow-2xl transition-all duration-500 hover:-translate-y-6 flex flex-col justify-between">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md z-50 whitespace-nowrap">Más Solicitado</div>
                <div>
                  <p className="text-amber-600 text-xs font-bold tracking-widest uppercase mb-2">Cinemático</p>
                  <span className="text-xs md:text-sm font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-500">desde</span>
                  <div className="text-4xl font-black mb-6 df-text">S/ 800</div>
                  <ul className="space-y-4 mb-8 text-sm df-text">
                    <li className="flex gap-3"><CheckCircle2 className="text-amber-600 w-5 h-5 flex-shrink-0"/> 8 horas de cobertura</li>
                    <li className="flex gap-3"><CheckCircle2 className="text-amber-600 w-5 h-5 flex-shrink-0"/> Video resumen (3-5 min)</li>
                    <li className="flex gap-3"><CheckCircle2 className="text-amber-600 w-5 h-5 flex-shrink-0"/> 60 fotos editadas</li>
                  </ul>
                </div>
              </div>

              {/* PLAN PREMIUM */}
              <div className="p-8 rounded-2xl border df-border df-bg shadow-xs hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between">
                <div>
                  <p className="text-blue-600 text-xs font-bold tracking-widest uppercase mb-2">Premium</p>
                  <span className="text-xs md:text-sm font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-500">desde</span>
                  <div className="text-4xl font-black mb-6 df-text">S/ 1200</div>
                  <ul className="space-y-4 mb-8 text-sm df-muted">
                    <li className="flex gap-3"><CheckCircle2 className="text-blue-600 w-5 h-5 flex-shrink-0"/> Full Day (Preparativos a Fiesta)</li>
                    <li className="flex gap-3"><CheckCircle2 className="text-blue-600 w-5 h-5 flex-shrink-0"/> Tomas con Dron</li>
                    <li className="flex gap-3"><CheckCircle2 className="text-blue-600 w-5 h-5 flex-shrink-0"/> Video highlight + documental</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* PREGUNTAS FRECUENTES */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }} 
          viewport={{ once: true }} 
          id="faq" 
          className="py-24 px-6 md:px-12"
        >
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-amber-600 text-xs font-bold tracking-widest uppercase mb-3">RESOLVEMOS TUS DUDAS</p>
              <h2 className="text-4xl md:text-5xl font-extrabold df-text">Preguntas Frecuentes</h2>
            </div>
            <div className="space-y-4">
              {preguntasFrecuentes.map((faq, index) => (
                <div 
                  key={index} 
                  className="df-card border df-border rounded-2xl overflow-hidden shadow-xs transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-6 text-left font-bold df-text flex justify-between items-center gap-4 focus:outline-none cursor-pointer"
                    aria-expanded={faqAbierto === index}
                  >
                    <span className="text-base md:text-lg">{faq.pregunta}</span>
                    <ChevronDown 
                      size={20} 
                      className={`text-amber-600 transform transition-transform duration-300 flex-shrink-0 ${faqAbierto === index ? 'rotate-180' : ''}`} 
                    />
                  </button>
                  {faqAbierto === index && (
                    <div className="px-6 pb-6 pt-0 df-muted text-sm md:text-base leading-relaxed animate-fade-in border-t df-border pt-4">
                      {faq.respuesta}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* CONTACTO */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }} 
          viewport={{ once: true }} 
          id="contacto" 
          className="py-24 px-6 md:px-12 df-card border-t df-border relative overflow-hidden"
        >
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 relative z-10">
            <div>
              <p className="text-amber-600 text-xs font-bold tracking-widest uppercase mb-3">CONTACTO</p>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 df-text">Hagamos realidad tu próximo proyecto.</h2>
              <p className="df-muted mb-10 text-sm leading-relaxed">Escríbenos para verificar disponibilidad de agenda o coordinar una propuesta a la medida de tus requerimientos técnicos.</p>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4 transition-transform duration-300 hover:translate-x-1">
                  <div className="w-12 h-12 df-bg rounded-xl flex items-center justify-center df-text shadow-xs"><Smartphone size={20}/></div>
                  <div><p className="text-xs df-muted">WhatsApp</p><p className="font-semibold df-text">+51 967 576 214</p></div>
                </div>
                <div className="flex items-center gap-4 transition-transform duration-300 hover:translate-x-1">
                  <div className="w-12 h-12 df-bg rounded-xl flex items-center justify-center df-text shadow-xs"><Mail size={20}/></div>
                  <div><p className="text-xs df-muted">Email</p><p className="font-semibold df-text">delucesvisual@gmail.com</p></div>
                </div>
                <div className="flex items-center gap-4 transition-transform duration-300 hover:translate-x-1">
                  <div className="w-12 h-12 df-bg rounded-xl flex items-center justify-center df-text shadow-xs"><MapPin size={20}/></div>
                  <div><p className="text-xs df-muted">Ubicación</p><p className="font-semibold df-text">Perú</p></div>
                </div>
              </div>
            </div>

            <div className="df-bg p-8 rounded-2xl border df-border shadow-xl transition-all duration-300 hover:shadow-2xl">
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
                  <label className="text-xs font-bold df-muted mb-1.5 block">Tu Nombre</label>
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
                  <label className="text-xs font-bold df-muted mb-1.5 block">Mensaje</label>
                  <textarea 
                    rows="4" 
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    required
                    className="w-full df-card border df-border rounded-xl px-4 py-3 focus:outline-none focus:border-amber-600 transition-colors resize-none df-text text-sm" 
                    placeholder="Cuéntanos los detalles..."
                  ></textarea>
                </div>

                {/* Botón de envío */}
                <button type="submit" className="w-full btn-shimmer text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-md hover:shadow-xl flex items-center justify-center gap-2 text-sm active:scale-95 cursor-pointer">
                  <Send size={18} /> Enviar Mensaje por WhatsApp
                </button>
              </form>
            </div>
          </div>
        </motion.section>

        {/* BOTÓN VOLVER ARRIBA */}
        {showTopBtn && (
          <button 
            onClick={goToTop}
            className="fixed bottom-24 right-6 z-40 df-card border df-border df-text p-3.5 rounded-full shadow-lg hover:bg-amber-600 hover:text-white transition-all duration-300 animate-fade-in flex items-center justify-center cursor-pointer"
            aria-label="Volver arriba"
          >
            <ArrowUp size={20} />
          </button>
        )}

        {/* WIDGET FLOTANTE DE WHATSAPP */}
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
        <footer className="py-8 px-6 bg-zinc-900/30 border-t df-border text-center df-muted text-xs df-card">
          <p>© 2026 Deluces Films. Capturando la luz de tus mejores momentos.</p>
        </footer>

      </div>
    </div>
  );
}