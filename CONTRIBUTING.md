# Contribuir a TaskFlow

Este es un proyecto personal de portfolio, pero está armado siguiendo prácticas pensadas para un repositorio colaborativo real.

## Flujo de trabajo

1. Haz un fork del repositorio y crea una rama descriptiva: `feature/nombre-corto` o `fix/nombre-corto`.
2. Instala las dependencias en `backend/` y `frontend/` (ver [README](./README.md#puesta-en-marcha)).
3. Antes de abrir un PR, ejecuta en ambos paquetes:
   ```bash
   pnpm lint
   pnpm test       # solo backend
   pnpm build
   ```
4. Escribe mensajes de commit en modo imperativo y en español o inglés de forma consistente (ej. `feat: agrega paginación al tablero`).
5. Abre el Pull Request describiendo qué cambia y por qué. Si tocas lógica de permisos o auth, agrega o actualiza tests en `backend/src/tests/`.

## Convenciones de código

- TypeScript en modo `strict` en ambos paquetes; evitar `any` salvo casos justificados.
- Backend: cada ruta nueva debe pasar por `requireAuth` y, si corresponde, `requireRole(...)`.
- Frontend: componentes funcionales con hooks; estado de servidor vía `api.ts`, estado en tiempo real vía `useRealtime`.
- Nombres de branches, commits y comentarios de código en español (idioma del resto del proyecto).

## Reportar bugs

Abre un issue con: pasos para reproducir, comportamiento esperado vs. observado, y versión de Node usada.
