export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/gestion-deluces', '/clientes'],
    },
    sitemap: 'https://deluces-films.vercel.app/sitemap.xml',
  };
}