# Contribuir a TaskFlow

Este es un proyecto personal de portfolio, pero está armado siguiendo prácticas pensadas para un repositorio colaborativo real.

## Flujo de trabajo

1. Forkeá el repositorio y creá una rama descriptiva: `feature/nombre-corto` o `fix/nombre-corto`.
2. Instalá dependencias en `backend/` y `frontend/` (ver [README](./README.md#puesta-en-marcha)).
3. Antes de abrir un PR, corré en ambos paquetes:
   ```bash
   pnpm lint
   pnpm test       # solo backend
   pnpm build
   ```
4. Escribí mensajes de commit en modo imperativo y en español o inglés de forma consistente (ej. `feat: agrega paginación al tablero`).
5. Abrí el Pull Request describiendo qué cambia y por qué. Si tocás lógica de permisos o auth, agregá o actualizá tests en `backend/src/tests/`.

## Convenciones de código

- TypeScript en modo `strict` en ambos paquetes; evitar `any` salvo casos justificados.
- Backend: cada ruta nueva debe pasar por `requireAuth` y, si corresponde, `requireRole(...)`.
- Frontend: componentes funcionales con hooks; estado de servidor vía `api.ts`, estado en tiempo real vía `useRealtime`.
- Nombres de branches, commits y comentarios de código en español (idioma del resto del proyecto).

## Reportar bugs

Abrí un issue con: pasos para reproducir, comportamiento esperado vs. observado, y versión de Node usada.
