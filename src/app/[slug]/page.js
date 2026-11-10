import SlugClient from "./SlugClient";

const infoCategorias = {
  'institucional': {
    titulo: 'Eventos Institucionales',
    subtitulo: 'COBERTURA CORPORATIVA Y OFICIAL',
    desc: 'Registro audiovisual de alta calidad para conferencias, promociones escolares, aniversarios, ceremonias y eventos corporativos.',
    accent: 'bg-blue-600/10'
  },
  'parejas': {
    titulo: 'Sesión de Fotos de Pareja',
    subtitulo: 'FOTOGRAFÍA ESPECIALIZADA',
    desc: 'Capturamos la complicidad, la naturalidad y la esencia de su relación en locaciones al aire libre y atardeceres inolvidables.',
    accent: 'bg-amber-600/10'
  },
  'publicidad': {
    titulo: 'Publicidad para Negocios',
    subtitulo: 'SPOTS COMERCIALES Y DE MARCA',
    desc: 'Creamos contenido visual estratégico y Reels dinámicos para redes sociales que conectan con tus clientes y elevan tus ventas.',
    accent: 'bg-indigo-600/10'
  },
  'revelacion-genero': {
    titulo: 'Revelación de Género',
    subtitulo: 'MOMENTOS FAMILIARES ÚNICOS',
    desc: 'Inmortalizamos la emoción de 15 años, cumpleaños y grandes anuncios familiares con un registro lleno de vida y color.',
    accent: 'bg-pink-600/10'
  },
  'fiestas-patronales': {
    titulo: 'Fiestas Patronales',
    subtitulo: 'TRADICIÓN Y COSTUMBRES',
    desc: 'Cobertura completa de festividades, danzas y comparsas con un manejo impecable de la luz y el movimiento.',
    accent: 'bg-amber-600/10'
  },
  'videoclips': {
    titulo: 'Videoclips y Grupos de Baile',
    subtitulo: 'PRODUCCIÓN MUSICAL Y ARTÍSTICA',
    desc: 'Edición rítmica, sincronización precisa y estética cinematográfica para artistas, cantantes y agrupaciones de baile.',
    accent: 'bg-indigo-600/10'
  },
  'invitaciones-virtuales': {
    titulo: 'Invitaciones Virtuales',
    subtitulo: 'ANIMACIÓN Y MOTION GRAPHICS',
    desc: 'Sorprende a tus invitados desde el primer segundo con invitaciones en video animadas, modernas y personalizadas.',
    accent: 'bg-blue-600/10'
  },
  'personal': {
    titulo: 'Fotos y Videos Personales',
    subtitulo: 'RETRATOS, PROMOCIÓN Y DEPORTES',
    desc: 'Sesiones individuales, cuadros de promoción, fotografía deportiva y cobertura de momentos especiales con enfoque profesional.',
    accent: 'bg-pink-600/10'
  }
};

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const categoria = infoCategorias[slug] || {
    titulo: 'Servicio Audiovisual',
    subtitulo: 'DELUCES FILMS',
    desc: 'Producción profesional de fotografía y filmación adaptada a tus requerimientos.'
  };

  return {
    title: `${categoria.titulo} | Deluces Films`,
    description: categoria.desc,
    openGraph: {
      title: `${categoria.titulo} | Deluces Films`,
      description: categoria.desc,
      url: `https://deluces-films.vercel.app/${slug}`,
      siteName: 'Deluces Films',
      locale: 'es_PE',
      type: 'website',
    },
  };
}

export default async function Page({ params }) {
  const resolvedParams = await params;
  return <SlugClient slug={resolvedParams?.slug} />;
}