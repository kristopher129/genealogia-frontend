/**
 * TEST: Verificar que TODAS las parejas aparecen en el árbol
 * 
 * Simula exactamente lo que el usuario reportó:
 * 1. Crear a Jasper
 * 2. Agregar Pareja1, Pareja2, Pareja3, Pareja4, Pareja5
 * 3. Verificar que TODAS aparecen en la estructura del árbol
 * 
 * IMPORTANTE: Vemos la diferencia entre:
 * - Pareja2: Aparece (porque tiene 1 hijo con Jasper)
 * - Pareja3+: Aparecen (porque `addMissingMarriages()` las agrega)
 */

import { addMissingMarriages } from '../helpers.js';

describe('🎯 Caso de Usuario: Jasper con Múltiples Parejas', () => {
  
  test('Verificar que Pareja2 (CON hijos) aparece en dSeeder', () => {
    // DATOS ORIGINALES: Jasper con 2 parejas, Pareja2 tiene 1 hijo con Jasper
    const originalData = [
      { id: 1, name: 'Jasper', gender: 'M', parents: [], partners: [10, 11] },
      { id: 10, name: 'Pareja1', gender: 'F', parents: [], partners: [1] },
      { id: 11, name: 'Pareja2', gender: 'F', parents: [], partners: [1] },
      { id: 100, name: 'Hijo1', gender: 'M', parents: [1, 11] },  // ← HIJO de Jasper + Pareja2
    ];

    // Simular lo que dSeeder RETORNA (con Pareja2 pero SIN Pareja1)
    // dSeeder solo crea marriages para parejas con hijos
    const seededData = [
      {
        id: 1,
        name: 'Jasper',
        marriages: [
          // Pareja2 aparece porque tiene hijo común
          {
            spouse: { id: 11, name: 'Pareja2' },
            children: [{ id: 100, name: 'Hijo1' }]
          }
          // Pareja1 NO APARECE (no tiene hijo)
        ]
      }
    ];

    const originalDataMap = new Map(originalData.map(m => [m.id, m]));

    // MOSTRAR ESTRUCTURA ANTES
    console.log('\n📊 ANTES (dSeeder - INCOMPLETO):');
    console.log('Jasper marriages:', seededData[0].marriages.map(m => m.spouse.name));
    // ➜ ['Pareja2']  ← Solo Pareja2

    // EJECUTAR LA SOLUCIÓN
    const corrected = addMissingMarriages(seededData, originalDataMap);

    // MOSTRAR ESTRUCTURA DESPUÉS
    console.log('\n📊 DESPUÉS (addMissingMarriages - COMPLETO):');
    console.log('Jasper marriages:', corrected[0].marriages.map(m => m.spouse.name));
    // ➜ ['Pareja2', 'Pareja1']  ← AMBAS aparecen

    // VERIFICAR
    expect(corrected[0].marriages.length).toBe(2);
    expect(corrected[0].marriages.map(m => m.spouse.name)).toContain('Pareja1');
    expect(corrected[0].marriages.map(m => m.spouse.name)).toContain('Pareja2');
  });

  test('⭐ CASO REAL: Jasper con 5 parejas (diferencia Pareja2 vs Pareja3+)', () => {
    // PASO 1: El usuario crea a Jasper y agrega 5 parejas
    const originalData = [
      { id: 1, name: 'Jasper', gender: 'M', parents: [], partners: [10, 11, 12, 13, 14] },
      { id: 10, name: 'Pareja1', gender: 'F', parents: [], partners: [1] },
      { id: 11, name: 'Pareja2', gender: 'F', parents: [], partners: [1] },
      { id: 12, name: 'Pareja3', gender: 'F', parents: [], partners: [1] },
      { id: 13, name: 'Pareja4', gender: 'F', parents: [], partners: [1] },
      { id: 14, name: 'Pareja5', gender: 'F', parents: [], partners: [1] },
      // Hijos: Solo Pareja1 y Pareja2 tienen hijos con Jasper
      { id: 100, name: 'Hijo_Pareja1', gender: 'M', parents: [1, 10] },
      { id: 101, name: 'Hijo_Pareja2', gender: 'F', parents: [1, 11] },
      // Pareja3, 4, 5 NO tienen hijos
    ];

    // PASO 2: dSeeder RETORNA (INCOMPLETO - solo parejas con hijos)
    const seededDataBefore = JSON.parse(JSON.stringify([
      {
        id: 1,
        name: 'Jasper',
        marriages: [
          {
            spouse: { id: 10, name: 'Pareja1' },
            children: [{ id: 100, name: 'Hijo_Pareja1' }]
          },
          {
            spouse: { id: 11, name: 'Pareja2' },
            children: [{ id: 101, name: 'Hijo_Pareja2' }]
          }
          // ❌ Pareja3, Pareja4, Pareja5 FALTAN
        ]
      }
    ]));

    const originalDataMap = new Map(originalData.map(m => [m.id, m]));

    // 📊 COMPARATIVA: Antes vs Después
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🔍 COMPARATIVA: Pareja2 (con hijos) vs Pareja3/4/5 (sin hijos)');
    console.log('═══════════════════════════════════════════════════════════');

    console.log('\n❌ ANTES (dSeeder - INCOMPLETO):');
    console.log('  Parejas que aparecen:');
    seededDataBefore[0].marriages.forEach((m, idx) => {
      console.log(`    [${idx + 1}] ${m.spouse.name} - Hijos: ${m.children.length}`);
    });
    console.log(`  Total: ${seededDataBefore[0].marriages.length}/5 parejas`);
    // ➜ 2/5

    // PASO 3: Aplicar la solución
    const seededDataAfter = addMissingMarriages(seededDataBefore, originalDataMap);

    console.log('\n✅ DESPUÉS (addMissingMarriages - COMPLETO):');
    console.log('  Parejas que aparecen:');
    seededDataAfter[0].marriages.forEach((m, idx) => {
      const tipoMarriage = originalData.find(d => d.id === m.spouse.id).partners ? 
        '(ORIGINAL)' : '(RESTAURADA)';
      console.log(`    [${idx + 1}] ${m.spouse.name} - Hijos: ${m.children.length || 0} ${tipoMarriage}`);
    });
    console.log(`  Total: ${seededDataAfter[0].marriages.length}/5 parejas`);
    // ➜ 5/5

    console.log('\n📋 DIFERENCIAS:');
    console.log('  Pareja1 (con 1 hijo):  ❌→✅ (solo dSeeder NO era suficiente)');
    console.log('  Pareja2 (con 1 hijo):  ❌→✅ (solo dSeeder NO era suficiente)');
    console.log('  Pareja3 (sin hijos):   ❌→✅ (SOLO por addMissingMarriages)');
    console.log('  Pareja4 (sin hijos):   ❌→✅ (SOLO por addMissingMarriages)');
    console.log('  Pareja5 (sin hijos):   ❌→✅ (SOLO por addMissingMarriages)');
    console.log('═══════════════════════════════════════════════════════════\n');

    // VERIFICACIONES
    expect(seededDataBefore[0].marriages.length).toBe(2); // Antes: solo las con hijos
    expect(seededDataAfter[0].marriages.length).toBe(5);  // Después: todas

    const nombresFinales = seededDataAfter[0].marriages.map(m => m.spouse.name);
    expect(nombresFinales).toEqual(['Pareja1', 'Pareja2', 'Pareja3', 'Pareja4', 'Pareja5']);
  });

  test('🎨 Visualización: Mostrar exactamente lo que el usuario ve', () => {
    const originalData = [
      { id: 1, name: 'Jasper', gender: 'M', parents: [], partners: [10, 11, 12] },
      { id: 10, name: 'Pareja1', gender: 'F', parents: [], partners: [1] },
      { id: 11, name: 'Pareja2', gender: 'F', parents: [], partners: [1] },
      { id: 12, name: 'Pareja3', gender: 'F', parents: [], partners: [1] },
      { id: 100, name: 'Hijo_P1', gender: 'M', parents: [1, 10] },
      { id: 101, name: 'Hijo_P2', gender: 'F', parents: [1, 11] },
    ];

    // Lo que el usuario ve en el navegador ANTES (problema):
    console.log('\n🌳 ÁRBOL GENEALÓGICO - ANTES (PROBLEMA):');
    console.log('  Jasper');
    console.log('  ├─ Pareja1 ←─ Hijo_P1');
    console.log('  ├─ Pareja2 ←─ Hijo_P2');
    console.log('  └─ ❌ Pareja3 NO APARECE  ❌');
    // ← El usuario reportó esto como bug

    const seededDataBefore = [
      {
        id: 1,
        name: 'Jasper',
        marriages: [
          { spouse: { id: 10, name: 'Pareja1' }, children: [{ id: 100, name: 'Hijo_P1' }] },
          { spouse: { id: 11, name: 'Pareja2' }, children: [{ id: 101, name: 'Hijo_P2' }] }
        ]
      }
    ];

    const originalDataMap = new Map(originalData.map(m => [m.id, m]));
    const seededDataAfter = addMissingMarriages(seededDataBefore, originalDataMap);

    // Lo que el usuario ve en el navegador DESPUÉS (solución):
    console.log('\n🌳 ÁRBOL GENEALÓGICO - DESPUÉS (SOLUCIONADO):');
    console.log('  Jasper');
    console.log('  ├─ Pareja1 ←─ Hijo_P1');
    console.log('  ├─ Pareja2 ←─ Hijo_P2');
    console.log('  └─ ✅ Pareja3  ✅');
    // ← Ahora Pareja3 aparece sin hijos

    expect(seededDataAfter[0].marriages.length).toBe(3);
    expect(seededDataAfter[0].marriages.find(m => m.spouse.name === 'Pareja3')).toBeDefined();
  });
});