export const currentSignal = {
  score: 67,
  label: 'ACCUMULATION',
  updatedAgo: '8 min ago',
  subscores: { stablecoin: 74, exchange: 71, whale: 62, crosschain: 58 },
};

export const aiNarrative = `Circle minted $1.2B USDC in the last 4h. $890M moved to institutional custody. BlackRock BUIDL received $312M. Jump Trading withdrew $298M from Binance — pre-positioning signal. Pattern matches Jan 2024 ETF approval rally with 81% confidence.`;

export const topInflows = [
  { name: 'Coinbase Prime', type: 'CEX', chain: 'ETH', amount: 812e6, timeAgo: '12m' },
  { name: 'BlackRock BUIDL', type: 'Institutional', chain: 'ETH', amount: 445e6, timeAgo: '28m' },
  { name: 'Aave V3', type: 'DeFi', chain: 'ETH', amount: 234e6, timeAgo: '45m' },
  { name: 'Binance', type: 'CEX', chain: 'ETH', amount: 189e6, timeAgo: '1h' },
  { name: 'Fidelity Crypto', type: 'Institutional', chain: 'BASE', amount: 156e6, timeAgo: '2h' },
];

export const topOutflows = [
  { name: 'Jump Trading', type: 'Institutional', chain: 'ETH', amount: 298e6, timeAgo: '34m' },
  { name: 'OKX', type: 'CEX', chain: 'ETH', amount: 187e6, timeAgo: '1h' },
  { name: 'Wormhole Bridge', type: 'DeFi', chain: 'SOL', amount: 134e6, timeAgo: '2h' },
  { name: 'Kraken', type: 'CEX', chain: 'ARB', amount: 98e6, timeAgo: '3h' },
  { name: 'Compound', type: 'DeFi', chain: 'ETH', amount: 67e6, timeAgo: '4h' },
];

export const mintEvents = [
  { time: '14:32', token: 'USDC', type: 'MINT', entity: 'Circle Treasury', chain: 'ETH', amount: 250e6 },
  { time: '13:15', token: 'USDT', type: 'MINT', entity: 'Tether', chain: 'ETH', amount: 180e6 },
  { time: '12:48', token: 'USDC', type: 'BURN', entity: 'Coinbase', chain: 'ETH', amount: 200e6 },
  { time: '12:10', token: 'USDC', type: 'MINT', entity: 'Circle Treasury', chain: 'SOL', amount: 150e6 },
  { time: '11:22', token: 'DAI', type: 'MINT', entity: 'MakerDAO', chain: 'ETH', amount: 95e6 },
  { time: '10:05', token: 'USDC', type: 'MINT', entity: 'Circle Treasury', chain: 'BASE', amount: 100e6 },
  { time: '09:30', token: 'PYUSD', type: 'MINT', entity: 'PayPal', chain: 'ETH', amount: 40e6 },
  { time: '08:12', token: 'USDT', type: 'BURN', entity: 'Kraken', chain: 'ETH', amount: 75e6 },
  { time: '07:44', token: 'USDT', type: 'MINT', entity: 'Tether', chain: 'SOL', amount: 300e6 },
];

export const mintChartData = [
  { day: 'M', mint: 820, burn: 340 }, { day: 'T', mint: 540, burn: 210 },
  { day: 'W', mint: 1200, burn: 480 }, { day: 'T', mint: 380, burn: 150 },
  { day: 'F', mint: 960, burn: 320 }, { day: 'S', mint: 240, burn: 90 },
  { day: 'S', mint: 680, burn: 260 },
];

export const whaleWallets = [
  { name: 'Binance Hot Wallet', address: '0x28C6...9ef5', type: 'CEX', action: 'Received $189M USDC', volume: 2.4e9, change: 12.4 },
  { name: 'BlackRock BUIDL', address: '0x831C...3a12', type: 'Institutional', action: 'Minted $445M', volume: 890e6, change: 34.2 },
  { name: 'Jump Trading', address: '0xF977...e4B2', type: 'Institutional', action: 'Withdrew $298M', volume: 620e6, change: -8.7 },
  { name: 'Coinbase Prime', address: '0xA9D1...2c88', type: 'CEX', action: 'Custody +$812M', volume: 1.8e9, change: 22.1 },
  { name: 'Fidelity Crypto', address: '0x6cC5...7d43', type: 'Institutional', action: 'Accumulated $156M', volume: 430e6, change: 18.9 },
  { name: 'Citadel Securities', address: '0x2Fab...9c11', type: 'Institutional', action: 'Bridge to Base', volume: 310e6, change: 5.3 },
  { name: 'OKX', address: '0x6cC5...f8b2', type: 'CEX', action: 'Outflow $187M', volume: 980e6, change: -3.2 },
  { name: 'Alameda Remnants', address: '0x477b...3e22', type: 'Unknown', action: 'Moved $42M to OKX', volume: 120e6, change: -41.2 },
];

export const rwaProtocols = [
  { name: 'BlackRock BUIDL', ticker: 'BUIDL', tvl: 502e6, flow7d: 89e6, apy: 5.12, color: '#F5A623' },
  { name: 'Ondo USDY', ticker: 'USDY', tvl: 380e6, flow7d: 42e6, apy: 5.35, color: '#00D97E' },
  { name: 'Franklin BENJI', ticker: 'BENJI', tvl: 310e6, flow7d: 28e6, apy: 5.08, color: '#A78BFA' },
  { name: 'Superstate USTB', ticker: 'USTB', tvl: 180e6, flow7d: -12e6, apy: 5.22, color: '#28A0F0' },
  { name: 'Maple Finance', ticker: 'MPL', tvl: 145e6, flow7d: 18e6, apy: 8.40, color: '#FF4560' },
];

export const signalHistory = [
  18, 24, 31, 28, 42, 55, 48, 52, 38, 45,
  60, 67, 72, 65, 58, 50, 44, 38, 42, 55,
  62, 70, 67, 60, 54, 48, 55, 62, 65, 67,
];

export const stats = {
  totalVolume: 4.2e9,
  usdcNet: 340e6,
  largestFlow: 812e6,
  usdcSupply: 52.1e9,
};
