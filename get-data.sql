-- ============================================================
-- Connect Activation Console: SQL Queries
-- ============================================================
-- These queries would run against BigQuery/PostHog to generate
-- the funnel data shown in the demo. Assumes event-based tracking.
--
-- Schema assumptions:
--   accounts: id, segment, created_at, expected_monthly_gmv
--   events: account_id, event_name, timestamp, properties
--
-- Events tracked:
--   api_key_created, sandbox_call, production_call,
--   production_booking, booking_completed
-- ============================================================


-- ============================================================
-- 1. ACCOUNT STAGE CLASSIFICATION
-- ============================================================
-- Determine each account's furthest stage reached based on events.
-- This is the foundation for all funnel calculations.

WITH account_events AS (
  SELECT
    a.id AS account_id,
    a.segment,
    a.expected_monthly_gmv,
    a.created_at,

    -- Stage flags based on event existence
    MAX(CASE WHEN e.event_name = 'api_key_created' THEN 1 ELSE 0 END) AS has_api_key,
    MAX(CASE WHEN e.event_name = 'sandbox_call' THEN 1 ELSE 0 END) AS has_sandbox_call,
    MAX(CASE WHEN e.event_name = 'production_call' THEN 1 ELSE 0 END) AS has_production_call,
    MAX(CASE WHEN e.event_name = 'production_booking' THEN 1 ELSE 0 END) AS has_production_booking,

    -- Sustained volume: 3+ bookings in last 30 days
    SUM(CASE
      WHEN e.event_name = 'booking_completed'
        AND e.timestamp >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
      THEN 1 ELSE 0
    END) AS bookings_last_30d,

    -- Activity recency
    MAX(e.timestamp) AS last_activity_at,
    DATE_DIFF(CURRENT_DATE(), DATE(MAX(e.timestamp)), DAY) AS days_since_last_activity,

    -- First booking timing (for onboarding trigger)
    MIN(CASE WHEN e.event_name = 'production_booking' THEN e.timestamp END) AS first_booking_at

  FROM accounts a
  LEFT JOIN events e ON a.id = e.account_id
  GROUP BY a.id, a.segment, a.expected_monthly_gmv, a.created_at
),

account_stages AS (
  SELECT
    *,
    -- Determine furthest stage (0-4)
    CASE
      WHEN bookings_last_30d >= 3 THEN 4  -- Sustained Volume
      WHEN has_production_booking = 1 THEN 3  -- Production Booking
      WHEN has_production_call = 1 THEN 2  -- Production Call
      WHEN has_sandbox_call = 1 THEN 1  -- Sandbox Call
      WHEN has_api_key = 1 THEN 0  -- API Key
      ELSE -1  -- Not in funnel
    END AS stage,

    -- Trigger flags
    CASE
      WHEN first_booking_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
      THEN TRUE ELSE FALSE
    END AS first_booking_within_7d,

    -- Headroom: GMV potential above current (simplified: top 30% of segment)
    PERCENT_RANK() OVER (PARTITION BY segment ORDER BY expected_monthly_gmv) AS gmv_percentile

  FROM account_events
  WHERE has_api_key = 1  -- Only accounts that got an API key
)

SELECT * FROM account_stages;


-- ============================================================
-- 2. FUNNEL VALUES BY STAGE (Cumulative)
-- ============================================================
-- For each stage, count accounts AT OR BEYOND that stage.
-- This produces the funnel bars.

WITH account_stages AS (
  -- (use CTE from above)
  SELECT account_id, segment, expected_monthly_gmv, stage
  FROM account_stages_view  -- or inline the CTE
),

funnel_counts AS (
  SELECT
    s.stage_index,
    s.stage_label,

    -- Total count at or beyond this stage
    COUNT(CASE WHEN a.stage >= s.stage_index THEN 1 END) AS total_count,

    -- Total GMV at or beyond this stage
    SUM(CASE WHEN a.stage >= s.stage_index THEN a.expected_monthly_gmv ELSE 0 END) AS total_gmv,

    -- Segment breakdown (count)
    COUNT(CASE WHEN a.stage >= s.stage_index AND a.segment = 'indie' THEN 1 END) AS indie_count,
    COUNT(CASE WHEN a.stage >= s.stage_index AND a.segment = 'funded_ota' THEN 1 END) AS funded_ota_count,
    COUNT(CASE WHEN a.stage >= s.stage_index AND a.segment = 'enterprise' THEN 1 END) AS enterprise_count,

    -- Segment breakdown (GMV)
    SUM(CASE WHEN a.stage >= s.stage_index AND a.segment = 'indie' THEN a.expected_monthly_gmv ELSE 0 END) AS indie_gmv,
    SUM(CASE WHEN a.stage >= s.stage_index AND a.segment = 'funded_ota' THEN a.expected_monthly_gmv ELSE 0 END) AS funded_ota_gmv,
    SUM(CASE WHEN a.stage >= s.stage_index AND a.segment = 'enterprise' THEN a.expected_monthly_gmv ELSE 0 END) AS enterprise_gmv

  FROM (
    SELECT 0 AS stage_index, 'API Key' AS stage_label UNION ALL
    SELECT 1, 'Sandbox Call' UNION ALL
    SELECT 2, 'Production Call' UNION ALL
    SELECT 3, 'Production Booking' UNION ALL
    SELECT 4, 'Sustained Volume'
  ) s
  CROSS JOIN account_stages a
  GROUP BY s.stage_index, s.stage_label
),

funnel_with_conversion AS (
  SELECT
    *,
    -- Conversion rate from previous stage
    ROUND(
      100.0 * total_count / LAG(total_count) OVER (ORDER BY stage_index),
      1
    ) AS conversion_rate_count,

    ROUND(
      100.0 * total_gmv / LAG(total_gmv) OVER (ORDER BY stage_index),
      1
    ) AS conversion_rate_gmv

  FROM funnel_counts
)

