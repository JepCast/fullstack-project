import { connectDB } from '@/lib/db';
import { withAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { QueueItem } from '@/lib/types';
import sql from 'mssql';

// Roles que pueden ver la cola de espera: Triage, Recepción, Administradores.
const allowedRoles = ['admin', 'recepcion', 'enfermero'] as const;

/**
 * GET /api/queue/triage
 * Obtiene la lista de turnos en estado 'esperando', ordenados por ClinicaId y NumeroTurno.
 */
export async function GET(request: Request) {
    // 1. Verificar autenticación y rol
    const authError = await withAuth(allowedRoles)(request);
    if (authError) return authError;
    
    try {
        const pool = await connectDB();
        
        const result = await pool.request()
            .query(`
                SELECT
                    t.Id,
                    t.PacienteId,
                    t.ClinicaId,
                    t.NumeroTurno,
                    t.Estado,
                    t.Prioridad,
                    t.FechaAsignacion,
                    p.Nombre AS PacienteNombre,
                    p.Apellido AS PacienteApellido,
                    c.Nombre AS ClinicaNombre
                FROM dbo.Turnos t
                INNER JOIN dbo.Pacientes p ON t.PacienteId = p.Id
                INNER JOIN dbo.Clinicas c ON t.ClinicaId = c.Id
                WHERE t.Estado = 'esperando'
                ORDER BY t.ClinicaId ASC, t.Prioridad DESC, t.NumeroTurno ASC
            `);

        // Mapear los resultados para asegurar la estructura de QueueItem
        const queue: QueueItem[] = result.recordset.map((record) => ({
            Id: record.Id,
            PacienteId: record.PacienteId,
            ClinicaId: record.ClinicaId,
            NumeroTurno: record.NumeroTurno,
            Estado: record.Estado,
            Prioridad: record.Prioridad,
            FechaAsignacion: record.FechaAsignacion,
            PacienteNombre: record.PacienteNombre,
            PacienteApellido: record.PacienteApellido,
            ClinicaNombre: record.ClinicaNombre
        }));

        return NextResponse.json(queue);

    } catch (error) {
        console.error('Error al obtener la cola de triage:', error);
        return NextResponse.json({ message: 'Error interno al obtener la cola.' }, { status: 500 });
    }
}