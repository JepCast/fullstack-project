// src/app/api/turnos/create/route.ts
import { NextResponse } from 'next/server';
import { QueueItem } from '@/lib/types';
import { mockQueue, mockClinics } from '@/lib/mockData'; // Asumimos que la data simulada se mueve a un archivo compartido

// NOTA: En un sistema real, esta función usaría `mssql` para insertar en dbo.Pacientes y dbo.Turnos.

/**
 * POST /api/turnos/create
 * Registra un nuevo paciente y genera un turno inicial.
 */
export async function POST(request: Request) {
    try {
        const { nombre, apellido, clinicaId } = await request.json();

        // 1. Validaciones
        if (!nombre || !apellido || !clinicaId) {
            return NextResponse.json({ message: 'Faltan campos requeridos: nombre, apellido, clinicaId.' }, { status: 400 });
        }
        
        // 2. Simulación de encontrar la clínica (ID 5 es Triage)
        const clinic = mockClinics.find(c => c.Id === clinicaId);
        if (!clinic) {
            return NextResponse.json({ message: 'Clínica de destino no válida.' }, { status: 404 });
        }

        // 3. Simulación de creación de Paciente y Turno (DB INSERT)
        // Se genera un nuevo ID y número de turno
        const newTurnId = mockQueue.length > 0 ? Math.max(...mockQueue.map(t => t.Id)) + 1 : 1000;
        const newPatientId = newTurnId; // Usamos el mismo ID para simulación
        const newTurnNumber = String(newTurnId).slice(-3); // Ej: 001, 002...

        const newTurn: QueueItem = {
            Id: newTurnId,
            NumeroTurno: newTurnNumber,
            Estado: 'esperando',
            FechaCreacion: new Date().toISOString(),
            
            PacienteId: newPatientId,
            PacienteNombre: nombre,
            PacienteApellido: apellido,
            
            ClinicaId: clinicaId,
            ClinicaNombre: clinic.Nombre,
        };
        
        // Agregar el nuevo turno a la cola simulada (Necesitas manejar esto a nivel de aplicación)
        mockQueue.push(newTurn);
        
        console.log(`Nuevo paciente registrado: ${nombre}, Turno #${newTurnNumber} en ${clinic.Nombre}`);

        // 4. Respuesta
        return NextResponse.json({ 
            message: 'Turno creado exitosamente.',
            ...newTurn
        }, { status: 200 });

    } catch (error) {
        console.error('Error en la API de creación de turno:', error);
        return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
    }
}

// **NOTA IMPORTANTE:** Para que los archivos de API y el panel funcionen juntos,
// las variables de datos simulados (mockQueue y mockClinics) DEBEN estar centralizadas.
// Aquí se incluyen las simulaciones necesarias:

export const mockClinics: Clinic[] = [
    { Id: 1, Nombre: 'Medicina General', Especialidad: 'Consulta Primaria' },
    { Id: 2, Nombre: 'Pediatría', Especialidad: 'Atención Infantil' },
    { Id: 3, Nombre: 'Odontología', Especialidad: 'Salud Dental' },
    { Id: 4, Nombre: 'Ginecología', Especialidad: 'Salud Femenina' },
    { Id: 5, Nombre: 'Triage/Enfermería', Especialidad: 'Evaluación Inicial' },
];

export let mockQueue: QueueItem[] = [
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
    {
        Id: 103, NumeroTurno: '003', Estado: 'en_atencion', FechaCreacion: new Date(Date.now() - 120000).toISOString(),
        PacienteId: 3, PacienteNombre: 'Maria', PacienteApellido: 'López',
        ClinicaId: 1, ClinicaNombre: 'Medicina General'
    },
];