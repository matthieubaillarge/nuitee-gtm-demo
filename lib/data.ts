// Connect Activation Console - Seed Data and Selectors
import { Account, Segment, Metric, StageIndex, StageData, TriggerRule, STAGE_LABELS, SegmentBreakdown } from './types';

// Seed 48 accounts matching PRD distribution
// Indies: 30 accounts, ~€3,000/month avg
// Funded OTA: 12 accounts, ~€60,000/month avg
// Enterprise: 6 accounts, ~€400,000/month avg
//
// New conversion rates (cliff at stage 1→2, the Sandbox→Production drop):
// Stage 0 (API Key): 48 total
// Stage 1 (Sandbox Call): 44 total (92% from 0)
// Stage 2 (Production Call): 20 total (45% from 1) ← THE CLIFF
// Stage 3 (Production Booking): 14 total (70% from 2)
// Stage 4 (Sustained Revenue): 9 total (64% from 3)

function generateAccounts(): Account[] {
  const accounts: Account[] = [];
  let id = 1;

  // Indies: 30 accounts
  // Cumulative: 30 at stage 0+, 28 at stage 1+, 10 at stage 2+, 7 at stage 3+, 4 at stage 4
  // Per-stage: 2 at 0, 18 at 1, 3 at 2, 3 at 3, 4 at 4
  const indieStages: StageIndex[] = [
    0, 0, // 2 at API Key only
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 18 at Sandbox Call
    2, 2, 2, // 3 at Production Call
    3, 3, 3, // 3 at Production Booking
    4, 4, 4, 4, // 4 at Sustained Revenue
  ];

  indieStages.forEach((stage) => {
    accounts.push({
      id: `ACC-${String(id++).padStart(3, '0')}`,
      segment: 'indie',
      stage,
      gmvMonthly: 1500 + Math.floor(Math.random() * 3000), // €1.5K-4.5K
      daysSinceLastActivity: stage <= 1 ? Math.floor(Math.random() * 30) : Math.floor(Math.random() * 10),
      firstBookingWithin7d: stage >= 3 && Math.random() > 0.5,
      hasHeadroom: stage === 4 && Math.random() > 0.3,
    });
  });

  // Funded OTAs: 12 accounts
  // Cumulative: 12 at stage 0+, 11 at stage 1+, 7 at stage 2+, 5 at stage 3+, 3 at stage 4
  // Per-stage: 1 at 0, 4 at 1, 2 at 2, 2 at 3, 3 at 4
  const fundedStages: StageIndex[] = [
    0, // 1 at API Key only
    1, 1, 1, 1, // 4 at Sandbox Call
    2, 2, // 2 at Production Call
    3, 3, // 2 at Production Booking
    4, 4, 4, // 3 at Sustained Revenue
  ];

  fundedStages.forEach((stage) => {
    accounts.push({
      id: `ACC-${String(id++).padStart(3, '0')}`,
      segment: 'funded_ota',
      stage,
      gmvMonthly: 40000 + Math.floor(Math.random() * 40000), // €40K-80K
      daysSinceLastActivity: stage <= 1 ? 10 + Math.floor(Math.random() * 20) : Math.floor(Math.random() * 7),
      firstBookingWithin7d: stage >= 3 && Math.random() > 0.3,
      hasHeadroom: stage === 4 && Math.random() > 0.2,
    });
  });

  // Enterprise: 6 accounts
  // Cumulative: 6 at stage 0+, 5 at stage 1+, 3 at stage 2+, 2 at stage 3+, 2 at stage 4
  // Per-stage: 1 at 0, 2 at 1, 1 at 2, 0 at 3, 2 at 4
  const enterpriseStages: StageIndex[] = [
    0, // 1 at API Key only
    1, 1, // 2 at Sandbox Call
    2, // 1 at Production Call
    // 0 at Production Booking (they all go straight to sustained)
    4, 4, // 2 at Sustained Revenue
  ];

  enterpriseStages.forEach((stage) => {
    accounts.push({
      id: `ACC-${String(id++).padStart(3, '0')}`,
      segment: 'enterprise',
      stage,
      gmvMonthly: 300000 + Math.floor(Math.random() * 200000), // €300K-500K
      daysSinceLastActivity: Math.floor(Math.random() * 5),
      firstBookingWithin7d: stage >= 3 && Math.random() > 0.2,
      hasHeadroom: stage === 4 && Math.random() > 0.1,
    });
  });

  return accounts;
}

// Generate accounts once (deterministic for demo)
export const SEED_ACCOUNTS: Account[] = generateAccounts();

/**
 * Filter accounts by segment
 */
export function filterBySegment(accounts: Account[], segment: Segment): Account[] {
  if (segment === 'all') return accounts;
  return accounts.filter((a) => a.segment === segment);
}

