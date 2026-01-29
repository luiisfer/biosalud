<div align="center">
  <img width="1200" height="auto" alt="BioLab Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  
  <h1 style="margin-top: 20px;">🧬 BioLab - Sistema de Gestión de Laboratorio</h1>
  
  <p align="center">
    <strong>Una solución integral y moderna para la administración eficiente de laboratorios clínicos.</strong>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular" />
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  </p>
</div>

<br />

## 📋 Sobre el Proyecto

**BioLab** está diseñado para transformar y optimizar el flujo de trabajo diario en laboratorios de análisis clínicos. Desde la recepción del paciente hasta la entrega segura de resultados, nuestra plataforma asegura integridad, rapidez y facilidad de uso.

El objetivo es permitir que los profesionales de la salud se centren en lo más importante: el diagnóstico y bienestar de sus pacientes.

---

## ✨ Características Principales

### 🏥 Gestión Clínica
- **Expedientes de Pacientes:** Historial completo, búsqueda rápida y seguimiento detallado.
- **Resultados y Exámenes:** Configuración flexible de perfiles de análisis, entrada de resultados segura y validación.
- **Reportes Profesionales:** Generación automática de resultados en PDF listos para imprimir o enviar por correo.

### 💼 Administración y Finanzas
- **Control de Ventas:** Punto de venta integrado para servicios de laboratorio.
- **Facturación:** Gestión simplificada de cobros y estados de cuenta.
- **Dashboards:** Visualización clara del rendimiento del laboratorio.

### 🛡️ Seguridad y Tecnología
- **Roles y Permisos:** Acceso controlado para administradores, bioanalistas y recepcionistas.
- **Auditoría:** Registro de cambios en resultados críticos (quién editó qué y cuándo).
- **Nube Segura:** Datos respaldados y accesibles 24/7 gracias a la infraestructura de Supabase.

---

## 🚀 Guía de Inicio Rápido

Sigue estos pasos para ejecutar el proyecto en tu entorno local.

### Prerrequisitos
Asegúrate de tener instalado:
*   [Node.js](https://nodejs.org/) (Versión LTS recomendada)
*   **NPM** (viene con Node)

### Instalación

1.  **Clonar el repositorio**
    ```bash
    git clone <url-del-repositorio>
    cd biolab
    ```

2.  **Instalar dependencias**
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno**
    Crea un archivo `.env` o `.env.local` en la raíz del proyecto. Necesitarás configurar las claves de tus servicios (como Supabase o Gemini):
    ```env
    # Ejemplo de configuración
    GEMINI_API_KEY=tu_api_key_aqui
    SUPABASE_URL=tu_url_supabase
    SUPABASE_ANON_KEY=tu_key_publica
    ```

4.  **Ejecutar en Desarrollo**
    Inicia el servidor local:
    ```bash
    npm run dev
    ```
    La aplicación estará disponible típicamente en `http://localhost:4200` (o el puerto que indique tu consola).

---

## 🛠️ Stack Tecnológico

Este proyecto ha sido construido utilizando tecnologías de vanguardia para asegurar escalabilidad y mantenibilidad:

| Tecnología | Uso en el Proyecto |
|------------|-------------------|
| **Angular** | Framework Frontend robusto para la interfaz de usuario. |
| **TypeScript** | Lógica de negocio tipada y segura. |
| **Supabase** | Backend-as-a-Service (Base de datos PostgreSQL, Auth, Realtime). |
| **Tailwind CSS** | (Si aplica) Estilizado rápido y responsivo. |

---

<div align="center">
  <p><sub>Documentación actualizada para el equipo de BioLab 🧬</sub></p>
</div>
