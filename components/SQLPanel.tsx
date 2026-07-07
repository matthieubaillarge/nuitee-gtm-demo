'use client';

import { useState } from 'react';

interface SQLPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SQLSection {
  id: string;
  title: string;
  description: string;
  sql: string;
}

const SQL_SECTIONS: SQLSection[] = [
  {
    id: 'account-stages',
    title: 'Account Stage Classification',
    description: 'Determines each account\'s furthest stage reached based on event history. This CTE is the foundation for all funnel calculations.',
    sql: `WITH account_events AS (
  SELECT
    a.id AS account_id,
    a.segment,
    a.expected_monthly_gmv,

    -- Stage flags from events
    MAX(CASE WHEN e.event_name = 'api_key_created' THEN 1 ELSE 0 END) AS has_api_key,
    MAX(CASE WHEN e.event_name = 'sandbox_call' THEN 1 ELSE 0 END) AS has_sandbox_call,
    MAX(CASE WHEN e.event_name = 'production_call' THEN 1 ELSE 0 END) AS has_production_call,
    MAX(CASE WHEN e.event_name = 'production_booking' THEN 1 ELSE 0 END) AS has_production_booking,

    -- Sustained: 3+ bookings in 30 days
    SUM(CASE WHEN e.event_name = 'booking_completed'
      AND e.timestamp >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
      THEN 1 ELSE 0 END) AS bookings_last_30d,

    DATE_DIFF(CURRENT_DATE(), DATE(MAX(e.timestamp)), DAY) AS days_since_last_activity

  FROM accounts a
  LEFT JOIN events e ON a.id = e.account_id
  GROUP BY a.id, a.segment, a.expected_monthly_gmv
),

account_stages AS (
  SELECT *,
    CASE
      WHEN bookings_last_30d >= 3 THEN 4  -- Sustained Volume
      WHEN has_production_booking = 1 THEN 3
      WHEN has_production_call = 1 THEN 2
      WHEN has_sandbox_call = 1 THEN 1
      WHEN has_api_key = 1 THEN 0
      ELSE -1
    END AS stage
  FROM account_events
)`,
  },
  {
    id: 'funnel-values',
    title: 'Funnel Values (Cumulative)',
    description: 'Computes cumulative counts and GMV at each stage. "Cumulative" means accounts AT OR BEYOND that stage, which is how funnels work.',
    sql: `SELECT
  s.stage_index,
  s.stage_label,

  -- Total at or beyond this stage
  COUNT(CASE WHEN a.stage >= s.stage_index THEN 1 END) AS total_count,
  SUM(CASE WHEN a.stage >= s.stage_index
      THEN a.expected_monthly_gmv ELSE 0 END) AS total_gmv,

  -- Segment breakdown for stacked bars
  COUNT(CASE WHEN a.stage >= s.stage_index
      AND a.segment = 'indie' THEN 1 END) AS indie_count,
  COUNT(CASE WHEN a.stage >= s.stage_index
      AND a.segment = 'funded_ota' THEN 1 END) AS funded_ota_count,
  COUNT(CASE WHEN a.stage >= s.stage_index
      AND a.segment = 'enterprise' THEN 1 END) AS enterprise_count,

  -- Conversion rate from previous stage
  ROUND(100.0 * total_count /
    LAG(total_count) OVER (ORDER BY stage_index), 1
  ) AS conversion_rate

FROM stage_labels s
CROSS JOIN account_stages a
GROUP BY s.stage_index, s.stage_label
ORDER BY s.stage_index`,
  },
  {
    id: 'triggers',
    title: 'Lifecycle Trigger Rules',
    description: 'Each trigger is a predicate that identifies accounts needing action. These power the automation rules panel.',
    sql: `-- Onboarding Nudge: Recent first booking
SELECT 'Onboarding Nudge' AS rule, COUNT(*) AS count
FROM account_stages
WHERE stage = 3 AND first_booking_within_7d = TRUE

UNION ALL

-- Reactivation: Sandbox testers gone silent
SELECT 'Reactivation Sequence', COUNT(*)
FROM account_stages
WHERE stage = 1 AND days_since_last_activity >= 14

UNION ALL

-- AE Alert: High-value stalled accounts
SELECT 'AE Alert', COUNT(*)
FROM account_stages
WHERE stage = 2
  AND gmv_percentile >= 0.7  -- Top 30% by GMV
  AND days_since_last_activity > 10

UNION ALL

-- Expansion: Sustained with headroom
SELECT 'Expansion Play', COUNT(*)
FROM account_stages
WHERE stage = 4 AND gmv_percentile < 0.9`,
  },
  {
    id: 'cliff-analysis',
    title: 'The Cliff Analysis',
    description: 'Quantifies the activation cliff in euros. This is the key insight: how much monthly GMV is lost at the Sandbox → Production drop.',
    sql: `WITH cumulative AS (
  SELECT
    stage,
    SUM(account_count) OVER (ORDER BY stage DESC) AS cumulative_count,
    SUM(total_gmv) OVER (ORDER BY stage DESC) AS cumulative_gmv
  FROM stage_totals
)

SELECT
  'Sandbox Call' AS from_stage,
  'Production Call' AS to_stage,

  c1.cumulative_count AS accounts_at_sandbox,
  c2.cumulative_count AS accounts_at_production,

  ROUND(100.0 * c2.cumulative_count / c1.cumulative_count, 1)
    AS conversion_rate,

  -- The money framing
  c1.cumulative_gmv - c2.cumulative_gmv AS gmv_lost_monthly,

  CONCAT('Lost ', FORMAT('%,.0f', c1.cumulative_gmv - c2.cumulative_gmv),
    '€/month at the activation cliff') AS insight

FROM cumulative c1
JOIN cumulative c2 ON c1.stage = 1 AND c2.stage = 2`,
  },
  {
    id: 'segment-filter',
    title: 'Segment Filter (Parameterized)',
    description: 'When the user selects a segment, a WHERE clause filters the data. In BigQuery, this uses DECLARE for parameterized queries.',
    sql: `DECLARE segment_filter STRING DEFAULT 'all';
-- Values: 'all', 'indie', 'funded_ota', 'enterprise'

WITH filtered_accounts AS (
  SELECT *
  FROM account_stages
  WHERE segment_filter = 'all'
     OR segment = segment_filter
)

-- All subsequent queries use filtered_accounts
SELECT ...
FROM filtered_accounts`,
  },
];

