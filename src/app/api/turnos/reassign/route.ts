import { NextResponse } from 'next/server';
import { QueueItem, ReassignmentLog } from '@/lib/types';

// NOTA: Para este ejemplo, dependemos de los mock data de /api/queue/triage/route.ts.
// En un sistema real, importarías un módulo de base de datos.

// Importar la cola simulada (Necesitas que esta línea sea dinámica o usar una DB)
// Para el ejemplo, simularemos la base de datos de turnos internamente.
let mockQueue: QueueItem[] = [
    // Simula los mismos datos de la cola para poder actualizar el estado en el backend simulado
    {
        Id: 101, NumeroTurno: '001', Estado: 'esperando', FechaCreacion: new Date().toISOString(),
        PacienteId: 1, PacienteNombre: 'Ana', PacienteApellido: 'García',
        ClinicaId: 5, ClinicaNombre: 'Triage/Enfermería'
    },
    {
        Id: 102, NumeroTurno: '002', Estado: 'esperando', FechaCreacion: new Date(Date.now() - 60000).toISOString(),
        PacienteId: 2, PacienteNombre: 'Luis', PacienteApellido: 'Pérez',
        ClinicaId: 5, ClinicaNombre: 'Triage/Enfermería'
    },
    // ... más datos simulados
];

// Simulamos los logs de reasignación
let mockReassignmentLogs: ReassignmentLog[] = [];

// Simulamos las clínicas (para lookup de nombre)
const mockClinics = [
    { Id: 1, Nombre: 'Medicina General', Especialidad: 'Consulta Primaria' },
    { Id: 2, Nombre: 'Pediatría', Especialidad: 'Atención Infantil' },
    { Id: 5, Nombre: 'Triage/Enfermería', Especialidad: 'Evaluación Inicial' },
];

/**
 * POST /api/turnos/reassign
 * Reasigna un turno a una nueva clínica.
 */
export async function POST(request: Request) {
    try {
        const { turnoId, newClinicId, motivo, usuarioId } = await request.json();

        // 1. Validaciones
        if (!turnoId || !newClinicId || !motivo || !usuarioId) {
            return NextResponse.json({ message: 'Faltan campos requeridos: turnoId, newClinicId, motivo, usuarioId.' }, { status: 400 });
        }

        // 2. Encontrar el turno actual (Simulación de DB)
        const turnoIndex = mockQueue.findIndex(t => t.Id === turnoId);
        if (turnoIndex === -1) {
            return NextResponse.json({ message: 'Turno no encontrado.' }, { status: 404 });
        }

        const currentTurn = mockQueue[turnoIndex];
        const oldClinicId = currentTurn.ClinicaId;

        if (oldClinicId === newClinicId) {
            return NextResponse.json({ message: 'La nueva clínica debe ser diferente a la clínica actual.' }, { status: 400 });
        }

        // 3. Obtener el nombre de la nueva clínica (Simulación de DB)
        const newClinic = mockClinics.find(c => c.Id === newClinicId);
        if (!newClinic) {
            return NextResponse.json({ message: 'Clínica de destino no válida.' }, { status: 404 });
        }
        
        // 4. Actualizar el Turno (Simulación de DB UPDATE)
        const updatedTurn: QueueItem = {
            ...currentTurn,
            ClinicaId: newClinicId,
            ClinicaNombre: newClinic.Nombre,
            Estado: 'esperando', // Vuelve al estado de espera en la nueva clínica
            // Opcional: Podrías cambiar el NumeroTurno si el sistema lo requiere.
        };
        mockQueue[turnoIndex] = updatedTurn;

        // 5. Registrar la Reasignación (Simulación de DB INSERT)
        const newLog: ReassignmentLog = {
            Id: mockReassignmentLogs.length + 1,
            TurnoId: turnoId,
            OldClinicId: oldClinicId,
            NewClinicId: newClinicId,
            Motivo: motivo,
            FechaReasignacion: new Date().toISOString(),
            UsuarioId: usuarioId,
        };
        mockReassignmentLogs.push(newLog);
        
        console.log(`Reasignación exitosa para turno ${currentTurn.NumeroTurno}: ${currentTurn.ClinicaNombre} -> ${newClinic.Nombre}`);

        // 6. Respuesta
        return NextResponse.json({ 
            message: `Turno ${currentTurn.NumeroTurno} reasignado correctamente a ${newClinic.Nombre}.`,
            log: newLog
        }, { status: 200 });

    } catch (error) {
        console.error('Error en la API de reasignación:', error);
        return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
    }
}