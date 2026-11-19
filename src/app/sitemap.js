export default function sitemap() {
  const baseUrl = 'https://deluces-films.vercel.app';
  const categorias = [
    'institucional',
    'parejas',
    'publicidad',
    'revelacion-genero',
    'fiestas-patronales',
    'videoclips',
    'invitaciones-virtuales',
    'personal',
  ];

  const rutasCategorias = categorias.map((slug) => ({
    url: `${baseUrl}/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...rutasCategorias,
  ];
}