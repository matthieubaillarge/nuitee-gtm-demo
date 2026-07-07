'use client';

import { StageData, Metric, SEGMENT_COLORS } from '@/lib/types';
import { FunnelStage } from './FunnelStage';

interface FunnelProps {
  stages: StageData[];
  metric: Metric;
}

export function Funnel({ stages, metric }: FunnelProps) {
  const maxValue = stages.length > 0 ? stages[0].value : 0;

  // The cliff is always at stage 2 (Production Call) per the PRD
  // This is the "sandbox call → production call" drop (~45%, the steepest)
  const cliffIndex = 2;

  return (
    <div className="card h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(229, 233, 240, 0.6)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-h2">Activation Funnel</h2>
            <p className="text-subtitle mt-0.5">
              Cumulative {metric === 'gmv' ? 'monthly GMV' : 'accounts'} at each lifecycle stage
            </p>
          </div>
          {/* ICP Legend */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: SEGMENT_COLORS.indie.bg }}
              />
              <span className="text-label">{SEGMENT_COLORS.indie.label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: SEGMENT_COLORS.funded_ota.bg }}
              />
              <span className="text-label">{SEGMENT_COLORS.funded_ota.label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: SEGMENT_COLORS.enterprise.bg }}
              />
              <span className="text-label">{SEGMENT_COLORS.enterprise.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Funnel stages */}
      <div className="flex-1 px-6 py-4 pr-48 overflow-auto">
        {/* Column headers */}
        <div
          className="flex items-center gap-4 pb-3 mb-2"
          style={{ borderBottom: '1px solid rgba(229, 233, 240, 0.6)' }}
        >
          <div className="w-44 shrink-0">
            <span className="text-label uppercase tracking-wider">Stage</span>
          </div>
          <div className="flex-1">
            <span className="text-label uppercase tracking-wider">
              {metric === 'gmv' ? 'Monthly GMV' : 'Account Count'}
            </span>
          </div>
          <div className="w-20 text-right shrink-0">
            <span className="text-label uppercase tracking-wider">Conv.</span>
          </div>
        </div>

        {stages.map((stage, index) => (
          <FunnelStage
            key={stage.index}
            stage={stage}
            metric={metric}
            maxValue={maxValue}
            isCliff={index === cliffIndex}
            previousValue={index > 0 ? stages[index - 1].value : null}
          />
        ))}
      </div>
    </div>
  );
}
