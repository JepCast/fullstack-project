import { QueueItem, Clinic, ReassignmentLog } from './types';

// Definición de Clínicas
export const mockClinics: Clinic[] = [
    { Id: 1, Nombre: 'Medicina General', Especialidad: 'Consulta Primaria' },
    { Id: 2, Nombre: 'Pediatría', Especialidad: 'Atención Infantil' },
    { Id: 3, Nombre: 'Odontología', Especialidad: 'Salud Dental' },
    { Id: 4, Nombre: 'Ginecología', Especialidad: 'Salud Femenina' },
    { Id: 5, Nombre: 'Triage/Enfermería', Especialidad: 'Evaluación Inicial' },
];

// Cola de Turnos (Debe ser `let` para permitir modificaciones por las APIs POST)
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

// Logs de Reasignación (vacío al inicio)
export let mockReassignmentLogs: ReassignmentLog[] = [];

// Función auxiliar para generar números de turno secuenciales
export const generateNewTurnNumber = (): string => {
    // Busca el ID más alto y le suma 1 para el nuevo ID
    const maxId = mockQueue.length > 0 ? Math.max(...mockQueue.map(t => t.Id)) : 100;
    const newId = maxId + 1;
    // Formatea el ID a 3 dígitos (ej: 104 -> '104')
    return String(newId).padStart(3, '0');
}