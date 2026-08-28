/**
 * SIPRAS MABAR - Core Type Definitions & Enums
 * School Facilities and Infrastructure Information System of West Manggarai Regency
 */

export type UserRole = 'super_admin' | 'sd_admin' | 'smp_admin' | 'school_operator';

export type EducationLevel = 'SD' | 'SMP';

export type DistrictName = 
  | 'Komodo'
  | 'Boleng'
  | 'Mbeliling'
  | 'Sano Nggoang'
  | 'Lembor'
  | 'South Lembor'
  | 'Welak'
  | 'Pacar'
  | 'Macang Pacar'
  | 'Ndoso'
  | 'Kuwus'
  | 'West Kuwus';

export const DISTRICT_LIST: DistrictName[] = [
  'Komodo',
  'Boleng',
  'Mbeliling',
  'Sano Nggoang',
  'Lembor',
  'South Lembor',
  'Welak',
  'Pacar',
  'Macang Pacar',
  'Ndoso',
  'Kuwus',
  'West Kuwus'
];

export type PrincipalStatus = 'PNS' | 'PPPK' | 'Honorer' | 'Plt';

export type OwnershipStatus = 'Milik Sendiri' | 'Sewa' | 'Pinjam Pakai' | 'Hibah' | 'Pemerintah Daerah';

export type LandRightsType = 'SHM' | 'HGB' | 'Hak Pakai' | 'Girik/Adat' | 'Belum Bersertifikat';

export type FundingSource = 'APBD' | 'APBN/DAK' | 'BOS' | 'Yayasan/Swasta' | 'CSR/Donor';

export type ConstructionType = 'Permanen' | 'Semi Permanen' | 'Darurat/Kayu';

export type PhysicalCondition = 'Baik' | 'Rusak Ringan' | 'Rusak Sedang' | 'Rusak Berat' | 'Rusak Total';

export type ValidationStatus = 'pending' | 'verified' | 'rejected';

export type AnnouncementAudience = 'ALL' | 'SD' | 'SMP';

export type AnnouncementType = 'notice' | 'warning' | 'message' | 'instruction';

export type TicketStatus = 'open' | 'in_progress' | 'closed';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type FacilityCategoryType = 
  | 'furniture'
  | 'it_equipment'
  | 'learning_equipment'
  | 'books'
  | 'sports_equipment'
  | 'health_equipment'
  | 'supporting_assets'
  | 'other';

export type FacilityCategory = FacilityCategoryType;

export interface FacilityCategoryMeta {
  id: FacilityCategory;
  label: string;
  description: string;
}

export const FACILITY_CATEGORIES: FacilityCategoryMeta[] = [
  { id: 'furniture', label: 'Mebel & Perabot', description: 'Meja, kursi siswa/guru, lemari, rak buku, papan tulis' },
  { id: 'it_equipment', label: 'Peralatan TIK / Komputer', description: 'Chromebook, laptop, PC lab, proyektor, router, printer' },
  { id: 'learning_equipment', label: 'Media & Alat Peraga Pembelajaran', description: 'Alat peraga IPA/IPS, torso, mikroskop, globe, peta dinding' },
  { id: 'books', label: 'Buku & Koleksi Perpustakaan', description: 'Buku teks utama, buku referensi, ensiklopedia, modul' },
  { id: 'sports_equipment', label: 'Sarana Olahraga', description: 'Bola voli, sepak bola, matras, raket, tiang net' },
  { id: 'health_equipment', label: 'Peralatan UKS & Kesehatan', description: 'Tempat tidur UKS, timbangan, tensimeter, kotak P3K' },
  { id: 'other', label: 'Sarana Penunjang Lainnya', description: 'Genset, sound system, APAR, drum band, tenda pramuka' }
];

export interface User {
  id: string;
  username?: string;
  email: string;
  full_name: string;
  role: UserRole;
  school_id?: string | null;
  is_first_login?: boolean;
  first_login?: boolean;
  is_active?: boolean;
  phone?: string;
  avatar_url?: string;
  new_password?: string;
  created_at: string;
  updated_at: string;
}

