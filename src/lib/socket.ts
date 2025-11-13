import { Server as IOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { NextApiResponse } from 'next';

// Exportamos un tipo para facilitar el manejo en Next.js
export type NextApiResponseWithSocket = NextApiResponse & {
    socket: {
        server: HttpServer & {
            io?: IOServer;
        };
    };
};

// Esta función inicializa el servidor Socket.io si aún no existe
export const initSocketServer = (res: NextApiResponseWithSocket): IOServer => {
    // Si la instancia ya existe, la devolvemos.
    if (res.socket.server.io) {
        return res.socket.server.io;
    }

    console.log('Inicializando Socket.io Server...');
    
    // Crear la instancia de Socket.io adjunta al servidor HTTP
    const io = new IOServer(res.socket.server, {
        path: '/api/socket', // Ruta para la conexión del cliente
        addTrailingSlash: false,
    });

    // Manejador de conexión de Socket
    io.on('connection', (socket: Socket) => {
        console.log(`Cliente conectado: ${socket.id}`);
        
        // Unirse a una sala (se podría usar para salas específicas por clínica)
        socket.on('join_clinic', (clinicId: number) => {
            socket.join(`clinic-${clinicId}`);
            console.log(`Cliente ${socket.id} unido a sala clinic-${clinicId}`);
        });

        socket.on('disconnect', () => {
            console.log(`Cliente desconectado: ${socket.id}`);
        });
    });

    // Guardar la instancia para reutilizarla
    res.socket.server.io = io;
    return io;
};