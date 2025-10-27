'use client'; 

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseConfig'; // Importamos la DB
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

const partidosCollectionRef = collection(db, 'partidos');

// Función de ayuda para formatear la hora
const formatTime = (timestamp) => {
    if (!timestamp) return 'Hora no definida';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

// Renderiza los resultados de sets
const renderScores = (resultadoSets, tvMode) => {
    if (!resultadoSets || resultadoSets.length === 0) return tvMode ? '0 - 0' : '0-0';

    const scoreStyle = {
        fontSize: tvMode ? '1.8em' : '1.4em', // Más grande en modo TV
        fontWeight: 'bold',
        color: '#fff',
        marginRight: tvMode ? '15px' : '5px',
    }

    return resultadoSets.map(([a, b], index) => 
        <span key={index} style={scoreStyle}>{a}-{b}</span>
    );
}

// Aceptamos la prop 'tvMode'
export default function LiveScoreboard({ tvMode = false }) {
    const [partidos, setPartidos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Consultamos partidos que estén Programados o Jugando, ordenados por hora
        const q = query(
            partidosCollectionRef, 
            where("estado", "in", ["Programado", "Jugando"]),
            orderBy("horaInicio", "asc")
        );

        // onSnapshot establece el listener en tiempo real
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const partidosData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                horaInicio: doc.data().horaInicio ? doc.data().horaInicio : null,
            }));
            setPartidos(partidosData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error al escuchar partidos:", error);
            setIsLoading(false);
        });

        // Limpieza
        return () => unsubscribe();
    }, []);

    if (isLoading) {
        return <div style={loadingStyle(tvMode)}>Cargando Scoreboard en vivo... ⏳</div>;
    }
    
    // Aplicamos estilos responsivos y para TV
    const currentGridStyle = tvMode ? tvGridStyle : gridStyle;

    return (
        <div style={containerStyle}>
            {!tvMode && <h2 style={titleStyle}>Partidos en Vivo y Próximos ⚡️</h2>}
            
            {partidos.length === 0 ? (
                <p style={{ color: '#aaa', textAlign: 'center', fontSize: tvMode ? '1.5em' : '1em' }}>
                    No hay partidos activos ni programados en este momento.
                </p>
            ) : (
                <div style={currentGridStyle}>
                    {partidos.map(p => (
                        <div key={p.id} style={cardStyle(p.estado, tvMode)}>
                            <div style={headerStyle}>
                                <span style={canchaStyle(tvMode)}>{p.cancha}</span>
                                <span style={statusStyle(p.estado, tvMode)}>{p.estado.toUpperCase()}</span>
                            </div>
                            
                            <p style={teamsStyle(tvMode)}>{p.nombreEquipoA} vs {p.nombreEquipoB}</p>
                            
                            <div style={scoreLineStyle}>
                                <span style={roundStyle(tvMode)}>{p.ronda}</span>
                                <div>{renderScores(p.resultadoSets, tvMode)}</div>
                            </div>
                            
                            <p style={timeStyle(tvMode)}>**{formatTime(p.horaInicio)}**</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// --- ESTILOS INLINE (Gold Edition) ---
const containerStyle = {
    padding: '0',
    background: 'transparent',
    boxShadow: 'none'
};

const titleStyle = {
    color: '#FFD700',
    borderBottom: '1px solid #FFD700',
    paddingBottom: '10px',
    marginBottom: '20px',
    textAlign: 'center'
};

const loadingStyle = (tvMode) => ({
    color: '#FFD700',
    textAlign: 'center',
    padding: tvMode ? '50px' : '20px',
    fontSize: tvMode ? '2em' : '1em',
});

// Estilos para la vista normal (público/móvil)
const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
};

// Estilos para el Modo TV (más columnas y más espacio)
const tvGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '40px 20px', // Más espacio vertical
};


const cardStyle = (estado, tvMode) => ({
    background: estado === 'Jugando' ? '#4e2723' : '#2a2a2a', // Rojo oscuro o gris
    border: estado === 'Jugando' ? '3px solid #FFD700' : '1px solid #444',
    padding: tvMode ? '25px' : '15px', // Más padding en TV
    borderRadius: '10px',
    color: '#fff',
    transition: 'transform 0.2s',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.7)',
});

const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
};

const canchaStyle = (tvMode) => ({
    fontWeight: 'bold',
    color: '#fff',
    fontSize: tvMode ? '1.8em' : '1.2em', // Más grande en TV
    lineHeight: 1
});

const statusStyle = (estado, tvMode) => ({
    fontSize: tvMode ? '1.2em' : '10px',
    fontWeight: 'bold',
    padding: tvMode ? '8px 15px' : '4px 8px',
    borderRadius: '5px',
    color: estado === 'Jugando' ? '#222' : '#fff',
    background: estado === 'Jugando' ? '#FFD700' : (estado === 'Programado' ? '#555' : '#1e88e5'),
});

const teamsStyle = (tvMode) => ({
    fontSize: tvMode ? '2em' : '1.2em', // Más grande en TV
    fontWeight: '800',
    color: '#FFD700',
    marginBottom: '10px',
});

const scoreLineStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderTop: '1px dotted #444',
    marginTop: '5px'
};

const roundStyle = (tvMode) => ({
    fontWeight: 'normal', 
    color: '#ccc', 
    fontSize: tvMode ? '1.2em' : '0.9em'
});

const timeStyle = (tvMode) => ({
    fontSize: tvMode ? '1.4em' : '0.9em',
    color: '#ccc',
    textAlign: 'right',
    marginTop: '10px'
});
