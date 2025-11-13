// src/lib/db.ts
import sql from 'mssql';

// Obtener la URL de conexión del archivo .env.local
const config: sql.config = {
    user: process.env.SQL_SERVER_USER,
    password: process.env.SQL_SERVER_PASSWORD,
    server: process.env.SQL_SERVER_HOST as string,
    database: process.env.SQL_SERVER_DATABASE,
    port: process.env.SQL_SERVER_PORT ? parseInt(process.env.SQL_SERVER_PORT) : 1433,
    options: {
        encrypt: true, // Para Azure SQL Database
        trustServerCertificate: true // Necesario si no tienes certificado (para desarrollo local)
    }
};

let pool: sql.ConnectionPool | undefined;

export async function connectDB(): Promise<sql.ConnectionPool> {
    if (pool && pool.connected) {
        return pool;
    }
    
    try {
        pool = await sql.connect(config);
        console.log('Conexión a SQL Server establecida.');
        return pool;
    } catch (err) {
        console.error('Error al conectar a SQL Server:', err);
        throw new Error('Database connection failed');
    }
}