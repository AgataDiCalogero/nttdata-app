import { IdService } from './id.service';

describe('IdService', () => {
  let service: IdService;

  beforeEach(() => {
    // IdService is a pure utility service with no DI dependencies, instantiate directly
    service = new IdService();
  });

  it('should generate incremental IDs with default prefix', () => {
    // Arrange & Act
    const id1 = service.next();
    const id2 = service.next();

    // Assert
    expect(id1).toBe('id-1');
    expect(id2).toBe('id-2');
  });

  it('should generate incremental IDs with custom prefix', () => {
    // Arrange & Act
    const id1 = service.next('custom');
    const id2 = service.next('custom');

    // Assert
    expect(id1).toBe('custom-1');
    expect(id2).toBe('custom-2');
  });

  it('should reset specific prefix counter', () => {
    // Arrange
    service.next('test');
    service.next('test');

    // Act
    service.reset('test');
    const id = service.next('test');

    // Assert
    expect(id).toBe('test-1');
  });

  it('should reset all counters when no prefix provided', () => {
    // Arrange
    service.next('a');
    service.next('b');

    // Act
    service.reset();
    const idA = service.next('a');
    const idB = service.next('b');

    // Assert
    expect(idA).toBe('a-1');
    expect(idB).toBe('b-1');
  });
});
