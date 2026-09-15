import { describe, expect, it } from 'vitest';
import { loadChildProfile } from './profile';

describe('child profile', () => {
  it('carries name, age and grade from the account', () => {
    const profile = loadChildProfile('?name=Sam&age=9&grade=4');
    expect(profile).toEqual({ name: 'Sam', age: 9, grade: '4' });
  });

  it('accepts the pre-Grade-1 years', () => {
    expect(loadChildProfile('?name=Sam&grade=jk').grade).toBe('JK');
    expect(loadChildProfile('?name=Sam&grade=SK').grade).toBe('SK');
    expect(loadChildProfile('?name=Sam&grade=EL').grade).toBe('EL');
  });

  it('returns null for anything sign-up did not capture, so intake asks', () => {
    const profile = loadChildProfile('?name=Sam');
    expect(profile.age).toBeNull();
    expect(profile.grade).toBeNull();
  });

  it('also accepts the short label the chips show, since a host may send it', () => {
    expect(loadChildProfile('?name=Sam&grade=Early').grade).toBe('EL');
  });

  it('rejects an out-of-range age or an unknown grade rather than trusting it', () => {
    // A bad value must not become a placement measured against nothing.
    expect(loadChildProfile('?name=Sam&age=99').age).toBeNull();
    expect(loadChildProfile('?name=Sam&age=seven').age).toBeNull();
    expect(loadChildProfile('?name=Sam&grade=12').grade).toBeNull();
  });
});
