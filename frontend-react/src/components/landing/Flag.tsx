import React from 'react';

const FLAG_FILES: Record<string, string> = {
  es: 'es',
  fr: 'fr',
  de: 'de',
  be: 'be',
  gb: 'gb',
  uk: 'gb',
  us: 'us',
  ca: 'ca',
  ru: 'ru',
  cn: 'cn',
  in: 'in',
  jp: 'jp',
};

interface FlagProps {
  /** Código ISO del país (`ES`, `FR`, `GB`…) o el id usado por la app (`es`, `uk`…). */
  code?: string | null;
  /** Nombre del país para el texto alternativo. */
  country?: string;
  className?: string;
}

/**
 * Bandera SVG local. Se usan archivos en `public/flags/` para que no dependan
 * de los emojis del sistema operativo (Windows no renderiza banderas emoji).
 */
export function Flag({ code, country, className = 'h-4 w-6' }: FlagProps) {
  const file = code ? FLAG_FILES[code.toLowerCase()] : undefined;
  if (!file) return null;

  return (
    <img
      src={`/flags/${file}.svg`}
      alt={country ? `Bandera de ${country}` : 'Bandera'}
      loading="lazy"
      className={`inline-block shrink-0 rounded-[3px] object-cover ring-1 ring-black/10 ${className}`}
    />
  );
}
