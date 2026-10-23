-- "Away mode": a person on vacation or out sick doesn't check in, and HR can see why
-- they're missing. Away days live in their own table (not check_ins), so they never
-- count as mood data in insights or break/extend the uncomfortable-streak logic.
CREATE TABLE away_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('vacation', 'sick')),
  starts_on date NOT NULL DEFAULT CURRENT_DATE,
  ends_on date,          -- NULL = open-ended, until the person says they're back
  ended_at timestamptz,  -- set when the person taps "I'm back" before ends_on
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_on IS NULL OR ends_on >= starts_on)
);

CREATE INDEX away_periods_employee_idx ON away_periods (employee_id, starts_on DESC);
