import { connectDB } from '@/lib/db';
import { withAuth } from '@/lib/auth';
import { NextResponse, NextRequest } from 'next/server';
import { NextApiResponseWithSocket, initSocketServer } from '@/lib/socket';
import sql from 'mssql';

// Solo médicos pueden controlar el flujo de turnos
const allowedRoles = ['medico'] as const;

/**
 * POST /api/turnos/control
 * Actualiza el estado de un turno y notifica por Socket.io.
 */
export async function POST(req: NextRequest, res: NextApiResponseWithSocket) {
    // 1. Verificar autenticación y rol
    const authError = await withAuth(allowedRoles)(req);
    if (authError) return authError;
    
    // Obtener el ID del médico que está operando (del JWT)
    const medicoId = (req as any).user.id;
    
    try {
        const { turnoId, action } = await req.json();

        if (!turnoId || !action) {
            return NextResponse.json({ message: 'Faltan turnoId o action.' }, { status: 400 });
        }

        const pool = await connectDB();
        let newState: 'llamado' | 'en_atencion' | 'finalizado' | 'ausente';
        let logMessage: string;

        switch (action) {
            case 'call':
                newState = 'llamado';
                logMessage = 'Turno llamado por el médico.';
                break;
            case 'attend':
                newState = 'en_atencion';
                logMessage = 'Paciente ha sido tomado para atención.';
                break;
            case 'finish':
                newState = 'finalizado';
                logMessage = 'Atención médica finalizada.';
                break;
            case 'miss':
                newState = 'ausente';
                logMessage = 'Paciente se ha ausentado.';
                break;
            default:
                return NextResponse.json({ message: 'Acción inválida.' }, { status: 400 });
        }

        // 2. Actualizar el estado del turno y obtener datos clave
        const result = await pool.request()
            .input('TurnoId', sql.Int, turnoId)
            .input('MedicoId', sql.Int, medicoId)
            .input('NewState', sql.NVarChar, newState)
            .query(`
                UPDATE dbo.Turnos
                SET Estado = @NewState,
                    FechaActualizacion = GETDATE()
                OUTPUT INSERTED.Id, INSERTED.ClinicaId, INSERTED.NumeroTurno, INSERTED.Estado
                WHERE Id = @TurnoId;
                
                -- Opcional: Registrar la acción en TurnLogs (si existiera una columna de log)
                -- Por simplicidad, omitimos el log explícito aquí.
            `);

        if (result.recordset.length === 0) {
            return NextResponse.json({ message: 'Turno no encontrado.' }, { status: 404 });
        }

        const updatedTurno = result.recordset[0];

        // 3. Notificación en Tiempo Real (Socket.io)
        // Intentar inicializar Socket.io si no lo está (usando el workaround de Next.js)
        const io = initSocketServer(res);
        
        // Emitir un evento global y específico para la clínica
        io.emit('turno_updated', {
            id: updatedTurno.Id,
            clinicaId: updatedTurno.ClinicaId,
            numeroTurno: updatedTurno.NumeroTurno,
            estado: updatedTurno.Estado,
            action: action
        });
        
        // Emitir a la sala de la clínica
        io.to(`clinic-${updatedTurno.ClinicaId}`).emit('clinic_update', {
            id: updatedTurno.Id,
            estado: updatedTurno.Estado
        });


        return NextResponse.json({ 
            message: `Turno ${updatedTurno.NumeroTurno} actualizado a '${newState}'.`,
            turno: updatedTurno
        });

    } catch (error) {
        console.error('Error al controlar turno:', error);
        return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
    }
}