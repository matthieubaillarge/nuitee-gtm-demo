// Connect Activation Console - Seed Data and Selectors
import { Account, Segment, Metric, StageIndex, StageData, TriggerRule, STAGE_LABELS, SegmentBreakdown } from './types';

// Seed 48 accounts matching PRD distribution
// Indies: 30 accounts, ~€3,000/month avg
// Funded OTA: 12 accounts, ~€60,000/month avg
// Enterprise: 6 accounts, ~€400,000/month avg
//
// SEGMENT-SPECIFIC CONVERSION PATTERNS:
//
// INDIE: Easy to get to Production (curiosity, low friction)
//        But BIG DROP at Booking & Sustained (most never ship)
//        Cumulative: 30 → 28 (93%) → 18 (64%) → 5 (28%) → 2 (40%)
//
// FUNDED/ENTERPRISE: Big cliff at Sandbox → Production (decision point)
//        But once there, HIGH conversion (invested, committed)
//        Funded: 12 → 11 (92%) → 4 (36%) → 3 (75%) → 3 (100%)
//        Enterprise: 6 → 5 (83%) → 2 (40%) → 2 (100%) → 2 (100%)

function generateAccounts(): Account[] {
  const accounts: Account[] = [];
  let id = 1;

  // Indies: 30 accounts
  // Easy to Production, but drop off after (most never book/sustain)
  // Cumulative: 30 → 28 (93%) → 18 (64%) → 5 (28%) → 2 (40%)
  // Per-stage: 2, 10, 13, 3, 2
  const indieStages: StageIndex[] = [
    0, 0, // 2 at API Key only
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 10 at Sandbox Call
    2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, // 13 at Production Call (easy to get here)
    3, 3, 3, // 3 at Production Booking (most drop here)
    4, 4, // 2 at Sustained Revenue (few sustain)
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
  // Big cliff at Sandbox → Production, but commit after
  // Cumulative: 12 → 11 (92%) → 4 (36%) → 3 (75%) → 3 (100%)
  // Per-stage: 1, 7, 1, 0, 3
  const fundedStages: StageIndex[] = [
    0, // 1 at API Key only
    1, 1, 1, 1, 1, 1, 1, // 7 at Sandbox Call (THE CLIFF - most stall here)
    2, // 1 at Production Call
    // 0 at Production Booking (once in production, they push through)
    4, 4, 4, // 3 at Sustained Revenue (committed)
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
  // Big cliff at Sandbox → Production (approval processes)
  // But once there, very high conversion (serious investment)
  // Cumulative: 6 → 5 (83%) → 2 (40%) → 2 (100%) → 2 (100%)
  // Per-stage: 1, 3, 0, 0, 2
  const enterpriseStages: StageIndex[] = [
    0, // 1 at API Key only
    1, 1, 1, // 3 at Sandbox Call (THE CLIFF - approval processes)
    // 0 at Production Call (once approved, they go all the way)
    // 0 at Production Booking
    4, 4, // 2 at Sustained Revenue (fully committed)
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
