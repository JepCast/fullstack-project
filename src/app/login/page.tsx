'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Notification from '@/components/Notification';
import { UserPayload } from '@/lib/auth';

export default function LoginPage() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' }>({ message: '', type: 'error' });
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotification({ message: '', type: 'error' });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correo, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setNotification({ message: 'Inicio de sesión exitoso. Redirigiendo...', type: 'success' });
        // Simular un pequeño retraso para que el usuario vea el mensaje de éxito
        setTimeout(() => {
          const userRole: UserPayload['rol'] = data.user.rol;
          
          // Redireccionamiento basado en el Rol (Triaje/Recepcion es el primer módulo)
          switch (userRole) {
            case 'admin':
              router.push('/admin'); 
              break;
            case 'recepcion':
            case 'enfermero':
              router.push('/triage'); // Módulo principal de registro de turnos
              break;
            case 'medico':
              router.push('/doctor'); // Panel médico
              break;
            default:
              router.push('/'); // Fallback
          }
        }, 1000);
      } else {
        setNotification({ message: data.message || 'Error de credenciales.', type: 'error' });
      }
    } catch (error) {
      console.log(error)
      setNotification({ message: 'No se pudo conectar con el servidor.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl border border-gray-100">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 text-center">
          Sistema de Turnos <span className="text-blue-600">Hospitalario</span>
        </h1>
        <p className="text-center text-gray-500 mb-6">Acceso para Personal Médico y Administrativo</p>
        
        <Notification message={notification.message} type={notification.type} />

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="correo" className="block text-sm font-medium text-gray-700">
              Correo Electrónico
            </label>
            <input
              id="correo"
              type="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border text-gray-600 border-gray-300 rounded-md shadow-sm placeholder-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
              placeholder="ejemplo@hospital.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border text-gray-600 border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition duration-200 ${
              loading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}