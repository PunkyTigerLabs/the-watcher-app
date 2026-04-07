// ============================================
// THE WATCHER — Design System
// ============================================
// Superman (USDC) = cool blue/teal
// Bizarro (USDT) = warm red/amber

export const colors = {
  // Deep layered backgrounds — not flat black
  bg: '#06090F',
  bgAlt: '#080C14',
  surface: 'rgba(12,18,30,0.85)',
  surface2: 'rgba(18,26,42,0.7)',
  surfaceSolid: '#0C121E',
  border: 'rgba(40,60,100,0.25)',
  borderActive: 'rgba(0,200,120,0.3)',

  // Signature green — less neon, more premium
  green: '#00C896',
  greenBright: '#00FFAA',
  greenDim: 'rgba(0,200,150,0.10)',
  greenGlow: 'rgba(0,200,150,0.20)',
  greenPulse: 'rgba(0,255,170,0.06)',

  // Accent palette
  gold: '#E8A838',
  goldDim: 'rgba(232,168,56,0.10)',
  red: '#FF3B5C',
  redDim: 'rgba(255,59,92,0.10)',
  cyan: '#00D4FF',
  cyanDim: 'rgba(0,212,255,0.08)',

  // Text hierarchy
  text: '#F0F4FA',
  textSub: '#8899B0',
  muted: '#4A5670',

  // Chain colors
  eth: '#627EEA',
  sol: '#9945FF',
  arb: '#28A0F0',
  base: '#0052FF',
  poly: '#8247E5',
  tron: '#FF0013',
};

// ---- Superman Theme (USDC) ----
export const superman = {
  primary: '#2775CA',       // USDC blue
  primaryBright: '#4A9FFF',
  primaryDim: 'rgba(39,117,202,0.10)',
  primaryGlow: 'rgba(39,117,202,0.20)',
  accent: '#00D4FF',        // Cyan accent
  accentDim: 'rgba(0,212,255,0.08)',
  mint: '#00C896',
  burn: '#FF3B5C',
  gradient: ['#0A1428', '#060A12', '#040810'] as const,
  glowGradient: ['rgba(39,117,202,0.08)', 'rgba(39,117,202,0)'] as const,
  tabIcon: '◇',
  tokenName: 'USDC',
  entityName: 'Circle',
  tagline: 'Superman',
};

// ---- Bizarro Theme (USDT) ----
export const bizarro = {
  primary: '#26A17B',       // Tether green
  primaryBright: '#50C878',
  primaryDim: 'rgba(38,161,123,0.10)',
  primaryGlow: 'rgba(38,161,123,0.20)',
  accent: '#FF6B35',        // Warm amber/orange accent
  accentDim: 'rgba(255,107,53,0.08)',
  mint: '#26A17B',
  burn: '#FF3B5C',
  gradient: ['#140A0A', '#0C0606', '#080404'] as const,
  glowGradient: ['rgba(38,161,123,0.08)', 'rgba(38,161,123,0)'] as const,
  tabIcon: '⬡',
  tokenName: 'USDT',
  entityName: 'Tether',
  tagline: 'Bizarro',
  // TRON visual distinction
  tron: {
    color: '#FF0013',
    dim: 'rgba(255,0,19,0.10)',
    glow: 'rgba(255,0,19,0.20)',
    label: 'TRON UNDERGROUND',
  },
};

export type TokenTheme = typeof superman | typeof bizarro;

// Gradient presets
export const gradients = {
  hero: ['#0A1020', '#060A12', '#040810'] as const,
  card: ['rgba(12,18,30,0.9)', 'rgba(8,14,24,0.95)'] as const,
  glow: ['rgba(0,200,150,0.08)', 'rgba(0,200,150,0)'] as const,
  danger: ['rgba(255,59,92,0.06)', 'rgba(255,59,92,0)'] as const,
  headerOverlay: ['rgba(6,9,15,0)', 'rgba(6,9,15,1)'] as const,
  superman: ['#0A1428', '#060A12', '#040810'] as const,
  bizarro: ['#140A0A', '#0C0606', '#080404'] as const,
};

export const CHAIN_COLORS: Record<string, string> = {
  ETH: colors.eth,
  ethereum: colors.eth,
  SOL: colors.sol,
  ARB: colors.arb,
  BASE: colors.base,
  base: colors.base,
  POLY: colors.poly,
  TRON: colors.tron,
  tron: colors.tron,
};

export const TOKEN_COLORS: Record<string, string> = {
  USDC: '#2775CA',
  USDT: '#26A17B',
  DAI: '#E8A838',
  PYUSD: '#5B62E0',
};
