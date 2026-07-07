'use client';

import { TriggerRule } from '@/lib/types';
import { TriggerRuleCard } from './TriggerRule';

interface TriggerLayerProps {
  rules: TriggerRule[];
}

export function TriggerLayer({ rules }: TriggerLayerProps) {
  const totalTriggers = rules.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="card h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(229, 233, 240, 0.6)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-h2">Lifecycle Triggers</h2>
            <p className="text-subtitle mt-0.5">Automation rules</p>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: '#f0f1fa' }}
          >
            <span className="text-label" style={{ color: '#47509a' }}>Active:</span>
            <span
              className="font-semibold"
              style={{ color: '#47509a', fontSize: '14px' }}
            >
              {totalTriggers}
            </span>
          </div>
        </div>
      </div>

      {/* Rules list */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="flex flex-col gap-3">
          {rules.map((rule) => (
            <TriggerRuleCard key={rule.id} rule={rule} />
          ))}
        </div>
      </div>

      {/* Footer hint */}
      <div
        className="px-5 py-3 rounded-b-lg"
        style={{
          borderTop: '1px solid rgba(229, 233, 240, 0.6)',
          backgroundColor: '#f7f7fa',
        }}
      >
        <p className="text-label text-center">
          Counts update with segment filter
        </p>
      </div>
    </div>
  );
}
