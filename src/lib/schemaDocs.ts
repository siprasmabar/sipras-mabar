/**
 * SIPRAS MABAR - Database Architecture, PostgreSQL Schemas & Supabase RLS Policies
 */

export const POSTGRES_SCHEMA_SQL = `-- ==============================================================================
-- SIPRAS MABAR (Sistem Informasi Sarana dan Prasarana Sekolah Kab. Manggarai Barat)
-- Database Architecture: PostgreSQL 15+ / Supabase
-- Primary Keys: UUID DEFAULT gen_random_uuid()
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUMS
CREATE TYPE user_role_enum AS ENUM ('super_admin', 'sd_admin', 'smp_admin', 'school_operator');
CREATE TYPE education_level_enum AS ENUM ('SD', 'SMP');
CREATE TYPE district_enum AS ENUM (
  'Komodo', 'Boleng', 'Mbeliling', 'Sano Nggoang', 'Lembor', 'South Lembor',
  'Welak', 'Pacar', 'Macang Pacar', 'Ndoso', 'Kuwus', 'West Kuwus'
);
CREATE TYPE principal_status_enum AS ENUM ('PNS', 'PPPK', 'Honorer', 'Plt');
CREATE TYPE physical_condition_enum AS ENUM ('Baik', 'Rusak Ringan', 'Rusak Sedang', 'Rusak Berat', 'Rusak Total');
CREATE TYPE validation_status_enum AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE audience_enum AS ENUM ('ALL', 'SD', 'SMP');
CREATE TYPE ticket_status_enum AS ENUM ('open', 'in_progress', 'closed');
CREATE TYPE ticket_priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');

-- 2. SCHOOLS TABLE
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    npsn VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    education_level education_level_enum NOT NULL,
    establishment_year INT NOT NULL,
    principal_name VARCHAR(255) NOT NULL,
    principal_nip VARCHAR(50),
    principal_phone VARCHAR(30),
    principal_status principal_status_enum DEFAULT 'PNS',
    school_phone VARCHAR(30),
    district district_enum NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL DEFAULT -8.5089,
    longitude DOUBLE PRECISION NOT NULL DEFAULT 119.8964,
    accreditation VARCHAR(20) DEFAULT 'Belum Terakreditasi',
    profile_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'school_operator',
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    is_first_login BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    phone VARCHAR(30),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LANDS TABLE
CREATE TABLE lands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    ownership_status VARCHAR(100) NOT NULL,
    rights_type VARCHAR(100) NOT NULL,
    certificate_number VARCHAR(150),
    certificate_date DATE,
    certificate_holder VARCHAR(255),
    land_area NUMERIC(12,2) NOT NULL,
    certificate_url TEXT,
    photo_url TEXT,
    description TEXT,
    gps_lat DOUBLE PRECISION,
    gps_lng DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BUILDINGS TABLE
CREATE TABLE buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    floors INT NOT NULL DEFAULT 1,
    length NUMERIC(8,2) NOT NULL,
    width NUMERIC(8,2) NOT NULL,
    area NUMERIC(10,2) GENERATED ALWAYS AS (length * width) STORED,
    construction_year INT NOT NULL,
    funding_source VARCHAR(100) NOT NULL,
    construction_type VARCHAR(100) NOT NULL,
    ownership_status VARCHAR(100) NOT NULL,
    damage_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    condition physical_condition_enum NOT NULL DEFAULT 'Baik',
    photo_url TEXT,
    notes TEXT,
    validation_status validation_status_enum DEFAULT 'pending',
    validation_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ROOMS TABLE
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    room_type VARCHAR(100) NOT NULL,
    room_function VARCHAR(255) NOT NULL,
    floor_number INT DEFAULT 1,
    length NUMERIC(8,2) NOT NULL,
    width NUMERIC(8,2) NOT NULL,
    area NUMERIC(10,2) GENERATED ALWAYS AS (length * width) STORED,
    capacity INT NOT NULL DEFAULT 30,
    status VARCHAR(50) DEFAULT 'Aktif Digunakan',
    last_renovation_year INT,
    damage_percentage NUMERIC(5,2) DEFAULT 0,
    condition physical_condition_enum DEFAULT 'Baik',
    photo_url TEXT,
    notes TEXT,
    validation_status validation_status_enum DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SUPPORTING FACILITIES TABLE
CREATE TABLE supporting_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    facility_type VARCHAR(100) NOT NULL,
    area NUMERIC(10,2) DEFAULT 0,
    last_renovation_date DATE,
    damage_percentage NUMERIC(5,2) DEFAULT 0,
    condition physical_condition_enum DEFAULT 'Baik',
    photo_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. FACILITIES ITEMS TABLE
CREATE TABLE facility_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    subcategory VARCHAR(100) NOT NULL,
    good_condition INT NOT NULL DEFAULT 0,
    minor_damage INT NOT NULL DEFAULT 0,
    major_damage INT NOT NULL DEFAULT 0,
    total_quantity INT GENERATED ALWAYS AS (good_condition + minor_damage + major_damage) STORED,
    required_additional_quantity INT NOT NULL DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'Unit',
    photo_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SPTJM DOCUMENTS TABLE
CREATE TABLE sptjm_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year VARCHAR(50) NOT NULL,
    period VARCHAR(50) NOT NULL,
    letter_number VARCHAR(150) NOT NULL,
    signed_date DATE NOT NULL,
    principal_name VARCHAR(255) NOT NULL,
    principal_nip VARCHAR(50),
    file_url TEXT,
    status VARCHAR(50) DEFAULT 'submitted',
    verification_notes TEXT,
    verified_by VARCHAR(255),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ANNOUNCEMENTS TABLE
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_audience audience_enum DEFAULT 'ALL',
    announcement_type VARCHAR(50) DEFAULT 'notice',
    attachment_url TEXT,
    is_published BOOLEAN DEFAULT TRUE,
    author_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TICKETS TABLE & REPLIES
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_no VARCHAR(50) UNIQUE NOT NULL,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    priority ticket_priority_enum DEFAULT 'medium',
    status ticket_status_enum DEFAULT 'open',
    description TEXT NOT NULL,
    attachment_url TEXT,
    created_by_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ticket_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role user_role_enum NOT NULL,
    message TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. ACTIVITY LOGS TABLE
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role user_role_enum NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    description TEXT NOT NULL,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. SYSTEM SETTINGS TABLE
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    active_academic_year VARCHAR(50) NOT NULL DEFAULT '2025/2026 - Ganjil',
    is_submission_open BOOLEAN DEFAULT TRUE,
    submission_deadline DATE,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    announcement_banner TEXT,
    system_name VARCHAR(100) DEFAULT 'SIPRAS MABAR',
    system_subtext VARCHAR(255),
    allow_operator_registration BOOLEAN DEFAULT FALSE
);

-- 14. DOCUMENT SIGNERS TABLE
CREATE TABLE document_signers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_name VARCHAR(255) NOT NULL,
    regency_name VARCHAR(255) NOT NULL,
    head_of_department_name VARCHAR(255) NOT NULL,
    head_of_department_nip VARCHAR(50) NOT NULL,
    head_of_department_title VARCHAR(255) NOT NULL,
    signature_stamp_url TEXT,
    letterhead_logo_url TEXT,
    address_line TEXT,
    postal_code VARCHAR(20),
    email VARCHAR(100),
    phone VARCHAR(50),
    website VARCHAR(150)
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX idx_schools_district ON schools(district);
CREATE INDEX idx_schools_level ON schools(education_level);
CREATE INDEX idx_buildings_school ON buildings(school_id);
CREATE INDEX idx_rooms_building ON rooms(building_id);
CREATE INDEX idx_facilities_school_cat ON facility_items(school_id, category);
CREATE INDEX idx_tickets_status ON tickets(status);
`;

