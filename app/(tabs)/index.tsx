// ============================================
// THE WATCHER — Flows Tab (USDC ↔ USDT Flip Card)
// ============================================
// One screen, two faces. Front = USDC (cold blue). Back = USDT (hot amber).
// Flip button rotates the card 3D; the top ticker ribbon stays fixed.

import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FlipCardContainer from '../../src/components/FlipCardContainer';
import FlowScreen from '../../src/components/FlowScreen';
import TickerRibbon from '../../src/components/TickerRibbon';
import { superman, bizarro, gradients, colors } from '../../src/theme';
import WatcherAPI from '../../src/api/watcher';
import { useWatcher } from '../../src/api/hooks';

const fmt = (n: number) =>
  n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(0)}M` : `$${(n / 1e3).toFixed(0)}K`;

export default function FlowsTab() {
  const { data: marketSupply } = useWatcher(() => WatcherAPI.marketSupply(), []);
  const { data: marketExchange } = useWatcher(() => WatcherAPI.marketExchange(), []);
  const { data: fearGreed } = useWatcher(() => WatcherAPI.fearGreed(), []);

  const tickerItems = [
    { label: 'USDC SUPPLY', value: marketSupply?.usdc ? fmt(marketSupply.usdc) : '—' },
    { label: 'USDT SUPPLY', value: marketSupply?.usdt ? fmt(marketSupply.usdt) : '—' },
    { label: 'BTC', value: marketExchange?.btc ? `$${marketExchange.btc.toFixed(0)}` : '—' },
    { label: 'ETH', value: marketExchange?.eth ? `$${marketExchange.eth.toFixed(0)}` : '—' },
    { label: 'FEAR & GREED', value: fearGreed?.value ? `${fearGreed.value.toFixed(0)}` : '—' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TickerRibbon items={tickerItems} speed={50000} />
      <View style={styles.flipHost}>
        <FlipCardContainer
          front={
            <FlowScreen
              token="USDC"
              theme={superman}
              gradient={gradients.superman}
              apiFn={() => WatcherAPI.usdcOverview()}
              subheadChains="Circle · Ethereum · Base"
              icon="◇"
            />
          }
          back={
            <FlowScreen
              token="USDT"
              theme={bizarro}
              gradient={gradients.bizarro}
              apiFn={() => WatcherAPI.usdtOverview()}
              subheadChains="Tether · Ethereum · TRON"
              icon="⬡"
              showTronCard
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flipHost: { flex: 1 },
});
