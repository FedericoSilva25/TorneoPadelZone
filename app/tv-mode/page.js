'use client'; 

import React from 'react';
import LiveScoreboard from '@/app/components/LiveScoreboard'; // Ajustar la ruta si es necesario

export default function TVMode() {
  return (
    <div style={fullScreenContainerStyle}>
        
        {/* Encabezado fijo y prominente */}
        <header style={headerStyle}>
            <h1 style={titleStyle}>
                PADELZONE LIVE SCOREBOARD 🎾
            </h1>
            <p style={subtitleStyle}>
                RESULTADOS Y HORARIOS EN TIEMPO REAL
            </p>
        </header>

        {/* Contenido principal: El Scoreboard en Vivo */}
        <main style={mainContentStyle}>
            <LiveScoreboard tvMode={true} />
        </main>
        
        {/* Footer simple (ideal para poner el logo o el QR si se quiere) */}
        <footer style={footerStyle}>
            <p>Sigue el torneo desde tu móvil: [Colocar Código QR Aquí]</p>
        </footer>
    </div>
  );
}

// --- ESTILOS INLINE PARA MÁXIMA VISIBILIDAD EN TV ---
const fullScreenContainerStyle = {
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#111', // Fondo muy oscuro
    color: '#fff',
    fontFamily: 'Montserrat, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    boxSizing: 'border-box'
};

const headerStyle = {
    width: '100%',
    padding: '20px 0',
    borderBottom: '4px solid #FFD700', // Línea dorada gruesa
    textAlign: 'center',
    marginBottom: '30px'
};

const titleStyle = {
    color: '#FFD700',
    fontSize: '3em',
    fontWeight: '800',
    letterSpacing: '5px',
    margin: 0,
    textShadow: '0 0 10px rgba(255, 215, 0, 0.5)' // Efecto de brillo
};

const subtitleStyle = {
    color: '#ccc',
    fontSize: '1.5em',
    fontWeight: '400',
    marginTop: '10px'
};

const mainContentStyle = {
    flexGrow: 1, // Permite que el contenido ocupe el espacio restante
    width: '100%',
    maxWidth: '1400px', // Limite el ancho en pantallas muy grandes
};

const footerStyle = {
    width: '100%',
    textAlign: 'center',
    padding: '15px 0',
    marginTop: '20px',
    fontSize: '1em',
    color: '#888'
};
