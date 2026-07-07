'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Funnel } from '@/components/Funnel';
import { Recommendations } from '@/components/Recommendations';
import { SQLPanel } from '@/components/SQLPanel';
import { SEED_ACCOUNTS, getFunnelValues } from '@/lib/data';
import { Metric, Segment } from '@/lib/types';

export default function Home() {
  const [metric, setMetric] = useState<Metric>('count');
  const [segment, setSegment] = useState<Segment>('all');
  const [sqlPanelOpen, setSqlPanelOpen] = useState(false);

  const funnelStages = getFunnelValues(SEED_ACCOUNTS, metric, segment);
  // Always compute GMV stages for the cliff annotation (shows €X lost even in count mode)
  const gmvStages = getFunnelValues(SEED_ACCOUNTS, 'gmv', segment);

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'white' }}>
      <Header
        metric={metric}
        segment={segment}
        onMetricChange={setMetric}
        onSegmentChange={setSegment}
        onSQLClick={() => setSqlPanelOpen(true)}
      />

      <SQLPanel isOpen={sqlPanelOpen} onClose={() => setSqlPanelOpen(false)} />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div
            className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6"
            style={{ minHeight: 'calc(100vh - 180px)' }}
          >
            <Funnel stages={funnelStages} gmvStages={gmvStages} metric={metric} />
            <Recommendations />
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
