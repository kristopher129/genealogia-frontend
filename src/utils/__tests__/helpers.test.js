import { sanitizeStoredMembers } from '../helpers';
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

  test('mergeWithDefaultMembers merges stored members with defaults and combines partners', () => {
    const { mergeWithDefaultMembers } = require('../helpers');
    const stored = [{ id: 0, name: 'Niclas Modified', partners: [99] }];
    const merged = mergeWithDefaultMembers(stored);
    const niclas = merged.find((m) => m.id === 0);
    expect(niclas).toBeTruthy();
    // default partners for id 0 include 1 (from seed); merged should contain both 1 and 99
    expect(Array.isArray(niclas.partners)).toBe(true);
    expect(niclas.partners).toEqual(expect.arrayContaining([1, 99]));
  });
});