SELECT * FROM funnel_with_conversion ORDER BY stage_index;


-- ============================================================
-- 3. LIFECYCLE TRIGGER RULES
-- ============================================================
-- Count accounts matching each trigger predicate.
-- These power the Trigger Layer panel.

WITH account_stages AS (
  -- (use CTE from section 1)
  SELECT
    account_id,
    segment,
    stage,
    expected_monthly_gmv,
    days_since_last_activity,
    first_booking_within_7d,
    gmv_percentile
  FROM account_stages_view
)

SELECT
  -- 1. Onboarding Nudge: First booking in last 7 days
  'Onboarding Nudge' AS rule_name,
  'New' AS tag,
  COUNT(*) AS account_count,
  'First production booking in last 7 days' AS description
FROM account_stages
WHERE stage = 3 AND first_booking_within_7d = TRUE

UNION ALL

SELECT
  -- 2. Reactivation: Sandbox but stalled 14+ days
  'Reactivation Sequence' AS rule_name,
  'At Risk' AS tag,
  COUNT(*) AS account_count,
  'Tested sandbox, no production call, silent 14+ days' AS description
FROM account_stages
WHERE stage = 1 AND days_since_last_activity >= 14

UNION ALL

SELECT
  -- 3. AE Alert: Production call, high GMV, stalled
  'AE Alert' AS rule_name,
  'Priority' AS tag,
  COUNT(*) AS account_count,
  'Production call, no booking, high GMV, stalled 10+ days' AS description
FROM account_stages
WHERE stage = 2
  AND gmv_percentile >= 0.7  -- Top 30% by GMV
  AND days_since_last_activity > 10

UNION ALL

SELECT
  -- 4. Expansion: Sustained volume with headroom
  'Expansion Play' AS rule_name,
  'Growth' AS tag,
  COUNT(*) AS account_count,
  'Sustained volume with GMV headroom' AS description
FROM account_stages
WHERE stage = 4
  AND gmv_percentile < 0.9;  -- Not maxed out, room to grow


-- ============================================================
-- 4. SEGMENT FILTER (Parameterized)
-- ============================================================
-- When user selects a segment filter, add WHERE clause.
-- In BigQuery, use DECLARE or parameterized queries.

DECLARE segment_filter STRING DEFAULT 'all';  -- 'all', 'indie', 'funded_ota', 'enterprise'

WITH filtered_accounts AS (
  SELECT *
  FROM account_stages_view
  WHERE segment_filter = 'all' OR segment = segment_filter
)

-- Then use filtered_accounts in funnel/trigger queries above


-- ============================================================
-- 5. THE CLIFF ANALYSIS
-- ============================================================
-- Quantify the activation cliff (Sandbox → Production Call).
-- This is the key insight the demo visualizes.

WITH stage_totals AS (
  SELECT
    stage,
    COUNT(*) AS account_count,
    SUM(expected_monthly_gmv) AS total_gmv
  FROM account_stages_view
  WHERE stage >= 0
  GROUP BY stage
),

cumulative AS (
  SELECT
    stage,
    SUM(account_count) OVER (ORDER BY stage DESC) AS cumulative_count,
    SUM(total_gmv) OVER (ORDER BY stage DESC) AS cumulative_gmv
  FROM stage_totals
)

SELECT
  'Sandbox Call' AS from_stage,
  'Production Call' AS to_stage,

  -- Count drop
  c1.cumulative_count AS accounts_at_sandbox,
  c2.cumulative_count AS accounts_at_production,
  c1.cumulative_count - c2.cumulative_count AS accounts_lost,
  ROUND(100.0 * c2.cumulative_count / c1.cumulative_count, 1) AS conversion_rate,

  -- GMV drop (the money framing)
  c1.cumulative_gmv AS gmv_at_sandbox,
  c2.cumulative_gmv AS gmv_at_production,
  c1.cumulative_gmv - c2.cumulative_gmv AS gmv_lost,

  -- The punchline
  CONCAT(
    'Lost ',
    FORMAT('%,.0f', c1.cumulative_gmv - c2.cumulative_gmv),
    '€/month in represented pipeline at the activation cliff'
  ) AS insight

FROM cumulative c1
JOIN cumulative c2 ON c1.stage = 1 AND c2.stage = 2;


-- ============================================================
-- 6. POSTHOG-SPECIFIC: Using HogQL
-- ============================================================
-- If using PostHog, the syntax differs slightly. Here's the
-- equivalent funnel query using PostHog's HogQL.

/*
SELECT
  countIf(properties.$event = 'api_key_created') AS stage_0,
  countIf(properties.$event = 'sandbox_call') AS stage_1,
  countIf(properties.$event = 'production_call') AS stage_2,
  countIf(properties.$event = 'production_booking') AS stage_3,
  countIf(
    properties.$event = 'booking_completed'
    AND timestamp >= now() - INTERVAL 30 DAY
  ) AS stage_4
FROM events
WHERE timestamp >= now() - INTERVAL 90 DAY
GROUP BY distinct_id  -- account_id equivalent
*/


-- ============================================================
-- 7. SCHEDULED REFRESH (dbt or BigQuery Scheduled Query)
-- ============================================================
-- In production, these queries would run on a schedule to
-- populate a dashboard table. Example dbt model config:

/*
-- models/connect_activation_funnel.sql
{{ config(
    materialized='table',
    partition_by={'field': 'snapshot_date', 'data_type': 'date'},
    cluster_by=['segment']
) }}

WITH account_stages AS (
  ...
)

SELECT
  CURRENT_DATE() AS snapshot_date,
  *
FROM funnel_with_conversion
*/
