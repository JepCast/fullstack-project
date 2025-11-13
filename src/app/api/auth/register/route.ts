import { connectDB } from '@/lib/db';
    import { hashPassword, getRoleId } from '@/lib/auth';
    import sql from 'mssql';
    import { NextResponse } from 'next/server';

    /**
     * POST /api/auth/register
     * RUTA TEMPORAL DE PRUEBA: Permite registrar un usuario admin para inicializar el sistema.
     * DEBE SER ELIMINADA O PROTEGIDA ANTES DE PRODUCCIÓN.
     */
    export async function POST(request: Request) {
        try {
            const { nombre, correo, password, roleName = 'admin' } = await request.json();

            if (!nombre || !correo || !password) {
                return NextResponse.json({ message: 'Faltan campos obligatorios' }, { status: 400 });
            }

            const pool = await connectDB();
            
            // 1. Obtener el ID del rol
            const rolId = await getRoleId(roleName as any);
            if (!rolId) {
                return NextResponse.json({ message: `Rol '${roleName}' no encontrado en la base de datos.` }, { status: 404 });
            }

            // 2. Hashear la contraseña de forma segura
            const passwordHash = await hashPassword(password);
            
            // 3. Insertar el usuario
            const insertResult = await pool.request()
                .input('Nombre', sql.NVarChar, nombre)
                .input('Correo', sql.NVarChar, correo)
                .input('PasswordHash', sql.NVarChar, passwordHash)
                .input('RolId', sql.Int, rolId)
                .query(`
                    INSERT INTO dbo.Usuarios (Nombre, Correo, PasswordHash, RolId)
                    OUTPUT INSERTED.Id
                    VALUES (@Nombre, @Correo, @PasswordHash, @RolId)
                `);
            
            const newUserId = insertResult.recordset[0].Id;

            return NextResponse.json({ 
                message: `Usuario '${nombre}' registrado exitosamente con ID ${newUserId} y Rol: ${roleName}.`,
                userId: newUserId,
                correo: correo
            }, { status: 201 });

        } catch (error) {
            console.error('Error en el registro temporal:', error);
            // Error code 2627: Unique constraint violation (correo ya existe)
            if (error instanceof Error && (error as any).code === 'EREQUEST' && error.message.includes('2627')) {
                 return NextResponse.json({ message: 'El correo electrónico ya está registrado.' }, { status: 409 });
            }
            return NextResponse.json({ message: 'Error interno del servidor al registrar.' }, { status: 500 });
        }
    }