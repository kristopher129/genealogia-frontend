// Script de debug para probar fixMultipleSpouseNames
import { fixMultipleSpouseNames } from './src/utils/helpers.js';

// Datos simulados que replican el problema
const testMembers = [
  { id: 1, name: "Jasper", gender: "man", partners: [10, 11, 12, 13] },
  { id: 10, name: "Pareja1", gender: "woman", partners: [1] },
  { id: 11, name: "Pareja2", gender: "woman", partners: [1] },
  { id: 12, name: "Pareja3", gender: "woman", partners: [1] },
  { id: 13, name: "Pareja4", gender: "woman", partners: [1] }
];

// Simular estructura jerárquica con el bug
const seededData = [
  {
    id: 1,
    name: "Jasper",
    marriages: [
      {
        spouse: { id: 10, name: "Jasper" }, // BUG: nombre incorrecto
        children: []
      },
      {
        spouse: { id: 11, name: "Jasper" }, // BUG: nombre incorrecto
        children: []
      },
      {
        spouse: { id: 12, name: "Jasper" }, // BUG: nombre incorrecto
        children: []
      },
      {
        spouse: { id: 13, name: "Jasper" }, // BUG: nombre incorrecto
        children: []
      }
    ]
  }
];

console.log('🔴 ANTES de fixMultipleSpouseNames:');
console.log(JSON.stringify(seededData, null, 2));

// Crear mapa de datos originales
const originalDataMap = new Map(testMembers.map(m => [m.id, m]));

// Aplicar corrección
const fixed = fixMultipleSpouseNames(seededData, originalDataMap);

console.log('✅ DESPUÉS de fixMultipleSpouseNames:');
console.log(JSON.stringify(fixed, null, 2));

// Verificar resultados
console.log('\n📊 Verificación:');
fixed[0].marriages.forEach((marriage, index) => {
  const expectedName = `Pareja${index + 1}`;
  const actualName = marriage.spouse.name;
  const status = actualName === expectedName ? '✅' : '❌';
  console.log(`${status} Marriage ${index + 1}: expected "${expectedName}", got "${actualName}"`);
});