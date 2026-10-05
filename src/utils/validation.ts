const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isEmail = (value: string): boolean => EMAIL_RE.test(value);
