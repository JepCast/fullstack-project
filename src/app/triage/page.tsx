'use client';

import React, { useState, useEffect } from 'react';
import Notification from '@/components/Notification';
import { useRouter } from 'next/navigation';
import { Clinic, Turno } from '@/lib/types'; // Asumimos la existencia de types.ts

export default function TriagePage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dpi: '',
    clinicaId: '',
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' }>({ message: '', type: 'error' });
  const router = useRouter();

  // 1. Cargar Clínicas al iniciar
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const response = await fetch('/api/clinics');
        if (response.ok) {
          const data = await response.json();
          setClinics(data);
          if (data.length > 0) {
            setFormData(f => ({ ...f, clinicaId: data[0].Id.toString() })); // Seleccionar la primera por defecto
          }
        } else if (response.status === 401 || response.status === 403) {
            // No autorizado (token faltante o rol incorrecto) -> Redirigir al login
            router.push('/login');
        } else {
            const data = await response.json();
            setNotification({ message: data.message || 'Error al cargar clínicas.', type: 'error' });
        }
      } catch (error) {
        setNotification({ message: 'Error de conexión al obtener clínicas.', type: 'error' });
      }
    };
    fetchClinics();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateTurn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotification({ message: '', type: 'error' });

    try {
      const response = await fetch('/api/turnos/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            ...formData, 
            clinicaId: parseInt(formData.clinicaId) 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const turno: Turno = data.turno;
        setNotification({ 
            message: `Turno ${turno.NumeroTurno} asignado a ${clinics.find(c => c.Id === turno.ClinicaId)?.Nombre || 'Clínica Desconocida'}.`, 
            type: 'success' 
        });
        // Limpiar el formulario excepto la clínica seleccionada
        setFormData(f => ({ ...f, nombre: '', apellido: '', dpi: '' }));
      } else if (response.status === 401 || response.status === 403) {
            router.push('/login'); // Forzar re-login si el token falló
      } else {
        setNotification({ message: data.message || 'Fallo la asignación del turno.', type: 'error' });
      }
    } catch (error) {
      setNotification({ message: 'Error de red al intentar crear el turno.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!clinics.length && !notification.message.includes('Error')) {
    return <div className="flex items-center justify-center min-h-screen">Cargando clínicas...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-xl">
        <h1 className="text-3xl font-extrabold text-blue-800 mb-1">Módulo de Preclasificación (Triage)</h1>
        <p className="text-gray-500 mb-6">Registro de pacientes y asignación a clínica.</p>
        
        <Notification message={notification.message} type={notification.type} />

        <form onSubmit={handleCreateTurn} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Datos del Paciente */}
          <div className="md:col-span-2 border-b pb-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Datos del Paciente</h2>
          </div>
          
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre *</label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              required
              value={formData.nombre}
              onChange={handleChange}
              className="mt-1 block w-full border text-black border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nombre del paciente"
            />
          </div>
          <div>
            <label htmlFor="apellido" className="block text-sm font-medium text-gray-700">Apellido</label>
            <input
              id="apellido"
              name="apellido"
              type="text"
              value={formData.apellido}
              onChange={handleChange}
              className="mt-1 block w-full border text-black border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Apellido del paciente"
            />
          </div>
          <div>
            <label htmlFor="dpi" className="block text-sm font-medium text-gray-700">DPI/Identificación</label>
            <input
              id="dpi"
              name="dpi"
              type="text"
              value={formData.dpi}
              onChange={handleChange}
              className="mt-1 block w-full border text-black border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Documento de Identificación"
            />
          </div>
          
          {/* Asignación de Clínica */}
          <div className="md:col-span-2 border-b pt-2 pb-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Asignación de Clínica</h2>
          </div>
          
          <div className='md:col-span-2'>
            <label htmlFor="clinicaId" className="block text-sm font-medium text-gray-700">Clínica de Destino *</label>
            <select
              id="clinicaId"
              name="clinicaId"
              required
              value={formData.clinicaId}
              onChange={handleChange}
              className="mt-1 block w-full border text-black border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {clinics.map((clinic) => (
                <option key={clinic.Id} value={clinic.Id}>
                  {clinic.Nombre} ({clinic.Descripcion})
                </option>
              ))}
            </select>
            {clinics.length === 0 && (
                <p className="text-sm text-red-500 mt-2">No se encontraron clínicas. Contacte al administrador.</p>
            )}
          </div>

          <div className="md:col-span-2 pt-4">
            <button
              type="submit"
              disabled={loading || !formData.clinicaId || !formData.nombre}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-lg font-bold text-white transition duration-200 transform hover:scale-[1.01] ${
                loading || !formData.clinicaId || !formData.nombre
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50'
              }`}
            >
              {loading ? 'Asignando Turno...' : 'Registrar Paciente y Asignar Turno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}