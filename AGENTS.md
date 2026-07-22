<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ComiTrack — Guía del Proyecto

## Visión General

ComiTrack es una aplicación web personal para gestión y cálculo automático de comisiones mensuales. Calcula comisiones de **4 fuentes** distintas, filtrando todo por un selector global de mes/año en la navbar.

- **Idioma de la UI y código:** Español (es-AR, formato ARS)
- **Moneda:** Pesos argentinos (ARS), formateados con `Intl.NumberFormat("es-AR")`

## Stack Tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| Next.js | 16.x | Framework (App Router + Server Actions) |
| React | 19.x | UI |
| TypeScript | ^5 | Tipado estático |
| Prisma | ^6.x | ORM + PostgreSQL |
| Tailwind CSS | ^4 | Estilos (dark mode, `@import "tailwindcss"`, NO v3) |
| Zustand | ^5.x | Estado global (mes/año) |
| jose | ^6.x | JWT (HS256, 24h exp) |
| bcrypt | ^6.x | Hash de passwords/PINs |
| lucide-react | ^1.x | Iconografía |
| clsx + tailwind-merge | — | Utility `cn()` para clases CSS |

## Arquitectura

### Flujo de Datos

```
User (Client Component)
  │
  ├── Zustand Store (useDateStore) ──► month/year global
  ├── Role Context (RoleProvider) ──► role (ADMIN/VIEWER) desde cookie
  │
  └── Server Actions ("use server") ──► Prisma ──► PostgreSQL
        └── Retorna { success, data? | error? } al cliente
```

### Autenticación y Roles

- **Proxy** (`src/proxy.ts`): Verifica JWT en cookie `session`. Redirige a `/login` si inválido. (En Next.js 16, "Middleware" se renombró a "Proxy")
- **JWT**: HS256 via `jose`, 24h expiración, cookie httpOnly.
- **Cookie `role`**: No httpOnly, texto plano `"ADMIN"` o `"VIEWER"`, para decisiones de UI en cliente.
- **Server-side**: `requireAdmin()` en `lib/auth.ts` verifica JWT real en cada escritura.
- **Client-side**: `useRole()` desde `lib/role-context.tsx` condiciona renderizado de formularios/botones.

| Rol | Permisos |
|---|---|
| ADMIN | CRUD completo, acceso a `/settings` |
| VIEWER | Solo lectura, sin formularios ni Settings |

### Base de Datos (Prisma)

5 modelos, 3 enums:

| Modelo | Propósito | Unique Constraints |
|---|---|---|
| `User` | Auth (admin + viewer) | `username` |
| `TechnicalService` | Reparación | `coders` |
| `ServiceItem` | Servicio individual en reparación | — |
| `DevicePurchase` | Compra de inventario | `purchaseOrder` |
| `DeviceSalesMonthly` | Registro mensual ventas equipos | `@@unique([month, year])` |
| `GeneralSalesMonthly` | Registro mensual ventas generales | `@@unique([month, year])` |

Enums: `ServiceCategory` (4 tipos), `Capacity` (5 tamaños), `TargetAchievement` (4 niveles).

**Relaciones:** `TechnicalService` → `ServiceItem[]` (cascade delete). Todos los modelos principales tienen FK opcional a `User`.

### Lógica de Comisiones (CRÍTICO)

Todas las funciones puras están en `src/lib/constants.ts`:

- `techRates` — Mapa ServiceCategory → monto fijo ($0, $650, $1500, $2000)
- `calcPurchaseCommission(count)` — Escalonada por cantidad en el mes (1=$2000, 2=$2500/u, 3=$3500/u, 4+=$4500/u)
- `calcDeviceSalesCommission(quantity, volume)` — Porcentaje sobre volumen según cantidad (0.5% a 1.6%)
- `calcGeneralSalesCommission(grossVolume, deviceVolume, target)` — Base = bruto - volumen equipos, × tasa objetivo (1% a 1.8%)

**⚠️ DUPLICACIÓN:** `src/actions/dashboard.ts` redefine estas funciones inline en vez de importarlas de `constants.ts`. Si cambian las tasas, hay que actualizar DOS lugares.

## Estructura de Directorios

```
comitrack/
├── prisma/
│   ├── schema.prisma        # Schema de la DB
│   └── seed.ts              # Seed: usuario admin + viewer
├── src/
│   ├── proxy.ts             # Proxy (verificación JWT, renamed from Middleware en Next.js 16)
│   ├── actions/             # Server Actions (lógica de negocio)
│   │   ├── auth.ts          #   login, logout, cambio password/PIN
│   │   ├── dashboard.ts     #   Resumen de comisiones mensuales
│   │   ├── devicePurchase.ts#   CRUD compras de equipos
│   │   ├── deviceSales.ts   #   Upsert ventas de equipos (mensual)
│   │   ├── generalSales.ts  #   Upsert ventas generales (mensual)
│   │   └── technicalService.ts # CRUD servicio técnico + service items
│   ├── app/                 # Pages (App Router)
│   │   ├── layout.tsx       #   Root layout (Inter, Navbar, RoleProvider)
│   │   ├── page.tsx         #   Dashboard (/) — 4 cards + total
│   │   ├── globals.css      #   Tailwind v4 + variables CSS dark mode
│   │   ├── not-found.tsx    #   404
│   │   ├── login/page.tsx   #   Login (admin password o viewer PIN)
│   │   ├── settings/page.tsx#   Config (cambiar password/PIN)
│   │   ├── servicio-tecnico/page.tsx # CRUD servicio técnico (~772 líneas)
│   │   ├── compras/page.tsx #   CRUD compras (~543 líneas)
│   │   ├── ventas-equipos/page.tsx  # Form ventas equipos (~191 líneas)
│   │   └── ventas-generales/page.tsx # Form ventas generales (~254 líneas)
│   ├── components/
│   │   ├── global/
│   │   │   └── Navbar.tsx   # Navbar con mes/año, nav links, drawer mobile
│   │   └── ui/
│   │       └── DatePicker.tsx # Calendar custom
│   ├── lib/
│   │   ├── auth.ts          # JWT (create/verify), cookies, bcrypt, roles
│   │   ├── constants.ts     # Tipos, rates, labels, funciones de cálculo
│   │   ├── prisma.ts        # PrismaClient singleton (global dev)
│   │   ├── role-context.tsx # React Context para role (ADMIN/VIEWER)
│   │   └── utils.ts         # cn() class merge + formatARS
│   └── store/
│       └── useDateStore.ts  # Zustand: { month, year, setMonth, setYear }
```

