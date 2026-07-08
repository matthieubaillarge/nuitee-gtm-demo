'use client';

import { useState } from 'react';

interface Recommendation {
  id: string;
  title: string;
  description: string;
}

const RECOMMENDATIONS: Recommendation[] = [
  {
    id: '1',
    title: 'Focus on Time-To-Production',
    description: 'North-star metric. Developer activation motion, not sales. Speed and friction removal.',
  },
  {
    id: '2',
    title: 'Identify High Potential Accounts',
    description: 'Lead & account enrichment: ICP/persona match, target account fit, potential account value.',
  },
  {
    id: '3',
    title: 'Understand their usage',
    description: 'Total API calls, call frequency, endpoints usage, error rates, activity patterns.',
  },
  {
    id: '4',
    title: 'Understand their context',
    description: 'Get in touch with high potential. Understand: maturity, timeline, processes, frictions.',
  },
  {
    id: '5',
    title: 'Automate the rest',
    description: 'Nurturing sequences, re-activation alerts, self-serve docs for the long tail.',
  },
];

export function Recommendations() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="card h-full flex flex-col">
      {/* Header - clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors"
        style={{ borderBottom: isExpanded ? '1px solid rgba(229, 233, 240, 0.6)' : 'none' }}
      >
        <div>
          <h2 className="text-h2">Recommendations</h2>
          <p className="text-subtitle mt-0.5">
            {isExpanded ? 'Prioritized by GMV-weighted impact' : 'Click to reveal'}
          </p>
        </div>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform"
          style={{ backgroundColor: '#f1f5f9' }}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="rgb(100, 116, 139)"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Collapsible content */}
      <div
        className={`flex-1 overflow-hidden transition-all duration-300 ease-out ${
          isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-5 py-3 space-y-3">
          {RECOMMENDATIONS.map((rec, index) => (
            <div
              key={rec.id}
              className="flex gap-3 py-2"
              style={{
                borderBottom: index < RECOMMENDATIONS.length - 1 ? '1px solid rgba(229, 233, 240, 0.4)' : 'none',
              }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold"
                style={{ backgroundColor: '#443d8d', color: 'white' }}
              >
                {index}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'rgb(25, 23, 44)' }}>
                  {rec.title}
                </p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgb(100, 116, 139)' }}>
                  {rec.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Collapsed state placeholder */}
      {!isExpanded && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-8">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: '#f1f5f9' }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="rgb(100, 116, 139)"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: 'rgb(100, 116, 139)' }}>
              5 recommendations
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
