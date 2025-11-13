import { connectDB } from '@/lib/db';
import { withAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import sql from 'mssql';

// Solo el personal de recepción o enfermeros/triage pueden asignar turnos
const allowedRoles = ['recepcion', 'enfermero'] as const;

/**
 * POST /api/turnos/new
 * Recibe datos del paciente y ClinicaId. 
 * Llama a sp_CreateTurn para registrar el paciente y crear el turno de forma segura.
 * * NOTA: Aquí asumimos que el paciente es registrado si no tiene DPI, 
 * o se busca si ya existe (para simplificar, siempre creamos uno nuevo aquí).
 */
export async function POST(request: Request) {
    // 1. Verificar autenticación y rol
    const authError = await withAuth(allowedRoles)(request);
    if (authError) return authError;
    
    // Obtener el ID del usuario que está asignando el turno (del JWT)
    const assignedByUsuarioId = (request as any).user.id;

    try {
        const { nombre, apellido, dpi, clinicaId } = await request.json();

        if (!nombre || !clinicaId) {
            return NextResponse.json({ message: 'Faltan datos obligatorios (nombre, clínica).' }, { status: 400 });
        }
        
        const pool = await connectDB();
        let pacienteId: number;

        // --- INICIO DE LÓGICA DE REGISTRO DE PACIENTE ---
        // Para simplificar y acelerar: Si el DPI no existe, lo registramos. Si ya existe, lo usamos.
        let pacienteResult = await pool.request()
            .input('DPI', sql.NVarChar, dpi || null)
            .query('SELECT Id FROM dbo.Pacientes WHERE DPI = @DPI');

        if (pacienteResult.recordset.length > 0) {
            // El paciente ya existe, usamos su ID
            pacienteId = pacienteResult.recordset[0].Id;
        } else {
            // El paciente no existe, lo registramos
            const insertPacienteResult = await pool.request()
                .input('DPI', sql.NVarChar, dpi || null)
                .input('Nombre', sql.NVarChar, nombre)
                .input('Apellido', sql.NVarChar, apellido || null)
                .query(`
                    INSERT INTO dbo.Pacientes (DPI, Nombre, Apellido)
                    OUTPUT INSERTED.Id
                    VALUES (@DPI, @Nombre, @Apellido)
                `);
            pacienteId = insertPacienteResult.recordset[0].Id;
        }
        // --- FIN DE LÓGICA DE REGISTRO DE PACIENTE ---

        // 2. Llamar al Procedimiento Almacenado para crear el Turno
        const turnoResult = await pool.request()
            .input('PacienteId', sql.Int, pacienteId)
            .input('ClinicaId', sql.Int, clinicaId)
            .input('AssignedByUsuarioId', sql.Int, assignedByUsuarioId)
            .input('Prioridad', sql.TinyInt, 0) // Asumimos prioridad normal por ahora
            .execute('sp_CreateTurn');
        
        const newTurno = turnoResult.recordset[0];

        if (newTurno) {
            // NOTA: La notificación por WebSocket (Socket.io) se agrega en el Paso 7 (Día 3).
            // Por ahora, solo confirmamos la creación.

            return NextResponse.json({ 
                message: 'Turno asignado exitosamente.', 
                turno: newTurno,
                pacienteId: pacienteId
            });
        }

        return NextResponse.json({ message: 'Error al crear el turno.' }, { status: 500 });

    } catch (error) {
        console.error('Error al asignar turno:', error);
        return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
    }
}