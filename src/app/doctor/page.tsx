'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Notification from '@/components/Notification';
import { QueueItem } from '@/lib/types';
import io from 'socket.io-client';

// NOTE: El cliente de Socket.io se conecta al mismo host del que sirve la página
const socket = io({ 
    path: '/api/socket', // Ruta donde Next.js expone el servidor de socket.io
    autoConnect: false,
});

type DoctorQueue = {
    clinicId: number;
    clinicName: string;
    queue: QueueItem[];
}

export default function DoctorPanel() {
    const [doctorData, setDoctorData] = useState<DoctorQueue>({ clinicId: 0, clinicName: 'Cargando...', queue: [] });
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' }>({ message: '', type: 'error' });
    const router = useRouter();

    const fetchQueue = useCallback(async () => {
        try {
            const response = await fetch('/api/queue/doctor');
            if (response.ok) {
                const data = await response.json();
                setDoctorData(data);
            } else if (response.status === 401 || response.status === 403) {
                 router.push('/login');
            } else {
                const data = await response.json();
                setNotification({ message: data.message || 'Error al cargar la cola médica.', type: 'error' });
            }
        } catch (error) {
            setNotification({ message: 'Error de conexión al obtener la cola.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [router]);

    // Efecto 1: Carga inicial de datos y Socket.io
    useEffect(() => {
        fetchQueue();
        
        // Conexión Socket.io
        socket.connect();

        socket.on('connect', () => {
            console.log("Socket conectado al servidor.");
            // Una vez conectado, unirse a la sala específica de la clínica (si ya está cargada)
            if (doctorData.clinicId > 0) {
                socket.emit('join_clinic', doctorData.clinicId);
            }
        });

        // Escuchar actualizaciones de turno (para refrescar la lista)
        socket.on('turno_updated', (update) => {
            // Si el turno actualizado pertenece a nuestra clínica
            if (update.clinicaId === doctorData.clinicId) {
                console.log(`Actualización de turno ${update.numeroTurno} recibida.`);
                fetchQueue(); // Refrescar la cola
            }
        });
        
        // Limpiar al desmontar
        return () => {
            socket.off('turno_updated');
            socket.disconnect();
        };
    }, [fetchQueue, doctorData.clinicId]);
    
    // Si la clínicaId se carga después, unirse a la sala
    useEffect(() => {
        if (doctorData.clinicId > 0 && socket.connected) {
            socket.emit('join_clinic', doctorData.clinicId);
        }
    }, [doctorData.clinicId]);


    const handleTurnAction = async (turnoId: number, action: 'call' | 'attend' | 'finish' | 'miss') => {
        setLoading(true);
        setNotification({ message: '', type: 'error' });

        try {
            const response = await fetch('/api/turnos/control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ turnoId, action }),
            });

            const data = await response.json();

            if (response.ok) {
                // El socket.io en el backend ya notificó a todos. Solo actualizamos la lista local.
                fetchQueue(); 
                setNotification({ message: data.message, type: 'success' });
            } else {
                setNotification({ message: data.message || 'Error en la acción.', type: 'error' });
                if (response.status === 401 || response.status === 403) {
                    router.push('/login');
                }
            }
        } catch (error) {
            setNotification({ message: 'Error de red al intentar control de turno.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } finally {
            router.push('/login');
        }
    };

    const currentTurn = useMemo(() => 
        doctorData.queue.find(t => t.Estado === 'en_atencion'),
        [doctorData.queue]
    );


    if (loading && doctorData.clinicId === 0) {
        return <div className="flex items-center justify-center min-h-screen">Cargando Panel Médico...</div>;
    }

    if (doctorData.clinicId === 0 && !loading) {
        return (
            <div className="p-8 text-center bg-red-50 min-h-screen">
                <h1 className="text-4xl font-bold text-red-700">Acceso Denegado</h1>
                <p className="mt-4 text-lg text-gray-600">
                    No está asignado a una clínica para operar. Contacte al administrador.
                </p>
                <button onClick={handleLogout} className="mt-8 text-blue-600 hover:underline">
                    Volver al Login
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <header className="flex justify-between items-center max-w-7xl mx-auto mb-6 border-b pb-4">
                <h1 className="text-3xl font-extrabold text-green-700">
                    {doctorData.clinicName} | Panel de Atención
                </h1>
                <button 
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 shadow-md text-sm"
                >
                    Cerrar Sesión
                </button>
            </header>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Columna 1: Turno Actual */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-2xl border-t-4 border-green-500 h-fit">
                    <h2 className="text-2xl font-bold text-gray-700 mb-4">Turno en Atención</h2>
                    
                    {currentTurn ? (
                        <div className="space-y-4">
                            <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-4xl font-extrabold text-green-600">
                                    {currentTurn.ClinicaNombre.substring(0, 3).toUpperCase()}-{currentTurn.NumeroTurno}
                                </p>
                                <p className="text-lg font-semibold text-gray-800 mt-2">
                                    {currentTurn.PacienteNombre} {currentTurn.PacienteApellido}
                                </p>
                                <p className="text-sm text-gray-500">Estado: {currentTurn.Estado}</p>
                            </div>

                            <button
                                onClick={() => handleTurnAction(currentTurn.Id, 'finish')}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold shadow-md transition duration-200"
                            >
                                Finalizar Atención
                            </button>
                            <button
                                onClick={() => handleTurnAction(currentTurn.Id, 'miss')}
                                className="w-full bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-bold shadow-md transition duration-200"
                            >
                                Paciente Ausente
                            </button>
                        </div>
                    ) : (
                         <div className="text-center p-10 text-gray-500 bg-gray-50 rounded-lg border">
                            <p className="text-lg font-medium">No hay paciente en atención.</p>
                            <p className="text-sm mt-2">Llama al siguiente de la cola.</p>
                        </div>
                    )}

                </div>

                {/* Columna 2 y 3: Cola de Espera */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-xl border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-700 mb-4 border-b pb-2">Cola de Espera ({doctorData.queue.filter(t => t.Estado === 'esperando').length})</h2>
                    
                    <Notification message={notification.message} type={notification.type} />
                    
                    {doctorData.queue.length === 0 ? (
                        <div className="text-center p-10 text-gray-500 bg-gray-50 rounded-lg">
                            <p className="text-xl font-medium">¡Tu cola está vacía!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {doctorData.queue
                                .filter(t => t.Estado === 'esperando' || t.Estado === 'llamado')
                                .map((item) => (
                                <div 
                                    key={item.Id} 
                                    className={`flex justify-between items-center p-4 rounded-lg shadow-sm border ${
                                        item.Estado === 'llamado' ? 'bg-yellow-100 border-yellow-300' : 'bg-white hover:bg-gray-50'
                                    }`}
                                >
                                    <div>
                                        <p className={`text-xl font-bold ${item.Prioridad > 0 ? 'text-red-600' : 'text-indigo-600'}`}>
                                            {item.ClinicaNombre.substring(0, 3).toUpperCase()}-{item.NumeroTurno} {item.Prioridad > 0 && '🚨'}
                                        </p>
                                        <p className="text-sm text-gray-700">
                                            {item.PacienteNombre} {item.PacienteApellido}
                                        </p>
                                    </div>
                                    <div className="flex space-x-2">
                                        {item.Estado === 'esperando' && (
                                            <button
                                                onClick={() => handleTurnAction(item.Id, 'call')}
                                                disabled={loading}
                                                className="bg-green-500 hover:bg-green-600 text-white text-sm py-2 px-4 rounded-full font-semibold transition"
                                            >
                                                Llamar
                                            </button>
                                        )}
                                        {item.Estado === 'llamado' && (
                                            <button
                                                onClick={() => handleTurnAction(item.Id, 'attend')}
                                                disabled={loading}
                                                className="bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-4 rounded-full font-semibold transition"
                                            >
                                                Atender
                                            </button>
                                        )}
                                        {item.Estado === 'en_atencion' && (
                                            <span className="text-sm font-semibold text-green-500 bg-green-100 p-2 rounded-full">EN CURSO</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}