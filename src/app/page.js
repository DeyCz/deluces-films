"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Camera, Video, Film, CheckCircle2, MapPin, Mail, Smartphone, Send, Menu, X, ArrowRight, MessageCircle, ArrowUp, ChevronDown, Sun, Moon, Clapperboard, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

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
      href={trabajo.href}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="card-3d-spotlight group relative aspect-video df-card rounded-2xl overflow-hidden border df-border shadow-sm cursor-pointer flex flex-col justify-end p-6 transition-all duration-300 block relative"
    >
      <div 
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
        style={{
          background: 'radial-gradient(280px circle at var(--mouse-x) var(--mouse-y), rgba(217, 119, 6, 0.22), transparent 80%)'
        }}
      />
      
      <div className={`absolute inset-0 ${trabajo.accent} opacity-60 group-hover:opacity-30 transition-all duration-700 ease-out`} />
      
      <div className="absolute top-4 right-4 w-10 h-10 df-bg rounded-full flex items-center justify-center df-text shadow-sm transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20">
        <ArrowRight size={18} />
      </div>

      <div className="relative z-20">
        <span className="text-[10px] uppercase tracking-wider font-bold text-amber-600 dark:text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 shadow-xs">
          {trabajo.categoria}
        </span>
        <h3 className="text-xl font-bold mt-3 leading-tight df-text drop-shadow-xs">
          {trabajo.titulo}
        </h3>
        <p className="text-xs df-muted mt-1 line-clamp-1">{trabajo.desc}</p>
      </div>
    </Link>
  );
}

