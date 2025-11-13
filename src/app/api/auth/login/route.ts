// src/app/api/auth/login/route.ts
import { connectDB } from '@/lib/db';
import { comparePassword, generateToken, getRoleName, UserPayload } from '@/lib/auth';
import sql from 'mssql';
import { NextResponse } from 'next/server';

/**
 * Maneja la solicitud de inicio de sesión (Login).
 * Recibe correo y contraseña, verifica credenciales y emite un JWT.
 */
export async function POST(request: Request) {
    try {
        const { correo, password } = await request.json();

        if (!correo || !password) {
            return NextResponse.json({ message: 'Faltan correo o contraseña' }, { status: 400 });
        }

        const pool = await connectDB();
        
        // 1. Buscar el usuario por correo
        const userResult = await pool.request()
            .input('Correo', sql.NVarChar, correo)
            .query(`
                SELECT u.Id, u.PasswordHash, u.RolId, u.Activo, r.Name as RoleName
                FROM dbo.Usuarios u
                JOIN dbo.Roles r ON u.RolId = r.Id
                WHERE u.Correo = @Correo AND u.Activo = 1
            `);

        const userRecord = userResult.recordset[0];

        if (!userRecord || !userRecord.PasswordHash) {
            // Usar un mensaje genérico para no dar pistas sobre si existe el usuario
            return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
        }

        // 2. Comparar la contraseña con el hash
        const isMatch = await comparePassword(password, userRecord.PasswordHash);

        if (!isMatch) {
            return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
        }

        // 3. Generar el JWT
        const payload: UserPayload = {
            id: userRecord.Id,
            correo: correo,
            rol: userRecord.RoleName as UserPayload['rol'],
        };
        const token = generateToken(payload);

        // 4. Devolver la respuesta con el token en una cookie HTTP-Only
        const response = NextResponse.json({ 
            message: 'Inicio de sesión exitoso', 
            user: { id: payload.id, correo: payload.correo, rol: payload.rol }
        });
        
        // Configuración de la cookie: HTTP-Only y Secure son CRUCIALES para JWT
        response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Solo Secure en producción
            maxAge: 60 * 60 * 8, // 8 horas
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('Error en el login:', error);
        return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
    }
}