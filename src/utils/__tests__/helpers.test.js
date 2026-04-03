import { initializeTreeData, sanitizeStoredMembers } from '../helpers';
import { familyTreeData } from '../../data/familyTreeData';

describe('sanitizeStoredMembers (conservative policy)', () => {
  test('returns empty array for null input', () => {
    expect(sanitizeStoredMembers(null)).toEqual([]);
  });

  test('converts numeric-string ids to numbers and filters invalid partners', () => {
    const input = [
      { id: '10', name: 'A', sex: 'M', partners: ['11', 'x'] },
    ];
    const out = sanitizeStoredMembers(input);
    expect(out.length).toBe(1);
    expect(out[0].id).toBe(10);
    expect(Array.isArray(out[0].partners)).toBe(true);
    expect(out[0].partners).toEqual([11]);
  });

  test('discards member with non-numeric id', () => {
    const input = [{ id: 'abc', name: 'Bad' }];
    expect(sanitizeStoredMembers(input)).toEqual([]);
  });

  test('dedupes partners and excludes self id', () => {
    const input = [{ id: '5', name: 'X', partners: ['5', '6', '6'] }];
    const out = sanitizeStoredMembers(input);
    expect(out.length).toBe(1);
    expect(out[0].partners).toEqual([6]);
  });

  test('seed data returns array of members', () => {
    const out = sanitizeStoredMembers(familyTreeData);
    expect(Array.isArray(out)).toBe(true);
    expect(out.length).toBeGreaterThan(0);
    expect(out[0]).toHaveProperty('id');
  });

  test('initializeTreeData usa los datos guardados sin reinyectar el árbol por defecto', () => {
    window.localStorage.setItem(
      'genealogiaTreeData',
      JSON.stringify([{ id: 99, name: 'Solo Importado', parent1Id: null, parent2Id: null, gender: 'man', partners: [] }])
    );

    const loaded = initializeTreeData();

    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe(99);
    expect(loaded[0].name).toBe('Solo Importado');
  });

  test('initializeTreeData recupera borrados persistidos al recargar', () => {
    const withoutRoot = sanitizeStoredMembers(familyTreeData).filter((member) => member.id !== 0);
    window.localStorage.setItem('genealogiaTreeData', JSON.stringify(withoutRoot));

    const loaded = initializeTreeData();

    expect(loaded.some((member) => member.id === 0)).toBe(false);
  });
});
