// SaaS Theme for Agentrino - Clean, Professional
export const colors = {
  // Primary Brand Colors
  primaryBlue: '#2563eb',
  primaryHover: '#1d4ed8',
  primaryLight: '#3b82f6',

  // Dark Backgrounds
  darkBg: '#0f172a',
  cardBg: '#1e293b',
  borderColor: '#334155',

  // Light Backgrounds
  lightBg: '#f8fafc',
  lightCardBg: '#ffffff',
  lightBorderColor: '#e2e8f0',

  // Accent Colors
  accentBlue: '#0ea5e9',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',

  // Text Colors
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',

  // Light mode text
  lightTextPrimary: '#1e293b',
  lightTextSecondary: '#475569',

  // Message Colors
  userMessageBg: 'rgba(37, 99, 235, 0.15)',
  userMessageBorder: 'rgba(37, 99, 235, 0.3)',
  assistantMessageBg: 'rgba(14, 165, 233, 0.1)',
  assistantMessageBorder: 'rgba(14, 165, 233, 0.2)',
  userText: '#f1f5f9',
  assistantText: '#e2e8f0',

  // UI Elements
  inputBg: 'rgba(15, 23, 42, 0.8)',
  inputBorder: 'rgba(100, 116, 139, 0.3)',
  inputFocusBorder: '#2563eb',

  // Status
  connected: '#10b981',
  connecting: '#f59e0b',
  error: '#ef4444',
  disconnected: '#64748b',
} as const;

export type ColorKey = keyof typeof colors;
