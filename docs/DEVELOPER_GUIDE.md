# Developer Guide — genealogia-frontend

Purpose
- Guía operativa detallada para desarrolladores y asistentes de código que trabajan en este frontend React del árbol genealógico.

Dónde mirar primero (puntos rápidos)
- `src/components/FamilyTree.js` — punto donde se monta el renderer D3 (target: `div#graph`) y se conecta el panel lateral.
- `src/hooks/useFamilyTreeState.js` — lógica central de estado: acciones, import/export, persistencia y selectores.
- `src/components/familyTreeEffects.js` — efectos DOM / integración con D3 (`d3-dtree`).
- `src/utils/helpers.js` — sanitización (`sanitizeStoredMembers`) y transformaciones necesarias al persistir/migrar datos.

Valor exacto de persistencia
- STORAGE_KEY usado en localStorage (ver `src/components/familyTreeConstants.js`): `genealogiaTreeData`.

Ejemplo mínimo de formato `treeData`
- Forma simplificada (extraída de `src/data/familyTreeData.js`):

```
{
  "members": [
    { "id": "1", "name": "Rayo", "sex": "M", "parents": [] },
    { "id": "2", "name": "Luna", "sex": "F", "parents": ["1"] }
  ],
  "relations": []
}
```

Checklist para PRs que toquen formato/persistencia
1. ¿Cambió la forma de `treeData`? Actualiza `sanitizeStoredMembers` en `src/utils/helpers.js` y añade tests de migración.
2. Añade nota de migración en `README.md` si cambias `STORAGE_KEY` o la versión del formato.
3. Si modificas la representación D3, actualiza `src/components/familyTreeEffects.js` y `src/styles/dtree.css`.
4. Verifica visualmente con `npm start` que `div#graph` renderiza para los datos semilla.

Pasos reproducibles para depurar el grafo
1. Levanta el servidor de desarrollo:

```powershell
npm start
```

2. Forzar datos semilla (aislar renderer): en `src/hooks/useFamilyTreeState.js` importa temporalmente `src/data/familyTreeData.js` y retorna ese objeto como `treeData` para probar el renderer sin el resto de la lógica.
3. Abrir la consola del navegador: busca errores de D3 o `undefined` — suelen venir de `members` con propiedades faltantes (`id`, `name`, `sex`, `parents`).
4. Si el grafo no aparece: confirmar que `div#graph` existe en `src/components/FamilyTree.js` y que `graphRef` se pasa a `familyTreeEffects`.
5. Para probar persistencia: desde la consola del navegador ejecutar `localStorage.removeItem('genealogiaTreeData')` y recargar la aplicación.

Notas sobre separación de responsabilidades
- Mantener la lógica de estado en `useFamilyTreeState.js` y la lógica DOM/D3 en `familyTreeEffects.js`. No mezclar ambos sin una justificación clara.

Ejemplos rápidos de dónde están las cosas
- Formulario / constantes: `src/components/HorseForm.js` — contiene `RELATION_TYPES` y `SEXO`.
- Datos semilla: `src/data/familyTreeData.js`.
- Estilos del renderer: `src/styles/dtree.css`.

Preguntas útiles para PRs
- ¿Este cambio afecta la forma de `treeData` o sólo la visualización? Si afecta formato, ¿hay migración adecuada en `sanitizeStoredMembers`?
- ¿Se toca la inicialización D3 o sólo la configuración visual (CSS)?

Quick runs
```powershell
npm start
npm test
npm run build
```

Si quieres, puedo añadir un test de ejemplo para `sanitizeStoredMembers` que cubra una migración simple — dime si lo deseas y lo agrego.

## Recomendaciones de testing (estable y resistente)

Para mantener la suite de tests robusta y minimizar falsos negativos cuando el texto de la UI cambia ligeramente, sigue estas recomendaciones:

- Preferir consultas accesibles antes que buscar texto exacto:
  - getByRole / findByRole / getByLabelText / getByPlaceholderText cuando sea posible.
  - Ejemplo: `screen.getByRole('button', { name: /agregar/i })`.

- Para mensajes informativos en pantalla (alerts, banners, mensajes concatenados): usar expresiones regulares parciales en vez de cadenas exactas.
  - Ejemplo: `await screen.findByText(/Pareja agregada:\s*Camila/i)` en lugar de `findByText("Pareja agregada: Camila.")`.

- Si el texto es crítico y debe ser exacto (poco probable), considera añadir un atributo `data-testid` o `aria-label` específico con criterio y documentarlo en el test.

- Documenta decisiones fragiles en el test con un comentario que enlace a esta sección o a `.github/copilot-instructions.md`.

- Evita mocks globales de librerías que dependen fuertemente del DOM (p. ej. D3) sin un hook test-only o una abstracción que permita inyectar shims para tests; preferimos exponer puntos de inyección controlados (ya hay `__setTestLibraries` en `src/utils/globalLibs.js` para tests de integración).

- Recomendación de workflow para cambios visuales grandes:
  1. Añadir/actualizar tests usando queries por rol y regex antes del cambio.
  2. Ejecutar `npm test` y ajustar selectores si el cambio altera la estructura accesible.

Estas prácticas reducen el mantenimiento de tests cuando se refactoriza copy o se añaden frases adicionales a mensajes ya existentes.

## Nota sobre efectos y referencias (refs)

En varios efectos que inicializan o destruyen el renderer D3 (por ejemplo `familyTreeEffects.js` y el efecto dentro de `src/utils/helpers.js`) copiamos el valor de `graphRef.current` y del `treeInstanceRef` a variables locales al comienzo del effect. Esto se hace intencionalmente por dos razones:

- Garantizar un cleanup determinista: al capturar la referencia al DOM/instancia usada en esta ejecución del efecto, la función de limpieza opera siempre sobre el mismo nodo/instancia que creó el efecto, evitando borrar o destruir un nodo distinto en caso de re-renderizaciones.
- Evitar advertencias de ESLint (react-hooks/exhaustive-deps): acceder a `graphRef.current` directamente en la limpieza obliga a incluir refs mutables en el array de dependencias o provoca warnings sobre valores que pueden cambiar entre renderizados.

Por favor, no reviertas este patrón sin una alternativa que mantenga la limpieza determinista y que sea explícita en su manejo de refs — deja un comentario si decides cambiarlo.
