import { describe, it, expect } from 'vitest';
import {
  expectedIdLength,
  isValidId,
  isValidIdAnyRole,
  inferRoleFromId,
} from '../id-validation';

describe('expectedIdLength', () => {
  it('returns 7 for employees', () => {
    expect(expectedIdLength('employee')).toBe(7);
  });
  it('returns 9 for students', () => {
    expect(expectedIdLength('student')).toBe(9);
  });
});

describe('isValidId', () => {
  it('accepts 9 digits for student', () => {
    expect(isValidId('123456789', 'student')).toBe(true);
  });
  it('accepts 7 digits for employee', () => {
    expect(isValidId('1234567', 'employee')).toBe(true);
  });
  it('rejects 7 digits for student', () => {
    expect(isValidId('1234567', 'student')).toBe(false);
  });
  it('rejects 9 digits for employee', () => {
    expect(isValidId('123456789', 'employee')).toBe(false);
  });
  it('rejects non-digits', () => {
    expect(isValidId('12345abc', 'employee')).toBe(false);
    expect(isValidId('12345-789', 'student')).toBe(false);
  });
  it('rejects empty', () => {
    expect(isValidId('', 'student')).toBe(false);
    expect(isValidId('', 'employee')).toBe(false);
  });
});

describe('isValidIdAnyRole', () => {
  it('accepts 7 digits', () => {
    expect(isValidIdAnyRole('1234567')).toBe(true);
  });
  it('accepts 9 digits', () => {
    expect(isValidIdAnyRole('123456789')).toBe(true);
  });
  it('rejects 8 digits', () => {
    expect(isValidIdAnyRole('12345678')).toBe(false);
  });
  it('rejects letters', () => {
    expect(isValidIdAnyRole('abcdefghi')).toBe(false);
  });
});

describe('inferRoleFromId', () => {
  it('infers employee from 7 digits', () => {
    expect(inferRoleFromId('1234567')).toBe('employee');
  });
  it('infers student from 9 digits', () => {
    expect(inferRoleFromId('123456789')).toBe('student');
  });
  it('returns null for invalid lengths', () => {
    expect(inferRoleFromId('12345')).toBeNull();
    expect(inferRoleFromId('1234567890')).toBeNull();
  });
});
