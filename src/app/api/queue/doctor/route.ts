import { NextResponse } from 'next/server';
import sql from 'mssql';

// ⚙️ Configuración de la conexión
const dbConfig = {
  user: process.env.DB_USER || 'your_user',
  password: process.env.DB_PASSWORD || 'your_password',
  server: process.env.DB_SERVER || 'your_server',
  database: process.env.DB_NAME || 'TurnosDB',
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};


let poolPromise;
async function getConnection() {
  if (!poolPromise) {
    poolPromise = sql.connect(dbConfig);
  }
  return poolPromise;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get('doctorId');

  if (!doctorId) {
    return NextResponse.json(
      { message: 'Error: Se requiere el parámetro doctorId.' },
      { status: 400 }
    );
  }

  try {
    const pool = await getConnection();

    // 🔹 1. Buscar si el doctor tiene una clínica asignada en UsuariosClinicas
    const assignedClinic = await pool
      .request()
      .input('UsuarioId', sql.Int, parseInt(doctorId))
      .query(`
        SELECT TOP 1 UC.ClinicaId, C.Nombre AS ClinicaNombre
        FROM dbo.UsuariosClinicas UC
        INNER JOIN dbo.Clinicas C ON UC.ClinicaId = C.Id
        WHERE UC.UsuarioId = @UsuarioId;
      `);

    if (assignedClinic.recordset.length === 0) {
      return NextResponse.json(
        {
          message: 'Acceso denegado: el doctor no tiene ninguna clínica asignada.',
        },
        { status: 403 }
      );
    }

    const { ClinicaId, ClinicaNombre } = assignedClinic.recordset[0];

    // 🔹 2. Obtener la cola de pacientes pendientes para esa clínica
    const queueResult = await pool
      .request()
      .input('ClinicaId', sql.Int, ClinicaId)
      .query(`
        SELECT 
            T.Id AS TurnoId,
            P.Nombre AS PacienteNombre,
            P.Correo AS PacienteCorreo,
            T.FechaHoraInicio,
            T.Estado
        FROM dbo.Turnos T
        INNER JOIN dbo.Pacientes P ON T.PacienteId = P.Id
        WHERE 
            T.ClinicaId = @ClinicaId
            AND T.Estado = 'Pendiente'
        ORDER BY T.FechaHoraInicio ASC;
      `);

    // 🔹 3. Retornar respuesta clara
    return NextResponse.json({
      message: 'Cola obtenida exitosamente',
      clinica: {
        id: ClinicaId,
        nombre: ClinicaNombre
      },
      queue: queueResult.recordset
    });
  } catch (error) {
    console.error('❌ Error al obtener la cola del doctor:', error);
    return NextResponse.json(
      {
        message: 'Error interno del servidor al consultar la base de datos.',
        error: error.message
      },
      { status: 500 }
    );
  }
}