// /app/admin/ResultadosManager.js
'use client';

import React, { useState, useEffect } from 'react';
import { getPartidosPendientes, finalizarPartidoYActualizarRanking } from '@/lib/firestoreService';

const MAX_SETS = 3; // Un partido puede tener hasta 3 sets

// Componente para cargar los scores de un partido individual
const ScoreForm = ({ partido, onUpdate }) => {
    const [scores, setScores] = useState(partido.resultadoSets || []);
    const [mensaje, setMensaje] = useState('');

    // Rellena la estructura de scores si no existe o tiene menos de 3 sets
    useEffect(() => {
        let newScores = [...partido.resultadoSets];
        while (newScores.length < MAX_SETS) {
            newScores.push([0, 0]);
        }
        setScores(newScores);
    }, [partido.resultadoSets]);

    const handleScoreChange = (setIndex, teamIndex, value) => {
        const newScores = scores.map((set, i) => {
            if (i === setIndex) {
                const newSet = [...set];
                newSet[teamIndex] = parseInt(value) || 0;
                return newSet;
            }
            return set;
        });
        setScores(newScores);
    };
    
    const validarResultado = () => {
        let setsA = 0;
        let setsB = 0;
        let setsJugados = 0;

        for (const [scoreA, scoreB] of scores) {
            if (scoreA === 0 && scoreB === 0) continue; // Set vacío
            setsJugados++;
            
            // Regla básica: el ganador debe tener al menos 6 games y 2 de diferencia
            const ganoA = scoreA >= 6 && scoreA - scoreB >= 2;
            const ganoB = scoreB >= 6 && scoreB - scoreA >= 2;
            
            // Regla tie-break (solo si el score es 7-6)
            const tieBreakA = (scoreA === 7 && scoreB === 6);
            const tieBreakB = (scoreB === 7 && scoreA === 6);
            
            if (ganoA || tieBreakA) {
                setsA++;
            } else if (ganoB || tieBreakB) {
                setsB++;
            } else if (setsJugados > 0) {
                setMensaje("🚨 Resultado de set inválido. El ganador debe tener 6+ games y 2 de diferencia (o 7-6).");
                return false;
            }
        }
        
        // El partido finaliza si alguien gana 2 sets (2-0 o 2-1)
        if (setsA === 2 || setsB === 2) {
            setMensaje("");
            // Devolvemos solo los sets que realmente se jugaron
            return scores.slice(0, setsJugados);
        } else if (setsJugados > 0) {
             setMensaje("🚨 El partido no ha finalizado (debe ser 2-0 o 2-1).");
             return false;
        } else if (partido.estado === 'Programado') {
             setMensaje("✅ Puede dejar sets en blanco para iniciar en 'Jugando'.");
             return scores.filter(([a, b]) => a !== 0 || b !== 0);
        }
        
        return false;
    };
    
    const handleFinalizar = async () => {
        const setsValidados = validarResultado();
        if (!setsValidados) return;
        
        setMensaje("Finalizando partido y actualizando ranking...");

        try {
            // Guardamos solo los sets jugados para evitar ceros innecesarios
            const result = await finalizarPartidoYActualizarRanking(partido, setsValidados);
            if (result.success) {
                setMensaje(`🏆 Partido Finalizado! Ganador: ${result.ganador === partido.idEquipoA ? partido.nombreEquipoA : partido.nombreEquipoB}`);
                onUpdate(); // Recargar la lista de partidos
            }
        } catch (error) {
            setMensaje(`❌ Error al finalizar: ${error.message}`);
        }
    }
    
    // Función para marcar como "Jugando" sin finalizar
    const handleActualizar = async () => {
        setMensaje("Actualizando marcador...");
        try {
            const partidoRef = doc(db, "partidos", partido.id);
            await updateDoc(partidoRef, {
                estado: 'Jugando',
                resultadoSets: scores,
            });
            setMensaje(`⏱️ Marcador actualizado a: Jugando`);
            setTimeout(() => setMensaje(''), 3000);
            onUpdate();
        } catch (error) {
            setMensaje(`❌ Error al actualizar: ${error.message}`);
        }
    }


    return (
        <div style={scoreFormStyle}>
            <p style={{ fontWeight: 'bold', color: '#FFD700', marginBottom: '10px' }}>
                {partido.nombreEquipoA} vs {partido.nombreEquipoB} ({partido.ronda})
            </p>
            
            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', alignItems: 'center' }}>
                <span style={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}>{partido.nombreEquipoA}</span>
                {scores.map(([scoreA, scoreB], index) => (
                    <div key={index} style={setContainerStyle}>
                        <input
                            type="number"
                            min="0"
                            value={scores[index][0]}
                            onChange={(e) => handleScoreChange(index, 0, e.target.value)}
                            style={scoreInputStyle}
                        />
                    </div>
                ))}
            </div>
            
             <div style={{ display: 'flex', gap: '5px', marginBottom: '15px', alignItems: 'center' }}>
                <span style={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}>{partido.nombreEquipoB}</span>
                {scores.map(([scoreA, scoreB], index) => (
                    <div key={index} style={setContainerStyle}>
                         <input
                            type="number"
                            min="0"
                            value={scores[index][1]}
                            onChange={(e) => handleScoreChange(index, 1, e.target.value)}
                            style={scoreInputStyle}
                        />
                    </div>
                ))}
            </div>
            
            <p style={{ color: mensaje.startsWith('🚨') ? '#FF4500' : (mensaje.startsWith('🏆') ? '#00FF00' : '#fff'), minHeight: '20px', fontSize: '12px' }}>{mensaje}</p>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={handleActualizar} style={updateButtonStyle}>
                    ⏱️ Actualizar Score
                </button>
                <button type="button" onClick={handleFinalizar} style={finishButtonStyle}>
                    🏆 Finalizar Partido
                </button>
            </div>
        </div>
    );
}

