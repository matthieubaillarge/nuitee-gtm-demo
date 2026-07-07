'use client';

import { TriggerRule as TriggerRuleType } from '@/lib/types';

interface TriggerRuleProps {
  rule: TriggerRuleType;
}

// Colored card styles - title color matches border
const tagStyles: Record<string, {
  bg: string;
  border: string;
  titleColor: string;
  icon: React.ReactNode;
}> = {
  'At Risk': {
    bg: '#fff8f2',
    border: '#fcb160',
    titleColor: '#db8000',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#db8000" strokeWidth="2">
        <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  Priority: {
    bg: '#fff2f2',
    border: '#fa8682',
    titleColor: '#d62915',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d62915" strokeWidth="2">
        <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  New: {
    bg: '#f0fdf4', // Light green
    border: '#86efac',
    titleColor: '#16a34a',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  Growth: {
    bg: '#f2faff',
    border: '#80c4ff',
    titleColor: '#1675e0',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1675e0" strokeWidth="2">
        <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
};

export function TriggerRuleCard({ rule }: TriggerRuleProps) {
  const style = tagStyles[rule.segmentTag] || tagStyles['Growth'];

  return (
    <div
      className="rounded-xl p-4 transition-all cursor-default"
      style={{
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title with icon - color matches border */}
          <div className="flex items-center gap-2 mb-1.5">
            {style.icon}
            <h3
              className="font-medium"
              style={{
                color: style.titleColor,
                fontSize: '12px',
                lineHeight: '16px',
              }}
            >
              {rule.name}
            </h3>
          </div>
          <p
            className="leading-relaxed"
            style={{
              color: 'rgb(100, 116, 139)',
              fontSize: '12px',
              lineHeight: '16px',
            }}
          >
            {rule.description}
          </p>
        </div>

        {/* Count - black text, transparent background */}
        <div className="shrink-0">
          <div
            className="min-w-[2.5rem] h-10 flex items-center justify-center rounded-lg text-xl font-semibold"
            style={{
              color: '#000000',
              backgroundColor: 'transparent',
            }}
          >
            {rule.count}
          </div>
        </div>
      </div>
    </div>
  );
}
