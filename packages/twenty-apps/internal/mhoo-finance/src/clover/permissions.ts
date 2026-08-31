export const CLOVER_REQUIRED_READ_PERMISSIONS = [
  'Read customers',
  'Read employees',
  'Read inventory',
  'Read merchant',
  'Read orders',
  'Read payments',
] as const;

export const CLOVER_FORBIDDEN_EFFECT_PERMISSIONS = [
  'Write customers',
  'Write employees',
  'Write inventory',
  'Write merchant',
  'Write orders',
  'Write payments',
  'Online payments',
] as const;
