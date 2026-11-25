import { Ids, isUuidV7 } from '../../../src/shared/ids/ids.ts';

describe('Ids', () => {
  it('issues distinct UUIDv7 values that grow in order', () => {
    const ids = new Ids();
    const issued = Array.from({ length: 100 }, () => ids.next());
    expect(issued.every((id) => isUuidV7(id))).toBe(true);
    expect(new Set(issued).size).toBe(issued.length);
    expect([...issued].sort()).toEqual(issued);
  });
});
