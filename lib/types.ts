// Connect Activation Console Types

export type Segment = 'all' | 'indie' | 'funded_ota' | 'enterprise';

export type Metric = 'count' | 'gmv';

// Stage indices 0-4 represent the activation funnel
// 0: Signup, 1: Test Booking, 2: First Live Booking, 3: Sustained Usage, 4: Expansion
export type StageIndex = 0 | 1 | 2 | 3 | 4;

export interface Account {
  id: string;
  segment: Exclude<Segment, 'all'>;
  stage: StageIndex;
  gmvMonthly: number; // Monthly GMV in euros
  daysSinceLastActivity: number;
  firstBookingWithin7d: boolean;
  hasHeadroom: boolean; // True if account has expansion potential
}

export interface SegmentBreakdown {
  indie: number;
  funded_ota: number;
  enterprise: number;
}

export interface StageData {
  index: StageIndex;
  label: string;
  value: number; // Total (count or GMV depending on metric)
  breakdown: SegmentBreakdown; // Values by segment
  conversionRate: number | null; // Percentage from previous stage, null for stage 0
}

// Segment colors for stacked bars (Connect rs-color palette)
export const SEGMENT_COLORS: Record<Exclude<Segment, 'all'>, {
  bg: string;
  label: string;
}> = {
  indie: {
    bg: '#ffb300', // Connect yellow
    label: 'Indie',
  },
  funded_ota: {
    bg: '#2196f3', // Connect blue
    label: 'Startups',
  },
  enterprise: {
    bg: '#4caf50', // Connect green
    label: 'Enterprise',
  },
};

export interface TriggerRule {
  id: string;
  name: string;
  description: string;
  segmentTag: string;
  count: number;
}

export const STAGE_LABELS: Record<StageIndex, string> = {
  0: 'API Key',
  1: 'Sandbox Call',
  2: 'Production Call',
  3: 'Production Booking',
  4: 'Sustained Volume',
};

export const SEGMENT_LABELS: Record<Segment, string> = {
  all: 'All Segments',
  indie: 'Indie',
  funded_ota: 'Funded OTA',
  enterprise: 'Enterprise',
};
