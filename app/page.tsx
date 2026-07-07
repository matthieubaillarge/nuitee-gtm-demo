'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Funnel } from '@/components/Funnel';
import { TriggerLayer } from '@/components/TriggerLayer';
import { SEED_ACCOUNTS, getFunnelValues, getTriggerCounts } from '@/lib/data';
import { Metric, Segment } from '@/lib/types';

export default function Home() {
  const [metric, setMetric] = useState<Metric>('count');
  const [segment, setSegment] = useState<Segment>('all');

  const funnelStages = getFunnelValues(SEED_ACCOUNTS, metric, segment);
  const triggerRules = getTriggerCounts(SEED_ACCOUNTS, segment);

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'white' }}>
      <Header
        metric={metric}
        segment={segment}
        onMetricChange={setMetric}
        onSegmentChange={setSegment}
      />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div
            className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6"
            style={{ minHeight: 'calc(100vh - 180px)' }}
          >
            <Funnel stages={funnelStages} metric={metric} />
            <TriggerLayer rules={triggerRules} />
          </div>
        </div>
      </main>

      <footer
        className="py-3 px-6"
        style={{
          borderTop: '1px solid rgba(229, 233, 240, 0.6)',
          backgroundColor: 'white',
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between text-label">
          <span>Connect Activation Console (Demo)</span>
          <span>Data is illustrative and does not represent actual partner metrics</span>
        </div>
      </footer>
    </div>
  );
}