## Convenciones de Código

### Server Actions
- Todas las acciones usan `"use server"` al inicio del archivo.
- Retornan `{ success: boolean, data?: T, error?: string }`.
- Escrituras verifican permisos con `requireAdmin()`.
- Usan `revalidatePath()` para invalidar cache después de mutaciones.
- Fechas se calculan con `Date.UTC()` para evitar desfases de timezone.

### Client Components
- Todas las páginas y componentes interactivos usan `"use client"`.
- Estado local con `useState` + `useTransition` para operaciones async.
- `useRole()` para condicionar UI según permisos.
- `useDateStore()` para leer mes/año global.
- Loading states se manejan con `useTransition` (no `loading.tsx`).

### Estilos
- **Tailwind CSS v4** (sintaxis `@import "tailwindcss"`, NO `@tailwind` directives).
- Dark mode forzado (`<html className="dark">`).
- Tema: `bg-slate-950` fondo, `bg-slate-900` cards, `border-slate-800` bordes, `text-indigo-400` acentos.
- Utility `cn()` de `lib/utils.ts` para combinar clases (clsx + tailwind-merge).
- Animaciones CSS inline via `<style>` tags en componentes (modal, drawer, calendar).

### TypeScript
- Strict mode activado.
- `@/*` path alias → `./src/*`.
- Enums de Prisma se importan desde `@prisma/client`.
- Tipos custom en `lib/constants.ts` coinciden con los enums de Prisma.

### Fechas
- **Servidor usa UTC puro:** `new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))`.
- **DatePicker usa timezone local:** `new Date(y, m-1, d)` — puede causar off-by-one en timezones detrás de UTC.
- El mes se almacena como `Int` (1-12), NO como Date.

### Navbar
- Se oculta en `/login`.
- Selector de mes/año siempre visible (sticky top).
- Links: Dashboard, Servicio Técnico, Compras, Vtas. Equipos, Vtas. Generales.
- Mobile: drawer con backdrop blur + animación.
- Ajustes visible solo para ADMIN.

## Comandos Disponibles

```bash
npm run dev          # Desarrollo con hot reload
npm run build        # Build producción (prisma generate + db push + next build)
npm run start        # Servidor producción
npm run lint         # ESLint
npm run db:migrate   # prisma migrate dev
npm run db:seed      # prisma db seed (requiere tsx)
npm run db:reset     # prisma migrate reset --force
npx prisma studio    # Explorer visual de la DB
npx prisma db push   # Sincroniza schema con DB
npx prisma generate  # Genera Prisma Client
```

**⚠️ Build script:** `npm run build` ejecuta `prisma db push` antes de `next build`. Esto auto-aplica cambios de schema. En producción se recomienda `migrate deploy`.

## Endpoints/Rutas

| Ruta | Descripción | Autenticación |
|---|---|---|
| `/login` | Login (admin/viewer) | Pública |
| `/` | Dashboard con resumen de comisiones | Requiere sesión |
| `/servicio-tecnico` | CRUD reparaciones con servicios | Admin: CRUD, Viewer: lectura |
| `/compras` | CRUD compras de equipos | Admin: CRUD, Viewer: lectura |
| `/ventas-equipos` | Formulario mensual ventas equipos | Admin: edit, Viewer: lectura |
| `/ventas-generales` | Formulario mensual ventas generales | Admin: edit, Viewer: lectura |
| `/settings` | Cambiar password/PIN | Solo Admin |

No existen rutas API (`/api/`). Toda mutación es por Server Actions.

## Mejoras Pendientes (Conocidas)

1. **~~Lógica duplicada~~** ✅ — Resuelta: `dashboard.ts` importa de `constants.ts`.
2. **~~`date-fns` sin usar~~** ✅ — Eliminado de `package.json`.
3. **~~Sin tests~~** ✅ — Resuelta: 152 tests con Vitest (lib + actions).
4. **~~Zustand sin persistencia~~** ✅ — Resuelta: store persiste en `localStorage` con `skipHydration`.
5. **~~RoleContext estático~~** ✅ — Resuelta: `RoleProvider` lee cookie `role` en el cliente con `useEffect` dependiendo de `pathname`.
6. **~~Sin `loading.tsx` ni `error.tsx`~~** ✅ — Resuelta: skeleton loaders por ruta + error boundary raíz + metadata en 404.
7. **~~Sin rate limiting en login~~** ✅ — Resuelta: throttling por username (5 intentos / 15 min) con `lib/rate-limit.ts`.
8. **~~Middleware~~** ✅ — Confirmado: `src/proxy.ts` con export `proxy()` es la convención correcta de Next.js 16 (renamed from Middleware).
