"use client";

import { useEffect } from "react";

export default function ThemeInitializer() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('isDarkMode') === 'true';
    if (savedTheme) {
      document.body.classList.add('dark-mode');
    }
  }, []);

  return null;
}