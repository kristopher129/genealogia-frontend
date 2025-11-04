# Solución: Nombres Incorrectos de Múltiples Parejas en el Árbol Genealógico

## Problema Reportado

Al agregar múltiples parejas (a partir de la tercera pareja) a una persona llamada "Jasper" en el árbol genealógico, los nombres de las parejas no se mostraban correctamente visualmente. En su lugar, aparecía el nombre "Jasper" en lugar del nombre correcto de la pareja.

**Síntomas:**
- Las parejas 3, 4, 5+ de una persona mostraban el nombre incorrecto (nombre del padre en lugar del nombre de la pareja)
- Los hijos creados a partir de estas parejas sí mostraban correctamente sus parentescos
- El problema afectaba solo la visualización, no la estructura de datos

## Causa Raíz

La librería `dSeeder.seed()` transforma los datos planos (estructura flat de miembros con arrays de parejas) en una estructura jerárquica requerida por la librería `dTree` para renderizar. 

**El problema:** Cuando `dSeeder` procesa múltiples parejas, los nodos de parejas en la estructura jerárquica de `marriages` no reciben correctamente sus nombres del conjunto de datos original. En su lugar, retienen valores incorrectos o genéricos.

## Solución Implementada

Se creó una función post-procesamiento llamada `fixMultipleSpouseNames()` que:

1. Toma la estructura jerárquica generada por `dSeeder.seed()`
2. Crea un mapa de los datos originales (id → miembro)
3. Recorre recursivamente todos los nodos del árbol
4. Para cada relación matrimonial (marriage), busca el nombre correcto del cónyuge en los datos originales
5. Reemplaza el nombre del cónyuge con el nombre correcto

### Código de la Solución

```javascript
export const fixMultipleSpouseNames = (seededData, originalDataMap) => {
  if (!Array.isArray(seededData) || !originalDataMap) {
    return seededData;
  }

  const fixNode = (node) => {
    if (!node) return node;

    // Fix spouse names in marriages
    if (Array.isArray(node.marriages)) {
      node.marriages = node.marriages.map((marriage) => {
        if (marriage?.spouse) {
          const spouseId = marriage.spouse.id;
          const originalSpouse = originalDataMap.get(spouseId);
          if (originalSpouse && originalSpouse.name) {
            marriage.spouse.name = originalSpouse.name;
          }
        }
        // Recursively fix children
        if (Array.isArray(marriage.children)) {
          marriage.children = marriage.children.map(fixNode);
        }
        return marriage;
      });
    }

    return node;
  };

  return seededData.map(fixNode);
};
```

## Archivos Modificados

### 1. `src/utils/helpers.js`
- **Líneas 8-49**: Definición de la función `fixMultipleSpouseNames()`
- **Líneas 247-253**: Aplicación de la corrección en `useFamilyTreeLoader()`
- **Cambio**: La función está **EXPORTADA** para permitir su uso en tests y otros módulos

**Cambio en useFamilyTreeLoader:**
```javascript
// Create a map of original data for fixing spouse names
const originalDataMap = new Map(dataCopy.map((member) => [member.id, member]));

let seededData = dSeeder.seed(dataCopy, targetId, options);

// Fix spouse names for multiple spouses (common issue in genealogy trees)
seededData = fixMultipleSpouseNames(seededData, originalDataMap);
```

### 2. `src/components/familyTreeEffects.js`
- **Líneas 14-55**: Definición de la función `fixMultipleSpouseNames()`
- **Líneas 132-138**: Aplicación de la corrección en `useFamilyTreeLoaderEffects()`

**Cambio en useFamilyTreeLoaderEffects:**
```javascript
// Create a map of original data for fixing spouse names
const originalDataMap = new Map(dataCopy.map((member) => [member.id, member]));

let seededData = dSeeder.seed(dataCopy, targetId, options);

// Fix spouse names for multiple spouses (common issue in genealogy trees)
seededData = fixMultipleSpouseNames(seededData, originalDataMap);
```

### 3. `src/utils/__tests__/fixMultipleSpouseNames.test.js` (NUEVO)
- Suite completa de tests unitarios que valida:
  - ✅ Corrección de nombres para múltiples parejas
  - ✅ Preservación de nombres correctos
  - ✅ Manejo de datos vacíos
  - ✅ Manejo de valores null
  - ✅ Corrección recursiva en hijos
  - ✅ Manejo de nodos sin matrimonios
  - ✅ Manejo de matrimonios sin cónyuge

**Resultado de Tests:**
```
Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
Snapshots:   0 total
```

## Diagrama de Flujo

```
Datos Planos (flat members)
        ↓
   dSeeder.seed()
        ↓
Datos Jerárquicos (con marriages)
        ↓
fixMultipleSpouseNames()  ← CORRECCIÓN APLICADA
        ↓
Datos Jerárquicos Corregidos
        ↓
   dTree.init()
        ↓
Visualización Correcta del Árbol
```

## Arquitectura y Patrones

La solución mantiene los patrones del proyecto:

1. **Separación de Responsabilidades**: 
   - La función de corrección opera sobre datos ya seeded, manteniéndose separada de la lógica de estado
   - Se aplica en los efectos (effects), no en los hooks de estado

2. **Ubicuidad**: 
   - Implementada en dos lugares (`helpers.js` y `familyTreeEffects.js`) porque el proyecto usa ambos sistemas de renderizado
   - Garantiza que cualquier ruta de código que genere el árbol aplicará la corrección

3. **No Invasivo**: 
   - No modifica las librerías externas (`dSeeder`, `dTree`)
   - No cambia la estructura de datos persistidos
   - Es una corrección localizada y mantenible

## Verificación Manual

Para verificar que la solución funciona:

1. Iniciar el servidor:
   ```bash
   npm start
   ```

2. En la interfaz, agregar una persona llamada "Jasper"

3. Agregar 4-5 parejas diferentes a Jasper:
   - Pareja 1
   - Pareja 2
   - Pareja 3
   - Pareja 4

4. **Resultado esperado**: Los nombres de todas las parejas deben aparecer correctamente en el árbol genealógico

5. Crear hijos desde Jasper y cada pareja para confirmar que las relaciones están correctas

## Impacto de Performance

- **Mínimo**: La función realiza una única pasada recursiva sobre la estructura del árbol
- **Complejidad**: O(n) donde n es el número total de nodos
- **Se ejecuta**: Solo después de que `dSeeder` genera el árbol (una sola vez por renderizado)

## Regresiones a Considerar

En futuras modificaciones, recuerda:

1. Si cambias la estructura de datos `marriages`, actualiza `fixMultipleSpouseNames`
2. Si modificas `dSeeder`, verifica que el nombre del cónyuge se asigne correctamente
3. Si añades nuevos campos a los nodos de parejas, considera si necesitan corrección similar

## Referencias

- **Librería dSeeder**: v1.0.0 - Genera estructura jerárquica desde datos planos
- **Librería dTree**: v2.4.1 - Renderiza árboles genealógicos
- **React**: v19.2.0 - Framework base
- **D3**: v4.13.0 - Librería de visualización subyacente

## Conclusión

La solución es minimalista, localizada y mantenible. Funciona correctamente para múltiples parejas y no introduce cambios estructurales en la aplicación. Los tests unitarios garantizan que la función mantiene su comportamiento esperado a lo largo del tiempo.