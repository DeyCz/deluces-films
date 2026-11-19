import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeInitializer from "./ThemeInitializer";

const SITE_URL = "https://deluces-films.vercel.app";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Deluces Films | Fotografía y Filmación en Cerro de Pasco y Perú",
    template: "%s | Deluces Films",
  },
  description:
    "Productora audiovisual en Cerro de Pasco, Lima y todo el Perú. Fotografía profesional, filmación cinematográfica, promociones escolares, 15 años, fiestas patronales, transmisiones en vivo y reels publicitarios.",
  keywords: [
    "Deluces Films",
    "fotografía Cerro de Pasco",
    "filmación Cerro de Pasco",
    "fotógrafo promociones escolares Pasco",
    "filmación 15 años Pasco",
    "fiestas patronales Pasco",
    "reels publicitarios Perú",
    "transmisión en vivo multicámara",
  ],
  authors: [{ name: "Deluces Films" }],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "Deluces Films | Fotografía y Filmación Cinematográfica",
    description:
      "Inmortalizamos tu historia y potenciamos tu negocio con estándar cinematográfico. Cobertura en Cerro de Pasco, Lima y todo el Perú.",
    url: SITE_URL,
    siteName: "Deluces Films",
    locale: "es_PE",
    type: "website",
    images: [
      {
        url: "/institucional.jpg",
        width: 1200,
        height: 630,
        alt: "Deluces Films - Fotografía y Filmación",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deluces Films | Fotografía y Filmación",
    description:
      "Capturamos momentos con creatividad, estilo y calidad en Cerro de Pasco y todo el Perú.",
    images: ["/institucional.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Deluces Films",
  description:
    "Estudio de fotografía profesional, filmación cinematográfica y producción audiovisual.",
  url: SITE_URL,
  telephone: "+51967576214",
  email: "deluces.studio@gmail.com",
  image: `${SITE_URL}/institucional.jpg`,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Cerro de Pasco",
    addressRegion: "Pasco",
    addressCountry: "PE",
  },
  areaServed: ["Cerro de Pasco", "Pasco", "Lima", "Perú"],
  priceRange: "S/ 400 - S/ 1200+",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://drive.google.com" />
        <link rel="preconnect" href="https://lh3.googleusercontent.com" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <ThemeInitializer />
        {children}
      </body>
    </html>
  );
}