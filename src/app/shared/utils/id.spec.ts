import { createUniqueId } from './id';

describe('createUniqueId', () => {
  it('should generate incremental ids with default prefix', () => {
    // Arrange & Act
    const a = createUniqueId();
    const b = createUniqueId();

    // Extract numeric suffixes
    const numA = Number(a.split('-').pop());
    const numB = Number(b.split('-').pop());

    // Assert
    expect(a.startsWith('uid-')).toBeTrue();
    expect(numB - numA).toBe(1);
  });

  it('should generate incremental ids with custom prefix', () => {
    // Arrange & Act
    const a = createUniqueId('custom');
    const b = createUniqueId('custom');

    const prefixA = a.split('-')[0];
    const numA = Number(a.split('-').pop());
    const numB = Number(b.split('-').pop());

    // Assert
    expect(prefixA).toBe('custom');
    expect(numB - numA).toBe(1);
  });

  it('should increment the same global counter across different prefixes', () => {
    // Arrange & Act
    const a = createUniqueId('x');
    const b = createUniqueId('y');

    const numA = Number(a.split('-').pop());
    const numB = Number(b.split('-').pop());

    // Assert
    expect(a.startsWith('x-')).toBeTrue();
    expect(b.startsWith('y-')).toBeTrue();
    expect(numB - numA).toBe(1);
  });
});
