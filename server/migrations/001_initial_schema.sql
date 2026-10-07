CREATE TABLE employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  mood text NOT NULL CHECK (mood IN ('comfortable', 'neutral', 'uncomfortable')),
  checked_in_on date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, checked_in_on)
);

CREATE TABLE check_in_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  check_in_id uuid REFERENCES check_ins(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('note', 'reply', 'talk-choice', 'conversation')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  shared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  check_in_id uuid REFERENCES check_ins(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('bot', 'human')),
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'active', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('employee', 'assistant', 'hr', 'system')),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'normal' CHECK (severity IN ('low', 'normal', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CHECK (employee_id IS NOT NULL OR conversation_id IS NOT NULL)
);

CREATE INDEX check_ins_checked_in_on_idx ON check_ins (checked_in_on);
CREATE INDEX check_in_followups_employee_created_idx ON check_in_followups (employee_id, created_at DESC);
CREATE INDEX conversations_employee_created_idx ON conversations (employee_id, created_at DESC);
CREATE INDEX messages_conversation_created_idx ON messages (conversation_id, created_at);
CREATE INDEX alerts_open_created_idx ON alerts (created_at DESC) WHERE status = 'open';