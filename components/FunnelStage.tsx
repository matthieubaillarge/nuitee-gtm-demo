'use client';

import { StageData, Metric, SEGMENT_COLORS } from '@/lib/types';
import { formatEuro, formatNumber, formatPercent } from '@/lib/formatters';

interface FunnelStageProps {
  stage: StageData;
  metric: Metric;
  maxValue: number;
  isCliff: boolean;
  previousValue: number | null;
  gmvLoss?: number;  // GMV lost at this stage (only for cliff)
}

export function FunnelStage({ stage, metric, maxValue, isCliff, previousValue, gmvLoss }: FunnelStageProps) {
  const totalWidthPercent = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;

  const formattedValue = metric === 'gmv' ? formatEuro(stage.value) : formatNumber(stage.value);

  const dropPercent = previousValue && previousValue > 0
    ? Math.round((1 - stage.value / previousValue) * 100)
    : 0;

  const total = stage.breakdown.indie + stage.breakdown.funded_ota + stage.breakdown.enterprise;
  const segments = [
    { key: 'indie' as const, value: stage.breakdown.indie, bg: SEGMENT_COLORS.indie.bg },
    { key: 'funded_ota' as const, value: stage.breakdown.funded_ota, bg: SEGMENT_COLORS.funded_ota.bg },
    { key: 'enterprise' as const, value: stage.breakdown.enterprise, bg: SEGMENT_COLORS.enterprise.bg },
  ];

  return (
    <div className="relative">
      <div className="flex items-center gap-4 py-3">
        {/* Label */}
        <div className="w-44 shrink-0">
          <span
            className="text-sm font-medium"
            style={{ color: 'rgb(25, 23, 44)' }}
          >
            {stage.label}
          </span>
        </div>

        {/* Bar container */}
        <div className="flex-1 relative">
          <div
            className="h-11 rounded-lg overflow-hidden relative"
            style={{ backgroundColor: '#F7F7FA' }}
          >
            {/* Stacked bar segments */}
            <div
              className={`h-full flex transition-all duration-400 ease-out rounded-lg overflow-hidden ${
                isCliff ? 'ring-2 ring-offset-1' : ''
              }`}
              style={{
                width: `${totalWidthPercent}%`,
                ...(isCliff && { '--tw-ring-color': '#f44336' } as React.CSSProperties),
              }}
            >
              {segments.map((seg) => {
                const segPercent = total > 0 ? (seg.value / total) * 100 : 0;
                if (segPercent === 0) return null;
                return (
                  <div
                    key={seg.key}
                    className="h-full transition-all duration-400 ease-out"
                    style={{
                      width: `${segPercent}%`,
                      backgroundColor: seg.bg,
                    }}
                  />
                );
              })}
            </div>

            {/* Value label - black text, transparent bg */}
            <div className="absolute inset-0 flex items-center px-4">
              <span
                className="text-lg font-semibold"
                style={{
                  color: totalWidthPercent > 20 ? '#000000' : '#000000',
                  marginLeft: totalWidthPercent > 20 ? 0 : 'auto',
                }}
              >
                {formattedValue}
              </span>
            </div>
          </div>
        </div>

        {/* Conversion rate - colored by performance */}
        <div className="w-20 text-right shrink-0">
          {stage.conversionRate !== null ? (
            <span
              className="text-sm font-semibold"
              style={{
                color:
                  stage.conversionRate >= 75 ? '#16a34a' // green
                  : stage.conversionRate < 50 ? '#f44336' // red
                  : '#fa8900', // orange
              }}
            >
              {formatPercent(stage.conversionRate)}
            </span>
          ) : (
            <span className="text-sm" style={{ color: 'rgb(100, 116, 139)' }}>—</span>
          )}
        </div>
      </div>

      {/* Cliff annotation */}
      {isCliff && dropPercent > 0 && (
        <div className="absolute -right-4 top-1/2 -translate-y-1/2 translate-x-full">
          <div
            className="card rounded-xl px-3 py-2 ml-6"
            style={{
              backgroundColor: '#fff2f2',
              borderColor: '#faa9a7',
            }}
          >
            <div className="flex items-center gap-2">
              {/* Small icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f44336" strokeWidth="2">
                <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-sm font-semibold" style={{ color: '#f44336' }}>
                {dropPercent}% drop
              </span>
            </div>
            <p className="text-label mt-0.5" style={{ color: '#f44336' }}>
              Activation cliff
            </p>
            {/* GMV loss - always shown */}
            {gmvLoss !== undefined && gmvLoss > 0 && (
              <p className="text-xs font-medium mt-1" style={{ color: '#b91c1c' }}>
                ~{formatEuro(gmvLoss)}/mo leak
              </p>
            )}
          </div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2">
            <div
              className="w-0 h-0"
              style={{
                borderTop: '4px solid transparent',
                borderBottom: '4px solid transparent',
                borderRight: '4px solid #faa9a7',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
