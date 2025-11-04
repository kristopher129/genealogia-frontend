## Propósito
Proveer a los asistentes de código (Copilot/AGENT) la información esencial para ser productivos con este proyecto React (frontend del árbol genealógico).

## Resumen alto nivel
- Proyecto: aplicación React creada con Create React App (usa `react-scripts`).
- Dominio: visualización y edición de un árbol genealógico para caballos(nodos: "caballos"/entidades y relaciones padre-hijo y parejas).
- Librerías clave: `react`, `react-dom`, `d3`, `d3-dtree`, `dtree-seed`, `lodash`.
## Estructura importante y responsabilidades
- `src/components/FamilyTree.js` — componente contenedor principal. Usa el custom hook `useFamilyTreeState` y efectos definidos en `familyTreeEffects.js`. Renderiza `FamilyTreePanel` y el contenedor del grafo (`#graph`).
- `src/hooks/useFamilyTreeState.js` — lógica de estado principal (acciones, selectores, import/export, persistencia). Inspeccionar para entender la forma de los datos y las APIs internas.
- `src/components/familyTreeEffects.js` — efectos relacionados con el DOM/d3 (inicialización del grafo, resize, selección). Crucial para cualquier cambio visual o integración con d3.
- `src/components/FamilyTreePanel.js` — UI lateral: formularios, botones de import/export, reset y controles de edición.
- `src/components/HorseForm.js` — constantes de dominio (RELATION_TYPES, SEXO) y validaciones del formulario.
- `src/utils/helpers.js` — utilidades de sanitización (`sanitizeStoredMembers`) y helpers reutilizables.
- `src/data/familyTreeData.js` — datos de ejemplo / semilla.
- `src/styles/dtree.css` — estilos específicos del visualizador d3.
- `build/` y `public/` — salida y plantilla estática (típico CRA).

## Patrones y convenciones del proyecto
- Estado centralizado por custom hook: la mayoría de props en `FamilyTree` provienen de `useFamilyTreeState()` (devuelve un objeto con muchas funciones y valores). Cuando modifiques comportamiento, actualiza el hook.
- Efectos separados: lógica DOM/d3 está fuera del hook y en `familyTreeEffects.js`; mantener separación entre lógica de estado y efectos visuales.
- Persistencia: usan un `STORAGE_KEY` (ver `src/components/familyTreeConstants.js`) y `usePersistTreeDataEffect` para guardar/leer localStorage. Para cambios en el formato de datos, actualizar `sanitizeStoredMembers` en `src/utils/helpers.js`.
- Nombres de archivos/componentes: componentes en PascalCase, hooks en camelCase dentro de `hooks/`.
- Import/export de árbol: hay handlers en el hook (`handleExportTree`, `handleImportTree`) conectados al panel. Revisar `fileInputRef` y el manejo de `onImportChange` para el flujo de archivos.

## Flujo de datos clave
- UI -> `FamilyTreePanel` -> acciones del hook (`useFamilyTreeState`) -> actualiza `treeData`.
- Visualización: `treeData` -> efectos en `familyTreeEffects.js` -> D3 dibuja en `div#graph` usando `graphRef`.
- Persistencia: cambios en `treeData` -> `usePersistTreeDataEffect` -> localStorage (clave `STORAGE_KEY`).

## Workflows de desarrollo (comandos detectables)
- Desarrollo local (dev server): `npm start` (usa `react-scripts start`).
- Build para producción: `npm run build` (salida en `build/`).
- Tests: `npm test` (react-scripts + testing-library).
Nota: archivo `package.json` usa scripts estándar de Create React App.

## Puntos sensibles / dónde mirar primero al cambiar comportamiento
- Si tocas la representación del grafo: `src/components/familyTreeEffects.js` y `src/styles/dtree.css`.
- Si cambias shape de datos o la persistencia: `useFamilyTreeState.js`, `familyTreeConstants.js`, y `src/utils/helpers.js` (`sanitizeStoredMembers`).
- Si modificas formularios o tipos de relación: `HorseForm.js` y `FamilyTreePanel.js`.

## Ejemplos concretos sacados del código
- Storage key: ver `STORAGE_KEY` en `src/components/familyTreeConstants.js` (persistencia local).
- Sanitización: `sanitizeStoredMembers` en `src/utils/helpers.js` es la puerta de entrada para migraciones de formato.
- Render del grafo: `div#graph` en `FamilyTree.js` es el target donde `familyTreeEffects` inicializa D3.

## Integraciones externas
- D3 + d3-dtree: afectan cómo se estructura el dato para el renderer. Cambios en la librería requieren revisar `familyTreeEffects` y `dtree.css`.

