export const colors = {
  bg: '#080B12',
  surface: '#0D1117',
  surface2: '#131920',
  border: '#1C2333',
  green: '#00D97E',
  greenDim: 'rgba(0,217,126,0.12)',
  greenGlow: 'rgba(0,217,126,0.25)',
  gold: '#F5A623',
  goldDim: 'rgba(245,166,35,0.12)',
  red: '#FF4560',
  redDim: 'rgba(255,69,96,0.12)',
  text: '#E6EDF3',
  textSub: '#B0BAC6',
  muted: '#7D8590',
  // Chain colors
  eth: '#627EEA',
  sol: '#9945FF',
  arb: '#28A0F0',
  base: '#0052FF',
  poly: '#8247E5',
};

export const CHAIN_COLORS: Record<string, string> = {
  ETH: colors.eth,
  SOL: colors.sol,
  ARB: colors.arb,
  BASE: colors.base,
  POLY: colors.poly,
};

export const TOKEN_COLORS: Record<string, string> = {
  USDC: '#2775CA',
  USDT: '#26A17B',
  DAI: '#F5A623',
  PYUSD: '#5B62E0',
};
