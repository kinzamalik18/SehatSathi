-- SehatSaathi Database Schema
-- Run this in your Supabase SQL Editor

-- Conversations table: tracks each user interaction session
create table conversations (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null,
  language text default 'ur', -- ur | pa | en
  created_at timestamptz default now()
);

-- Triage cases table: stores each symptom assessment
create table triage_cases (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  transcript_text text,
  symptoms_summary text,
  urgency_level text not null,        -- emergency | soon | monitor
  confidence numeric,
  triggered_by text not null,         -- 'model' | 'keyword_override'
  status text default 'open',         -- open | contacted | resolved
  audio_url text,
  created_at timestamptz default now()
);

-- Clinics table: nearby healthcare facilities
create table clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  lat numeric,
  lng numeric,
  open_hours text
);

-- Seed demo clinics for the portfolio version
insert into clinics (name, phone, address, open_hours) values
  ('Demo Rural Health Center', '0300-0000000', 'Main Road, Demo Town', 'Mon-Sat 8am-6pm'),
  ('Demo District Hospital', '0300-0000001', 'Hospital Road, Demo City', '24 hours');
