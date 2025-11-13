import { NextRequest, NextResponse } from 'next/server';
import { NextApiResponseWithSocket, initSocketServer } from '@/lib/socket';

/**
 * Este endpoint maneja la inicialización del servidor Socket.io en el entorno de Next.js.
 * Debe ser manejado por el API Handler de Pages Router, pero en App Router se adapta así:
 * Nota: El Cliente de Socket.io se conectará a /api/socket, y esta función asegura que el servidor esté listo.
 */
export async function GET(req: NextRequest, res: NextApiResponseWithSocket) {
    if (res && res.socket && res.socket.server) {
        initSocketServer(res);
        // Devolvemos una respuesta vacía, la conexión de socket ocurre en segundo plano
        return new NextResponse(null, { status: 200 });
    }
    
    // Esto no debería suceder en un entorno de Next.js bien configurado
    return NextResponse.json({ message: 'Error al inicializar socket.io.' }, { status: 500 });
}