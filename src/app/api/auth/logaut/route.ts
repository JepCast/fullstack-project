import { NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * Elimina la cookie 'auth_token' para finalizar la sesión.
 */
export async function POST() {
    try {
        const response = NextResponse.json({ message: 'Sesión finalizada exitosamente.' });
        
        // Borrar la cookie al configurarla con una fecha de expiración pasada
        response.cookies.set('auth_token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            expires: new Date(0), // Establecer la fecha de expiración en el pasado
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('Error durante el logout:', error);
        return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
    }
}