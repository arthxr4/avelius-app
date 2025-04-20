# Structure de la Base de Données Supabase

## Tables

[
  {
    "table_name": "appointments",
    "columns": "id uuid, client_id text, contact_id uuid, list_id uuid, date timestamp with time zone, status USER-DEFINED, added_by text, created_at timestamp with time zone, updated_at timestamp with time zone"
  },
  {
    "table_name": "calendars",
    "columns": "id uuid, client_id uuid, name text, description text, platform text, url text, created_at timestamp with time zone"
  },
  {
    "table_name": "client_contracts",
    "columns": "id uuid, client_id text, start_date date, end_date date, created_at timestamp with time zone, updated_at timestamp with time zone, is_recurring boolean, recurrence_unit text, recurrence_every integer, default_goal integer"
  },
  {
    "table_name": "client_members",
    "columns": "id uuid, client_id text, user_email text, invited boolean, accepted_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone"
  },
  {
    "table_name": "clients",
    "columns": "id text, name text, created_by text, created_at timestamp with time zone, client_id text"
  },
  {
    "table_name": "contact_custom_fields",
    "columns": "id uuid, contact_id uuid, field_name text, field_value text"
  },
  {
    "table_name": "contacts",
    "columns": "id uuid, client_id text, first_name text, last_name text, email text, phone text, company text, status USER-DEFINED, notes text, created_at timestamp with time zone, updated_at timestamp with time zone"
  },
  {
    "table_name": "contract_periods",
    "columns": "id uuid, contract_id uuid, period_start date, period_end date, goal integer, rdv_realised integer, status text, performance_percent numeric, created_at timestamp with time zone, updated_at timestamp with time zone"
  },
  {
    "table_name": "onboarding_fields",
    "columns": "id uuid, label text, type text, required boolean, created_at timestamp with time zone, section text, order_in_section integer"
  },
  {
    "table_name": "onboarding_responses",
    "columns": "id uuid, client_id text, field_id uuid, value text, created_at timestamp with time zone, updated_at timestamp with time zone"
  },
  {
    "table_name": "prospecting_list_contacts",
    "columns": "list_id uuid, contact_id uuid"
  },
  {
    "table_name": "prospecting_lists",
    "columns": "id uuid, client_id text, created_by text, title text, status text, date timestamp with time zone, created_at timestamp with time zone, description text"
  },
  {
    "table_name": "users",
    "columns": "id text, first_name text, last_name text, email text, role USER-DEFINED, invited boolean, status USER-DEFINED, accepted_at timestamp without time zone, first_login timestamp without time zone, created_at timestamp without time zone, updated_at timestamp without time zone, avatar_url text"
  }
]




## Relations


[
  {
    "from_table": "contacts",
    "from_column": "client_id",
    "to_table": "clients",
    "to_column": "id"
  },
  {
    "from_table": "prospecting_lists",
    "from_column": "client_id",
    "to_table": "clients",
    "to_column": "id"
  },
  {
    "from_table": "prospecting_lists",
    "from_column": "created_by",
    "to_table": "users",
    "to_column": "id"
  },
  {
    "from_table": "prospecting_list_contacts",
    "from_column": "contact_id",
    "to_table": "contacts",
    "to_column": "id"
  },
  {
    "from_table": "prospecting_list_contacts",
    "from_column": "list_id",
    "to_table": "prospecting_lists",
    "to_column": "id"
  },
  {
    "from_table": "onboarding_responses",
    "from_column": "client_id",
    "to_table": "clients",
    "to_column": "id"
  },
  {
    "from_table": "onboarding_responses",
    "from_column": "field_id",
    "to_table": "onboarding_fields",
    "to_column": "id"
  },
  {
    "from_table": "client_contracts",
    "from_column": "client_id",
    "to_table": "clients",
    "to_column": "id"
  },
  {
    "from_table": "appointments",
    "from_column": "client_id",
    "to_table": "clients",
    "to_column": "id"
  },
  {
    "from_table": "appointments",
    "from_column": "contact_id",
    "to_table": "contacts",
    "to_column": "id"
  },
  {
    "from_table": "appointments",
    "from_column": "list_id",
    "to_table": "prospecting_lists",
    "to_column": "id"
  },
  {
    "from_table": "client_members",
    "from_column": "client_id",
    "to_table": "clients",
    "to_column": "id"
  },
  {
    "from_table": "client_members",
    "from_column": "user_email",
    "to_table": "users",
    "to_column": "email"
  },
  {
    "from_table": "contract_periods",
    "from_column": "contract_id",
    "to_table": "client_contracts",
    "to_column": "id"
  }
]

## Indexes

- À compléter avec les index importants

## Politiques de Sécurité (RLS)

- À compléter avec les politiques de sécurité Row Level Security

## Fonctions et Triggers

- À compléter avec les fonctions et triggers spécifiques

## Types Personnalisés

- À compléter avec les types enum ou composites

## Notes d'Implémentation

- À compléter avec des notes importantes sur l'implémentation

## Migrations

- À compléter avec les informations sur les migrations importantes 