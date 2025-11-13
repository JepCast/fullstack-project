// src/lib/auth.ts
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { connectDB } from './db';
import sql from 'mssql';

// Definición de tipos
type UserRole = 'admin' | 'recepcion' | 'enfermero' | 'medico';

export interface UserPayload {
    id: number;
    correo: string;
    rol: UserRole;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_must_be_changed';
const SALT_ROUNDS = 10;

/**
 * Hashea una contraseña usando bcrypt.
 * @param password La contraseña en texto plano.
 * @returns El hash de la contraseña.
 */
export const hashPassword = (password: string): Promise<string> => {
    return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compara una contraseña con su hash.
 * @param password La contraseña en texto plano.
 * @param hash El hash almacenado.
 * @returns True si coinciden, False en caso contrario.
 */
export const comparePassword = (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
};

/**
 * Genera un JSON Web Token (JWT) para el usuario.
 * @param payload Datos del usuario a incluir en el token.
 * @returns El JWT firmado.
 */
export const generateToken = (payload: UserPayload): string => {
    // El token expira en 8 horas, suficiente para una jornada laboral
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
};

/**
 * Verifica un JWT y retorna el payload si es válido.
 * @param token El JWT.
 * @returns El payload del usuario o null si es inválido.
 */
export const verifyToken = (token: string): UserPayload | null => {
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        return payload as UserPayload;
    } catch (error) {
        return null;
    }
};

/**
 * Middleware para validar la autenticación y el rol del usuario desde un token en las cookies.
 * @param roles Array de roles permitidos.
 */
export const withAuth = (roles: UserRole[]) => async (req: Request) => {
    // Extraer el token de la cookie (asume que el cliente lo envía en una cookie llamada 'auth_token')
    const token = req.headers.get('Cookie')?.split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

    if (!token) {
        return new Response(JSON.stringify({ message: 'Acceso denegado. No hay token.' }), { status: 401 });
    }

    const payload = verifyToken(token);

    if (!payload) {
        return new Response(JSON.stringify({ message: 'Token inválido o expirado.' }), { status: 401 });
    }

    // Verificar el rol
    if (!roles.includes(payload.rol)) {
        return new Response(JSON.stringify({ message: `Permiso denegado. Rol '${payload.rol}' no autorizado.` }), { status: 403 });
    }

    // Adjuntar el payload del usuario al objeto de la solicitud para uso posterior
    (req as any).user = payload;
    
    return null; // Indica éxito, el handler de la API puede continuar
};

/**
 * Función para buscar el RolId basado en el nombre del rol.
 * @param roleName Nombre del rol ('admin', 'medico', etc.)
 * @returns El Id del Rol o null si no se encuentra.
 */
export async function getRoleId(roleName: UserRole): Promise<number | null> {
    try {
        const pool = await connectDB();
        const result = await pool.request()
            .input('Name', sql.NVarChar, roleName)
            .query('SELECT Id FROM dbo.Roles WHERE Name = @Name');
        
        if (result.recordset.length > 0) {
            return result.recordset[0].Id;
        }
        return null;
    } catch (error) {
        console.error("Error al obtener RolId:", error);
        return null;
    }
}

/**
 * Función para buscar el nombre del rol basado en el RolId.
 * @param roleId ID del Rol.
 * @returns El nombre del rol o null si no se encuentra.
 */
export async function getRoleName(roleId: number): Promise<UserRole | null> {
    try {
        const pool = await connectDB();
        const result = await pool.request()
            .input('Id', sql.Int, roleId)
            .query('SELECT Name FROM dbo.Roles WHERE Id = @Id');
        
        if (result.recordset.length > 0) {
            return result.recordset[0].Name as UserRole;
        }
        return null;
    } catch (error) {
        console.error("Error al obtener el nombre del Rol:", error);
        return null;
    }
}