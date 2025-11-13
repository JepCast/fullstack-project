import { connectDB } from '@/lib/db';
import { withAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import sql from 'mssql';

// Roles que pueden acceder a la lista de clínicas:
// Triaje y Médicos para asignar, Admin para gestionar.
const allowedRoles = ['admin', 'recepcion', 'enfermero', 'medico'] as const;

/**
 * GET /api/clinics
 * Obtiene la lista de clínicas activas.
 */
export async function GET(request: Request) {
    // 1. Verificar autenticación y rol
    const authError = await withAuth(allowedRoles)(request);
    if (authError) return authError;
    
    try {
        const pool = await connectDB();
        
        const result = await pool.request()
            .query(`
                SELECT Id, Nombre, Descripcion 
                FROM dbo.Clinicas 
                WHERE Activo = 1 
                ORDER BY Nombre ASC
            `);

        return NextResponse.json(result.recordset);

    } catch (error) {
        console.error('Error al obtener clínicas:', error);
        return NextResponse.json({ message: 'Error interno al obtener las clínicas.' }, { status: 500 });
    }
}