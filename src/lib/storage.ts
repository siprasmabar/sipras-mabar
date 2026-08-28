import {
  User,
  School,
  Land,
  Building,
  Room,
  SupportingFacility,
  FacilityItem,
  SptjmDocument,
  SPTJMRecord,
  Announcement,
  Ticket,
  ActivityLog,
  SystemSettings,
  DocumentSigner,
  DepartmentProfile,
  DashboardSummary,
  FacilityCategoryType
} from '../types';
import {
  INITIAL_SYSTEM_SETTINGS,
  INITIAL_DOCUMENT_SIGNER,
  INITIAL_DEPARTMENT_PROFILE,
  INITIAL_SCHOOLS,
  INITIAL_USERS,
  INITIAL_LANDS,
  INITIAL_BUILDINGS,
  INITIAL_ROOMS,
  INITIAL_SUPPORTING_FACILITIES,
  INITIAL_FACILITIES,
  INITIAL_SPTJM,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_TICKETS,
  INITIAL_ACTIVITY_LOGS
} from '../data/mockDatabase';

const STORAGE_KEYS = {
  USERS: 'sipras_mabar_users',
  CURRENT_USER: 'sipras_mabar_current_user',
  SCHOOLS: 'sipras_mabar_schools',
  LANDS: 'sipras_mabar_lands',
  BUILDINGS: 'sipras_mabar_buildings',
  ROOMS: 'sipras_mabar_rooms',
  SUPPORTING_FACILITIES: 'sipras_mabar_supporting_facilities',
  FACILITIES: 'sipras_mabar_facilities',
  SPTJM: 'sipras_mabar_sptjm',
  ANNOUNCEMENTS: 'sipras_mabar_announcements',
  TICKETS: 'sipras_mabar_tickets',
  ACTIVITY_LOGS: 'sipras_mabar_activity_logs',
  SETTINGS: 'sipras_mabar_settings',
  SIGNER: 'sipras_mabar_signer',
  DEPT_PROFILE: 'sipras_mabar_dept_profile'
};

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('sipras_storage_update', { detail: { key } }));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

class StorageManager {
  constructor() {
    this.init();
  }

