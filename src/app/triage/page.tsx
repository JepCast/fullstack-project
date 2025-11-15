'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Asumimos que estos componentes y tipos existen en sus rutas correspondientes
// NOTA: Reemplazar 'Notification' y 'types' con su implementación real.
interface QueueItem {
    Id: number;
    NumeroTurno: number;
    PacienteNombre: string;
    PacienteApellido: string;
    ClinicaId: number;
    ClinicaNombre: string;
    Estado: 'esperando' | 'en_sala' | 'completado';
    FechaCreacion: string;
}

interface Clinic {
    Id: number;
    Nombre: string;
}

interface NotificationProps {
    message: string;
    type: 'success' | 'error' | 'info';
}

const Notification: React.FC<NotificationProps> = ({ message, type }) => {
    if (!message) return null;

    const baseStyle = "p-4 rounded-xl shadow-lg mb-4 flex items-center";
    let colorStyle = "";
    let icon = "";

    switch (type) {
        case 'success':
            colorStyle = "bg-green-100 border-l-4 border-green-500 text-green-700";
            icon = "✅";
            break;
        case 'error':
            colorStyle = "bg-red-100 border-l-4 border-red-500 text-red-700";
            icon = "❌";
            break;
        case 'info':
        default:
            colorStyle = "bg-blue-100 border-l-4 border-blue-500 text-blue-700";
            icon = "ℹ️";
            break;
    }

    return (
        <div className={`${baseStyle} ${colorStyle}`} role="alert">
            <span className="text-xl mr-3">{icon}</span>
            <p className="font-medium">{message}</p>
        </div>
    );
};
// --- Fin de Componentes Placeholder ---


// --- Placeholder del Hook de Autenticación para Triage ---
const useTriageAuth = () => {
    // Simula un usuario de Triage/Enfermería autenticado
    const [user, setUser] = useState<{ id: number; rol: 'triage' | 'doctor' } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setUser({ id: 201, rol: 'triage' }); // ID de ejemplo para el log de acciones
            setLoading(false);
        }, 500);
    }, []);
    
    return { user, loading };
};
// --- Fin del Placeholder ---


// --- COMPONENTES MODAL ---

interface NewPatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { nombre: string; apellido: string; clinicaId: number }) => void;
    clinics: Clinic[];
    isSubmitting: boolean;
}

