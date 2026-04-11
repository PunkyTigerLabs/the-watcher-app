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
// Clean, institutional, transparent — like USDC itself
export const superman = {
  primary: '#4A9FFF',       // Bright steel blue
  primaryBright: '#70B8FF',
  primaryDim: 'rgba(74,159,255,0.12)',
  primaryGlow: 'rgba(74,159,255,0.25)',
  accent: '#00D4FF',        // Cyan accent
  accentDim: 'rgba(0,212,255,0.10)',
  mint: '#4A9FFF',
  burn: '#FF3B5C',
  bg: '#060A14',            // Deep cold navy
  surface: '#0A1024',       // Cold steel surface
  borderColor: 'rgba(74,159,255,0.15)',
  gradient: ['#0C1530', '#060A14', '#040810'] as const,
  glowGradient: ['rgba(74,159,255,0.12)', 'rgba(74,159,255,0)'] as const,
  tabIcon: '◇',
  tokenName: 'USDC',
  entityName: 'Circle',
  tagline: 'Superman',
};

// ---- Bizarro Theme (USDT) ----
// Underground, opaque, dangerous — the shadow world of stablecoins
export const bizarro = {
  primary: '#FF6B35',       // Hot amber/orange — NOT tether green
  primaryBright: '#FF8C5A',
  primaryDim: 'rgba(255,107,53,0.12)',
  primaryGlow: 'rgba(255,107,53,0.25)',
  accent: '#FF0013',        // TRON red as accent
  accentDim: 'rgba(255,0,19,0.10)',
  mint: '#FF6B35',
  burn: '#FF3B5C',
  bg: '#0F0804',            // Deep warm black
  surface: '#1A0E06',       // Dark amber surface
  borderColor: 'rgba(255,107,53,0.15)',
  gradient: ['#1A0C04', '#0F0804', '#080402'] as const,
  glowGradient: ['rgba(255,107,53,0.12)', 'rgba(255,107,53,0)'] as const,
  tabIcon: '⬡',
  tokenName: 'USDT',
  entityName: 'Tether',
  tagline: 'Bizarro',
  // TRON visual distinction
  tron: {
    color: '#FF0013',
    dim: 'rgba(255,0,19,0.12)',
    glow: 'rgba(255,0,19,0.25)',
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
  superman: ['#0C1530', '#060A14', '#040810'] as const,
  bizarro: ['#1A0C04', '#0F0804', '#080402'] as const,
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