export const SUPABASE_RLS_POLICIES_SQL = `-- ==============================================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES FOR SIPRAS MABAR
-- Enforcing strict multi-tenant school operator isolation and admin permissions
-- ==============================================================================

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lands ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE supporting_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sptjm_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION auth.current_user_role()
RETURNS user_role_enum AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.current_school_id()
RETURNS UUID AS $$
  SELECT school_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 1. SCHOOLS POLICIES
CREATE POLICY "Super admin full access on schools"
ON schools FOR ALL
USING (auth.current_user_role() = 'super_admin');

CREATE POLICY "Admins can view schools in their education level"
ON schools FOR SELECT
USING (
  (auth.current_user_role() = 'sd_admin' AND education_level = 'SD') OR
  (auth.current_user_role() = 'smp_admin' AND education_level = 'SMP')
);

CREATE POLICY "School operators can manage only their school"
ON schools FOR ALL
USING (id = auth.current_school_id());

-- 2. BUILDINGS & ROOMS POLICIES
CREATE POLICY "Super admin full access on buildings"
ON buildings FOR ALL
USING (auth.current_user_role() = 'super_admin');

CREATE POLICY "Admins view and validate buildings by level"
ON buildings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM schools s
    WHERE s.id = buildings.school_id
    AND (
      (auth.current_user_role() = 'sd_admin' AND s.education_level = 'SD') OR
      (auth.current_user_role() = 'smp_admin' AND s.education_level = 'SMP')
    )
  )
);

CREATE POLICY "Operators manage buildings of their own school"
ON buildings FOR ALL
USING (school_id = auth.current_school_id());

-- 3. FACILITIES ITEMS POLICIES
CREATE POLICY "Super admin full access on facilities"
ON facility_items FOR ALL
USING (auth.current_user_role() = 'super_admin');

CREATE POLICY "Operators manage facilities of their own school"
ON facility_items FOR ALL
USING (school_id = auth.current_school_id());

-- 4. TICKETS POLICIES
CREATE POLICY "Operators see and create their tickets"
ON tickets FOR ALL
USING (school_id = auth.current_school_id());

CREATE POLICY "Admins and Super Admins manage all tickets"
ON tickets FOR ALL
USING (auth.current_user_role() IN ('super_admin', 'sd_admin', 'smp_admin'));
`;