## Reglas para asistentes de código
- Evitar cambios que mezclen lógica de estado y efectos DOM: no mover código de `familyTreeEffects` al hook sin justificar la separación.
- Si introduces un cambio en el formato persistido, siempre actualizar `sanitizeStoredMembers` y añadir una breve nota en `README.md` sobre la migración.
- Prefiere modificar/leer `useFamilyTreeState` para tratar acciones de dominio (import/export, delete, edit) antes de tocar múltiples componentes.

## Preguntas útiles para aclarar PRs
- ¿Este cambio afecta la forma de `treeData` o sólo la visualización? Si afecta formato, ¿hay migración adecuada en `sanitizeStoredMembers`?
- ¿Se toca la inicialización D3 o sólo la configuración visual (CSS)?

---
Nota: este archivo está pensado para ser una referencia concisa para asistentes. La guía detallada (ejemplos de `STORAGE_KEY`, formato de `treeData`, checklist de PRs y pasos de depuración) fue movida a `docs/DEVELOPER_GUIDE.md`. Revisa ese archivo para instrucciones operativas y ejemplos concretos.

## Ejemplos concretos y checklist rápido

- Ejemplo de `STORAGE_KEY` (ver `src/components/familyTreeConstants.js`):

	- STORAGE_KEY = "genealogiaTreeData"

- Ejemplo mínimo de la forma de `treeData` (tomado y simplificado de `src/data/familyTreeData.js`):

	- {
		"members": [
			{ "id": "1", "name": "Rayo", "sex": "M", "parents": [] },
			{ "id": "2", "name": "Luna", "sex": "F", "parents": ["1"] }
		],
		"relations": []
	}

- Checklist útil para PRs que toquen formato o persistencia:
	1. ¿Cambia la forma de `treeData`? Actualiza `sanitizeStoredMembers` en `src/utils/helpers.js`.
	2. Añade una nota corta en `README.md` o en el changelog sobre la migración (clave `STORAGE_KEY` y versión si corresponde).
	3. Si modificas la representación D3, actualiza `src/components/familyTreeEffects.js` y `src/styles/dtree.css`.
	4. Ejecuta `npm start` y verifica que `div#graph` renderiza sin errores para los datos semilla (`src/data/familyTreeData.js`).

## Cómo depurar rápidamente problemas del grafo (pasos reproducibles)

1. Levanta el servidor de desarrollo:

```powershell
npm start
```

2. Forzar datos semilla: en `src/hooks/useFamilyTreeState.js` (temporalmente) importa y retorna `src/data/familyTreeData.js` como `treeData` para aislar problemas del renderer.

3. Abrir la consola del navegador (Chrome/Edge) y buscar errores de D3 o referencias `undefined` — la mayoría vienen de propiedades faltantes en `members` (id, name, sex, parents).

4. Si el grafo no aparece, verificar que el elemento `div#graph` existe en `src/components/FamilyTree.js` y que `graphRef` está siendo pasado a `familyTreeEffects`.

5. Para comprobar la persistencia: limpiar `localStorage.removeItem('family_tree_members_v1')` desde consola y recargar para ver si toma los datos semilla.

## Cierre
Mantendré el archivo compacto y orientado a tareas concretas. Dime si quieres que:

- incluya el valor exacto de `STORAGE_KEY` tal cual está en `src/components/familyTreeConstants.js` (si prefieres exactitud en lugar del ejemplo), o
- añada tests unitarios de ejemplo para `sanitizeStoredMembers` y la importación/exportación.

---

## Notas sobre tests — búsqueda de mensajes de UI

- Contexto: durante la estabilización de la suite de tests (`src/App.test.js`) detectamos que algunos mensajes de la UI son más largos o contienen texto adicional (por ejemplo: "Pareja agregada: Camila. Cría agregada automáticamente: ..."). Las aserciones que buscan una cadena exacta pueden fallar si el contenido se concatena o cambia ligeramente.

- Qué se cambió: en `src/App.test.js` se sustituyó la búsqueda estricta

	await screen.findByText("Pareja agregada: Camila.");

	por una búsqueda menos frágil usando una expresión regular:

	await screen.findByText(/Pareja agregada:\s*Camila/i);

- Recomendaciones para tests menos frágiles:
	- Preferir queries por roles/etiquetas accesibles (ej. `getByRole`, `getByLabelText`) cuando sea posible.
	- Para mensajes de texto que pueden variar, usar `findByText(/texto parcial/i)` o `getByText(/regex/)` en lugar de matches exactos.
	- Alternativamente, añadir atributos `data-testid` o `aria-label` específicos en los componentes (siempre con criterio) para seleccionar elementos con mayor estabilidad.
	- Documentar estas decisiones en los tests con un comentario corto que enlace a esta sección.

- Razón práctica: esto reduce falsos negativos por cambios menores en la UI (p. ej. añadir una segunda frase o modificar puntuación) y mejora la resiliencia de la suite de integración.

