// Nuitee Brand Colors and Tokens

export const brand = {
  // Primary colors
  primary: '#443D8D', // LiteAPI purple
  navy: '#143b5c', // Nuitee dark navy
  teal: '#025964',

  // Semantic colors
  healthy: '#025964', // Teal for healthy stages
  leak: '#dc6b40', // Amber/red for cliff annotation
  leakBg: '#fef3ee', // Light background for leak highlight

  // Backgrounds
  bgLight: '#F8F8F8',
  bgWhite: '#ffffff',

  // Text
  textPrimary: '#143b5c',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',

  // Borders
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
} as const;

export const fonts = {
  heading: 'var(--font-onest)',
  body: 'var(--font-inter)',
} as const;
