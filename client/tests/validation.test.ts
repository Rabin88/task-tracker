import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from '../src/features/auth/schemas';
import { taskFormSchema } from '../src/features/tasks/schemas';
import { validate } from '../src/lib/validate';

describe('loginSchema', () => {
  it('trims and lowercases the email', () => {
    expect(validate(loginSchema, { email: '  Rabin@Example.COM ', password: 'x' }).data).toEqual({
      email: 'rabin@example.com',
      password: 'x',
    });
  });

  it('requires both fields', () => {
    expect(validate(loginSchema, { email: '', password: '' }).errors).toEqual({
      email: 'Email is required',
      password: 'Password is required',
    });
  });

  it('rejects an invalid email', () => {
    expect(validate(loginSchema, { email: 'not-an-email', password: 'x' }).errors).toEqual({
      email: 'Invalid email address',
    });
  });
});

describe('registerSchema', () => {
  const valid = { email: 'a@b.com', password: 'password1', confirmPassword: 'password1' };

  it('accepts valid input', () => {
    expect(validate(registerSchema, valid).errors).toBeNull();
  });

  it('needs at least 8 characters, and at most 72', () => {
    expect(validate(registerSchema, { ...valid, password: 'short', confirmPassword: 'short' }).errors).toEqual({
      password: 'Password must be at least 8 characters',
    });
    const long = 'a'.repeat(73);
    expect(validate(registerSchema, { ...valid, password: long, confirmPassword: long }).errors).toEqual({
      password: 'Password must be at most 72 characters',
    });
  });

  it('needs the passwords to match', () => {
    expect(validate(registerSchema, { ...valid, confirmPassword: 'different1' }).errors).toEqual({
      confirmPassword: 'Passwords do not match',
    });
  });
});

describe('taskFormSchema', () => {
  it('trims the title and turns an empty description into null', () => {
    expect(validate(taskFormSchema, { title: '  Buy milk ', description: '   ', status: 'todo' }).data).toEqual({
      title: 'Buy milk',
      description: null,
      status: 'todo',
    });
  });

  it('rejects a blank title', () => {
    expect(validate(taskFormSchema, { title: '   ', description: '', status: 'todo' }).errors).toEqual({
      title: 'Title is required',
    });
  });

  it('enforces the server limits', () => {
    expect(
      validate(taskFormSchema, { title: 'a'.repeat(201), description: 'b'.repeat(501), status: 'todo' }).errors,
    ).toEqual({
      title: 'Title must be at most 200 characters',
      description: 'Description must be at most 500 characters',
    });
  });

  it('rejects an unknown status', () => {
    expect(validate(taskFormSchema, { title: 'x', description: '', status: 'archived' }).errors).toHaveProperty(
      'status',
    );
  });
});
