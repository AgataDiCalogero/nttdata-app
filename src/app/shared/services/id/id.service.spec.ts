import { IdService } from './id.service';

describe('IdService', () => {
  let service: IdService;

  beforeEach(() => {
    service = new IdService();
  });

  it('should generate incremental IDs with default prefix', () => {
    const id1 = service.next();
    const id2 = service.next();
    expect(id1).toBe('id-1');
    expect(id2).toBe('id-2');
  });

  it('should generate incremental IDs with custom prefix', () => {
    const id1 = service.next('custom');
    const id2 = service.next('custom');
    expect(id1).toBe('custom-1');
    expect(id2).toBe('custom-2');
  });

  it('should reset specific prefix counter', () => {
    service.next('test');
    service.next('test');
    service.reset('test');
    const id = service.next('test');
    expect(id).toBe('test-1');
  });

  it('should reset all counters when no prefix provided', () => {
    service.next('a');
    service.next('b');
    service.reset();
    const idA = service.next('a');
    const idB = service.next('b');
    expect(idA).toBe('a-1');
    expect(idB).toBe('b-1');
  });
});