export interface School {
  id: string;
  npsn: string;
  name: string;
  education_level: EducationLevel;
  establishment_year: number;
  principal_name: string;
  principal_nip: string;
  principal_phone: string;
  principal_status: PrincipalStatus;
  school_phone: string;
  district: DistrictName;
  address: string;
  latitude: number;
  longitude: number;
  accreditation: 'A' | 'B' | 'C' | 'Belum Terakreditasi';
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Land {
  id: string;
  school_id: string;
  name: string;
  ownership_status: OwnershipStatus;
  rights_type: LandRightsType;
  certificate_number: string;
  certificate_date: string;
  certificate_holder: string;
  land_area: number; // in m2
  certificate_url?: string;
  photo_url?: string;
  description: string;
  gps_lat?: number;
  gps_lng?: number;
  created_at: string;
  updated_at: string;
}

export interface Building {
  id: string;
  school_id: string;
  code: string;
  name: string;
  floors: number;
  length: number;
  width: number;
  area: number; // auto-calculated
  construction_year: number;
  funding_source: FundingSource;
  construction_type: ConstructionType;
  ownership_status: OwnershipStatus;
  damage_percentage: number;
  condition: PhysicalCondition; // auto-calculated
  photo_url?: string;
  notes: string;
  validation_status: ValidationStatus;
  validation_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  school_id: string;
  building_id: string;
  building_name?: string;
  room_type: string;
  room_function: string;
  floor_number: number;
  length: number;
  width: number;
  area: number; // auto-calculated
  capacity: number;
  status: 'Aktif Digunakan' | 'Rusak/Tidak Digunakan' | 'Alih Fungsi';
  last_renovation_year: number;
  damage_percentage: number;
  condition: PhysicalCondition;
  photo_url?: string;
  notes: string;
  validation_status: ValidationStatus;
  created_at: string;
  updated_at: string;
}

export interface SupportingFacility {
  id: string;
  school_id: string;
  name: string;
  facility_type?: string;
  type?: string;
  area: number;
  last_renovation_date: string;
  damage_percentage: number;
  condition: PhysicalCondition;
  photo_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FacilityItem {
  id: string;
  school_id: string;
  category: FacilityCategory;
  item_name?: string;
  name?: string;
  subcategory?: string;
  room_id?: string;
  room_name?: string;
  specification?: string;
  good_condition: number;
  minor_damage: number;
  moderate_damage?: number;
  major_damage: number;
  total_damage?: number;
  total_quantity: number; // auto-calculated (good + minor + mod + maj + tot)
  required_additional_quantity: number;
  unit?: string;
  source?: string;
  condition?: PhysicalCondition;
  photo_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SPTJMRecord {
  id: string;
  school_id: string;
  academic_year: string;
  letter_number: string;
  submission_date?: string;
  signed_date?: string;
  period?: 'Semester Ganjil' | 'Semester Genap' | 'Tahunan';
  principal_name: string;
  principal_nip: string;
  document_status?: 'draft' | 'uploaded' | 'verified' | 'rejected' | 'submitted' | 'approved';
  status?: 'draft' | 'submitted' | 'approved' | 'rejected' | 'uploaded' | 'verified';
  file_url?: string;
  file_name?: string;
  admin_notes?: string;
  verification_notes?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export type SptjmDocument = SPTJMRecord;

export interface Announcement {
  id: string;
  title: string;
  content: string;
  target_audience: AnnouncementAudience;
  announcement_type: AnnouncementType;
  attachment_url?: string;
  is_published: boolean;
  author_id: string;
  author_name?: string;
  created_at: string;
  updated_at: string;
}

export interface TicketReply {
  id: string;
  ticket_id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  message: string;
  attachment_url?: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  ticket_no: string;
  school_id: string;
  school_name?: string;
  subject: string;
  category: 'Sarana' | 'Prasarana' | 'SPTJM/Validasi' | 'Akun & Teknis' | 'Lainnya';
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
  attachment_url?: string;
  created_by_name: string;
  replies: TicketReply[];
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  user_email?: string;
  user_role: UserRole;
  action: string;
  entity_type?: string;
  target_entity?: string;
  entity_id?: string;
  description?: string;
  details?: string;
  ip_address: string;
  created_at: string;
}

export interface SystemSettings {
  id: string;
  active_academic_year: string;
  is_submission_open: boolean;
  submission_deadline: string;
  dak_submission_deadline?: string;
  maintenance_mode: boolean;
  announcement_banner: string;
  system_name: string;
  system_subtext: string;
  allow_operator_registration: boolean;
}

export interface DocumentSigner {
  id: string;
  department_name: string;
  regency_name: string;
  head_of_department_name: string;
  head_of_department_nip: string;
  head_of_department_title: string;
  signature_stamp_url?: string;
  letterhead_logo_url?: string;
  address_line: string;
  postal_code: string;
  email: string;
  phone: string;
  website: string;
}

export interface DepartmentProfile {
  id: string;
  name: string;
  regency_seat: string;
  vision: string;
  mission: string[];
  contact_person: string;
  hotline_phone: string;
  helpdesk_email: string;
  office_hours: string;
}

export interface DashboardSummary {
  total_schools: number;
  total_sd: number;
  total_smp: number;
  total_infrastructure_items: number;
  total_facilities_count: number;
  minor_damage_count: number;
  major_damage_count: number;
  good_condition_count: number;
  required_additional_items: number;
  sptjm_submitted_count: number;
  sptjm_approved_count: number;
  pending_tickets_count: number;
}