// Modal para Crear un Nuevo Turno (Registro)
const NewPatientModal: React.FC<NewPatientModalProps> = ({ isOpen, onClose, onSubmit, clinics, isSubmitting }) => {
    const [formData, setFormData] = useState({ nombre: '', apellido: '', clinicaId: '' });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nombre || !formData.apellido || !formData.clinicaId) return;
        onSubmit({
            nombre: formData.nombre,
            apellido: formData.apellido,
            clinicaId: parseInt(formData.clinicaId)
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Registrar Nuevo Paciente</h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <input
                            type="text"
                            name="nombre"
                            placeholder="Nombre del Paciente *"
                            required
                            value={formData.nombre}
                            onChange={handleInputChange}
                            className="w-full border text-black border-gray-300 rounded-md p-3 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        <input
                            type="text"
                            name="apellido"
                            placeholder="Apellido del Paciente *"
                            required
                            value={formData.apellido}
                            onChange={handleInputChange}
                            className="w-full border text-black border-gray-300 rounded-md p-3 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        <div>
                            <label htmlFor="initialClinic" className="block text-sm font-medium text-gray-700 mb-1">
                                Asignación Inicial de Clínica *
                            </label>
                            <select
                                id="initialClinic"
                                name="clinicaId"
                                required
                                value={formData.clinicaId}
                                onChange={handleInputChange}
                                className="w-full border text-black border-gray-300 rounded-md p-3 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                            >
                                <option value="" disabled>Seleccione una clínica...</option>
                                {clinics.map((c) => (
                                    <option key={c.Id} value={c.Id}>{c.Nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isSubmitting ? 'Registrando...' : 'Crear Turno'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface ReassignClinicModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (newClinicId: number, motivo: string) => void;
    turn: QueueItem | null;
    clinics: Clinic[];
    isSubmitting: boolean;
}

// Modal para Reasignar un Turno
const ReassignClinicModal: React.FC<ReassignClinicModalProps> = ({ isOpen, onClose, onSubmit, turn, clinics, isSubmitting }) => {
    const [reassignData, setReassignData] = useState({ newClinicId: '', motivo: '' });

    const handleModalChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
        setReassignData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (turn && reassignData.newClinicId && reassignData.motivo) {
            onSubmit(parseInt(reassignData.newClinicId), reassignData.motivo);
        }
    };

    if (!isOpen || !turn) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Editar o Reasignar Clínica</h2>
                <p className="mb-4 text-gray-600">
                    Paciente: <span className="font-semibold">{turn.PacienteNombre} {turn.PacienteApellido}</span>
                    <br />
                    Clínica Actual: <span className="font-semibold text-red-500">{turn.ClinicaNombre}</span>
                </p>
                
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="newClinicId" className="block text-sm font-medium text-gray-700">
                                Asignar a Nueva Clínica *
                            </label>
                            <select
                                id="newClinicId"
                                name="newClinicId"
                                required
                                value={reassignData.newClinicId}
                                onChange={handleModalChange}
                                className="mt-1 block w-full border text-black border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                                <option value="" disabled>Seleccione una clínica...</option>
                                {clinics
                                    .filter(c => c.Id !== turn.ClinicaId) 
                                    .map((clinic) => (
                                    <option key={clinic.Id} value={clinic.Id}>
                                        {clinic.Nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label htmlFor="motivo" className="block text-sm font-medium text-gray-700">
                                Motivo del Cambio *
                            </label>
                            <textarea
                                id="motivo"
                                name="motivo"
                                required
                                rows={3}
                                value={reassignData.motivo}
                                onChange={handleModalChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Escriba el motivo (Obligatorio para trazabilidad)"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !reassignData.newClinicId || !reassignData.motivo}
                            className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition ${
                                (isSubmitting || !reassignData.newClinicId || !reassignData.motivo) ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            {isSubmitting ? 'Guardando...' : 'Confirmar Cambio'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
// --- FIN DE COMPONENTES MODAL ---


export default function TriagePanel() {
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [loadingQueue, setLoadingQueue] = useState(true);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' }>({ message: '', type: 'info' });
    const router = useRouter();
    
    const { user, loading: authLoading } = useTriageAuth();

    // Estados de Modales
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
    const [selectedTurn, setSelectedTurn] = useState<QueueItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. Cargar Clínicas
    const fetchClinics = useCallback(async () => {
        try {
            // Simulación de API call para clínicas
            const mockClinics: Clinic[] = [
                { Id: 1, Nombre: 'Consulta General' },
                { Id: 2, Nombre: 'Odontología' },
                { Id: 3, Nombre: 'Pediatría' },
                { Id: 4, Nombre: 'Emergencias' },
                { Id: 5, Nombre: 'Triage/Enfermería' }, // Asumimos ID 5 para el área de Triage
            ];
            setClinics(mockClinics);
        } catch (error) {
             setNotification({ message: 'Error al cargar las clínicas.', type: 'error' });
        }
    }, []);

    // 2. Cargar la Cola (Simulación)
    const fetchQueue = useCallback(async () => {
        setLoadingQueue(true);
        try {
            // Simulación de API call para la cola de triage
            const mockQueue: QueueItem[] = [
                { Id: 101, NumeroTurno: 1, PacienteNombre: 'Ana', PacienteApellido: 'García', ClinicaId: 5, ClinicaNombre: 'Triage/Enfermería', Estado: 'esperando', FechaCreacion: new Date(Date.now() - 120000).toISOString() }, // 2 minutos de espera
                { Id: 102, NumeroTurno: 2, PacienteNombre: 'Luis', PacienteApellido: 'Martínez', ClinicaId: 5, ClinicaNombre: 'Triage/Enfermería', Estado: 'esperando', FechaCreacion: new Date(Date.now() - 360000).toISOString() }, // 6 minutos de espera
                { Id: 103, NumeroTurno: 3, PacienteNombre: 'Sofía', PacienteApellido: 'Pérez', ClinicaId: 1, ClinicaNombre: 'Consulta General', Estado: 'esperando', FechaCreacion: new Date(Date.now() - 60000).toISOString() },
            ];
            // Filtra solo los turnos que están en Triage y esperando.
            setQueue(mockQueue.filter(item => item.ClinicaId === 5 && item.Estado === 'esperando'));
        } catch (error) {
             setNotification({ message: 'Error al cargar la cola de espera.', type: 'error' });
        } finally {
            setLoadingQueue(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading && user) {
            fetchClinics();
            fetchQueue();
            // Refresco periódico para la cola
            const interval = setInterval(fetchQueue, 30000); 
            return () => clearInterval(interval);
        } else if (!authLoading && !user) {
            // router.push('/login'); // Simulación de redirección
            console.log("Usuario no autenticado, redirigiendo a login simulado.");
        }
    }, [user, authLoading, fetchQueue, fetchClinics, router]);


    // --- Handlers de NUEVO PACIENTE (Simulación de API POST /api/turnos/create) ---
    const handleNewPatientSubmit = async (data: { nombre: string; apellido: string; clinicaId: number }) => {
        setIsSubmitting(true);
        setNotification({ message: '', type: 'info' });
        try {
            // Simulación de registro exitoso y adición a la cola
            const newTurno: QueueItem = {
                Id: Date.now(), // ID único simulado
                NumeroTurno: queue.length + 1,
                PacienteNombre: data.nombre,
                PacienteApellido: data.apellido,
                ClinicaId: data.clinicaId,
                ClinicaNombre: clinics.find(c => c.Id === data.clinicaId)?.Nombre || 'Desconocida',
                Estado: 'esperando',
                FechaCreacion: new Date().toISOString()
            };

            // Simulación de latencia de red
            await new Promise(resolve => setTimeout(resolve, 500)); 

            setQueue(prevQueue => [...prevQueue, newTurno]);

            setNotification({ message: `Paciente ${data.nombre} registrado. Turno #${newTurno.NumeroTurno}.`, type: 'success' });
            setIsRegisterModalOpen(false);
        } catch (error) {
            setNotification({ message: 'Error al registrar el paciente.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Handlers de LLAMAR A SALA (Simulación de acción) ---
    const handleCallNext = (item: QueueItem) => {
        // En un sistema real, esto cambiaría el estado a 'en_sala' y actualizaría las pantallas
        setNotification({ message: `Llamando a ${item.PacienteNombre}.`, type: 'info' });

        // Simulación: remover de la cola de triage
        setQueue(prevQueue => prevQueue.filter(q => q.Id !== item.Id));
    }


    // --- Handlers de REASIGNACIÓN (Simulación de API POST /api/turnos/reassign) ---
    const openReassignModal = (turno: QueueItem) => {
        setSelectedTurn(turno);
        setIsReassignModalOpen(true);
    };

    const handleReassignSubmit = async (newClinicId: number, motivo: string) => {
        if (!selectedTurn || !user) return;
        
        setIsSubmitting(true);
        setNotification({ message: '', type: 'info' });

        try {
            // Simulación de latencia de red
            await new Promise(resolve => setTimeout(resolve, 500));

            // Simulación: el turno es reasignado, por lo tanto, sale de la cola de Triage
            setQueue(prevQueue => prevQueue.filter(q => q.Id !== selectedTurn.Id));
            
            const newClinicName = clinics.find(c => c.Id === newClinicId)?.Nombre || 'Nueva Clínica';
            
            setNotification({ message: `Turno ${selectedTurn.NumeroTurno} reasignado a ${newClinicName} por motivo: ${motivo}.`, type: 'success' });
            setIsReassignModalOpen(false);
        } catch (error) {
            setNotification({ message: 'Error de red. No se pudo reasignar.', type: 'error' });
        } finally {
            setIsSubmitting(false);
            setSelectedTurn(null);
        }
    };


    if (authLoading || loadingQueue) {
        return <div className="flex items-center justify-center min-h-screen text-lg font-semibold text-blue-600">Cargando Módulo de Triage...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col sm:flex-row justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-xl border-b-4 border-blue-500">
                    <h1 className="text-3xl font-extrabold text-blue-700 mb-4 sm:mb-0">
                        Módulo de Triage y Evaluación Inicial
                    </h1>
                    {/* ESTE ES EL BOTÓN DE CREACIÓN / REGISTRO que faltaba */}
                    <button
                        onClick={() => setIsRegisterModalOpen(true)}
                        className="flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition duration-150 transform hover:scale-105"
                    >
                        <span className="text-xl mr-2">📝</span> Nuevo Registro / Turno
                    </button>
                </header>

                <Notification message={notification.message} type={notification.type} />

                {/* Cola de Pacientes en Triage (ID 5) */}
                <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">
                        Pacientes en Espera de Triage ({queue.length})
                    </h2>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-blue-200">
                            <thead className="bg-blue-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-blue-600 uppercase">Turno #</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-blue-600 uppercase">Paciente</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-blue-600 uppercase">Clínica Asignada</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-blue-600 uppercase">Tiempo en Espera</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-blue-600 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {queue.map((item) => (
                                    <TurnoRow 
                                        key={item.Id} 
                                        item={item} 
                                        onCallNext={handleCallNext} // Usa el handler de Llamar
                                        onReassign={openReassignModal} // Usa el handler de Reasignar
                                    />
                                ))}
                                {queue.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center p-10 text-gray-500 italic">
                                            No hay pacientes en la cola de espera de Triage.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            {/* ------------------------- MODALES ------------------------- */}

            <NewPatientModal
                isOpen={isRegisterModalOpen}
                onClose={() => setIsRegisterModalOpen(false)}
                onSubmit={handleNewPatientSubmit}
                clinics={clinics}
                isSubmitting={isSubmitting}
            />

            <ReassignClinicModal
                isOpen={isReassignModalOpen}
                onClose={() => setIsReassignModalOpen(false)}
                onSubmit={handleReassignSubmit}
                turn={selectedTurn}
                clinics={clinics}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}

// Componente para la Fila de la Tabla
interface TurnoRowProps {
    item: QueueItem;
    onCallNext: (item: QueueItem) => void;
    onReassign: (item: QueueItem) => void;
}

const TurnoRow: React.FC<TurnoRowProps> = ({ item, onCallNext, onReassign }) => {
    
    // Función para calcular el tiempo en espera
    const calculateTimeInQueue = (creationDate: string) => {
        // En un entorno real, usarías un hook de useEffect para actualizar esto cada segundo
        const timeInQueue = new Date().getTime() - new Date(creationDate).getTime();
        const totalSeconds = Math.floor(timeInQueue / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return { minutes, seconds };
    };

    const { minutes, seconds } = calculateTimeInQueue(item.FechaCreacion);
    const timeString = `${minutes}m ${seconds}s`;
    // Marcar como urgente si lleva más de 5 minutos
    const isOverdue = minutes >= 5;

    return (
        <tr className="hover:bg-gray-50">
            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-indigo-600">
                {item.ClinicaNombre.substring(0, 3).toUpperCase()}-{item.NumeroTurno}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {item.PacienteNombre} {item.PacienteApellido}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {item.ClinicaNombre}
            </td>
            <td className={`px-4 py-3 whitespace-nowrap text-sm font-semibold ${isOverdue ? 'text-red-600 animate-pulse' : 'text-green-600'}`}>
                {timeString}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm space-x-2">
                {/* BOTÓN 1: LLAMAR A SALA (Acción de Asignación) */}
                <button 
                    onClick={() => onCallNext(item)}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-3 rounded-md shadow-sm transition duration-150 transform hover:scale-105"
                >
                    Llamar a Sala
                </button>
                 {/* BOTÓN 2: EDITAR / REASIGNAR (Acción de Reasignación) */}
                 <button 
                    onClick={() => onReassign(item)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold py-2 px-3 rounded-md shadow-sm transition duration-150"
                >
                    Reasignar
                </button>
            </td>
        </tr>
    );
};