function SQLSection({ section, isExpanded, onToggle }: {
  section: SQLSection;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-medium text-sm" style={{ color: 'rgb(25, 23, 44)' }}>
            {section.title}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">
            {section.description}
          </p>
          <div
            className="rounded-lg p-3 overflow-x-auto"
            style={{ backgroundColor: '#1e1e2e' }}
          >
            <pre
              className="text-xs leading-relaxed"
              style={{
                color: '#cdd6f4',
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
              }}
            >
              <code>{section.sql}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export function SQLPanel({ isOpen, onClose }: SQLPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['account-stages']));

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedSections(new Set(SQL_SECTIONS.map((s) => s.id)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid rgba(229, 233, 240, 0.6)' }}
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="rgb(68, 61, 141)"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
              />
            </svg>
            <h2 className="text-h2">SQL Queries</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="text-xs px-2 py-1 rounded hover:bg-gray-100 transition-colors"
              style={{ color: 'rgb(100, 116, 139)' }}
            >
              Expand all
            </button>
            <button
              onClick={collapseAll}
              className="text-xs px-2 py-1 rounded hover:bg-gray-100 transition-colors"
              style={{ color: 'rgb(100, 116, 139)' }}
            >
              Collapse
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-100 transition-colors ml-2"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Intro */}
        <div className="px-4 py-3" style={{ backgroundColor: '#f8f9fc', borderBottom: '1px solid rgba(229, 233, 240, 0.6)' }}>
          <p className="text-xs leading-relaxed" style={{ color: 'rgb(100, 116, 139)' }}>
            These queries would run against <strong>BigQuery</strong> or <strong>PostHog</strong> to generate the dashboard data.
            They demonstrate event-based stage classification, cumulative funnel logic, and lifecycle trigger predicates.
          </p>
        </div>

        {/* Sections */}
        <div className="overflow-y-auto" style={{ height: 'calc(100% - 140px)' }}>
          {SQL_SECTIONS.map((section) => (
            <SQLSection
              key={section.id}
              section={section}
              isExpanded={expandedSections.has(section.id)}
              onToggle={() => toggleSection(section.id)}
            />
          ))}
        </div>

        {/* Footer */}
        <div
          className="absolute bottom-0 left-0 right-0 px-4 py-3"
          style={{ borderTop: '1px solid rgba(229, 233, 240, 0.6)', backgroundColor: 'white' }}
        >
          <p className="text-xs" style={{ color: 'rgb(100, 116, 139)' }}>
            Full queries available in <code className="px-1 py-0.5 rounded" style={{ backgroundColor: '#f1f5f9' }}>get-data.sql</code>
          </p>
        </div>
      </div>
    </>
  );
}