export default function Home() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [faqAbierto, setFaqAbierto] = useState(null);
  
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [nombre, setNombre] = useState('');
  const [tipoEvento, setTipoEvento] = useState('Eventos Institucionales');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('isDarkMode') === 'true';
    setIsDarkMode(savedTheme);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('isDarkMode', 'true');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('isDarkMode', 'false');
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

  // Función de scroll lento para secciones
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

  // Función de scroll lento para volver arriba (Logo y botón flotante)
  const goToTop = (e) => {
    if (e) e.preventDefault();
    setMenuAbierto(false);

    const startPosition = window.pageYOffset;
    const duration = 1000; // 1 segundo exacto de desplazamiento lento
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

  const toggleFaq = (index) => {
    setFaqAbierto(faqAbierto === index ? null : index);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const categoriasTrabajos = [
    { id: 1, categoria: 'Institucional', titulo: 'Eventos Institucionales', desc: 'Cobertura corporativa y actos oficiales.', accent: 'bg-blue-600/10', href: '/institucional' },
    { id: 2, categoria: 'Parejas', titulo: 'Sesión de Fotos de Pareja', desc: 'Complicidad y atardeceres al aire libre.', accent: 'bg-amber-600/10', href: '/parejas' },
    { id: 3, categoria: 'Publicidad', titulo: 'Publicidad para Negocios', desc: 'Spots comerciales que potencian tu marca.', accent: 'bg-blue-900/10', href: '/publicidad' },
    { id: 4, categoria: 'Sociales', titulo: 'Revelación de Género', desc: 'Emoción y momentos inolvidables en familia.', accent: 'bg-purple-600/10', href: '/revelacion-genero' },
    { id: 5, categoria: 'Sociales', titulo: 'Fiestas Patronales', desc: 'Tradición, color y alegría capturados en alta definición.', accent: 'bg-amber-600/10', href: '/fiestas-patronales' },
    { id: 6, categoria: 'Videoclips', titulo: 'Videoclips y Grupos de Baile', desc: 'Edición rítmica y estética musical profesional.', accent: 'bg-blue-900/10', href: '/videoclips' },
    { id: 7, categoria: 'Videoclips', titulo: 'Invitaciones Virtuales', desc: 'Animaciones personalizadas para tus invitados.', accent: 'bg-slate-600/10', href: '/invitaciones-virtuales' },
    { id: 8, categoria: 'Personal', titulo: 'Fotos y Videos Personales', desc: 'Retratos individuales y cobertura íntima.', accent: 'bg-purple-600/10', href: '/personal' },
  ];

  const serviciosGenerales = [
    {
      titulo: "Fotografía Profesional",
      desc: "Capturamos cada instante con ópticas de alta gama, cuidando la composición, iluminación natural y el detalle emocional.",
      icono: Camera
    },
    {
      titulo: "Filmación Cinematográfica",
      desc: "Grabaciones en alta definición y 4K con equipos estabilizados, audio dedicado y un lenguaje visual de nivel cinematográfico.",
      icono: Clapperboard
    },
    {
      titulo: "Post-Producción & Edición",
      desc: "Corrección de color avanzada, diseño sonoro envolvente y montaje rítmico para darle vida y dinamismo a tus proyectos.",
      icono: Film
    }
  ];

  const preguntasFrecuentes = [
    {
      pregunta: '¿Con cuánta anticipación debo separar la fecha para mi evento?',
      respuesta: 'Recomendamos reservar con un mínimo de 2 a 3 meses de anticipación, especialmente para bodas, quince años y fechas de alta demanda.'
    },
    {
      pregunta: '¿Realizan coberturas fuera de Lima?',
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

  const handleWhatsAppSubmit = (e) => {
    e.preventDefault();
    const numeroWhatsApp = '51900000000';
    const texto = `Hola, mi nombre es ${nombre}. Me interesa cotizar un servicio de "${tipoEvento}". Detalle: ${mensaje}`;
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
            DE<span className="text-amber-600">LUCES</span> FILMS
          </Link>
          
          <div className="hidden md:flex gap-8 text-sm items-center">
            <a href="#servicios" onClick={(e) => scrollToSection(e, '#servicios')} className="nav-link cursor-pointer">Servicios</a>
            <a href="#portafolio" onClick={(e) => scrollToSection(e, '#portafolio')} className="nav-link cursor-pointer">Especialidades</a>
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

        {/* Menú Móvil */}
        {menuAbierto && (
          <div className="fixed inset-0 z-40 df-bg pt-24 px-6 flex flex-col gap-6 md:hidden animate-fade-in shadow-2xl">
            <a href="#servicios" onClick={(e) => scrollToSection(e, '#servicios')} className="text-xl font-bold df-text border-b df-border pb-3 cursor-pointer">Servicios</a>
            <a href="#portafolio" onClick={(e) => scrollToSection(e, '#portafolio')} className="text-xl font-bold df-text border-b df-border pb-3 cursor-pointer">Especialidades</a>
            <a href="#proceso" onClick={(e) => scrollToSection(e, '#proceso')} className="text-xl font-bold df-text border-b df-border pb-3 cursor-pointer">Proceso</a>
            <a href="#precios" onClick={(e) => scrollToSection(e, '#precios')} className="text-xl font-bold df-text border-b df-border pb-3 cursor-pointer">Precios</a>
            <a href="#faq" onClick={(e) => scrollToSection(e, '#faq')} className="text-xl font-bold df-text border-b df-border pb-3 cursor-pointer">FAQ</a>
            <Link href="/clientes" onClick={() => setMenuAbierto(false)} className="text-xl font-bold text-amber-600 border-b df-border pb-3 cursor-pointer">Área de Clientes</Link>
            <a href="#contacto" onClick={(e) => scrollToSection(e, '#contacto')} className="btn-shimmer text-center text-white py-3.5 rounded-xl font-bold mt-4 shadow-md cursor-pointer">Cotizar evento</a>
          </div>
        )}

        <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-zinc-950">
        
        {/* Capa del Patrón en el Hero: Pequeño (140px) y Sutil */}
        <div className="absolute inset-0 bg-[url('/pattern.png')] bg-repeat bg-[length:140px_140px] opacity-[0.04] pointer-events-none" />

        {/* Efectos de luz de fondo */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/5 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Contenido del Hero (z-10 para estar sobre el patrón) */}
        <div className="relative z-10 text-center max-w-4xl px-6">
          <p className="text-amber-600 text-xs md:text-sm font-semibold tracking-[0.25em] uppercase mb-6 flex items-center justify-center gap-3">
            <span className="w-10 h-[1.5px] bg-amber-600"></span>
            FOTOGRAFÍA · FILMACIÓN · PRODUCCIÓN
            <span className="w-10 h-[1.5px] bg-amber-600"></span>
          </p>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.08] mb-8 text-white">
            Cada momento <br className="hidden md:block"/> tiene su <span className="text-amber-600 italic pr-2 font-serif inline-block">luz.</span>
          </h1>
          
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-normal">
            Inmortalizamos tu historia y potenciamos tu negocio con un estándar cinematográfico, sobrio y profesional.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="#portafolio" className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg inline-block cursor-pointer">
              Explorar Especialidades
            </a>
          </div>
        </div>
      </section>
        

        {/* SECCIÓN: SERVICIOS */}
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
              <p className="df-muted text-sm mt-2 max-w-xl mx-auto">Pilares técnicos y creativos con los que dotamos a cada producción de un valor estético superior.</p>
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

        {/* SECCIÓN DE ESPECIALIDADES */}
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

        {/* PROCESO */}
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
              <div className="p-8 rounded-2xl border df-border df-bg shadow-xs hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between">
                <div>
                  <p className="df-muted text-xs font-bold tracking-widest uppercase mb-2">Esencial</p>
                  <div className="text-4xl font-black mb-6 df-text">S/ 690</div>
                  <ul className="space-y-4 mb-8 text-sm df-muted">
                    <li className="flex gap-3"><CheckCircle2 className="text-slate-500 w-5 h-5 flex-shrink-0"/> 3 horas de cobertura</li>
                    <li className="flex gap-3"><CheckCircle2 className="text-slate-500 w-5 h-5 flex-shrink-0"/> 40 fotos editadas</li>
                    <li className="flex gap-3"><CheckCircle2 className="text-slate-500 w-5 h-5 flex-shrink-0"/> Galería digital privada</li>
                  </ul>
                </div>
              </div>
              <div className="p-8 rounded-2xl border-2 border-amber-600 df-bg relative transform md:-translate-y-4 shadow-2xl transition-all duration-500 hover:-translate-y-6 flex flex-col justify-between">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md z-50 whitespace-nowrap">Más Solicitado</div>
                <div>
                  <p className="text-amber-600 text-xs font-bold tracking-widest uppercase mb-2">Cinemático</p>
                  <div className="text-4xl font-black mb-6 df-text">S/ 1,290</div>
                  <ul className="space-y-4 mb-8 text-sm df-text">
                    <li className="flex gap-3"><CheckCircle2 className="text-amber-600 w-5 h-5 flex-shrink-0"/> 5 horas de cobertura</li>
                    <li className="flex gap-3"><CheckCircle2 className="text-amber-600 w-5 h-5 flex-shrink-0"/> Video resumen (3-5 min)</li>
                    <li className="flex gap-3"><CheckCircle2 className="text-amber-600 w-5 h-5 flex-shrink-0"/> 60 fotos editadas</li>
                  </ul>
                </div>
              </div>
              <div className="p-8 rounded-2xl border df-border df-bg shadow-xs hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between">
                <div>
                  <p className="text-blue-600 text-xs font-bold tracking-widest uppercase mb-2">Premium</p>
                  <div className="text-4xl font-black mb-6 df-text">S/ 2,490</div>
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

        {/* FAQ */}
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
                  <div><p className="text-xs df-muted">WhatsApp</p><p className="font-semibold df-text">+51 900 000 000</p></div>
                </div>
                <div className="flex items-center gap-4 transition-transform duration-300 hover:translate-x-1">
                  <div className="w-12 h-12 df-bg rounded-xl flex items-center justify-center df-text shadow-xs"><Mail size={20}/></div>
                  <div><p className="text-xs df-muted">Email</p><p className="font-semibold df-text">hola@delucesfilms.com</p></div>
                </div>
                <div className="flex items-center gap-4 transition-transform duration-300 hover:translate-x-1">
                  <div className="w-12 h-12 df-bg rounded-xl flex items-center justify-center df-text shadow-xs"><MapPin size={20}/></div>
                  <div><p className="text-xs df-muted">Ubicación</p><p className="font-semibold df-text">Lima, Perú</p></div>
                </div>
              </div>
            </div>

            <div className="df-bg p-8 rounded-2xl border df-border shadow-xl transition-all duration-300 hover:shadow-2xl">
              <form onSubmit={handleWhatsAppSubmit} className="space-y-4">
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
                <div>
                  <label className="text-xs font-bold df-muted mb-1.5 block">Tipo de Evento o Proyecto</label>
                  <select 
                    value={tipoEvento}
                    onChange={(e) => setTipoEvento(e.target.value)}
                    className="w-full df-card border df-border rounded-xl px-4 py-3 focus:outline-none focus:border-amber-600 transition-colors df-text text-sm"
                  >
                    <option value="Eventos Institucionales" className="df-card df-text">Eventos Institucionales</option>
                    <option value="Sesión de Fotos de Pareja" className="df-card df-text">Sesión de Fotos de Pareja</option>
                    <option value="Publicidad para Negocios" className="df-card df-text">Publicidad para Negocios</option>
                    <option value="Revelación de Género" className="df-card df-text">Revelación de Género</option>
                    <option value="Fiestas Patronales" className="df-card df-text">Fiestas Patronales</option>
                    <option value="Videoclips y Grupos de Baile" className="df-card df-text">Videoclips o Grupos de Baile</option>
                    <option value="Invitaciones Virtuales" className="df-card df-text">Invitaciones Virtuales</option>
                    <option value="Sesión Personal / Retratos" className="df-card df-text">Fotos y Videos Personales</option>
                  </select>
                </div>
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
                <button type="submit" className="w-full btn-shimmer text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-md hover:shadow-xl flex items-center justify-center gap-2 text-sm active:scale-95 cursor-pointer">
                  <Send size={18} /> Enviar Mensaje por WhatsApp
                </button>
              </form>
            </div>
          </div>
        </motion.section>

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

        {/* WIDGET FLOTANTE DE WHATSAPP */}
        <a 
          href="https://wa.me/51900000000?text=Hola,%20me%20interesa%20cotizar%20un%20servicio%20audiovisual." 
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