
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeInitializer from "./ThemeInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Deluces Films | Fotografía y Filmación",
  description: "Inmortalizamos tu historia y potenciamos tu negocio con un estándar cinematográfico.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <ThemeInitializer />
        {children}
      </body>
    </html>
  );
}