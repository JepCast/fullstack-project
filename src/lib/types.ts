export interface Clinic {
    Id: number;
    Nombre: string;
    Descripcion: string;
}

export interface Turno {
    Id: number;
    PacienteId: number;
    ClinicaId: number;
    NumeroTurno: number; // El número consecutivo en la cola
    Estado: 'esperando' | 'llamado' | 'en_atencion' | 'finalizado' | 'ausente';
    Prioridad: number;
    FechaAsignacion: Date;
}

export interface Patient {
    Id: number;
    DPI: string | null;
    Nombre: string;
    Apellido: string | null;
    // ... otros campos
}

export interface QueueItem extends Turno {
    PacienteNombre: string;
    PacienteApellido: string;
    ClinicaNombre: string;
}