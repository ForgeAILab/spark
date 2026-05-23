import { describe, expect, test } from 'bun:test';
import { ZeroProvider } from '../src/ZeroProvider.tsx';

describe('ZeroProvider', () => {
  test('exports a provider component', () => {
    expect(typeof ZeroProvider).toBe('function');
  });
});
