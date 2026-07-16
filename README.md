# ComiTrack 📊

> Aplicación web personal para la gestión y cálculo automático de comisiones mensuales.

---

## Descripción

ComiTrack es una herramienta de uso personal construida con **Next.js 16 (App Router)**, **Tailwind CSS v4**, **Prisma 6** y **PostgreSQL**. Permite registrar y calcular comisiones de cuatro fuentes distintas, filtrando todo por un selector global de **Mes y Año** ubicado en la barra de navegación.

---

## Stack Tecnológico

| Tecnología | Versión | Propósito |
|---|---|---|
| [Next.js](https://nextjs.org/) | 16.x | Framework React (App Router + Server Actions) |
| [Tailwind CSS](https://tailwindcss.com/) | v4 | Estilos y diseño (Dark Mode) |
| [Prisma](https://www.prisma.io/) | 6.x | ORM y migraciones de base de datos |
| [PostgreSQL](https://www.postgresql.org/) | — | Base de datos relacional |
| [Zustand](https://zustand-demo.pmnd.rs/) | 5.x | Estado global (selector Mes/Año) |
| [Lucide React](https://lucide.dev/) | — | Iconografía |
| [date-fns](https://date-fns.org/) | 4.x | Utilidades de fechas |

---

## Funcionalidades

### 🎛️ Selector Global de Mes y Año
Disponible en la Navbar superior. Todos los datos, cálculos y CRUDs de la aplicación filtran automáticamente según el período seleccionado.

### 1. Dashboard Principal (`/`)
Muestra un resumen de comisiones para el mes seleccionado:
- 💠 Total por **Servicio Técnico**
- 💠 Total por **Compras de Celulares**
- 💠 Total por **Ventas de Celulares**
- 💠 Total por **Ventas Generales**
- 🏆 **Total de Comisiones** (sumatoria de las 4 fuentes)

### 2. Servicio Técnico (`/servicio-tecnico`)
CRUD diario de reparaciones (`coders`). Cada reparación puede tener múltiples servicios con las siguientes comisiones:

| Tipo de Servicio | Comisión |
|---|---|
| Módulo, Batería, Pin de carga o ST >$20.000 | $1.500 |
| Revisión Aprobada | $2.000 |
| Limpieza (16484, 16485, mantpin) o ST <$20.000 | $650 |
| Revisión denegada / Sin reparación / Garantía | $0 |

### 3. Compras de Celulares
CRUD mensual de ingresos al inventario. Sólo iPhones 12 en adelante (excluye Mini, SE, 16e, 17e).

| Equipos en el mes | Comisión |
|---|---|
| 1 equipo | $2.000 total |
| 2 equipos | $2.500 c/u ($5.000) |
| 3 equipos | $3.500 c/u ($10.500) |
| 4 o más | $4.500 c/u |

### 4. Ventas de Celulares
Formulario mensual con cantidad y volumen facturado. Comisión sobre el volumen:

| Cantidad | Porcentaje |
|---|---|
| 1 a 3 | 0.5% |
| 4 | 0.8% |
| 5 a 9 | 1% |
| 10 o más | 1.6% |

### 5. Ventas Generales
Formulario mensual. Calcula el **Volumen Base Comisionable** restando el volumen de Ventas de Celulares al Volumen Bruto total, y aplica:

| Objetivo | Porcentaje |
|---|---|
| < 100% | 1% |
| 100% | 1.4% |
| 110% | 1.6% |
| ≥ 125% | 1.8% |

---

## Estructura del Proyecto

```
comitrack/
├── prisma/
│   └── schema.prisma          # Modelos y enums de la base de datos
├── src/
│   ├── actions/               # Server Actions (lógica de negocio + DB)
│   │   ├── dashboard.ts       # Cálculo del resumen mensual
│   │   ├── devicePurchase.ts  # CRUD Compras de equipos
│   │   ├── deviceSales.ts     # Registro mensual Ventas de equipos
│   │   ├── generalSales.ts    # Registro mensual Ventas Generales
│   │   └── technicalService.ts
│   ├── app/
│   │   ├── layout.tsx         # Root layout con Navbar
│   │   ├── page.tsx           # Dashboard Principal
│   │   ├── globals.css
│   │   ├── compras/           # CRUD Compras
│   │   │   └── page.tsx
│   │   ├── servicio-tecnico/  # CRUD Servicio Técnico
│   │   │   └── page.tsx
│   │   ├── ventas-equipos/    # Registro Ventas Equipos
│   │   │   └── page.tsx
│   │   └── ventas-generales/  # Registro Ventas Generales
│   │       └── page.tsx
│   ├── components/
│   │   ├── global/
│   │   │   └── Navbar.tsx     # Navbar con selector Mes/Año y navegación
│   │   └── ui/
│   │       └── DatePicker.tsx # Selector de fechas custom
│   ├── lib/
│   │   ├── constants.ts       # Tipos, tarifas y etiquetas de servicios
│   │   ├── prisma.ts          # Singleton de PrismaClient
│   │   └── utils.ts           # cn() y formatARS
│   └── store/
│       └── useDateStore.ts    # Estado global Mes/Año (Zustand)
```

---

## Primeros Pasos

### Prerrequisitos
- Node.js 18+
- PostgreSQL (local o en la nube)

### Instalación

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd comitrack

# 2. Instalar dependencias
npm install

# 3. Configurar la base de datos
cp .env.example .env
# Editar .env con tu DATABASE_URL de PostgreSQL

# 4. Aplicar el esquema a la base de datos y generar el cliente
npx prisma db push
npx prisma generate

# 5. Iniciar el servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

### Variables de Entorno

Copiar `.env.example` a `.env` y completar con tus valores:

```env
DATABASE_URL="postgresql://usuario:contraseña@host:5432/comitrack?schema=public"
```

---

## Scripts Disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con Hot Reload |
| `npm run build` | Build optimizado para producción |
| `npm run start` | Inicia el servidor en modo producción |
| `npm run lint` | Ejecuta el linter de ESLint |
| `npx prisma db push` | Sincroniza el schema con la base de datos |
| `npx prisma studio` | Abre Prisma Studio (explorador visual de DB) |

---

## Autenticación y Roles

ComiTrack tiene un sistema de autenticación con dos roles:

| Rol | Permisos |
|---|---|
| **Admin** | CRUD completo en todas las secciones. Acceso a Configuración (`/settings`) para cambiar su contraseña y el PIN del viewer. |
| **Viewer** | Solo lectura. No ve formularios, botones de edición ni eliminación. Sin acceso a Configuración. |

### Flujo de autenticación

1. El usuario inicia sesión desde `/login` con usuario y contraseña (Admin) o PIN de 4 dígitos (Viewer).
2. El servidor crea un **JWT** firmado con `HS256` y 24h de expiración, almacenado en una cookie httpOnly (`session`).
3. Simultáneamente, se setea una cookie `role` (no httpOnly) con el texto plano `"ADMIN"` o `"VIEWER"`.
4. El **middleware** verifica el JWT en cada request — si es inválido o expiró, redirige a `/login`.
5. El **layout** (Server Component) lee la cookie `role` y la pasa como `initialRole` al `RoleProvider`.
6. Las **Server Actions** de escritura llaman a `requireAdmin()`, que verifica el JWT real impidiendo cualquier modificación no autorizada.

### Arquitectura de permisos

```
┌──────────────────────────────────────────────────────┐
│                   Middleware (proxy.ts)                │
│  Verifica JWT → redirige a /login si es inválido     │
├──────────────────────────────────────────────────────┤
│              Layout (Server Component)                 │
│  getRoleCookie() → initialRole → RoleProvider         │
├──────────────────────────────────────────────────────┤
│         RoleProvider (Client Context)                  │
│  Expone { role } a toda la app (sin useState)         │
├──────────────────────────────────────────────────────┤
│   Páginas: role === "ADMIN" ? formularios : ocultos  │
│   Server Actions: requireAdmin() → JWT verification   │
└──────────────────────────────────────────────────────┘
```

La cookie `role` es solo para la UI. La seguridad real está en el JWT: si alguien manipula la cookie `role` a `"ADMIN"`, igual no puede escribir porque `requireAdmin()` verifica el JWT firmado contra `JWT_SECRET`.

### Navbar según el rol

| Elemento | Admin | Viewer |
|---|---|---|
| Badge "Solo lectura" | No | Sí |
| Link Ajustes (desktop) | Sí | No |
| Botón Salir (desktop) | Sí | Sí |
| Drawer: Ajustes | Sí | "Modo solo lectura" |
| Drawer: Cerrar sesión | Sí | Sí |

Al cerrar sesión o cambiar de rol, se invalida el cache del router de Next.js con `revalidatePath` para evitar que queden datos stale en memoria.

---

## Notas Técnicas

- **Timezone:** Todas las fechas se calculan en UTC puro (`Date.UTC`) para evitar desfasajes entre el servidor (UTC) y la base de datos. Esto es especialmente importante para filtros por mes en zonas horarias como Argentina (UTC-3).
- **Server Actions:** Toda la lógica de base de datos y los cálculos de comisiones se ejecutan exclusivamente en el servidor. El cliente sólo recibe los resultados calculados.
- **Estado Global:** El selector de Mes/Año vive en un store de Zustand, lo que permite que cualquier componente reaccione al cambio sin prop-drilling.
