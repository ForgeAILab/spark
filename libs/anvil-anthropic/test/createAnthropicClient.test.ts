import { describe, expect, test } from 'bun:test';
import { createAnthropicClient } from '../src/createAnthropicClient';

describe('createAnthropicClient', () => {
  test('returns an Anthropic client shape', () => {
    expect(createAnthropicClient('test-key')).toHaveProperty('messages');
  });
});
