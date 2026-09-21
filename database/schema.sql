CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  phone VARCHAR(30) NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'professional', 'admin')),
  professional_id VARCHAR(40),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS professionals (
  id VARCHAR(40) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  specialty VARCHAR(160) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  initials VARCHAR(4) NOT NULL,
  tone VARCHAR(30) NOT NULL DEFAULT 'rose',
  service_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  work_days JSONB NOT NULL DEFAULT '[1,2,3,4,5,6]'::jsonb,
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '18:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id VARCHAR(40) NOT NULL,
  service_name VARCHAR(160) NOT NULL,
  professional_id VARCHAR(40) NOT NULL,
  professional_name VARCHAR(160) NOT NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 15 AND 720),
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  status VARCHAR(30) NOT NULL DEFAULT 'Agendado' CHECK (status IN ('Agendado', 'Confirmado', 'Concluído', 'Cancelado', 'Não compareceu')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedule_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id VARCHAR(40) REFERENCES professionals(id) ON DELETE CASCADE,
  block_date DATE NOT NULL,
  reason VARCHAR(180) NOT NULL,
  whole_day BOOLEAN NOT NULL DEFAULT TRUE,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (whole_day OR (start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time))
);

CREATE INDEX IF NOT EXISTS appointments_client_idx ON appointments(client_id, appointment_date, start_time);
CREATE INDEX IF NOT EXISTS appointments_professional_idx ON appointments(professional_id, appointment_date, start_time);
CREATE INDEX IF NOT EXISTS schedule_blocks_date_idx ON schedule_blocks(block_date, professional_id);
