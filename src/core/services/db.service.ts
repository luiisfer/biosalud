
import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { environment } from '../../environments/environment';

// --- CONFIGURACIÓN SUPABASE ---
const SUPABASE_URL = environment.supabaseUrl;
const SUPABASE_KEY = environment.supabaseAnonKey;

// Table Names (Matching previous collection IDs for consistency)
const TBL_PATIENTS = 'patients';
const TBL_EXAMS = 'exams';
const TBL_RESULTS = 'lab_results';
const TBL_DOCTORS = 'doctors';
const TBL_APPOINTMENTS = 'appointments';
const TBL_USERS = 'users';
const TBL_SALES = 'sales';
const TBL_SETTINGS = 'settings';

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: 'Admin' | 'Técnico' | 'Recepcionista';
  lastLogin?: string;
  authId?: string;
}

export interface Methodology {
  id: string;
  name: string;
  description: string;
  price?: number;
  createdBy?: string;

  lastModifiedBy?: string;
  creator?: { name: string };
  modifier?: { name: string };
}

export interface Profile {
  id: string;
  name: string;
  description: string;
  price?: number;
  createdBy?: string;

  lastModifiedBy?: string;
  creator?: { name: string };
  modifier?: { name: string };
}

export interface Exam {
  id: string;
  name: string;
  code: string;
  price: number;
  description: string;
  range?: string;
  unit?: string;
  profile_id?: string;
  methodology_id?: string;
  createdBy?: string;
  lastModifiedBy?: string;

  creator?: { name: string };
  modifier?: { name: string };
}

export interface Patient {
  id: string;
  name: string;
  dpi: string;
  nit?: string;
  birthDate?: string;
  doctor?: string;
  gender: 'Masculino' | 'Femenino';
  age: number;
  email?: string;
  phone?: string;
  history: string;
  createdBy?: string;
  lastModifiedBy?: string;
  creator?: { name: string };
  modifier?: { name: string };
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  referralsLastMonth: number;
  status: 'Activo' | 'En Riesgo' | 'Inactivo';
  lastContact: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  date: string;
  time: string;
  status: 'Programado' | 'Completado' | 'Cancelado' | 'Resultados Listos';
  type: string;
}

export interface LabResult {
  id: string;
  patientId: string;
  testName: string;
  date: string;
  values: string;
  interpretation?: string;
  status: 'Pendiente' | 'Finalizado';
  createdBy?: string;
  lastModifiedBy?: string;
  created_at?: string;
  orderNumber?: string;
  price?: number;
  creator?: { name: string };
  modifier?: { name: string };
}

export interface Sale {
  id: string;
  date: string;
  patientId: string;
  patientName: string;
  items: string[];
  total: number; // This will now represent the Subtotal (Gross)
  subtotal?: number;
  discount?: number;
  tax?: number;
  finalTotal?: number;
  method: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Seguro';
  createdBy?: string;
  creator?: { name: string };
}

@Injectable({
  providedIn: 'root'
})
export class DbService {
  private router = inject(Router);
  private supabase: SupabaseClient;

  // Connection Status
  connectionStatus = signal<'checking' | 'connected' | 'error'>('checking');
  connectionError = signal<string>('');
  authInitialized = signal<boolean>(false);

  // Auth State
  currentUser = signal<User | null>(null);
  labSignature = signal<string | null>(null);
  labLogo = signal<string | null>(null);

  // Data Signals
  users = signal<User[]>([]);
  methodologies = signal<Methodology[]>([]);
  profiles = signal<Profile[]>([]);
  exams = signal<Exam[]>([]);
  patients = signal<Patient[]>([]);
  doctors = signal<Doctor[]>([]);
  appointments = signal<Appointment[]>([]);
  labResults = signal<LabResult[]>([]);
  sales = signal<Sale[]>([]);