/**
 * Compute segment breakdown for accounts
 */
function computeBreakdown(accounts: Account[], metric: Metric): SegmentBreakdown {
  const getValue = (seg: Exclude<Segment, 'all'>) => {
    const segAccounts = accounts.filter((a) => a.segment === seg);
    return metric === 'count'
      ? segAccounts.length
      : segAccounts.reduce((sum, a) => sum + a.gmvMonthly, 0);
  };

  return {
    indie: getValue('indie'),
    funded_ota: getValue('funded_ota'),
    enterprise: getValue('enterprise'),
  };
}

/**
 * Get cumulative funnel values for each stage
 * In a funnel, each stage includes all accounts at that stage OR BEYOND
 * Always shows breakdown by segment (indie, funded_ota, enterprise)
 */
export function getFunnelValues(
  accounts: Account[],
  metric: Metric,
  segment: Segment
): StageData[] {
  // For breakdown, always use all accounts (to show composition)
  // But filter for the selected segment when computing totals if needed
  const filtered = filterBySegment(accounts, segment);

  const stages: StageIndex[] = [0, 1, 2, 3, 4];

  return stages.map((stageIndex, idx) => {
    // Cumulative: accounts at this stage or beyond
    const accountsAtOrBeyond = filtered.filter((a) => a.stage >= stageIndex);

    const value =
      metric === 'count'
        ? accountsAtOrBeyond.length
        : accountsAtOrBeyond.reduce((sum, a) => sum + a.gmvMonthly, 0);

    // Compute breakdown by segment
    const breakdown = computeBreakdown(accountsAtOrBeyond, metric);

    // Calculate conversion rate from previous stage
    let conversionRate: number | null = null;
    if (idx > 0) {
      const prevAccounts = filtered.filter((a) => a.stage >= stages[idx - 1]);
      const prevValue =
        metric === 'count'
          ? prevAccounts.length
          : prevAccounts.reduce((sum, a) => sum + a.gmvMonthly, 0);
      conversionRate = prevValue > 0 ? (value / prevValue) * 100 : 0;
    }

    return {
      index: stageIndex,
      label: STAGE_LABELS[stageIndex],
      value,
      breakdown,
      conversionRate,
    };
  });
}

/**
 * Get stage conversion percentage
 */
export function getStageConversion(current: number, previous: number): number {
  if (previous === 0) return 0;
  return (current / previous) * 100;
}

/**
 * Get trigger rule counts for lifecycle automation
 */
export function getTriggerCounts(accounts: Account[], segment: Segment): TriggerRule[] {
  const filtered = filterBySegment(accounts, segment);

  // Reactivation: stage=1, daysSinceLastActivity >= 14
  const reactivationCount = filtered.filter(
    (a) => a.stage === 1 && a.daysSinceLastActivity >= 14
  ).length;

  // AE Alert: stage=2, high GMV (top 30%), stalled (>10 days)
  const stage2Accounts = filtered.filter((a) => a.stage === 2);
  const gmvThreshold = stage2Accounts.length > 0
    ? stage2Accounts.sort((a, b) => b.gmvMonthly - a.gmvMonthly)[Math.floor(stage2Accounts.length * 0.3)]?.gmvMonthly || 0
    : 0;
  const aeAlertCount = filtered.filter(
    (a) => a.stage === 2 && a.gmvMonthly >= gmvThreshold && a.daysSinceLastActivity > 10
  ).length;

  // Onboarding nudge: stage=3, firstBookingWithin7d=true
  const onboardingCount = filtered.filter(
    (a) => a.stage === 3 && a.firstBookingWithin7d
  ).length;

  // Expansion: stage=4, hasHeadroom=true
  const expansionCount = filtered.filter(
    (a) => a.stage === 4 && a.hasHeadroom
  ).length;

  return [
    {
      id: 'onboarding',
      name: 'Onboarding Nudge',
      description: 'First production booking in last 7 days → trigger onboarding sequence',
      segmentTag: 'New',
      count: onboardingCount,
    },
    {
      id: 'reactivation',
      name: 'Reactivation Sequence',
      description: 'Tested sandbox, no production call, silent 14+ days → enroll in reactivation sequence',
      segmentTag: 'At Risk',
      count: reactivationCount,
    },
    {
      id: 'ae-alert',
      name: 'AE Alert',
      description: 'Production call, no booking yet, high GMV, stalled → alert account executive',
      segmentTag: 'Priority',
      count: aeAlertCount,
    },
    {
      id: 'expansion',
      name: 'Expansion Play',
      description: 'Sustained volume with GMV headroom → expansion play',
      segmentTag: 'Growth',
      count: expansionCount,
    },
  ];
}
