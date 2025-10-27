// /app/components/LiveScoreboard.js
'use client'; 

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseConfig'; // Importamos la DB
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

const partidosCollectionRef = collection(db, 'partidos');

// Función de ayuda para formatear la hora
const formatTime = (timestamp) => {
    if (!timestamp) return 'Hora no definida';
    
    // Si es un objeto Date/Timestamp de Firebase
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

// Renderiza los resultados de sets
const renderScores = (resultadoSets) => {
    if (!resultadoSets || resultadoSets.length === 0) return '0-0';

    return resultadoSets.map(([a, b], index) => 
        <span key={index} style={{ fontWeight: 'bold' }}>{a}-{b}</span>
    ).join(' | ');
}

export default function LiveScoreboard() {
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
                // Convertir timestamp a un formato más fácil de usar
                horaInicio: doc.data().horaInicio ? doc.data().horaInicio : null,
            }));
            setPartidos(partidosData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error al escuchar partidos:", error);
            setIsLoading(false);
        });

        // La función de limpieza se ejecuta al desmontar el componente
        return () => unsubscribe();
    }, []);

    if (isLoading) {
        return <div style={loadingStyle}>Cargando Scoreboard en vivo... ⏳</div>;
    }
    
    return (
        <div style={containerStyle}>
            <h2 style={titleStyle}>Partidos en Vivo y Próximos ⚡️</h2>
            
            {partidos.length === 0 ? (
                <p style={{ color: '#aaa', textAlign: 'center' }}>No hay partidos activos ni programados en este momento.</p>
            ) : (
                <div style={gridStyle}>
                    {partidos.map(p => (
                        <div key={p.id} style={cardStyle(p.estado)}>
                            <div style={headerStyle}>
                                <span style={canchaStyle}>{p.cancha}</span>
                                <span style={statusStyle(p.estado)}>{p.estado.toUpperCase()}</span>
                            </div>
                            
                            <p style={teamsStyle}>{p.nombreEquipoA} vs {p.nombreEquipoB}</p>
                            
                            <div style={scoreLineStyle}>
                                <span style={{fontWeight: 'normal', color: '#ccc', marginRight: '10px'}}>{p.ronda}</span>
                                <span style={scoreStyle}>{renderScores(p.resultadoSets)}</span>
                            </div>
                            
                            <p style={timeStyle}>**{formatTime(p.horaInicio)}**</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// --- ESTILOS INLINE (Gold Edition) ---
const containerStyle = {
    padding: '20px',
    background: '#1c1c1c',
    borderRadius: '8px',
    marginTop: '30px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
};

const titleStyle = {
    color: '#FFD700',
    borderBottom: '1px solid #FFD700',
    paddingBottom: '10px',
    marginBottom: '20px',
    textAlign: 'center'
};

const loadingStyle = {
    color: '#FFD700',
    textAlign: 'center',
    padding: '20px'
};

const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
};

const cardStyle = (estado) => ({
    background: estado === 'Jugando' ? '#3e2723' : '#2a2a2a', // Rojo oscuro para JUGANDO
    border: estado === 'Jugando' ? '2px solid #FFD700' : '1px solid #444',
    padding: '15px',
    borderRadius: '6px',
    color: '#fff',
    transition: 'transform 0.2s',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.5)',
});

const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
};

const canchaStyle = {
    fontWeight: 'bold',
    color: '#fff',
};

const statusStyle = (estado) => ({
    fontSize: '10px',
    fontWeight: 'bold',
    padding: '4px 8px',
    borderRadius: '3px',
    color: estado === 'Jugando' ? '#222' : '#fff',
    background: estado === 'Jugando' ? '#FFD700' : (estado === 'Programado' ? '#555' : '#1e88e5'),
});

const teamsStyle = {
    fontSize: '1.2em',
    fontWeight: '800',
    color: '#FFD700',
    marginBottom: '5px',
};

const scoreLineStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 0',
    borderTop: '1px dotted #444',
    marginTop: '5px'
};

const scoreStyle = {
    fontSize: '1.4em',
    color: '#fff',
};

const timeStyle = {
    fontSize: '0.9em',
    color: '#ccc',
    textAlign: 'right',
    marginTop: '10px'
};