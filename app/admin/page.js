'use client'; 

import React, { useState } from 'react';
import { addEquipo } from '@/lib/firestoreService';
import PartidosManager from './PartidosManager'; 
import ResultadosManager from './ResultadosManager'; 

// ----------------------------------------------------
// VARIABLES Y CONSTANTES DEL TORNEO
// ----------------------------------------------------

const CATEGORIAS = ['5ta Caballeros', '6ta Caballeros', '7ma Mixto', '4ta Damas'];
const ZONAS = ['Zona A', 'Zona B', 'Zona C', 'Zona D'];

// ----------------------------------------------------
// ESTILOS INLINE (Necesarios para el componente)
// ----------------------------------------------------

const labelStyle = { display: 'block', marginBottom: '5px', color: '#FFD700', fontWeight: '600' };
const inputStyle = { width: '100%', padding: '10px', border: '1px solid #FFD700', borderRadius: '4px', background: '#222', color: '#fff' };
const selectStyle = { width: '100%', padding: '10px', border: '1px solid #FFD700', borderRadius: '4px', background: '#222', color: '#fff' };
const buttonStyle = { 
    padding: '10px 20px', 
    background: '#FFD700', 
    color: '#222', 
    border: 'none', 
    borderRadius: '4px', 
    cursor: 'pointer', 
    fontWeight: 'bold', 
    marginTop: '10px',
    transition: 'background-color 0.3s'
};
const formGroupStyle = { flex: 1 };


// ----------------------------------------------------
// COMPONENTE PRINCIPAL
// ----------------------------------------------------

const AdminPanel = () => {
  // Estado para el formulario de Equipos
  const [equipo, setEquipo] = useState({
    nombre: '',
    jugador1: '',
    jugador2: '',
    categoria: CATEGORIAS[0],
    zona: ZONAS[0],
  });
  const [mensaje, setMensaje] = useState('');
  
  // Estado para forzar la recarga de listas (Equipos y Partidos)
  const [refreshKey, setRefreshKey] = useState(0); 
  
  // Función para forzar la recarga
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };


  const handleChange = (e) => {
    setEquipo({ ...equipo, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('Cargando equipo...');

    if (!equipo.nombre || !equipo.jugador1 || !equipo.jugador2) {
        setMensaje('🚨 Por favor, complete todos los campos requeridos.');
        return;
    }

    const result = await addEquipo(equipo);

    if (result.success) {
      setMensaje(`✅ Equipo "${equipo.nombre}" agregado con éxito.`);
      setEquipo({
        nombre: '',
        jugador1: '',
        jugador2: '',
        categoria: equipo.categoria,
        zona: equipo.zona,
      });
      // Forzamos la recarga de la lista de equipos en los Managers
      handleRefresh(); 
      setTimeout(() => setMensaje(''), 3000);
    } else {
      setMensaje(`❌ Error al cargar: ${result.error}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: 'auto', background: '#222', color: '#fff', minHeight: '100vh', fontFamily: 'Montserrat, sans-serif' }}>
      
      <h1 style={{ color: '#FFD700', borderBottom: '2px solid #FFD700', paddingBottom: '10px' }}>
        PadelZone Live 🎾 Panel de Organización
      </h1>

      {/* --- 1. GESTOR DE EQUIPOS --- */}
      <h2 style={{ color: '#FFD700', marginTop: '30px' }}>1. Agregar Nuevo Equipo</h2>

      <p style={{ minHeight: '30px', fontWeight: 'bold', color: mensaje.startsWith('✅') ? '#00FF00' : (mensaje.startsWith('❌') ? '#FF4500' : '#fff') }}>
          {mensaje}
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px', background: '#333', padding: '20px', borderRadius: '8px' }}>
        
        {/* Nombre del Equipo */}
        <div>
          <label style={labelStyle}>Nombre del Equipo:</label>
          <input
            type="text"
            name="nombre"
            value={equipo.nombre}
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </div>

        {/* Jugadores */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Jugador 1:</label>
            <input
              type="text"
              name="jugador1"
              value={equipo.jugador1}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Jugador 2:</label>
            <input
              type="text"
              name="jugador2"
              value={equipo.jugador2}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>
        </div>

        {/* Categoría y Zona */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Categoría:</label>
            <select name="categoria" value={equipo.categoria} onChange={handleChange} style={selectStyle}>
              {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Zona:</label>
            <select name="zona" value={equipo.zona} onChange={handleChange} style={selectStyle}>
              {ZONAS.map(zona => <option key={zona} value={zona}>{zona}</option>)}
            </select>
          </div>
        </div>
        
        <button type="submit" style={buttonStyle}>
          💾 Agregar Equipo
        </button>

      </form>
      
      {/* GESTOR DE PARTIDOS - SECCIÓN 2 */}
      {/* Pasamos el handler de recarga y el key para forzar la recarga de equipos */}
      <PartidosManager onPartidoAdded={handleRefresh} refreshKey={refreshKey} /> 
      
      {/* GESTOR DE RESULTADOS - SECCIÓN 3 */}
      {/* Usamos el key para forzar que el componente se remonte y recargue los partidos pendientes */}
      <ResultadosManager key={refreshKey} />

    </div>
  );
};


export default AdminPanel;