  // Computed statistics
  totalPatients = computed(() => this.patients().length);
  totalAppointmentsToday = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.appointments().filter(a => a.date === today).length;
  });
  pendingResults = computed(() => this.labResults().filter(r => r.status === 'Pendiente').length);

  constructor() {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      this.connectionStatus.set('error');
      this.connectionError.set('Faltan variables de entorno (SUPABASE_URL o SUPABASE_ANON_KEY). Revise su archivo .env.');
      this.supabase = {} as any; // Dummy to avoid crash
      return;
    }
    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    this.testConnection();
    this.checkSession();
  }

  // --- AUTHENTICATION & ROLE MANAGEMENT ---

  async checkSession() {
    const { data: { session }, error } = await this.supabase.auth.getSession();

    if (error || !session) {
      this.currentUser.set(null);
      if (this.router.url !== '/' && !this.router.url.includes('login')) {
        // Silently allow if on home
      }
      this.authInitialized.set(true);
      return;
    }

    const { user } = session;

    // 1. Try fetching by authId
    let { data: profile, error: profileError } = await this.supabase
      .from(TBL_USERS)
      .select('*')
      .eq('authId', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile by authId:', profileError.message);
    }

    // 2. Fallback: Try by Email if not found by authId
    if (!profile) {
      const { data: byEmail } = await this.supabase
        .from(TBL_USERS)
        .select('*')
        .eq('email', user.email)
        .single();

      if (byEmail) {
        profile = byEmail;
        // Link authId for next time
        await this.supabase
          .from(TBL_USERS)
          .update({ authId: user.id })
          .eq('id', profile.id);
      }
    }

    let role: 'Admin' | 'Técnico' = 'Técnico';
    if (profile && profile.role) {
      role = profile.role;
      this.updateUserLoginTime(profile.id);
    }

    const userObj: User = {
      id: profile ? profile.id : user.id,
      name: profile?.name || user.user_metadata?.['name'] || 'Usuario',
      email: user.email!,
      role: role,
      authId: user.id
    };

    console.log(`User: ${userObj.email}, Assigned Role: ${userObj.role}`);
    this.currentUser.set(userObj);

    // 4. Load Data
    this.testConnection();
    this.loadAllData();
    this.authInitialized.set(true);
  }

  async updateUserLoginTime(docId: string) {
    try {
      await this.supabase
        .from(TBL_USERS)
        .update({ lastLogin: new Date().toISOString() })
        .eq('id', docId);
    } catch (e) { /* ignore */ }
  }

  async login(email: string, password: string): Promise<boolean> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.warn("Login warning:", error.message);
      return false;
    }

    await this.checkSession();
    return this.currentUser() !== null;
  }

  async logout() {
    await this.supabase.auth.signOut();
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }

  // --- CONNECTION & DATA ---

  async testConnection() {
    this.connectionStatus.set('checking');
    try {
      const { error } = await this.supabase.from(TBL_PATIENTS).select('id').limit(1);
      if (error) throw error;
      this.connectionStatus.set('connected');
      this.connectionError.set('');
    } catch (e: any) {
      this.connectionStatus.set('error');
      this.connectionError.set(e.message || 'Error de conexión con Supabase');
    }
  }

  // --- FETCH METHODS ---

  async loadAllData() {
    if (!this.currentUser()) return;

    this.fetchPatients();
    this.fetchMethodologies();
    this.fetchProfiles();
    this.fetchExams();
    this.fetchResults();
    this.fetchDoctors();
    this.fetchAppointments();
    this.fetchUsers();
    this.fetchSales();
    this.fetchSettings();
  }

  async fetchPatients() {
    try {
      const { data, error } = await this.supabase
        .from(TBL_PATIENTS)
        .select('*, creator:users!patients_created_by_uuid_fkey(name), modifier:users!patients_last_modified_by_uuid_fkey(name)')
        .order('name');
      if (data) this.patients.set(data as Patient[]);
    } catch (e) { }
  }

  async fetchMethodologies() {
    try {
      const { data } = await this.supabase
        .from('methodologies')
        .select('*, creator:users!methodologies_created_by_uuid_fkey(name), modifier:users!methodologies_last_modified_by_uuid_fkey(name)')
        .order('name');
      if (data) this.methodologies.set(data as Methodology[]);
    } catch (e) { }
  }

  async fetchProfiles() {
    try {
      const { data } = await this.supabase
        .from('profiles')
        .select('*, creator:users!profiles_created_by_uuid_fkey(name), modifier:users!profiles_last_modified_by_uuid_fkey(name)')
        .order('name');
      if (data) this.profiles.set(data as Profile[]);
    } catch (e) { }
  }

  async fetchExams() {
    try {
      const { data, error } = await this.supabase
        .from(TBL_EXAMS)
        .select('*, creator:users!exams_created_by_uuid_fkey(name), modifier:users!exams_last_modified_by_fkey(name)')
        .order('name');
      if (data) this.exams.set(data as Exam[]);
    } catch (e) { }
  }

  async fetchResults() {
    try {
      const { data, error } = await this.supabase
        .from(TBL_RESULTS)
        .select('*, creator:users!lab_results_created_by_uuid_fkey(name), modifier:users!lab_results_last_modified_by_uuid_fkey(name)')
        .order('date', { ascending: false })
        .limit(100);
      if (data) this.labResults.set(data as LabResult[]);
    } catch (e) { }
  }

  async fetchDoctors() {
    try {
      const { data, error } = await this.supabase.from(TBL_DOCTORS).select('*').order('name');
      if (data) this.doctors.set(data as Doctor[]);
    } catch (e) { }
  }

  async fetchAppointments() {
    try {
      const { data, error } = await this.supabase.from(TBL_APPOINTMENTS).select('*').order('date');
      if (data) this.appointments.set(data as Appointment[]);
    } catch (e) { }
  }

  async fetchUsers() {
    try {
      const { data, error } = await this.supabase.from(TBL_USERS).select('*');
      if (data) this.users.set(data as User[]);
    } catch (e) {
      console.warn("No se pudo cargar la lista de usuarios.");
    }
  }

  async fetchSales() {
    try {
      const { data, error } = await this.supabase
        .from(TBL_SALES)
        .select('*, creator:users!sales_created_by_uuid_fkey(name)')
        .order('date', { ascending: false })
        .limit(100);
      if (data) this.sales.set(data as Sale[]);
    } catch (e) {
      console.warn("No se pudo cargar la colección de ventas.");
    }
  }

  async fetchSettings() {
    try {
      const { data, error } = await this.supabase
        .from(TBL_SETTINGS)
        .select('key, value');

      if (data) {
        data.forEach(setting => {
          if (setting.key === 'lab_signature' && setting.value) {
            this.labSignature.set(setting.value);
          }
          if (setting.key === 'lab_logo' && setting.value) {
            this.labLogo.set(setting.value);
          }
        });
      }
    } catch (e) {
      console.warn("No se pudo cargar la configuración.");
    }
  }

  private getUserName(): string {
    return this.currentUser()?.name || 'Sistema';
  }

  // --- ACTIONS ---

  async addPatient(p: Patient) {
    const payload = { ...p, createdBy: this.currentUser()?.id };
    delete (payload as any).id;
    delete (payload as any).creator;
    delete (payload as any).modifier;

    const { data, error } = await this.supabase
      .from(TBL_PATIENTS)
      .insert(payload)
      .select('*, creator:users!patients_created_by_uuid_fkey(name), modifier:users!patients_last_modified_by_uuid_fkey(name)')
      .single();

    if (data) {
      this.patients.update(list => [...list, data as Patient]);
    }
  }

  async updatePatient(id: string, updated: Partial<Patient>) {
    const changes = { ...updated, lastModifiedBy: this.currentUser()?.id };
    delete (changes as any).creator;
    delete (changes as any).modifier;

    const { data, error } = await this.supabase
      .from(TBL_PATIENTS)
      .update(changes)
      .eq('id', id)
      .select('*, creator:users!patients_created_by_uuid_fkey(name), modifier:users!patients_last_modified_by_uuid_fkey(name)')
      .single();

    if (data) {
      this.patients.update(list => list.map(p => p.id === id ? (data as Patient) : p));
    }
  }

  async addExam(e: Exam) {
    const payload = { ...e, createdBy: this.currentUser()?.id };
    delete (payload as any).id;
    delete (payload as any).creator;
    delete (payload as any).modifier;

    const { data, error } = await this.supabase
      .from(TBL_EXAMS)
      .insert(payload)
      .select('*, creator:users!exams_created_by_uuid_fkey(name), modifier:users!exams_last_modified_by_fkey(name)')
      .single();

    if (data) {
      this.exams.update(list => [...list, data as Exam]);
    }
  }

  async updateExam(id: string, updated: Partial<Exam>) {
    const changes = { ...updated, lastModifiedBy: this.currentUser()?.id };
    delete (changes as any).creator;
    delete (changes as any).modifier;

    const { data, error } = await this.supabase
      .from(TBL_EXAMS)
      .update(changes)
      .eq('id', id)
      .select('*, creator:users!exams_created_by_uuid_fkey(name), modifier:users!exams_last_modified_by_fkey(name)')
      .single();

    if (data) {
      this.exams.update(list => list.map(e => e.id === id ? (data as Exam) : e));
    }
  }

  async deleteExam(id: string) {
    const { error } = await this.supabase.from(TBL_EXAMS).delete().eq('id', id);
    if (!error) {
      this.exams.update(list => list.filter(e => e.id !== id));
    }
  }

  async addMethodology(m: Methodology) {
    const payload = { ...m, createdBy: this.currentUser()?.id };
    delete (payload as any).id;
    delete (payload as any).creator;
    delete (payload as any).modifier;
    const { data } = await this.supabase.from('methodologies')
      .insert(payload)
      .select('*, creator:users!methodologies_created_by_uuid_fkey(name), modifier:users!methodologies_last_modified_by_uuid_fkey(name)')
      .single();
    if (data) this.methodologies.update(list => [...list, data as Methodology]);
  }

  async updateMethodology(id: string, updated: Partial<Methodology>) {
    const changes = { ...updated, lastModifiedBy: this.currentUser()?.id };
    delete (changes as any).creator;
    delete (changes as any).modifier;

    const { data } = await this.supabase
      .from('methodologies')
      .update(changes)
      .eq('id', id)
      .select('*, creator:users!methodologies_created_by_uuid_fkey(name), modifier:users!methodologies_last_modified_by_uuid_fkey(name)')
      .single();
    if (data) {
      this.methodologies.update(list => list.map(m => m.id === id ? (data as Methodology) : m));
    }
  }

  async deleteMethodology(id: string) {
    const { error } = await this.supabase.from('methodologies').delete().eq('id', id);
    if (!error) {
      this.methodologies.update(list => list.filter(m => m.id !== id));
    }
  }

  async addProfile(p: Profile): Promise<Profile | null> {
    const payload = { ...p, createdBy: this.currentUser()?.id };
    delete (payload as any).id;
    delete (payload as any).creator;
    delete (payload as any).modifier;

    const { data } = await this.supabase.from('profiles')
      .insert(payload)
      .select('*, creator:users!profiles_created_by_uuid_fkey(name), modifier:users!profiles_last_modified_by_uuid_fkey(name)')
      .single();
    if (data) {
      this.profiles.update(list => [...list, data as Profile]);
      return data as Profile;
    }
    return null;
  }

  async updateProfile(id: string, updated: Partial<Profile>): Promise<Profile | null> {
    const changes = { ...updated, lastModifiedBy: this.currentUser()?.id };
    delete (changes as any).creator;
    delete (changes as any).modifier;

    const { data } = await this.supabase
      .from('profiles')
      .update(changes)
      .eq('id', id)
      .select('*, creator:users!profiles_created_by_uuid_fkey(name), modifier:users!profiles_last_modified_by_uuid_fkey(name)')
      .single();
    if (data) {
      this.profiles.update(list => list.map(p => p.id === id ? (data as Profile) : p));
      return data as Profile;
    }
    return null;
  }

  async deleteProfile(id: string) {
    const { error } = await this.supabase.from('profiles').delete().eq('id', id);
    if (!error) {
      this.profiles.update(list => list.filter(p => p.id !== id));
    }
  }

  async assignExamsToProfile(profileId: string, examIds: string[]) {
    try {
      // 1. Reset all exams that currently belong to this profile
      await this.supabase
        .from(TBL_EXAMS)
        .update({ profile_id: null })
        .eq('profile_id', profileId);

      if (examIds.length > 0) {
        // 2. Assign the selected exams to this profile
        const { error } = await this.supabase
          .from(TBL_EXAMS)
          .update({ profile_id: profileId })
          .in('id', examIds);

        if (error) throw error;
      }

      await this.fetchExams();
    } catch (error) {
      console.error('Error in assignExamsToProfile:', error);
    }
  }

  async addLabResult(r: LabResult): Promise<boolean> {
    const payload = { ...r, createdBy: this.currentUser()?.id };
    delete (payload as any).id;
    delete (payload as any).creator;
    delete (payload as any).modifier;

    const { data, error } = await this.supabase
      .from(TBL_RESULTS)
      .insert(payload)
      .select('*, creator:users!lab_results_created_by_uuid_fkey(name), modifier:users!lab_results_last_modified_by_uuid_fkey(name)')
      .single();

    if (data) {
      this.labResults.update(list => [data as LabResult, ...list]);
      return true;
    } else {
      console.error("Error al guardar el resultado:", error?.message, error?.details);
      return false;
    }
  }

  async updateResult(id: string, interpretation: string) {
    const changes = { interpretation, status: 'Finalizado' as const, lastModifiedBy: this.currentUser()?.id };
    const { data, error } = await this.supabase
      .from(TBL_RESULTS)
      .update(changes)
      .eq('id', id)
      .select('*, creator:users!lab_results_created_by_uuid_fkey(name), modifier:users!lab_results_last_modified_by_uuid_fkey(name)')
      .single();

    if (data) {
      this.labResults.update(results => results.map(r => r.id === id ? (data as LabResult) : r));
    }
  }

  async updateFullResult(id: string, updated: Partial<LabResult>) {
    const changes = { ...updated, lastModifiedBy: this.currentUser()?.id };
    const { data, error } = await this.supabase
      .from(TBL_RESULTS)
      .update(changes)
      .eq('id', id)
      .select()
      .single();

    if (data) {
      this.labResults.update(results => results.map(r => r.id === id ? (data as LabResult) : r));
    }
  }

  async addAppointment(a: Appointment) {
    const { data, error } = await this.supabase
      .from(TBL_APPOINTMENTS)
      .insert(a)
      .select()
      .single();

    if (data) {
      this.appointments.update(list => [...list, data as Appointment]);
    }
  }

  async addSale(s: Sale) {
    const payload = { ...s, createdBy: this.currentUser()?.id };
    delete (payload as any).id;
    delete (payload as any).creator;

    const { data, error } = await this.supabase
      .from(TBL_SALES)
      .insert(payload)
      .select('*, creator:users!sales_created_by_uuid_fkey(name)')
      .single();

    if (data) {
      this.sales.update(list => [data as Sale, ...list]);
    } else if (error) {
      console.error("Error creando venta en Supabase:", error.message);
    }
  }

  // --- USER PROFILES ---

  async addUser(u: User) {
    try {
      const payload = {
        name: u.name,
        email: u.email,
        role: u.role,
        lastLogin: null
      };
      const { data, error } = await this.supabase
        .from(TBL_USERS)
        .insert(payload)
        .select()
        .single();

      if (data) this.fetchUsers();
    } catch (e) {
      alert("Error al crear usuario en BD.");
    }
  }

  async updateUser(id: string, updated: Partial<User>) {
    try {
      const { password, ...safeUpdates } = updated;
      const { data, error } = await this.supabase
        .from(TBL_USERS)
        .update(safeUpdates)
        .eq('id', id)
        .select()
        .single();

      if (data) {
        this.users.update(list => list.map(u => u.id === id ? (data as User) : u));
        if (this.currentUser()?.id === id) {
          this.currentUser.update(curr => curr ? { ...curr, ...updated } : null);
        }
      }
    } catch (e) {
      alert("Error actualizando usuario en BD.");
    }
  }

  async deleteUser(id: string) {
    try {
      const { error } = await this.supabase.from(TBL_USERS).delete().eq('id', id);
      if (!error) {
        this.users.update(list => list.filter(u => u.id !== id));
      }
    } catch (e) { /* ignore */ }
  }

  // --- EMAILS ---

  async sendResultEmail(email: string, patientName: string, resultData: LabResult, pdfBase64?: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.functions.invoke('send-result-email', {
        body: {
          to: email,
          patientName: patientName,
          testName: resultData.testName,
          resultValues: resultData.values,
          pdfBase64: pdfBase64,
          subject: `BioSalud: Resultados de Laboratorio - ${patientName}`
        }
      });

      if (error) {
        console.error("Error al invocar la función de correo:", error);
        return false;
      }

      return data?.success === true;
    } catch (e) {
      console.error("Error inesperado en sendResultEmail:", e);
      return false;
    }
  }

  async setSignature(base64Image: string) {
    this.labSignature.set(base64Image);
    try {
      await this.supabase
        .from(TBL_SETTINGS)
        .upsert({ key: 'lab_signature', value: base64Image, updated_at: new Date().toISOString() });
    } catch (e) {
      console.error("Error al guardar la firma en la base de datos:", e);
    }
  }

  async setLogo(base64Image: string) {
    this.labLogo.set(base64Image);
    try {
      await this.supabase
        .from(TBL_SETTINGS)
        .upsert({ key: 'lab_logo', value: base64Image, updated_at: new Date().toISOString() });
    } catch (e) {
      console.error("Error al guardar el logo en la base de datos:", e);
    }
  }

  getRevenueHistory() {
    // Group sales by day of the week (last 7 days)
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const salesList = this.sales();
    return last7Days.map(dateStr => {
      const d = new Date(dateStr + 'T12:00:00'); // mid-day to avoid TZ issues
      const dayName = days[d.getDay()];
      const dayTotal = salesList
        .filter(s => s.date.startsWith(dateStr))
        .reduce((sum, s) => sum + s.total, 0);
      return { day: dayName, value: dayTotal };
    });
  }

  getExamDistribution() {
    const results = this.labResults();
    if (results.length === 0) {
      return [{ name: 'Sin Datos', value: 1 }];
    }

    // Since a result.testName can be a combined string like "Glucosa / Creatinina",
    // we take the first part or group by methodology if possible.
    // For simplicity, we'll extract the first test name mentioned.
    const counts: Record<string, number> = {};
    results.forEach(r => {
      const primaryTest = r.testName.split('/')[0].trim();
      counts[primaryTest] = (counts[primaryTest] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5
  }

  getMonthlyExamCount() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Count exams across all finalized results in the current month
    // Note: one LabResult might contain multiple staged exams, but 
    // usually we count how many procedures/reports were issued.
    // If we want individual tests, we'd need to parse the values field.
    return this.labResults().filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
  }

  getMedicalReferrals() {
    // Returns top referrers based on referralsLastMonth field
    return this.doctors()
      .sort((a, b) => (b.referralsLastMonth || 0) - (a.referralsLastMonth || 0))
      .slice(0, 5)
      .map(d => ({ name: d.name, value: d.referralsLastMonth || 0 }));
  }
}
