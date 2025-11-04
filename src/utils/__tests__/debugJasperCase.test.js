/**
 * Debug test para simular exactamente el caso de Jasper con múltiples parejas
 * Este test importa la función fixMultipleSpouseNames y realiza debugging detallado
 */

import { fixMultipleSpouseNames } from '../helpers';

// Mock simple de dSeeder.seed que simula su comportamiento
// basado en lo que retorna para múltiples parejas
const mockDSeederSeed = (members) => {
  // Jasper es el padre
  const jasper = members.find(m => m.name === "Jasper");
  
  if (!jasper) {
    return [];
  }

  // dSeeder crea una estructura jerárquica donde Jasper es la raíz
  // y sus parejas están en un array de marriages
  const jasperNode = {
    id: jasper.id,
    name: jasper.name,
    marriages: []
  };

  // Crear un marriage para cada pareja
  if (jasper.partners && jasper.partners.length > 0) {
    jasper.partners.forEach((partnerId) => {
      const partner = members.find(m => m.id === partnerId);
      if (partner) {
        jasperNode.marriages.push({
          spouse: {
            id: partner.id,
            name: jasper.name, // El BUG: dSeeder asigna el nombre de Jasper a la pareja
            gender: partner.gender
          },
          children: []
        });
      }
    });
  }

  return [jasperNode];
};

describe('Debug: Jasper con múltiples parejas', () => {
  test('Simula exactamente el escenario reportado', () => {
    // Crear datos de prueba que simulan exactamente el caso de Jasper
    const testMembers = [
      { id: 1, name: "Jasper", gender: "man", partners: [10, 11, 12, 13] },
      { id: 10, name: "Pareja1", gender: "woman", partners: [1] },
      { id: 11, name: "Pareja2", gender: "woman", partners: [1] },
      { id: 12, name: "Pareja3", gender: "woman", partners: [1] },
      { id: 13, name: "Pareja4", gender: "woman", partners: [1] }
    ];

    // Simular lo que retorna dSeeder
    const seededData = mockDSeederSeed(testMembers);

    console.log('🔴 ANTES de fixMultipleSpouseNames:');
    console.log(JSON.stringify(seededData, null, 2));

    // Verificar que el bug está presente en la estructura simulada
    expect(seededData[0].marriages[0].spouse.name).toBe("Jasper");
    expect(seededData[0].marriages[1].spouse.name).toBe("Jasper");
    expect(seededData[0].marriages[2].spouse.name).toBe("Jasper");
    expect(seededData[0].marriages[3].spouse.name).toBe("Jasper");

    // Crear el mapa de datos originales
    const originalDataMap = new Map(testMembers.map(m => [m.id, m]));

    // Aplicar la corrección
    const fixed = fixMultipleSpouseNames(seededData, originalDataMap);

    console.log('✅ DESPUÉS de fixMultipleSpouseNames:');
    console.log(JSON.stringify(fixed, null, 2));

    // Verificar que la corrección funcionó
    expect(fixed[0].marriages[0].spouse.name).toBe("Pareja1");
    expect(fixed[0].marriages[1].spouse.name).toBe("Pareja2");
    expect(fixed[0].marriages[2].spouse.name).toBe("Pareja3");
    expect(fixed[0].marriages[3].spouse.name).toBe("Pareja4");
  });

  test('Verifica que dSeeder podría estar creando otra estructura', () => {
    // Quizás dSeeder crea una estructura diferente
    // donde el spouse podría tener otras propiedades
    const seededDataVariant = [
      {
        id: 1,
        name: "Jasper",
        marriages: [
          {
            spouse: {
              id: 10,
              name: "Jasper",
              gender: "woman",
              originalId: 10 // dSeeder podría agregar esto
            },
            children: []
          },
          {
            spouse: {
              id: 11,
              name: "Jasper",
              gender: "woman",
              originalId: 11
            },
            children: []
          },
          {
            spouse: {
              id: 12,
              name: "Jasper",
              gender: "woman",
              originalId: 12
            },
            children: []
          }
        ]
      }
    ];

    const originalDataMap = new Map([
      [1, { id: 1, name: "Jasper" }],
      [10, { id: 10, name: "Pareja1" }],
      [11, { id: 11, name: "Pareja2" }],
      [12, { id: 12, name: "Pareja3" }]
    ]);

    const fixed = fixMultipleSpouseNames(seededDataVariant, originalDataMap);

    // Incluso con propiedades adicionales, debe funcionar
    expect(fixed[0].marriages[0].spouse.name).toBe("Pareja1");
    expect(fixed[0].marriages[1].spouse.name).toBe("Pareja2");
    expect(fixed[0].marriages[2].spouse.name).toBe("Pareja3");
  });

  test('Verifica que el fix no afecta datos que ya están correctos', () => {
    const correctData = [
      {
        id: 1,
        name: "Jasper",
        marriages: [
          {
            spouse: {
              id: 10,
              name: "Pareja1", // Ya correcto
              gender: "woman"
            },
            children: []
          }
        ]
      }
    ];

    const originalDataMap = new Map([
      [1, { id: 1, name: "Jasper" }],
      [10, { id: 10, name: "Pareja1" }]
    ]);

    const fixed = fixMultipleSpouseNames(correctData, originalDataMap);

    // Los datos correctos no deben cambiar
    expect(fixed[0].marriages[0].spouse.name).toBe("Pareja1");
    expect(fixed).toEqual(correctData); // Debe ser exactamente igual
  });

  test('Verifica que el fix maneja datos sin estructura de marriages', () => {
    const flatData = [
      { id: 1, name: "Jasper", partners: [10] },
      { id: 10, name: "Pareja1", partners: [1] }
    ];

    const originalDataMap = new Map([
      [1, { id: 1, name: "Jasper" }],
      [10, { id: 10, name: "Pareja1" }]
    ]);

    const fixed = fixMultipleSpouseNames(flatData, originalDataMap);

    // Los datos sin marriages deben devolverse sin cambios
    expect(fixed).toEqual(flatData);
  });
});