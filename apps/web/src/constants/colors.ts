// Agent Chatter Brand Color Palette
// A modern, vibrant theme for AI agent conversations
export const colors = {
  // Primary Gradient Colors
  darkVoid: '#0a0a0f',
  cosmicPurple: '#1a1025',
  deepIndigo: '#15132b',
  electricViolet: '#8b5cf6',
  neonMagenta: '#d946ef',
  cyberCyan: '#06b6d4',

  // Accent Colors
  glowPurple: '#a855f7',
  glowPink: '#ec4899',
  glowBlue: '#3b82f6',
  glowGreen: '#22c55e',
  warmOrange: '#f97316',

  // Neutral Palette
  pureWhite: '#ffffff',
  snowWhite: '#f8fafc',
  silverMist: '#cbd5e1',
  slateGray: '#64748b',
  charcoal: '#1e293b',

  // Message-Specific Colors
  userMessageBg: 'rgba(139, 92, 246, 0.15)',
  userMessageBorder: 'rgba(139, 92, 246, 0.3)',
  assistantMessageBg: 'rgba(6, 182, 212, 0.1)',
  assistantMessageBorder: 'rgba(6, 182, 212, 0.2)',
  userText: '#f1f5f9',
  assistantText: '#e2e8f0',

  // UI Elements
  cardBg: 'rgba(30, 27, 50, 0.6)',
  cardBorder: 'rgba(139, 92, 246, 0.2)',
  cardHoverBorder: 'rgba(139, 92, 246, 0.5)',
  inputBg: 'rgba(15, 15, 25, 0.8)',
  inputBorder: 'rgba(100, 116, 139, 0.3)',
  inputFocusBorder: '#8b5cf6',
  buttonPrimary: '#8b5cf6',
  buttonHover: '#a855f7',
  buttonActive: '#7c3aed',

  // Status Colors
  connected: '#22c55e',
  connecting: '#f59e0b',
  error: '#ef4444',
  disconnected: '#6b7280',

  // Shadows and Glows
  glowShadow: 'rgba(139, 92, 246, 0.4)',
  darkShadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(10, 10, 15, 0.9)',
} as const;

export type ColorKey = keyof typeof colors;