// ----------------------------------------------------
// Componente principal del Results Manager
// ----------------------------------------------------

export default function ResultadosManager() {
    const [partidos, setPartidos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadPartidos = async () => {
        setIsLoading(true);
        const data = await getPartidosPendientes();
        setPartidos(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadPartidos();
    }, []);

    return (
        <div style={{ marginTop: '50px' }}>
            <h2 style={{ color: '#FFD700' }}>3. Carga de Resultados y Scoreboard</h2>
            
            <button onClick={loadPartidos} style={refreshButtonStyle}>
                🔄 Recargar Lista de Partidos Pendientes
            </button>
            
            {isLoading && <p style={{ color: '#fff' }}>Cargando partidos...</p>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
                {partidos.length === 0 && !isLoading && (
                    <p style={{ color: '#fff' }}>No hay partidos Programados o Jugando. ¡A programar!</p>
                )}
                {partidos.map(p => (
                    <ScoreForm key={p.id} partido={p} onUpdate={loadPartidos} />
                ))}
            </div>
        </div>
    );
}

// ----------------------------------------------------
// ESTILOS (Añadidos para este componente)
// ----------------------------------------------------
const scoreFormStyle = {
    background: '#333',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #555'
};
const setContainerStyle = {
    flex: 1,
    textAlign: 'center'
};
const scoreInputStyle = {
    width: '40px',
    padding: '5px',
    textAlign: 'center',
    borderRadius: '4px',
    border: '1px solid #FFD700',
    background: '#222',
    color: '#fff'
};
const updateButtonStyle = {
    padding: '8px 15px', 
    background: '#007bff', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '4px', 
    cursor: 'pointer',
    flex: 1
};
const finishButtonStyle = {
    padding: '8px 15px', 
    background: '#FF4500', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '4px', 
    cursor: 'pointer',
    flex: 1
};
const refreshButtonStyle = {
    padding: '8px 15px', 
    background: '#555', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '4px', 
    cursor: 'pointer',
    marginBottom: '15px'
};