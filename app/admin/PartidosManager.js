'use client';

import React, { useState, useEffect } from 'react';
import { getEquipos, addPartido } from '@/lib/firestoreService'; 

// Constantes del torneo
const CANCHAS = ['Cancha 1', 'Cancha 2', 'Cancha 3', 'Cancha Principal'];
const RONDAS = ['Jornada 1', 'Jornada 2', 'Jornada 3', 'Cuartos de Final', 'Semifinal', 'Final'];

export default function PartidosManager({ onPartidoAdded, refreshKey }) {
  const [equipos, setEquipos] = useState([]);
  const [partido, setPartido] = useState({
    idEquipoA: '',
    idEquipoB: '',
    cancha: CANCHAS[0],
    horaInicio: '',
    zona: 'Zona A',
    ronda: RONDAS[0],
  });
  const [mensaje, setMensaje] = useState('');

  // Cargar equipos al iniciar o cuando cambia refreshKey (cuando se agrega un equipo)
  useEffect(() => {
    async function loadEquipos() {
      const data = await getEquipos();
      setEquipos(data);
      // Establecer valores por defecto si hay equipos
      if (data.length >= 2) {
        setPartido(prev => ({
          ...prev,
          idEquipoA: data[0].id,
          idEquipoB: data[1].id,
          zona: data[0].zona 
        }));
      }
    }
    loadEquipos();
  }, [refreshKey]); 

  const handleChange = (e) => {
    setPartido({ ...partido, [e.target.name]: e.target.value });
  };
  
  const getEquipoName = (id) => {
      const team = equipos.find(e => e.id === id);
      return team ? team.nombre : '';
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('Programando partido...');

    const { idEquipoA, idEquipoB, horaInicio } = partido;

    if (!idEquipoA || !idEquipoB || !horaInicio || idEquipoA === idEquipoB) {
        setMensaje('🚨 Complete todos los campos y asegúrese de que los equipos sean diferentes.');
        return;
    }
    
    const partidoFinal = {
        ...partido,
        nombreEquipoA: getEquipoName(idEquipoA),
        nombreEquipoB: getEquipoName(idEquipoB),
        // Convertir la hora a un objeto Date para Firestore
        horaInicio: new Date(horaInicio), 
    }

    const result = await addPartido(partidoFinal);

    if (result.success) {
      setMensaje(`✅ Partido programado con éxito: ${partidoFinal.nombreEquipoA} vs ${partidoFinal.nombreEquipoB}`);
      // Llama a la función de recarga del padre para actualizar la lista de resultados
      if (onPartidoAdded) onPartidoAdded(); 
      setTimeout(() => setMensaje(''), 3000);
    } else {
      setMensaje(`❌ Error al programar: ${result.error}`);
    }
  };

  if (equipos.length < 2) {
    return (
      <div style={{ background: '#333', padding: '15px', color: '#FFD700', borderRadius: '4px', marginTop: '30px' }}>
        ⚠️ Se necesitan al menos 2 equipos cargados para programar un partido.
      </div>
    );
  }

  return (
    <div style={{ marginTop: '30px' }}>
      <h2 style={{ color: '#FFD700' }}>2. Programar Nuevo Partido</h2>

      <p style={{ minHeight: '30px', fontWeight: 'bold', color: mensaje.startsWith('✅') ? '#00FF00' : (mensaje.startsWith('❌') ? '#FF4500' : '#fff') }}>
          {mensaje}
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px', background: '#333', padding: '20px', borderRadius: '8px' }}>
        
        {/* Selector de Equipos */}
        <div style={formGroupStyle}>
            <label style={labelStyle}>Equipo A:</label>
            <select name="idEquipoA" value={partido.idEquipoA} onChange={handleChange} style={selectStyle}>
                <option value="">-- Seleccione Equipo A --</option>
                {equipos.map(e => <option key={e.id} value={e.id}>{e.nombre} ({e.zona})</option>)}
            </select>
        </div>
        
        <div style={formGroupStyle}>
            <label style={labelStyle}>Equipo B:</label>
            <select name="idEquipoB" value={partido.idEquipoB} onChange={handleChange} style={selectStyle}>
                <option value="">-- Seleccione Equipo B --</option>
                {equipos.filter(e => e.id !== partido.idEquipoA).map(e => <option key={e.id} value={e.id}>{e.nombre} ({e.zona})</option>)}
            </select>
        </div>

        {/* Cancha y Hora */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Cancha:</label>
            <select name="cancha" value={partido.cancha} onChange={handleChange} style={selectStyle}>
              {CANCHAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Hora/Fecha de Inicio:</label>
            <input 
              type="datetime-local"
              name="horaInicio"
              value={partido.horaInicio}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>
        </div>
        
        {/* Ronda y Zona */}
        <div style={{ display: 'flex', gap: '10px' }}>
            <div style={formGroupStyle}>
                <label style={labelStyle}>Ronda:</label>
                <select name="ronda" value={partido.ronda} onChange={handleChange} style={selectStyle}>
                  {RONDAS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
            <div style={formGroupStyle}>
                <label style={labelStyle}>Zona / Etapa:</label>
                <input 
                  type="text"
                  name="zona"
                  value={partido.zona}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Zona A o Playoff"
                  style={inputStyle}
                />
            </div>
        </div>
        
        <button type="submit" style={buttonStyle}>
          📅 Programar Partido
        </button>

      </form>
    </div>
  );
}

// Estilos
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
