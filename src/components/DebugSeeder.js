/**
 * Componente de debugging para ver exactamente qué retorna dSeeder
 * para el caso de Jasper con múltiples parejas
 */

import React, { useEffect, useState } from 'react';

export function DebugSeeder() {
  const [seederData, setSeederData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const debugDSeeder = async () => {
      try {
        // Cargar las librerías
        const script1 = document.createElement('script');
        script1.src = 'https://d3js.org/d3.v4.min.js';
        document.head.appendChild(script1);

        const script2 = document.createElement('script');
        script2.src = 'https://cdn.jsdelivr.net/lodash/4.17.4/lodash.min.js';
        document.head.appendChild(script2);

        const script3 = document.createElement('script');
        script3.src = 'https://cdn.jsdelivr.net/npm/dtree-seed@1.0.0/dist/dSeeder.min.js';
        script3.onload = () => {
          // Cuando dSeeder esté listo
          setTimeout(() => {
            if (window.dSeeder) {
              // Crear datos de prueba
              const testData = [
                { id: 1, name: "Jasper", gender: "man", parent1Id: null, parent2Id: null, partners: [10, 11, 12, 13] },
                { id: 10, name: "Pareja1", gender: "woman", parent1Id: null, parent2Id: null, partners: [1] },
                { id: 11, name: "Pareja2", gender: "woman", parent1Id: null, parent2Id: null, partners: [1] },
                { id: 12, name: "Pareja3", gender: "woman", parent1Id: null, parent2Id: null, partners: [1] },
                { id: 13, name: "Pareja4", gender: "woman", parent1Id: null, parent2Id: null, partners: [1] }
              ];

              const options = {
                class: (member) => member.gender || '',
                textClass: () => '',
                extra: (member) => ({ nickname: member.nickname, originalId: member.id })
              };

              const result = window.dSeeder.seed(testData, 1, options);
              
              console.log('🎯 dSeeder.seed() retornó:', result);
              setSeederData(result);
            } else {
              console.error('dSeeder no se cargó correctamente');
              setSeederData({ error: 'dSeeder not loaded' });
            }
            setLoading(false);
          }, 100);
        };
        document.head.appendChild(script3);
      } catch (err) {
        console.error('Error al cargar dSeeder:', err);
        setSeederData({ error: err.message });
        setLoading(false);
      }
    };

    debugDSeeder();
  }, []);

  if (loading) {
    return <div>Cargando dSeeder...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', overflow: 'auto' }}>
      <h3>📊 Estructura retornada por dSeeder.seed():</h3>
      <pre>{JSON.stringify(seederData, null, 2)}</pre>
    </div>
  );
}