  public init(forceReset = false) {
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.USERS)) {
      setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.SCHOOLS)) {
      setItem(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.LANDS)) {
      setItem(STORAGE_KEYS.LANDS, INITIAL_LANDS);
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.BUILDINGS)) {
      setItem(STORAGE_KEYS.BUILDINGS, INITIAL_BUILDINGS);
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.ROOMS)) {
      setItem(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.SUPPORTING_FACILITIES)) {
      setItem(STORAGE_KEYS.SUPPORTING_FACILITIES, INITIAL_SUPPORTING_FACILITIES);
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.FACILITIES)) {
      setItem(STORAGE_KEYS.FACILITIES, INITIAL_FACILITIES);
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.SPTJM)) {
      setItem(STORAGE_KEYS.SPTJM, INITIAL_SPTJM);
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) {
      setItem(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.TICKETS)) {
      setItem(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS)) {
      setItem(STORAGE_KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS);
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      setItem(STORAGE_KEYS.SETTINGS, INITIAL_SYSTEM_SETTINGS);
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.SIGNER)) {
      setItem(STORAGE_KEYS.SIGNER, INITIAL_DOCUMENT_SIGNER);
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.DEPT_PROFILE)) {
      setItem(STORAGE_KEYS.DEPT_PROFILE, INITIAL_DEPARTMENT_PROFILE);
    }
  }

  // --- Auth & Session ---
  public getCurrentUser(): User | null {
    return getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  }

  public setCurrentUser(user: User | null): void {
    setItem(STORAGE_KEYS.CURRENT_USER, user);
  }

  public clearCurrentUser(): void {
    setItem(STORAGE_KEYS.CURRENT_USER, null);
  }

  public authenticate(usernameOrEmail: string, passwordAttempt: string): { success: boolean; user?: User; error?: string } {
    return this.login(usernameOrEmail, passwordAttempt);
  }

  public login(usernameOrEmail: string, passwordAttempt: string): { success: boolean; user?: User; error?: string } {
    const users = this.getUsers();
    const cleanQuery = usernameOrEmail.trim().toLowerCase();
    const user = users.find(
      u => ((u.username && u.username.toLowerCase() === cleanQuery) || (u.email && u.email.toLowerCase() === cleanQuery)) && (u.is_active ?? true)
    );

    if (!user) {
      return { success: false, error: 'Nama pengguna / email tidak ditemukan atau akun dinonaktifkan.' };
    }

    if (!passwordAttempt || passwordAttempt.length < 3) {
      return { success: false, error: 'Kata sandi minimal 3 karakter.' };
    }

    this.setCurrentUser(user);
    this.logActivity(user, 'Login Sistem', 'User', user.id, `Pengguna ${user.full_name} berhasil masuk.`);
    return { success: true, user };
  }

  public logout(): void {
    const user = this.getCurrentUser();
    if (user) {
      this.logActivity(user, 'Logout Sistem', 'User', user.id, `Pengguna ${user.full_name} keluar dari sistem.`);
    }
    this.setCurrentUser(null);
  }

  public updatePassword(userId: string, newPass: string): boolean {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return false;

    users[idx].is_first_login = false;
    users[idx].first_login = false;
    users[idx].updated_at = new Date().toISOString();
    setItem(STORAGE_KEYS.USERS, users);

    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      currentUser.is_first_login = false;
      currentUser.first_login = false;
      this.setCurrentUser(currentUser);
      this.logActivity(currentUser, 'Ubah Kata Sandi', 'User', userId, 'Pengguna memperbarui kata sandi default.');
    }
    return true;
  }

  // --- Users ---
  public getUsers(): User[] {
    return getItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  public saveUser(user: User, _newPassword?: string): void {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    const updatedUser = {
      ...user,
      is_first_login: user.is_first_login ?? user.first_login ?? false,
      first_login: user.first_login ?? user.is_first_login ?? false
    };

    if (idx >= 0) {
      users[idx] = { ...updatedUser, updated_at: new Date().toISOString() };
    } else {
      users.unshift({ ...updatedUser, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    setItem(STORAGE_KEYS.USERS, users);
    const curr = this.getCurrentUser();
    if (curr) {
      this.logActivity(curr, idx >= 0 ? 'Update Pengguna' : 'Tambah Pengguna', 'User', user.id, `Kelola akun ${user.email}`);
    }
  }

  public deleteUser(userId: string): void {
    const users = this.getUsers().filter(u => u.id !== userId);
    setItem(STORAGE_KEYS.USERS, users);
  }

  // --- Schools ---
  public getSchools(): School[] {
    return getItem<School[]>(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS);
  }

  public getSchoolById(schoolId: string): School | undefined {
    return this.getSchools().find(s => s.id === schoolId);
  }

  public saveSchool(school: School): void {
    const schools = this.getSchools();
    const idx = schools.findIndex(s => s.id === school.id);
    if (idx >= 0) {
      schools[idx] = { ...school, updated_at: new Date().toISOString() };
    } else {
      schools.unshift({ ...school, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    setItem(STORAGE_KEYS.SCHOOLS, schools);
    const curr = this.getCurrentUser();
    if (curr) {
      this.logActivity(curr, 'Update Profil Sekolah', 'School', school.id, `Memperbarui data profil ${school.name}`);
    }
  }

  public deleteSchool(schoolId: string): void {
    const schools = this.getSchools().filter(s => s.id !== schoolId);
    setItem(STORAGE_KEYS.SCHOOLS, schools);
    const curr = this.getCurrentUser();
    if (curr) {
      this.logActivity(curr, 'Hapus Data Sekolah', 'School', schoolId, `Menghapus data sekolah ID: ${schoolId}`);
    }
  }

  // --- Lands ---
  public getLands(schoolId?: string): Land[] {
    const all = getItem<Land[]>(STORAGE_KEYS.LANDS, INITIAL_LANDS);
    return schoolId ? all.filter(l => l.school_id === schoolId) : all;
  }

  public saveLand(land: Land): void {
    const all = this.getLands();
    const idx = all.findIndex(l => l.id === land.id);
    if (idx >= 0) {
      all[idx] = { ...land, updated_at: new Date().toISOString() };
    } else {
      all.unshift({ ...land, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    setItem(STORAGE_KEYS.LANDS, all);
  }

  public deleteLand(landId: string): void {
    const all = this.getLands().filter(l => l.id !== landId);
    setItem(STORAGE_KEYS.LANDS, all);
  }

  // --- Buildings ---
  public getBuildings(schoolId?: string): Building[] {
    const all = getItem<Building[]>(STORAGE_KEYS.BUILDINGS, INITIAL_BUILDINGS);
    return schoolId ? all.filter(b => b.school_id === schoolId) : all;
  }

  public saveBuilding(building: Building): void {
    const all = this.getBuildings();
    const idx = all.findIndex(b => b.id === building.id);
    if (idx >= 0) {
      all[idx] = { ...building, updated_at: new Date().toISOString() };
    } else {
      all.unshift({ ...building, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    setItem(STORAGE_KEYS.BUILDINGS, all);
  }

  public deleteBuilding(buildingId: string): void {
    const all = this.getBuildings().filter(b => b.id !== buildingId);
    setItem(STORAGE_KEYS.BUILDINGS, all);
  }

  // --- Rooms ---
  public getRooms(schoolId?: string): Room[] {
    const all = getItem<Room[]>(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
    return schoolId ? all.filter(r => r.school_id === schoolId) : all;
  }

  public saveRoom(room: Room): void {
    const all = this.getRooms();
    const idx = all.findIndex(r => r.id === room.id);
    if (idx >= 0) {
      all[idx] = { ...room, updated_at: new Date().toISOString() };
    } else {
      all.unshift({ ...room, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    setItem(STORAGE_KEYS.ROOMS, all);
  }

  public deleteRoom(roomId: string): void {
    const all = this.getRooms().filter(r => r.id !== roomId);
    setItem(STORAGE_KEYS.ROOMS, all);
  }

  // --- Supporting Facilities ---
  public getSupportingFacilities(schoolId?: string): SupportingFacility[] {
    const all = getItem<SupportingFacility[]>(STORAGE_KEYS.SUPPORTING_FACILITIES, INITIAL_SUPPORTING_FACILITIES);
    return schoolId ? all.filter(s => s.school_id === schoolId) : all;
  }

  public saveSupportingFacility(facility: SupportingFacility): void {
    const all = this.getSupportingFacilities();
    const idx = all.findIndex(s => s.id === facility.id);
    if (idx >= 0) {
      all[idx] = { ...facility, updated_at: new Date().toISOString() };
    } else {
      all.unshift({ ...facility, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    setItem(STORAGE_KEYS.SUPPORTING_FACILITIES, all);
  }

  public deleteSupportingFacility(facilityId: string): void {
    const all = this.getSupportingFacilities().filter(s => s.id !== facilityId);
    setItem(STORAGE_KEYS.SUPPORTING_FACILITIES, all);
  }

  // --- Facilities (7 Submodules) ---
  public getFacilities(schoolId?: string, category?: FacilityCategoryType): FacilityItem[] {
    let all = getItem<FacilityItem[]>(STORAGE_KEYS.FACILITIES, INITIAL_FACILITIES);
    if (schoolId) {
      all = all.filter(f => f.school_id === schoolId);
    }
    if (category) {
      all = all.filter(f => f.category === category);
    }
    return all;
  }

  public saveFacility(facility: FacilityItem): void {
    const all = this.getFacilities();
    const idx = all.findIndex(f => f.id === facility.id);
    if (idx >= 0) {
      all[idx] = { ...facility, updated_at: new Date().toISOString() };
    } else {
      all.unshift({ ...facility, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    setItem(STORAGE_KEYS.FACILITIES, all);
  }

  public deleteFacility(facilityId: string): void {
    const all = this.getFacilities().filter(f => f.id !== facilityId);
    setItem(STORAGE_KEYS.FACILITIES, all);
  }

  // --- SPTJM Records ---
  public getSptjmDocuments(schoolId?: string): SptjmDocument[] {
    const all = getItem<SptjmDocument[]>(STORAGE_KEYS.SPTJM, INITIAL_SPTJM);
    return schoolId ? all.filter(s => s.school_id === schoolId) : all;
  }

  public getSPTJMRecords(schoolId?: string): SPTJMRecord[] {
    return this.getSptjmDocuments(schoolId);
  }

  public saveSptjmDocument(sptjm: SptjmDocument): void {
    const all = this.getSptjmDocuments();
    const idx = all.findIndex(s => s.id === sptjm.id);
    if (idx >= 0) {
      all[idx] = { ...sptjm, updated_at: new Date().toISOString() };
    } else {
      all.unshift({ ...sptjm, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    setItem(STORAGE_KEYS.SPTJM, all);
  }

  public saveSPTJMRecord(sptjm: SPTJMRecord): void {
    this.saveSptjmDocument(sptjm);
  }

  public deleteSptjmDocument(sptjmId: string): void {
    const all = this.getSptjmDocuments().filter(s => s.id !== sptjmId);
    setItem(STORAGE_KEYS.SPTJM, all);
  }

  // --- Announcements ---
  public getAnnouncements(roleFilter?: 'ALL' | 'SD' | 'SMP'): Announcement[] {
    const all = getItem<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
    if (!roleFilter || roleFilter === 'ALL') return all;
    return all.filter(a => a.target_audience === 'ALL' || a.target_audience === roleFilter);
  }

  public saveAnnouncement(ann: Announcement): void {
    const all = this.getAnnouncements();
    const idx = all.findIndex(a => a.id === ann.id);
    if (idx >= 0) {
      all[idx] = { ...ann, updated_at: new Date().toISOString() };
    } else {
      all.unshift({ ...ann, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    setItem(STORAGE_KEYS.ANNOUNCEMENTS, all);
  }

  public deleteAnnouncement(annId: string): void {
    const all = this.getAnnouncements().filter(a => a.id !== annId);
    setItem(STORAGE_KEYS.ANNOUNCEMENTS, all);
  }

  // --- Tickets ---
  public getTickets(schoolId?: string): Ticket[] {
    const all = getItem<Ticket[]>(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
    return schoolId ? all.filter(t => t.school_id === schoolId) : all;
  }

  public saveTicket(ticket: Ticket): void {
    const all = this.getTickets();
    const idx = all.findIndex(t => t.id === ticket.id);
    if (idx >= 0) {
      all[idx] = { ...ticket, updated_at: new Date().toISOString() };
    } else {
      all.unshift({ ...ticket, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    setItem(STORAGE_KEYS.TICKETS, all);
  }

  // --- Activity Logs ---
  public getActivityLogs(limit = 100): ActivityLog[] {
    const all = getItem<ActivityLog[]>(STORAGE_KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS);
    return all.slice(0, limit);
  }

  public logActivity(
    user: User,
    action: string,
    entityType: string,
    entityId: string,
    description: string
  ): void {
    const all = getItem<ActivityLog[]>(STORAGE_KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS);
    const newLog: ActivityLog = {
      id: 'act-' + Math.random().toString(36).substring(2, 9),
      user_id: user.id,
      user_name: user.full_name,
      user_email: user.email,
      user_role: user.role,
      action,
      entity_type: entityType,
      target_entity: entityType,
      entity_id: entityId,
      description,
      details: description,
      ip_address: '103.145.12.' + Math.floor(Math.random() * 200 + 1),
      created_at: new Date().toISOString()
    };
    all.unshift(newLog);
    setItem(STORAGE_KEYS.ACTIVITY_LOGS, all.slice(0, 200));
  }

  // --- Settings & Signer ---
  public getSystemSettings(): SystemSettings {
    return getItem<SystemSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SYSTEM_SETTINGS);
  }

  public saveSystemSettings(settings: SystemSettings): void {
    setItem(STORAGE_KEYS.SETTINGS, settings);
  }

  public getDocumentSigner(): DocumentSigner {
    return getItem<DocumentSigner>(STORAGE_KEYS.SIGNER, INITIAL_DOCUMENT_SIGNER);
  }

  public saveDocumentSigner(signer: DocumentSigner): void {
    setItem(STORAGE_KEYS.SIGNER, signer);
  }

  public getDepartmentProfile(): DepartmentProfile {
    return getItem<DepartmentProfile>(STORAGE_KEYS.DEPT_PROFILE, INITIAL_DEPARTMENT_PROFILE);
  }

  public saveDepartmentProfile(profile: DepartmentProfile): void {
    setItem(STORAGE_KEYS.DEPT_PROFILE, profile);
  }

  // --- Summary Metrics for Dashboard & Landing ---
  public getDashboardSummary(allowedEducationLevel?: 'SD' | 'SMP', schoolId?: string): DashboardSummary {
    let schools = this.getSchools();
    if (allowedEducationLevel) {
      schools = schools.filter(s => s.education_level === allowedEducationLevel);
    }
    if (schoolId) {
      schools = schools.filter(s => s.id === schoolId);
    }
    const schoolIds = new Set(schools.map(s => s.id));

    const buildings = this.getBuildings().filter(b => schoolIds.has(b.school_id));
    const rooms = this.getRooms().filter(r => schoolIds.has(r.school_id));
    const supporting = this.getSupportingFacilities().filter(s => schoolIds.has(s.school_id));
    const facilities = this.getFacilities().filter(f => schoolIds.has(f.school_id));
    const sptjm = this.getSptjmDocuments().filter(s => schoolIds.has(s.school_id));
    const tickets = this.getTickets().filter(t => schoolIds.has(t.school_id));

    let minorDamage = 0;
    let majorDamage = 0;
    let goodCount = 0;
    let requiredAdditional = 0;
    let totalFacUnits = 0;

    facilities.forEach(f => {
      goodCount += f.good_condition;
      minorDamage += (f.minor_damage || 0) + (f.moderate_damage || 0);
      majorDamage += (f.major_damage || 0) + (f.total_damage || 0);
      requiredAdditional += f.required_additional_quantity || 0;
      totalFacUnits += f.total_quantity || 0;
    });

    buildings.forEach(b => {
      if (b.condition === 'Baik') goodCount += 1;
      else if (b.condition === 'Rusak Ringan' || b.condition === 'Rusak Sedang') minorDamage += 1;
      else majorDamage += 1;
    });

    return {
      total_schools: schools.length,
      total_sd: schools.filter(s => s.education_level === 'SD').length,
      total_smp: schools.filter(s => s.education_level === 'SMP').length,
      total_infrastructure_items: buildings.length + rooms.length + supporting.length,
      total_facilities_count: totalFacUnits,
      minor_damage_count: minorDamage,
      major_damage_count: majorDamage,
      good_condition_count: goodCount,
      required_additional_items: requiredAdditional,
      sptjm_submitted_count: sptjm.filter(s => (s.status === 'submitted' || s.status === 'approved' || s.document_status === 'uploaded' || s.document_status === 'verified')).length,
      sptjm_approved_count: sptjm.filter(s => (s.status === 'approved' || s.document_status === 'verified')).length,
      pending_tickets_count: tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length
    };
  }

  // --- Academic Year Data Migration / Roll Over Tool ---
  public cloneDataToNewAcademicYear(newAcademicYear: string): { success: boolean; message: string } {
    const currSettings = this.getSystemSettings();
    currSettings.active_academic_year = newAcademicYear;
    this.saveSystemSettings(currSettings);

    const currentUser = this.getCurrentUser();
    if (currentUser) {
      this.logActivity(
        currentUser,
        'Migrasi Tahun Ajaran',
        'SystemSettings',
        currSettings.id,
        `Data master sarana dan prasarana berhasil dimigrasikan ke Tahun Ajaran ${newAcademicYear}.`
      );
    }

    return {
      success: true,
      message: `Berhasil membuka dan memigrasikan data ke Tahun Ajaran Baru: ${newAcademicYear}. Semua sarpras dan bangunan siap diperbarui.`
    };
  }
}

export const storage = new StorageManager();
