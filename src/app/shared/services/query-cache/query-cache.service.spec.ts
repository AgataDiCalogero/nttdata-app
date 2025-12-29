import { TestBed } from '@angular/core/testing';

import { QueryCacheService } from './query-cache.service';

describe('QueryCacheService', () => {
  let service: QueryCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [QueryCacheService],
    });
    service = TestBed.inject(QueryCacheService);
    service.clear();
  });

  it('returns null for missing keys', () => {
    expect(service.get('missing')).toBeNull();
  });

  it('stores and retrieves entries before expiration', () => {
    spyOn(Date, 'now').and.returnValues(1_000, 1_000, 1_100);
    service.set('k', 'val', { ttl: 500 });
    expect(service.get('k')).toBe('val');
  });

  it('expires entries that exceed ttl', () => {
    spyOn(Date, 'now').and.returnValues(1_000, 1_000, 2_000);
    service.set('k', 'val', { ttl: 500 });
    expect(service.get('k')).toBeNull();
  });

  it('reports has() based on expiration state', () => {
    spyOn(Date, 'now').and.returnValues(1_000, 1_000, 1_100);
    service.set('k', 'value', { ttl: 500 });
    expect(service.has('k')).toBeTrue();
  });

  it('invalidates entries by prefix', () => {
    service.set('posts|1', {}, { ttl: 1_000 });
    service.set('users|1', {}, { ttl: 1_000 });
    service.invalidate('posts|');

    expect(service.get('posts|1')).toBeNull();
    expect(service.get('users|1')).not.toBeNull();
  });

  it('invalidates entries via predicate', () => {
    service.set('keep', 'value', { ttl: 1_000 });
    service.set('drop', 'value', { ttl: 1_000 });
    service.invalidate((key) => key === 'drop');
    expect(service.get('drop')).toBeNull();
    expect(service.get('keep')).toBe('value');
  });

  it('clear removes everything', () => {
    service.set('a', 1);
    service.clear();
    expect(service.get('a')).toBeNull();
  });
});
