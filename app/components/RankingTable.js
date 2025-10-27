// /app/components/RankingTable.js
'use client'; 

import React, { useState, useEffect } from 'react';
import { getRankingEquipos } from '@/lib/firestoreService';

export default function RankingTable() {
    const [rankingData, setRankingData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadRanking() {
            const data = await getRankingEquipos();
            setRankingData(data);
            setIsLoading(false);
        }
        loadRanking();

        // **NOTA:** Para un ranking 100% en tiempo real, deberías usar onSnapshot aquí también.
        // Pero para simplificar y reducir costos de lectura, usaremos getRankingEquipos (que lee una sola vez).
        // Si el ranking debe actualizarse inmediatamente al cargar un resultado, el admin debe recargar la vista.
    }, []);

    if (isLoading) {
        return <div style={loadingStyle}>Cargando Tabla de Posiciones... 📊</div>;
    }

    // Agrupar los equipos por Categoria y luego por Zona
    const groupedData = rankingData.reduce((acc, equipo) => {
        const key = `${equipo.categoria} - ${equipo.zona}`;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(equipo);
        return acc;
    }, {});

    return (
        <div style={containerStyle}>
            <h2 style={titleStyle}>Tabla de Posiciones</h2>
            
            {Object.entries(groupedData).map(([title, equipos]) => (
                <div key={title} style={{ marginBottom: '40px' }}>
                    <h3 style={zoneTitleStyle}>{title}</h3>
                    <div style={tableWrapperStyle}>
                        <table style={tableStyle}>
                            <thead>
                                <tr style={headerRowStyle}>
                                    <th style={{ width: '5%', textAlign: 'center' }}>#</th>
                                    <th style={{ width: '35%' }}>Equipo</th>
                                    <th style={centeredCell}>PJ</th>
                                    <th style={centeredCell}>PG</th>
                                    <th style={centeredCell}>PP</th>
                                    <th style={centeredCell}>GF</th>
                                    <th style={centeredCell}>GC</th>
                                    <th style={pointCellStyle}>PTS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {equipos.map((e, index) => (
                                    <tr key={e.id} style={index % 2 === 0 ? rowEvenStyle : rowOddStyle}>
                                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: index < 2 ? '#FFD700' : '#fff' }}>{index + 1}</td>
                                        <td style={teamCellStyle}>{e.nombre}</td>
                                        <td style={centeredCell}>{e.partidosJugados}</td>
                                        <td style={centeredCell}>{e.partidosGanados}</td>
                                        <td style={centeredCell}>{e.partidosPerdidos}</td>
                                        <td style={centeredCell}>{e.gamesFavor}</td>
                                        <td style={centeredCell}>{e.gamesContra}</td>
                                        <td style={pointCellStyle}>{e.puntos}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
}

// --- ESTILOS INLINE ---
const containerStyle = {
    padding: '20px 0',
    marginTop: '30px',
    color: '#fff',
};

const loadingStyle = {
    color: '#FFD700',
    textAlign: 'center',
    padding: '20px'
};

const titleStyle = {
    color: '#FFD700',
    borderBottom: '1px solid #FFD700',
    paddingBottom: '10px',
    marginBottom: '20px',
    textAlign: 'center'
};

const zoneTitleStyle = {
    color: '#FFD700',
    backgroundColor: '#333',
    padding: '10px',
    marginTop: '20px',
    borderRadius: '4px 4px 0 0',
    fontSize: '1.2em'
};

const tableWrapperStyle = {
    overflowX: 'auto',
};

const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '500px',
    fontSize: '0.9em'
};

const headerRowStyle = {
    background: '#444',
    color: '#fff',
    textAlign: 'left',
    borderBottom: '2px solid #FFD700'
};

const cellStyle = {
    padding: '10px 8px',
    borderBottom: '1px solid #555',
};

const centeredCell = {
    ...cellStyle,
    textAlign: 'center',
    width: '10%'
};

const pointCellStyle = {
    ...cellStyle,
    textAlign: 'center',
    width: '10%',
    fontWeight: 'bold',
    backgroundColor: '#444',
    color: '#FFD700'
};

const teamCellStyle = {
    ...cellStyle,
    fontWeight: '600'
};

const rowEvenStyle = {
    backgroundColor: '#2a2a2a',
};

const rowOddStyle = {
    backgroundColor: '#333',
};