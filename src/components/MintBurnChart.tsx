// ============================================
// THE WATCHER — Mint/Burn 7-Day Chart
// ============================================
// Simple View-based bar chart showing daily mint vs burn volumes

import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export interface DayData {
  day: string;
  mint: number;
  burn: number;
}

interface Props {
  data: DayData[];
  primaryColor?: string;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function MintBurnChart({ data, primaryColor = colors.green }: Props) {
  if (!data || data.length === 0) {
    return null;
  }

  // Find max value for scaling
  const maxValue = Math.max(
    ...data.flatMap((d) => [d.mint, d.burn]),
    1,
  );

  const chartHeight = 120;
  const barWidth = 20;
  const barGap = 8;
  const pairGap = 12;

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        <View style={styles.yAxis}>
          <Text style={styles.yLabel}>{fmt(maxValue)}</Text>
          <Text style={styles.yLabel}>{fmt(maxValue / 2)}</Text>
          <Text style={styles.yLabel}>0</Text>
        </View>

        <View style={[styles.chart, { height: chartHeight }]}>
          {data.map((dayData, dayIdx) => {
            const mintHeight = (dayData.mint / maxValue) * chartHeight;
            const burnHeight = (dayData.burn / maxValue) * chartHeight;

            return (
              <View key={dayIdx} style={styles.dayGroup}>
                {/* Mint bar (green) */}
                <View style={[styles.barContainer, { height: chartHeight }]}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(2, mintHeight),
                        backgroundColor: '#00C896',
                        width: barWidth,
                      },
                    ]}
                  />
                </View>

                {/* Burn bar (red) */}
                <View style={[styles.barContainer, { height: chartHeight, marginLeft: barGap }]}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(2, burnHeight),
                        backgroundColor: '#FF3B5C',
                        width: barWidth,
                      },
                    ]}
                  />
                </View>

                {/* Day label */}
                <Text style={[styles.dayLabel, { marginLeft: -(barWidth + barGap / 2) }]}>
                  {DAY_LABELS[dayIdx]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#00C896' }]} />
          <Text style={styles.legendLabel}>Mints</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF3B5C' }]} />
          <Text style={styles.legendLabel}>Burns</Text>
        </View>
      </View>
    </View>
  );
}

function fmt(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingBottom: 8,
  },
  chartWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  yAxis: {
    width: 42,
    height: 120,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  yLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  chart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    borderLeftWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: colors.border,
    paddingLeft: 8,
    paddingBottom: 8,
  },
  dayGroup: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  barContainer: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    borderRadius: 2,
  },
  dayLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 6,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendLabel: {
    color: colors.textSub,
    fontSize: 11,
    fontWeight: '600',
  },
});