export const COMPLETE_SUPABASE_SCHEMA = `${POSTGRES_SCHEMA_SQL}\n\n${SUPABASE_RLS_POLICIES_SQL}`;

export const DEPLOYMENT_CHECKLIST = [
  'Buat project baru di Supabase Cloud (https://database.new) dengan region Singapore / Jakarta.',
  'Buka menu SQL Editor di Supabase Dashboard.',
  'Jalankan seluruh skrip DDL PostgreSQL untuk membuat tabel, trigger, dan view data.',
  'Jalankan skrip Row Level Security (RLS) policies untuk memproteksi multi-tenant operator dan dinas.',
  'Buat Storage Bucket "sipras-attachments" dan "sptjm-documents" dengan status public read.',
  'Salin URL API & Anon Public Key dari project settings ke environment (.env.local).',
  'Jalankan "npm run build" dan periksa seluruh komponen siap dideploy ke server.',
  'Lakukan tes login perdana operator sekolah dan pastikan mandatory change password bekerja.'
];

export const ARCHITECTURE_NOTES = [
  {
    title: 'Multi-Tenant Architecture',
    description: 'Data sekolah terisolasi secara horizontal per operator satuan pendidikan, dengan agregasi vertikal oleh Admin SD, Admin SMP, dan Super Admin.'
  },
  {
    title: 'Row Level Security (RLS)',
    description: 'Setiap query dieksekusi di bawah pengawasan kebijakan RLS PostgreSQL 15+ berdasarkan klaim token pengguna auth.uid() dan role sistem.'
  },
  {
    title: 'Dual Mode Data Layer',
    description: 'Mendukung penyimpanan offline-ready berbasis LocalStorage dan transisi seamless ke Supabase PostgreSQL API.'
  },
  {
    title: 'Audit Trail & Cybersecurity',
    description: 'Setiap operasi mutasi data, login, approval SPTJM, dan penghapusan item direkam dalam tabel activity_logs dengan alamat IP dan timestamp WITA.'
  }
];

export const ERD_MERMAID_DIAGRAM = `erDiagram
    USERS ||--o{ ACTIVITY_LOGS : "logs"
    USERS ||--o| SCHOOLS : "manages (operator)"
    SCHOOLS ||--o{ LANDS : "possesses"
    SCHOOLS ||--o{ BUILDINGS : "contains"
    BUILDINGS ||--o{ ROOMS : "houses"
    SCHOOLS ||--o{ SUPPORTING_FACILITIES : "operates"
    SCHOOLS ||--o{ FACILITY_ITEMS : "inventories"
    SCHOOLS ||--o{ SPTJM_DOCUMENTS : "submits"
    SCHOOLS ||--o{ TICKETS : "creates"
    TICKETS ||--o{ TICKET_REPLIES : "contains"
    USERS ||--o{ ANNOUNCEMENTS : "authors"
`;

export const DEPLOYMENT_AND_ARCHITECTURE_DOC = `# ARSITEKTUR SISTEM DAN PANDUAN DEPLOYMENT SIPRAS MABAR

## 1. Ikhtisar Arsitektur
SIPRAS MABAR dirancang dengan pendekatan modular Single Page Application (SPA) berkinerja tinggi menggunakan React 19, TypeScript, Tailwind CSS, Leaflet GIS, dan Recharts, dengan backend Supabase (PostgreSQL 15 + RLS + Auth + Storage).

## 2. Struktur Role & Isolasi Akses (RBAC)
1. **Super Admin (Dinas Dikpora Mabar)**:
   - Akses tak terbatas ke seluruh modul 12 kecamatan.
   - Manajemen akun admin dan sekolah.
   - Pengaturan tahun ajaran & migrasi data sarpras.
   - Verifikasi & approval SPTJM serta penutupan tiket helpdesk.
2. **Admin SD & Admin SMP**:
   - Isolasi data vertikal sesuai jenjang kewenangan.
   - Verifikasi kondisi kerusakan gedung & ruang.
   - Balas tiket & monitoring peta sebaran.
3. **Operator Sekolah**:
   - Isolasi data horizontal (hanya sekolah miliknya).
   - Wajib ganti password pada login perdana.
   - Menu terkunci sampai data Profil Sekolah terisi lengkap.
   - Pengelolaan aset sarpras 7 submodul & cetak SPTJM.
`;
