// /lib/firestoreService.js

import { 
  db 
} from './firebaseConfig';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  doc,       
  serverTimestamp,
  query,     
  where,
  orderBy
} from 'firebase/firestore'; 

// --- 1. REFERENCIAS DE COLECCIONES ---
const equiposCollectionRef = collection(db, 'equipos');
const partidosCollectionRef = collection(db, 'partidos');

// ------------------------------------------------------------------
// FUNCIONES DE UTILIDAD PARA RANKING
// ------------------------------------------------------------------

/**
* Función interna para calcular y actualizar las estadísticas de un equipo.
*/
const actualizarEstadisticasEquipo = async (equipoId, gano, gamesFavor, gamesContra) => {
  // 1. Obtener los datos actuales del equipo
  const equipoRef = doc(db, "equipos", equipoId);
  
  // Obtener el documento actual por su ID
  const snapshot = await getDocs(query(equiposCollectionRef, where("__name__", "==", equipoId)));
  if (snapshot.empty) {
      console.error("Equipo no encontrado para actualizar estadísticas:", equipoId);
      return;
  }
  const datosActuales = snapshot.docs[0].data();

  // 2. Calcular los nuevos valores
  const nuevosDatos = {
      partidosJugados: datosActuales.partidosJugados + 1,
      partidosGanados: datosActuales.partidosGanados + (gano ? 1 : 0),
      partidosPerdidos: datosActuales.partidosPerdidos + (gano ? 0 : 1),
      gamesFavor: datosActuales.gamesFavor + gamesFavor,
      gamesContra: datosActuales.gamesContra + gamesContra,
      // PADEL ZONE LIVE: 2 puntos por partido ganado, 0 por perdido
      puntos: datosActuales.puntos + (gano ? 2 : 0), 
  };

  // 3. Actualizar el documento en Firestore
  await updateDoc(equipoRef, nuevosDatos);
};


// ------------------------------------------------------------------
// FUNCIONES PARA EQUIPOS
// ------------------------------------------------------------------

/**
* Agrega un nuevo equipo con inicialización de stats.
*/
export const addEquipo = async (equipoData) => {
try {
  const nuevoEquipo = {
    ...equipoData,
    partidosJugados: 0,
    partidosGanados: 0,
    partidosPerdidos: 0,
    gamesFavor: 0,
    gamesContra: 0,
    puntos: 0,
    createdAt: serverTimestamp(),
  };
  
  await addDoc(equiposCollectionRef, nuevoEquipo);
  return { success: true };

} catch (error) {
  console.error("Error al agregar el equipo:", error);
  return { success: false, error: error.message };
}
};

/**
* Obtiene todos los equipos.
*/
export const getEquipos = async () => {
try {
  const snapshot = await getDocs(equiposCollectionRef);
  const equiposList = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  return equiposList;
} catch (error) {
  console.error("Error al obtener equipos:", error);
  return [];
}
};

/**
* Obtiene todos los equipos ordenados para la Tabla de Posiciones.
*/
export const getRankingEquipos = async () => {
  try {
      const q = query(
          equiposCollectionRef, 
          orderBy("categoria", "asc"), // Agrupar por categoría
          orderBy("zona", "asc"),      // Agrupar por zona
          orderBy("puntos", "desc"),   // 1. Puntos (DESC)
          orderBy("gamesFavor", "desc"), // 2. Games a favor (DESC)
          // Se pueden añadir más criterios de desempate aquí
      );
      const snapshot = await getDocs(q);
      
      const rankingList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
      }));
      
      return rankingList;
  } catch (error) {
      console.error("Error al obtener el ranking:", error);
      return [];
  }
};

// ------------------------------------------------------------------
// FUNCIONES PARA PARTIDOS
// ------------------------------------------------------------------

/**
* Agrega un nuevo partido programado.
*/
export const addPartido = async (partidoData) => {
try {
  const nuevoPartido = {
    ...partidoData,
    estado: 'Programado', 
    resultadoSets: [], 
    createdAt: serverTimestamp(),
  };
  
  await addDoc(partidosCollectionRef, nuevoPartido);
  return { success: true };

} catch (error) {
  console.error("Error al agregar el partido:", error);
  return { success: false, error: error.message };
}
};

/**
* Obtiene los partidos que están Programados o Jugando (para el Admin/Scoreboard).
*/
export const getPartidosPendientes = async () => {
try {
  const q = query(
      partidosCollectionRef, 
      where("estado", "in", ["Programado", "Jugando"]),
      orderBy("horaInicio", "asc") // Ordenar por hora de inicio
  );
  const snapshot = await getDocs(q);
  
  const partidosList = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    // Asegurar que horaInicio sea legible
    horaInicio: doc.data().horaInicio ? doc.data().horaInicio : null
  }));
  
  return partidosList;
} catch (error) {
  console.error("Error al obtener partidos pendientes:", error);
  return [];
}
};

/**
* Finaliza un partido, guarda el resultado y actualiza el ranking.
*/
export const finalizarPartidoYActualizarRanking = async (partido, resultadoSets) => {
  let setsA = 0;
  let setsB = 0;
  let gamesA = 0;
  let gamesB = 0;
  
  // 1. Calcular sets y games totales SÓLO para los sets jugados (que no son [0, 0])
  // Corregimos la lógica para asegurar que solo iteramos sobre sets con contenido
  const setsJugados = resultadoSets.filter(([scoreA, scoreB]) => scoreA !== 0 || scoreB !== 0);

  setsJugados.forEach(([scoreA, scoreB]) => {
      if (scoreA > scoreB) {
          setsA++;
      } else if (scoreB > scoreA) {
          setsB++;
      }
      gamesA += scoreA;
      gamesB += scoreB;
  });

  // 2. Determinar el ganador
  let ganadorId;
  if (setsA > setsB) {
      ganadorId = partido.idEquipoA;
  } else if (setsB > setsA) {
      ganadorId = partido.idEquipoB;
  } else {
      throw new Error("El partido no tiene un ganador claro (empate en sets).");
  }
  
  // 3. Actualizar el documento del partido
  const partidoRef = doc(db, "partidos", partido.id);
  await updateDoc(partidoRef, {
      estado: 'Finalizado',
      resultadoSets: setsJugados, // Guardamos solo los sets jugados
      ganadorId: ganadorId,
      fechaFin: serverTimestamp(),
  });

  // 4. Actualizar las estadísticas de ambos equipos
  
  // Equipo A
  const ganoA = ganadorId === partido.idEquipoA;
  await actualizarEstadisticasEquipo(partido.idEquipoA, ganoA, gamesA, gamesB);

  // Equipo B
  const ganoB = ganadorId === partido.idEquipoB;
  await actualizarEstadisticasEquipo(partido.idEquipoB, ganoB, gamesB, gamesA); // Invertir games

  return { success: true, ganador: ganadorId };
};
