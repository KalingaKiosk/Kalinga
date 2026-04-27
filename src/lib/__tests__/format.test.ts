import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { daysSince } from '../format';

describe('daysSince', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-27T12:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns minutes when under 1 hour', () => {
    expect(daysSince('2026-04-27T11:30:00Z')).toBe('30m');
  });

  it('returns hours when under 1 day', () => {
    expect(daysSince('2026-04-27T08:00:00Z')).toBe('4h');
  });

  it('returns days when under 1 week', () => {
    expect(daysSince('2026-04-25T12:00:00Z')).toBe('2d');
  });

  it('returns weeks when 1 week or more', () => {
    expect(daysSince('2026-04-13T12:00:00Z')).toBe('2w');
  });

  it('returns "now" for very recent timestamps', () => {
    expect(daysSince('2026-04-27T11:59:30Z')).toBe('now');
  });

  it('returns empty string for null/undefined', () => {
    expect(daysSince(null)).toBe('');
    expect(daysSince(undefined)).toBe('');
    expect(daysSince('')).toBe('');
  });
});
