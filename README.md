# 🏥 DoctorQueue — Sistema de Gestión de Citas y Colas Médicas

Bienvenido a **DoctorQueue**, una aplicación web moderna y completamente funcional diseñada para **optimizar la gestión de colas y citas en clínicas y consultorios médicos**.

Este sistema Full-Stack combina tecnologías de vanguardia para ofrecer una experiencia **rápida, en tiempo real y fluida** tanto para pacientes como para el personal médico.

---

## 🚀 Tecnologías Utilizadas

| **Componente** | **Tecnología** | **Descripción** |
|-----------------|----------------|-----------------|
| **Frontend** | [Next.js (React)](https://nextjs.org/) | Framework moderno para el desarrollo de interfaces de usuario dinámicas. |
| **Backend (API)** | [Next.js API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) | Manejo de solicitudes y lógica del servidor directamente en Next.js. |
| **Tiempo Real** | [Socket.IO](https://socket.io/) | Comunicación bidireccional en tiempo real para actualizar colas instantáneamente. |
| **Base de Datos** | [SQL Server](https://www.microsoft.com/sql-server) | Almacenamiento relacional y persistente para usuarios, clínicas y citas. |
| **Estilos** | [Tailwind CSS](https://tailwindcss.com/) | Utilidades CSS para un diseño moderno, responsive y rápido. |
| **Persistencia / Auth** | [Firebase Auth / Firestore](https://firebase.google.com/) | Autenticación y persistencia segura de usuarios. |

---

## ✨ Características Principales

### 🧍 Panel de Pacientes (Público)
- **Registro Rápido de Citas:** Los pacientes pueden generar un turno fácilmente ingresando sus datos.  
- **Cola en Tiempo Real:** Visualización del estado actual de la cola (número atendido, pacientes restantes).  
- **Interfaz Intuitiva:** Diseño limpio, minimalista y totalmente adaptable a dispositivos móviles.

### 👨‍⚕️ Panel de Médicos / Administración (Privado)
- **Login Seguro:** Acceso restringido al personal médico y administrativo (`doctor@local.test`, `admin@local.test`).  
- **Gestión de Cola:** Control completo sobre la atención: *Llamar, Atender, Finalizar o Marcar Ausente.*  
- **Detalles del Paciente:** Visualización clara de la información del paciente en turno.  
- **Asignación por Clínica:** Cada médico solo visualiza y gestiona la cola de su clínica asignada.

---

## 🧩 Estructura del Proyecto

```
src/
├── app/
│   ├── api/               # Rutas API (lógica del backend)
│   ├── doctor/            # Panel del médico
│   ├── patient/           # Panel del paciente
│   └── page.tsx           # Página principal
├── components/            # Componentes reutilizables (QueueDisplay, AuthForm, etc.)
├── context/               # Contextos globales (AuthContext, SocketContext)
├── lib/                   # Librerías y utilidades (SQL, Socket.IO, helpers)
└── styles/                # Configuración de Tailwind y estilos globales
```

---

## ⚙️ Configuración y Ejecución Local

### 🧾 Prerrequisitos
- [Node.js](https://nodejs.org/) (v18+)
- [SQL Server](https://www.microsoft.com/sql-server)
- Gestor de dependencias (`npm` o `yarn`)

### 1️⃣ Clonar el Repositorio
```bash
git clone [URL-DE-TU-REPOSITORIO]
cd doctor-queue
```

### 2️⃣ Instalar Dependencias
```bash
npm install
# o
yarn install
```

### 3️⃣ Configurar la Base de Datos
Asegúrate de tener una instancia de **SQL Server** corriendo con las tablas:

- `Usuarios`
- `Clinicas`
- `UsuariosClinicas`

👉 Incluye al menos un doctor asignado a una clínica para las pruebas iniciales.

### 4️⃣ Variables de Entorno
Crea un archivo **.env.local** en la raíz del proyecto con tus credenciales:

```bash
# Ejemplo de conexión a SQL Server
SQL_USER="tu_usuario"
SQL_PASSWORD="tu_password"
SQL_SERVER="localhost"
SQL_DATABASE="nombre_de_tu_db"
```

### 5️⃣ Ejecutar la Aplicación
```bash
npm run dev
# o
yarn dev
```

📍 La aplicación estará disponible en: **http://localhost:3000**

---

## 🔑 Cuentas de Prueba

| **Usuario** | **Contraseña** | **Rol** | **Ruta de Acceso** |
|--------------|----------------|----------|--------------------|
| doctor@local.test | medic123 | Médico | `/doctor` |
| admin@local.test | admin123 | Administrador | `/admin` |
| Paciente (público) | N/A | Visitante | `/` |

---

## 🤝 Contribuciones

Las contribuciones, reportes de errores y sugerencias son **bienvenidas**.  
Crea un **Issue** o envía un **Pull Request** para colaborar con el proyecto.

---

## 🪪 Licencia

Este proyecto está bajo la **[Licencia MIT](https://opensource.org/licenses/MIT)**.  
Desarrollado con 💚 por [Jep Castillo](https://github.com/) 🚀
