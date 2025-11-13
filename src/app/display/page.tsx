'use client';

import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import { QueueItem } from '@/lib/types';

// NOTE: El cliente de Socket.io se conecta al mismo host del que sirve la página
const socket = io({ 
    path: '/api/socket', 
    autoConnect: false,
});

// Definimos un tipo simplificado para lo que se muestra en pantalla
interface DisplayTurn {
    clinica: string;
    turno: number;
    estado: 'llamado' | 'en_atencion' | 'finalizado' | 'ausente';
    time: string;
}

export default function PublicDisplayPage() {
    const [calledTurns, setCalledTurns] = useState<DisplayTurn[]>([]);
    const [latestCalled, setLatestCalled] = useState<DisplayTurn | null>(null);

    const fetchCalledTurns = useCallback(async () => {
        // Obtenemos los últimos turnos llamados o en atención (para persistencia si el socket falla)
        try {
            const response = await fetch('/api/queue/triage'); // Reusamos la API de Triage para obtener todos los "esperando"
            const waitingQueue: QueueItem[] = response.ok ? await response.json() : [];
            
            // Simulación de una cola de turnos que fueron llamados
            // Para el display, realmente nos interesan los turnos en estado 'llamado' o 'en_atencion'.
            // Como la API de triage solo trae 'esperando', aquí forzamos datos de prueba o necesitamos una API específica.
            
            // **IMPORTANTE**: Necesitarías una API específica que traiga TODOS los turnos activos.
            // Por ahora, solo mantendremos los datos actualizados por el socket.

        } catch (error) {
            console.error('Error fetching initial display data:', error);
        }
    }, []);

    // Efecto 1: Carga inicial y Socket.io
    useEffect(() => {
        // Forzar la conexión del servidor de Socket.io (workaround de Next.js)
        fetch('/api/socket'); 
        
        socket.connect();
        
        socket.on('connect', () => {
            console.log("Display conectado al servidor de turnos.");
        });

        socket.on('turno_updated', (update) => {
            const time = new Date().toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            // Solo procesamos los cambios de estado 'llamado', 'en_atencion', y 'finalizado'
            if (update.estado === 'llamado') {
                const newCall: DisplayTurn = {
                    clinica: `C${update.clinicaId}`,
                    turno: update.numeroTurno,
                    estado: 'llamado',
                    time: time
                };
                
                // Poner en el turno más reciente y agregarlo a la lista
                setLatestCalled(newCall);
                setCalledTurns(prev => {
                    // Prevenir duplicados en la lista de historia reciente
                    const existing = prev.filter(t => t.turno !== update.numeroTurno);
                    return [newCall, ...existing.slice(0, 4)]; // Mantiene los 5 más recientes
                });

            } else if (update.estado === 'en_atencion' || update.estado === 'finalizado') {
                // Actualizar la lista de historia si un turno pasa a ser atendido/finalizado
                setCalledTurns(prev => prev.filter(t => t.turno !== update.numeroTurno));
                if (latestCalled && latestCalled.turno === update.numeroTurno) {
                    setLatestCalled(null); // Limpiar el llamado actual
                }
            }
        });
        
        return () => {
            socket.off('turno_updated');
            socket.disconnect();
        };
    }, [latestCalled]);


    return (
        <div className="min-h-screen bg-gray-900 p-8 text-white flex flex-col">
            <header className="text-center mb-10">
                <h1 className="text-6xl font-extrabold text-blue-400">HOSPITAL CENTRAL</h1>
                <p className="text-2xl text-gray-400 mt-2">Sala de Espera - Turnos en Llamada</p>
            </header>

            <div className="flex-grow grid grid-cols-3 gap-8">
                
                {/* Columna 1 y 2: Turno Actual Principal */}
                <div className="col-span-2 flex flex-col bg-white rounded-2xl shadow-2xl p-8 border-4 border-yellow-400">
                    <h2 className="text-4xl font-bold text-gray-800 mb-6 text-center">¡TURNO ACTUAL!</h2>
                    
                    <div className="flex-grow flex items-center justify-center">
                        {latestCalled ? (
                            <div className="space-y-10 text-center animate-pulse-slow">
                                <div className="text-9xl sm:text-[14rem] font-black tracking-tighter text-yellow-600 drop-shadow-lg">
                                    {latestCalled.turno}
                                </div>
                                <div className="text-5xl font-extrabold text-gray-800">
                                    Pase a: {latestCalled.clinica}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500">
                                <p className="text-4xl font-extrabold">Esperando el siguiente llamado...</p>
                                <p className="text-xl mt-4">Manténgase atento.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Columna 3: Historial de Llamados Recientes */}
                <div className="col-span-1 bg-gray-800 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-3xl font-bold text-gray-300 mb-6 border-b border-gray-700 pb-3">Llamados Recientes</h2>
                    
                    <div className="space-y-4">
                        {calledTurns.map((turn, index) => (
                            <div 
                                key={turn.time + index} 
                                className="flex justify-between items-center p-4 rounded-xl bg-gray-700 hover:bg-gray-600 transition duration-150"
                            >
                                <div>
                                    <p className="text-3xl font-bold text-green-400">
                                        {turn.turno}
                                    </p>
                                    <p className="text-lg text-gray-400">
                                        {turn.clinica}
                                    </p>
                                </div>
                                <span className="text-sm font-light text-gray-500">
                                    {turn.time.substring(0, 5)}
                                </span>
                            </div>
                        ))}
                    </div>
                    
                </div>
            </div>

            <style jsx global>{`
                @keyframes pulse-slow {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.02); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 4s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
}