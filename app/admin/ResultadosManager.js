'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseConfig';
import { getPartidosPendientes, finalizarPartidoYActualizarRanking } from '@/lib/firestoreService';
import { doc, updateDoc } from 'firebase/firestore'; 

const MAX_SETS = 3; 

// Componente para cargar los scores de un partido individual
const ScoreForm = ({ partido, onUpdate }) => {
    // Aseguramos que scores tenga la longitud de MAX_SETS para que los inputs se rendericen
    const initialScores = partido.resultadoSets || [];
    // Rellenamos con [0, 0] hasta 3 sets
    while (initialScores.length < MAX_SETS) {
        initialScores.push([0, 0]);
    }
    const [scores, setScores] = useState(initialScores);
    const [mensaje, setMensaje] = useState('');

    const handleScoreChange = (setIndex, teamIndex, value) => {
        const newScores = scores.map((set, i) => {
            if (i === setIndex) {
                const newSet = [...set];
                // Asegurar que el valor sea numérico, o 0 si está vacío
                newSet[teamIndex] = parseInt(value) || 0; 
                return newSet;
            }
            return set;
        });
        setScores(newScores);
    };
    
    // Función central que valida el formato y determina si el partido ha finalizado
    const validarResultado = (scoresArray) => {
        let setsA = 0;
        let setsB = 0;
        let setsValidos = []; // Solo incluye sets jugados o sets incompletos que son válidos hasta ahora

        for (const [scoreA, scoreB] of scoresArray) {
            if (scoreA === 0 && scoreB === 0) continue; 
            
            // Si hay score, lo consideramos como un set jugado/en progreso
            setsValidos.push([scoreA, scoreB]);

            // Reglas básicas: el set es válido si cumple las condiciones de victoria o si está en progreso
            const ganoA = (scoreA >= 6 && scoreA - scoreB >= 2) || (scoreA === 7 && scoreB === 6);
            const ganoB = (scoreB >= 6 && scoreB - scoreA >= 2) || (scoreB === 7 && scoreA === 6);
            
            if (ganoA) {
                setsA++;
            } else if (ganoB) {
                setsB++;
            } else {
                // Si el set tiene scores (>0) pero no cumple las reglas de victoria, es inválido.
                setMensaje("🚨 Resultado de set inválido. Verifique 6+ games y 2 de diferencia (o 7-6).");
                return false;
            }
        }
        
        // El partido finaliza si alguien gana 2 sets (2-0 o 2-1)
        if (setsA === 2 || setsB === 2) {
            setMensaje("🏆 Listo para finalizar. El partido está 2-0 o 2-1.");
            // Devolvemos solo los sets que tienen scores > 0
            return setsValidos; 
        } else if (setsValidos.length > 0 && setsValidos.length < 2) {
             setMensaje("📝 Partido en curso o faltan sets.");
        } else if (setsValidos.length === 3 && setsA !== setsB) {
             setMensaje("🏆 Partido finalizado. Resultado 2-1.");
             return setsValidos;
        } else if (setsValidos.length === 0 && partido.estado === 'Programado') {
             setMensaje("✅ Listo para empezar.");
        }
        
        // Si no hay errores, devolvemos el array de sets jugados (incluyendo sets incompletos que pasaron el filtro)
        return setsValidos; 
    };
    
    const handleFinalizar = async () => {
        // Obtenemos los sets válidos. Si devuelve 'false', hay error de formato.
        const setsValidados = validarResultado(scores); 

        // Chequeo si el resultado NO cumple con 2 sets ganados para finalizar
        if (!setsValidados || setsValidados.length < 2 || (setsValidados.length === 3 && setsValidados[2].every(s => s === 0))) {
             setMensaje("🚨 El partido NO puede finalizar. Debe haber un resultado de 2-0 o 2-1 válido.");
             return;
        }

        setMensaje("Finalizando partido y actualizando ranking...");

        try {
            // Pasamos el array de sets que se jugaron.
            const result = await finalizarPartidoYActualizarRanking(partido, setsValidados);
            if (result.success) {
                setMensaje(`🏆 Partido Finalizado! Ganador: ${result.ganador === partido.idEquipoA ? partido.nombreEquipoA : partido.nombreEquipoB}`);
                onUpdate(); 
            }
        } catch (error) {
            setMensaje(`❌ Error al finalizar: ${error.message}`);
        }
    }
    
    // CORRECCIÓN: Manejo de setsValidados en handleActualizar
    const handleActualizar = async () => {
        setMensaje("Actualizando marcador...");

        // Llamamos a validarResultado, pero si falla, no detenemos la actualización, 
        // solo usamos el score tal cual está en el estado (scores), ya que es una actualización parcial.
        const setsValidosCheck = validarResultado(scores); 
        
        // Filtramos el estado local (scores) para no enviar sets [0, 0] al campo resultadoSets
        const scoresToUpdate = scores.filter(([a, b]) => a !== 0 || b !== 0);

        if (scoresToUpdate.length === 0) {
             setMensaje("📝 Ingrese al menos un game para marcar como 'Jugando'.");
             return;
        }

        try {
            const partidoRef = doc(db, "partidos", partido.id);
            await updateDoc(partidoRef, {
                estado: 'Jugando', 
                resultadoSets: scoresToUpdate,
            });
            setMensaje(`⏱️ Marcador actualizado a: Jugando`);
            setTimeout(() => setMensaje(''), 3000);
            onUpdate();
        } catch (error) {
            // Este catch es el que atrapa el error de Firestore
            setMensaje(`❌ Error al actualizar: ${error.message}`);
        }
    }


    return (
        <div style={scoreFormStyle}>
            <p style={{ fontWeight: 'bold', color: '#FFD700', marginBottom: '10px' }}>
                {partido.nombreEquipoA} vs {partido.nombreEquipoB} ({partido.ronda} - {partido.cancha})
            </p>
            
            {/* Input de scores Equipo A */}
            <div style={{ display: 'flex', gap: '5px', marginBottom: '5px', alignItems: 'center' }}>
                <span style={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}>{partido.nombreEquipoA}</span>
                {scores.map((set, index) => (
                    <div key={index} style={setContainerStyle}>
                        <input
                            type="number"
                            min="0"
                            value={set[0]}
                            onChange={(e) => handleScoreChange(index, 0, e.target.value)}
                            style={scoreInputStyle}
                        />
                    </div>
                ))}
            </div>
            
             {/* Input de scores Equipo B */}
             <div style={{ display: 'flex', gap: '5px', marginBottom: '15px', alignItems: 'center' }}>
                <span style={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}>{partido.nombreEquipoB}</span>
                {scores.map((set, index) => (
                    <div key={index} style={setContainerStyle}>
                         <input
                            type="number"
                            min="0"
                            value={set[1]}
                            onChange={(e) => handleScoreChange(index, 1, e.target.value)}
                            style={scoreInputStyle}
                        />
                    </div>
                ))}
            </div>
            
            <p style={{ color: mensaje.startsWith('🚨') ? '#FF4500' : (mensaje.startsWith('🏆') ? '#00FF00' : (mensaje.startsWith('📝') ? '#FFD700' : '#fff')), minHeight: '20px', fontSize: '12px' }}>{mensaje || ' '}</p>

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

    // Este useEffect se ejecuta al montar el componente (y cuando se recrea por el 'key' del padre)
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
                    <p style={{ color: '#fff', fontSize: '1.2em' }}>No hay partidos Programados o Jugando. ¡A programar!</p>
                )}
                {partidos.map(p => (
                    // Pasamos loadPartidos como callback para que el formulario pueda pedir una recarga
                    <ScoreForm key={p.id} partido={p} onUpdate={loadPartidos} />
                ))}
            </div>
        </div>
    );
}

// ----------------------------------------------------
// ESTILOS
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