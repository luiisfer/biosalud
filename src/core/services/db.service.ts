
import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- CONFIGURACIÓN SUPABASE (SAFE ACCESS) ---
const getEnv = (key: string, fallback: string): string => {
  try {
    // 1. Check process.env (Node/some builders)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
    // 2. Check import.meta.env (Vite/modern builders)
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[key]) {
      return metaEnv[key] as string;
    }
    // 3. Fallback
    return fallback;
  } catch {
    return fallback;
  }
};

const SUPABASE_URL = getEnv('SUPABASE_URL', 'https://owdziohesmzyaolslcuh.supabase.co');
const SUPABASE_KEY = getEnv('SUPABASE_ANON_KEY', 'sb_publishable_BoWyStwSL8QcEUyFrMqQOA_Jmag24pq');

// Table Names (Matching previous collection IDs for consistency)
const TBL_PATIENTS = 'patients';
const TBL_EXAMS = 'exams';
const TBL_RESULTS = 'lab_results';
const TBL_DOCTORS = 'doctors';
const TBL_APPOINTMENTS = 'appointments';
const TBL_USERS = 'users';
const TBL_SALES = 'sales';

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: 'Admin' | 'Técnico';
  lastLogin?: string;
  authId?: string;
}

export interface Exam {
  id: string;
  name: string;
  code: string;
  price: number;
  description: string;
  range: string;
  unit: string;
  createdBy?: string;
  lastModifiedBy?: string;
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
  email: string;
  phone: string;
  history: string;
  createdBy?: string;
  lastModifiedBy?: string;
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
}

export interface Sale {
  id: string;
  date: string;
  patientId: string;
  patientName: string;
  items: string[];
  total: number;
  method: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Seguro';
  createdBy?: string;
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

  // Auth State
  currentUser = signal<User | null>(null);
  labSignature = signal<string | null>(null);

  // Data Signals
  users = signal<User[]>([]);
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
      return;
    }

    const { user } = session;

    // Fetch profile from users table
    const { data: profile, error: profileError } = await this.supabase
      .from(TBL_USERS)
      .select('*')
      .eq('authId', user.id)
      .single();

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
    this.fetchExams();
    this.fetchResults();
    this.fetchDoctors();
    this.fetchAppointments();
    this.fetchUsers();
    this.fetchSales();
  }

  async fetchPatients() {
    try {
      const { data, error } = await this.supabase.from(TBL_PATIENTS).select('*').order('name');
      if (data) this.patients.set(data as Patient[]);
    } catch (e) { }
  }

  async fetchExams() {
    try {
      const { data, error } = await this.supabase.from(TBL_EXAMS).select('*').order('name');
      if (data) this.exams.set(data as Exam[]);
    } catch (e) { }
  }

  async fetchResults() {
    try {
      const { data, error } = await this.supabase
        .from(TBL_RESULTS)
        .select('*')
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
        .select('*')
        .order('date', { ascending: false })
        .limit(100);
      if (data) this.sales.set(data as Sale[]);
    } catch (e) {
      console.warn("No se pudo cargar la colección de ventas.");
    }
  }

  private getUserName(): string {
    return this.currentUser()?.name || 'Sistema';
  }

  // --- ACTIONS ---

  async addPatient(p: Patient) {
    const payload = { ...p, createdBy: this.getUserName() };
    delete (payload as any).id; // Let Supabase handle ID if serial/uuid

    const { data, error } = await this.supabase
      .from(TBL_PATIENTS)
      .insert(payload)
      .select()
      .single();

    if (data) {
      this.patients.update(list => [...list, data as Patient]);
    }
  }

  async updatePatient(id: string, updated: Partial<Patient>) {
    const changes = { ...updated, lastModifiedBy: this.getUserName() };
    const { data, error } = await this.supabase
      .from(TBL_PATIENTS)
      .update(changes)
      .eq('id', id)
      .select()
      .single();

    if (data) {
      this.patients.update(list => list.map(p => p.id === id ? (data as Patient) : p));
    }
  }

  async addExam(e: Exam) {
    const payload = { ...e, createdBy: this.getUserName() };
    delete (payload as any).id;

    const { data, error } = await this.supabase
      .from(TBL_EXAMS)
      .insert(payload)
      .select()
      .single();

    if (data) {
      this.exams.update(list => [...list, data as Exam]);
    }
  }

  async updateExam(id: string, updated: Partial<Exam>) {
    const changes = { ...updated, lastModifiedBy: this.getUserName() };
    const { data, error } = await this.supabase
      .from(TBL_EXAMS)
      .update(changes)
      .eq('id', id)
      .select()
      .single();

    if (data) {
      this.exams.update(list => list.map(e => e.id === id ? (data as Exam) : e));
    }
  }

  async addLabResult(r: LabResult) {
    const payload = { ...r, createdBy: this.getUserName() };
    delete (payload as any).id;

    const { data, error } = await this.supabase
      .from(TBL_RESULTS)
      .insert(payload)
      .select()
      .single();

    if (data) {
      this.labResults.update(list => [data as LabResult, ...list]);
    }
  }

  async updateResult(id: string, interpretation: string) {
    const changes = { interpretation, status: 'Finalizado' as const, lastModifiedBy: this.getUserName() };
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
    const payload = { ...s, createdBy: this.getUserName() };
    delete (payload as any).id;

    const { data, error } = await this.supabase
      .from(TBL_SALES)
      .insert(payload)
      .select()
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

  async sendResultEmail(email: string, patientName: string, resultData: LabResult): Promise<boolean> {
    try {
      // In Supabase, you would use an Edge Function. 
      // For now, keeping the simulation/placeholder logic.
      console.log("Simulating email send via Supabase Edge Function placeholder...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    } catch (e) {
      return false;
    }
  }

  setSignature(base64Image: string) {
    this.labSignature.set(base64Image);
  }

  getRevenueHistory() {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return days.map(d => ({ day: d, value: Math.floor(Math.random() * 500) + 200 }));
  }

  getExamDistribution() {
    return [
      { name: 'Hemograma', value: 45 },
      { name: 'Lipídico', value: 30 },
      { name: 'Glucosa', value: 15 },
      { name: 'Hormonas', value: 10 }
    ];
  }
}
