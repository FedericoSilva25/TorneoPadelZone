'use client'; 

import React from 'react';
import LiveScoreboard from './components/LiveScoreboard';
import RankingTable from './components/RankingTable';

export default function PublicDashboard() {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: 'auto', background: '#1c1c1c', color: '#fff', minHeight: '100vh', fontFamily: 'Montserrat, sans-serif' }}>
      
      <h1 style={mainTitleStyle}>
        PadelZone Live 🏆 Torneo Oficial
      </h1>
      <p style={subtitleStyle}>
        Toda la información del torneo, resultados en vivo y tabla de posiciones actualizada en tiempo real.
      </p>

      {/* 1. Scoreboard de Partidos Activos y Próximos (Real-time) */}
      <LiveScoreboard />

      {/* 2. Tabla de Posiciones */}
      <RankingTable />
      
      {/* Información de Acceso Rápido (para el QR) */}
       <div style={footerStyle}>
        <p>👋 ¡Bienvenido! Este es el acceso público (QR) para jugadores y espectadores.</p>
        <p>URL para la administración: <a href="/admin" style={{color: '#FFD700', textDecoration: 'underline'}}> /admin </a></p>
      </div>
      
    </div>
  );
}

// --- ESTILOS INLINE PARA EL DASHBOARD PÚBLICO ---
const mainTitleStyle = {
    color: '#FFD700',
    fontSize: '2.5em',
    textAlign: 'center',
    padding: '20px 0',
    borderBottom: '3px solid #FFD700',
    marginBottom: '20px'
};

const subtitleStyle = {
    color: '#ccc',
    fontSize: '1.1em',
    textAlign: 'center',
    marginBottom: '40px'
};

const footerStyle = {
    textAlign: 'center',
    marginTop: '50px',
    padding: '20px',
    background: '#2a2a2a',
    borderRadius: '8px',
    color: '#FFD700',
    fontSize: '0.9em'
};