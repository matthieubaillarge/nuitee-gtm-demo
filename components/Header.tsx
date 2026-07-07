'use client';

import Image from 'next/image';
import { Segment, Metric, SEGMENT_LABELS } from '@/lib/types';

interface HeaderProps {
  metric: Metric;
  segment: Segment;
  onMetricChange: (metric: Metric) => void;
  onSegmentChange: (segment: Segment) => void;
}

export function Header({ metric, segment, onMetricChange, onSegmentChange }: HeaderProps) {
  const segments: Segment[] = ['all', 'indie', 'funded_ota', 'enterprise'];

  return (
    <header
      className="px-6 py-4"
      style={{
        backgroundColor: 'white',
        borderBottom: '1px solid rgba(229, 233, 240, 0.6)',
      }}
    >
      <div className="flex items-center justify-between">
        {/* Left: Logo and Title */}
        <div className="flex items-center gap-5">
          <Image
            src="/liteAPI-v3-logo.svg"
            alt="LiteAPI"
            width={140}
            height={34}
            priority
          />

          <div className="h-6 w-px" style={{ backgroundColor: 'rgba(229, 233, 240, 0.6)' }} />

          <div>
            <h1 className="text-h1">Activation Console</h1>
            <p className="text-subtitle text-sm">Illustrative data for demonstration</p>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-4">
          {/* Metric Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-label">View:</span>
            <div
              className="flex rounded-lg p-1"
              style={{ backgroundColor: '#F7F7FA' }}
            >
              <button
                onClick={() => onMetricChange('count')}
                className="px-4 py-1.5 text-sm font-medium rounded-md transition-all"
                style={{
                  backgroundColor: metric === 'count' ? 'white' : 'transparent',
                  color: metric === 'count' ? 'rgb(25, 23, 44)' : 'rgb(100, 116, 139)',
                  boxShadow: metric === 'count' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                Count
              </button>
              <button
                onClick={() => onMetricChange('gmv')}
                className="px-4 py-1.5 text-sm font-medium rounded-md transition-all"
                style={{
                  backgroundColor: metric === 'gmv' ? 'white' : 'transparent',
                  color: metric === 'gmv' ? 'rgb(25, 23, 44)' : 'rgb(100, 116, 139)',
                  boxShadow: metric === 'gmv' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                GMV
              </button>
            </div>
          </div>

          {/* Segment Filter */}
          <div className="flex items-center gap-2">
            <span className="text-label">Segment:</span>
            <select
              value={segment}
              onChange={(e) => onSegmentChange(e.target.value as Segment)}
              className="text-sm rounded-lg px-3 py-2 cursor-pointer font-medium"
              style={{
                backgroundColor: 'white',
                border: '1px solid rgba(229, 233, 240, 0.6)',
                color: 'rgb(25, 23, 44)',
              }}
            >
              {segments.map((seg) => (
                <option key={seg} value={seg}>
                  {SEGMENT_LABELS[seg]}
                </option>
              ))}
            </select>
          </div>

          {/* Demo indicator */}
          <div
            className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full text-white"
            style={{ backgroundColor: '#fa8900' }}
          >
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Demo
          </div>
        </div>
      </div>
    </header>
  );
}
