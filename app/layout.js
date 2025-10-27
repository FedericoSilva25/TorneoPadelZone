import React from 'react';

// Define los metadatos para toda la aplicación
export const metadata = {
  title: 'PadelZone Live - Torneo Scoreboard',
  description: 'Sistema de gestión y visualización de torneos de pádel en tiempo real.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        {/* Incluimos la tipografía Montserrat, sugerida en el concepto */}
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap" rel="stylesheet" />
        {/* Aseguramos la responsividad */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      {/* Aplicamos un fondo oscuro por defecto */}
      <body style={{ margin: 0, padding: 0, backgroundColor: '#1c1c1c' }}>
        {children}
      </body>
    </html>
  );
}
