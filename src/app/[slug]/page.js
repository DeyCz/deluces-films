import SlugClient from './SlugClient';

const SITE_URL = 'https://deluces-films.vercel.app';

const seoCategorias = {
  'institucional': {
    titulo: 'Eventos Institucionales | Deluces Films',
    desc: 'Cobertura audiovisual profesional para promociones escolares, conferencias, aniversarios y ceremonias en Cerro de Pasco y Lima.',
  },
  'parejas': {
    titulo: 'Sesión de Fotos de Pareja | Deluces Films',
    desc: 'Fotografía especializada de parejas en exteriores y atardeceres inolvidables. Reserva tu sesión con Deluces Films.',
  },
  'publicidad': {
    titulo: 'Publicidad y Reels para Negocios | Deluces Films',
    desc: 'Spots comerciales y reels estratégicos para redes sociales que potencian tu marca y elevan tus ventas.',
  },
  'revelacion-genero': {
    titulo: 'Revelación de Género | Deluces Films',
    desc: 'Fotografía y video cinematográfico para inmortalizar la emoción de tu revelación de género y momentos familiares.',
  },
  'fiestas-patronales': {
    titulo: 'Fiestas Patronales | Deluces Films',
    desc: 'Cobertura audiovisual de festividades, comparsas y tradiciones con estética cinematográfica en Cerro de Pasco y todo el Perú.',
  },
  'videoclips': {
    titulo: 'Videoclips y Grupos de Baile | Deluces Films',
    desc: 'Producción musical, edición rítmica y video HD/4K para artistas, cantantes y agrupaciones de baile.',
  },
  'invitaciones-virtuales': {
    titulo: 'Invitaciones Virtuales Animadas | Deluces Films',
    desc: 'Invitaciones en video modernas y personalizadas con motion graphics para 15 años, bodas, promociones y eventos.',
  },
  'personal': {
    titulo: 'Fotos y Videos Personales | Deluces Films',
    desc: 'Retratos artísticos, cuadros de promoción, fotografía deportiva y cobertura personalizada.',
  },
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const info = seoCategorias[slug] || {
    titulo: 'Portafolio Audiovisual | Deluces Films',
    desc: 'Producción fotográfica y audiovisual profesional en Cerro de Pasco, Lima y todo el Perú.',
  };
  const url = `${SITE_URL}/${slug}`;

  return {
    title: info.titulo,
    description: info.desc,
    alternates: { canonical: url },
    openGraph: {
      title: info.titulo,
      description: info.desc,
      url,
      siteName: 'Deluces Films',
      locale: 'es_PE',
      type: 'website',
      images: [
        {
          url: `${SITE_URL}/institucional.jpg`,
          width: 1200,
          height: 630,
          alt: info.titulo,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: info.titulo,
      description: info.desc,
      images: [`${SITE_URL}/institucional.jpg`],
    },
  };
}

export default async function CategoriaPage({ params }) {
  const { slug } = await params;
  return <SlugClient slug={slug} />;
}