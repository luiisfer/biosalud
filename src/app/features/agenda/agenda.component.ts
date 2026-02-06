import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DbService, Appointment } from '../../../core/services/db.service';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 class="text-2xl font-light text-slate-800">Agenda y Turnos</h1>
          <p class="text-slate-400 text-sm mt-1">Gestionar flujo de citas de laboratorio</p>
        </div>
        
        <div class="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
          
          <!-- View Switcher -->
          <div class="flex bg-slate-100 rounded-sm p-1 border border-slate-200">
             <button (click)="setViewMode('day')" 
                class="px-3 py-1.5 text-xs font-bold uppercase rounded-sm transition-all"
                [class.bg-white]="viewMode() === 'day'" 
                [class.shadow-sm]="viewMode() === 'day'" 
                [class.text-slate-800]="viewMode() === 'day'"
                [class.text-slate-500]="viewMode() !== 'day'">
                Día
             </button>
             <button (click)="setViewMode('month')" 
                class="px-3 py-1.5 text-xs font-bold uppercase rounded-sm transition-all"
                [class.bg-white]="viewMode() === 'month'" 
                [class.shadow-sm]="viewMode() === 'month'" 
                [class.text-slate-800]="viewMode() === 'month'"
                [class.text-slate-500]="viewMode() !== 'month'">
                Mes
             </button>
          </div>

          <div class="flex self-start sm:self-center">
             <button (click)="prevPeriod()" class="bg-white border border-slate-300 border-r-0 text-slate-600 px-4 py-2 hover:bg-slate-50 transition-colors rounded-l-sm">
               <i class="fas fa-chevron-left"></i>
             </button>
             <button (click)="returnToToday()" class="bg-white border border-slate-300 text-slate-800 px-6 py-2 hover:bg-slate-50 transition-colors font-medium text-sm min-w-[140px] capitalize">
               {{ formattedDate() }}
             </button>
             <button (click)="nextPeriod()" class="bg-white border border-slate-300 border-l-0 text-slate-600 px-4 py-2 hover:bg-slate-50 transition-colors rounded-r-sm">
               <i class="fas fa-chevron-right"></i>
             </button>
          </div>

          <button (click)="openModal()" class="bg-[#3498db] text-white px-6 py-2 rounded shadow-sm hover:bg-[#2980b9] transition-colors font-medium text-sm flex items-center justify-center gap-2">
            <i class="fas fa-plus"></i> Programar Cita
          </button>
        </div>
      </div>

      <div class="space-y-4">
        
        @if (viewMode() === 'day') {
          <!-- Calendar List View (Day) -->
          <div class="space-y-4 animate-fade-in">
            @if (filteredAppointments().length === 0) {
            <div class="text-center py-12 bg-slate-50 border border-slate-200 rounded-lg">
              <p class="text-slate-500">No hay citas programadas para esta fecha.</p>
              <button (click)="openModal()" class="mt-4 text-[#3498db] font-medium hover:underline">
                Programar la primera cita
              </button>
            </div>
          }

          @for (appt of filteredAppointments(); track appt.id) {
            <div (dblclick)="viewAppointment(appt)" class="bg-white p-5 border border-slate-200 flex items-center justify-between hover:border-slate-300 transition-colors group cursor-pointer" title="Doble clic para ver detalles">
              
              <div class="flex items-center gap-6">
                <div class="flex flex-col items-center justify-center bg-slate-50 w-16 h-16 border border-slate-100 text-slate-700">
                   <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">{{ getMonthShort(appt.date) }}</span>
                   <span class="text-2xl font-light">{{ getDay(appt.date) }}</span>
                </div>
                <div>
                  <h3 class="font-bold text-slate-800 text-lg group-hover:text-[#3498db] transition-colors">{{ getPatientName(appt) }}</h3>
                  <div class="text-sm text-slate-500 flex items-center gap-3 mt-1">
                     <span class="flex items-center gap-1"><i class="far fa-clock"></i> {{ appt.time }}</span>
                     <span class="text-slate-300">|</span>
                     <span class="uppercase tracking-wide text-xs font-bold">{{ appt.type }}</span>
                  </div>
                </div>
              </div>

              <div class="text-right">
                <span class="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider mb-2"
                      [class.bg-blue-50]="appt.status === 'Programado'" [class.text-blue-600]="appt.status === 'Programado'"
                      [class.bg-green-50]="appt.status === 'Completado'" [class.text-green-600]="appt.status === 'Completado'"
                      [class.bg-purple-50]="appt.status === 'Resultados Listos'" [class.text-purple-600]="appt.status === 'Resultados Listos'"
                      [class.bg-red-50]="appt.status === 'Cancelado'" [class.text-red-600]="appt.status === 'Cancelado'">
                  {{ appt.status }}
                </span>
                <div class="flex gap-4 justify-end">
                    <button (click)="editAppointment(appt.id)" class="text-slate-300 hover:text-slate-600 transition-colors" title="Editar"><i class="fas fa-pencil-alt"></i></button>
                    <button (click)="cancelAppointment(appt.id)" class="text-slate-300 hover:text-red-500 transition-colors" title="Cancelar"><i class="fas fa-times"></i></button>
                </div>
              </div>
            </div>
          }
        </div>
      }

      @if (viewMode() === 'month') {
          <!-- Calendar Grid View (Month) -->
          <div class="bg-white border border-slate-200 rounded-sm shadow-sm animate-fade-in overflow-hidden">
             <!-- Weekday Headers -->
             <div class="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                @for(day of weekDayNames; track day) {
                   <div class="p-3 text-center text-[10px] font-bold uppercase text-slate-500 tracking-wider">{{ day }}</div>
                }
             </div>
             <!-- Days Grid -->
             <div class="grid grid-cols-7 auto-rows-[minmax(120px,auto)] bg-slate-200 gap-px border-b border-slate-200">
                @for(cell of calendarGrid(); track $index) {
                   <div class="bg-white p-2 relative group hover:bg-blue-50/30 transition-colors min-h-[120px] flex flex-col">
                      @if(cell.day) {
                         <div class="flex justify-between items-start mb-2">
                            <span class="font-bold text-sm text-slate-700 w-7 h-7 flex items-center justify-center rounded-full"
                                  [class.bg-[#3498db]]="cell.date?.toDateString() === selectedDate().toDateString()"
                                  [class.text-white]="cell.date?.toDateString() === selectedDate().toDateString()">
                               {{ cell.day }}
                            </span>
                            @if(cell.appointments.length > 0) {
                               <span class="text-[10px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded-full border border-slate-200">
                                  {{ cell.appointments.length }}
                               </span>
                            }
                         </div>
                         
                         <div class="space-y-1 overflow-y-auto max-h-[100px] custom-scrollbar flex-1">
                            @for(appt of cell.appointments; track appt.id) {
                               <div (click)="viewAppointment(appt); $event.stopPropagation()" 
                                  class="text-[9px] px-1.5 py-1 rounded cursor-pointer border border-l-2 truncate transition-all hover:opacity-80"
                                  [class.bg-blue-50]="appt.status === 'Programado'" [class.text-blue-700]="appt.status === 'Programado'" [class.border-blue-100]="appt.status === 'Programado'" [class.border-l-blue-400]="appt.status === 'Programado'"
                                  [class.bg-green-50]="appt.status === 'Completado'" [class.text-green-700]="appt.status === 'Completado'" [class.border-green-100]="appt.status === 'Completado'" [class.border-l-green-400]="appt.status === 'Completado'"
                                  [class.bg-purple-50]="appt.status === 'Resultados Listos'" [class.text-purple-700]="appt.status === 'Resultados Listos'" [class.border-purple-100]="appt.status === 'Resultados Listos'" [class.border-l-purple-400]="appt.status === 'Resultados Listos'"
                                  [class.bg-red-50]="appt.status === 'Cancelado'" [class.text-red-700]="appt.status === 'Cancelado'" [class.border-red-100]="appt.status === 'Cancelado'" [class.border-l-red-400]="appt.status === 'Cancelado'"
                                  title="{{appt.time}} - {{getPatientName(appt)}} ({{appt.status}})">
                                  <span class="font-bold mr-1">{{ appt.time }}</span> {{ getPatientName(appt) }}
                               </div>
                            }
                         </div>
                      } @else {
                         <div class="bg-slate-50/50 h-full"></div>
                      }
                   </div>
                }
             </div>
          </div>
        }
      </div>

      <!-- New Appointment Modal -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div class="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 class="font-bold text-slate-800">{{ editingAppointmentId() ? 'Editar Cita' : 'Nueva Cita' }}</h3>
              <button (click)="closeModal()" class="text-slate-400 hover:text-slate-600">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <div class="p-6 space-y-4">
              <div class="mb-4">
                <div class="flex items-center justify-between mb-2">
                  <label class="text-xs font-bold text-slate-500 uppercase">Paciente</label>
                  <label class="flex items-center gap-2 text-xs cursor-pointer text-slate-600">
                    <input type="checkbox" [(ngModel)]="isExternalPatient" class="rounded text-[#3498db] focus:ring-[#3498db]">
                    <span>Paciente Externo / Nuevo</span>
                  </label>
                </div>

                @if (!isExternalPatient) {
                  <select [(ngModel)]="newAppointment.patientId" (ngModelChange)="newAppointment.patientName = ''" 
                    class="w-full border border-slate-300 rounded p-2 text-sm focus:outline-none focus:border-[#3498db]">
                    <option value="" disabled selected>Seleccione un paciente</option>
                    @for (patient of db.patients(); track patient.id) {
                      <option [value]="patient.id">{{ patient.name }} - {{ patient.dpi }}</option>
                    }
                  </select>
                } @else {
                  <input type="text" [(ngModel)]="newAppointment.patientName" (ngModelChange)="newAppointment.patientId = ''"
                    placeholder="Nombre completo del paciente"
                    class="w-full border border-slate-300 rounded p-2 text-sm focus:outline-none focus:border-[#3498db]">
                }
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha</label>
                  <input type="date" [(ngModel)]="newAppointment.date" class="w-full border border-slate-300 rounded p-2 text-sm focus:outline-none focus:border-[#3498db]">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Hora</label>
                  <input type="time" [(ngModel)]="newAppointment.time" class="w-full border border-slate-300 rounded p-2 text-sm focus:outline-none focus:border-[#3498db]">
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Cita</label>
                <select [(ngModel)]="newAppointment.type" class="w-full border border-slate-300 rounded p-2 text-sm focus:outline-none focus:border-[#3498db]">
                  <option value="Toma de Muestra">Toma de Muestra</option>
                  <option value="Entrega de Resultados">Entrega de Resultados</option>
                  <option value="Consulta General">Consulta General</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Observaciones</label>
                <textarea [(ngModel)]="newAppointment.observations" rows="3" class="w-full border border-slate-300 rounded p-2 text-sm focus:outline-none focus:border-[#3498db]" placeholder="Notas adicionales..."></textarea>
              </div>
            </div>

            <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button (click)="closeModal()" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded transition-colors text-sm font-medium">Cancelar</button>
              <button (click)="saveAppointment()" [disabled]="!isValidAppointment()" 
                      [class.opacity-50]="!isValidAppointment()"
                      class="px-4 py-2 bg-[#3498db] text-white rounded hover:bg-[#2980b9] transition-colors text-sm font-medium">
                Guardar Cita
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (showDeleteModal()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
           <div class="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden border border-red-100">
              <div class="bg-red-50 p-6 flex flex-col items-center text-center">
                 <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <i class="fas fa-trash-alt text-red-500 text-xl"></i>
                 </div>
                 <h3 class="text-lg font-bold text-slate-800 mb-2">¿Eliminar Cita?</h3>
                 <p class="text-sm text-slate-500">Esta acción eliminará la cita permanentemente. ¿Está seguro que desea continuar?</p>
              </div>
              <div class="flex border-t border-slate-100">
                 <button (click)="closeDeleteModal()" class="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-50 transition-colors text-sm">Cancelar</button>
                 <button (click)="confirmDelete()" class="flex-1 py-3 bg-red-500 text-white font-bold hover:bg-red-600 transition-colors text-sm">Sí, Eliminar</button>
              </div>
           </div>
        </div>
      }

      <!-- VIEW DETAILS MODAL -->
      @if (viewModal() && selectedAppointment()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
           <div class="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
              <div class="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                 <h3 class="font-bold text-slate-800">Detalles de la Cita</h3>
                 <button (click)="closeViewModal()" class="text-slate-400 hover:text-slate-600">
                    <i class="fas fa-times"></i>
                 </button>
              </div>
              <div class="p-6 space-y-4">
                 <div class="flex items-center gap-4 mb-4">
                    <div class="w-12 h-12 bg-blue-50 text-[#3498db] rounded-full flex items-center justify-center text-xl">
                       <i class="fas fa-calendar-check"></i>
                    </div>
                    <div>
                       <h2 class="text-xl font-bold text-slate-800">{{ getPatientName(selectedAppointment()!) }}</h2>
                       <span class="text-sm text-slate-500 font-mono">{{ selectedAppointment()!.date }} - {{ selectedAppointment()!.time }}</span>
                    </div>
                 </div>

                 <div class="grid grid-cols-2 gap-4 text-sm">
                    <div class="p-3 bg-slate-50 rounded border border-slate-100">
                       <span class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo de Cita</span>
                       <span class="font-medium text-slate-700">{{ selectedAppointment()!.type }}</span>
                    </div>
                    <div class="p-3 bg-slate-50 rounded border border-slate-100">
                       <span class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Estado</span>
                       <span class="font-medium" 
                          [class.text-blue-600]="selectedAppointment()!.status === 'Programado'"
                          [class.text-green-600]="selectedAppointment()!.status === 'Completado'"
                          [class.text-red-600]="selectedAppointment()!.status === 'Cancelado'">
                          {{ selectedAppointment()!.status }}
                       </span>
                    </div>
                 </div>

                 @if (selectedAppointment()!.observations) {
                    <div class="p-4 bg-yellow-50 border border-yellow-100 rounded text-sm text-slate-700">
                       <span class="block text-[10px] font-bold text-yellow-600 uppercase mb-2"><i class="fas fa-sticky-note mr-1"></i> Observaciones</span>
                       {{ selectedAppointment()!.observations }}
                    </div>
                 } @else {
                    <div class="text-center text-slate-300 text-sm italic py-2">Sin observaciones registradas.</div>
                 }
              </div>
              <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                 <button (click)="closeViewModal()" class="px-6 py-2 bg-slate-200 text-slate-700 font-bold rounded hover:bg-slate-300 transition-colors text-sm">Cerrar</button>
              </div>
           </div>
        </div>
      }
    </div>
  `,
  styles: [`
     @keyframes fadeIn {
       from { opacity: 0; transform: scale(0.98); }
       to { opacity: 1; transform: scale(1); }
     }
     .animate-fade-in { animation: fadeIn 0.2s ease-out; }
  `]
})
export class AgendaComponent {
  db = inject(DbService);
  viewMode = signal<'day' | 'month'>('day'); // New State
  selectedDate = signal(new Date());
  showModal = signal(false);
  isExternalPatient = false; // Toggle state

  newAppointment: Partial<Appointment> = {
    patientId: '',
    date: (() => {
      const d = new Date();
      return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    })(),
    time: '08:00',
    type: 'Toma de Muestra',
    status: 'Programado',
    observations: ''
  };

  formattedDate = computed(() => {
    const d = this.selectedDate();

    if (this.viewMode() === 'month') {
      return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
        .replace(/^\w/, c => c.toUpperCase());
    }

    const today = new Date();

    // Compare date strings to handle "Hoy" correctly
    const dStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const tStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', weekday: 'short' };
    const dateStr = d.toLocaleDateString('es-ES', options);

    if (dStr === tStr) return `Hoy, ${d.getDate()} ${this.getMonthShort(d.toISOString())}`;

    return dateStr.replace(/^\w/, (c) => c.toUpperCase());
  });

  filteredAppointments = computed(() => {
    const d = this.selectedDate();
    const dateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;

    return this.db.appointments()
      .filter(a => a.date === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  });

  getPatientName(appt: Appointment): string {
    if (appt.patientName) return appt.patientName;
    if (appt.patientId) {
      const p = this.db.patients().find(pt => pt.id === appt.patientId);
      return p ? p.name : 'Paciente Desconocido';
    }
    return 'Sin Nombre';
  }

  getMonthShort(dateStr: string): string {
    const d = new Date(dateStr); // Local interpretation might vary, but assuming ISO date 'YYYY-MM-DD'
    // To avoid timezone shift issues with just date string, append time or handle as string
    // Simplified:
    const parts = dateStr.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return months[parseInt(parts[1], 10) - 1];
  }

  getDay(dateStr: string): string {
    return dateStr.split('-')[2];
  }

  // Refactored Navigation
  prevPeriod() {
    this.selectedDate.update(d => {
      const newDate = new Date(d);
      if (this.viewMode() === 'day') {
        newDate.setDate(d.getDate() - 1);
      } else {
        newDate.setMonth(d.getMonth() - 1);
      }
      return newDate;
    });
  }

  nextPeriod() {
    this.selectedDate.update(d => {
      const newDate = new Date(d);
      if (this.viewMode() === 'day') {
        newDate.setDate(d.getDate() + 1);
      } else {
        newDate.setMonth(d.getMonth() + 1);
      }
      return newDate;
    });
  }

  returnToToday() {
    this.selectedDate.set(new Date());
  }

  setViewMode(mode: 'day' | 'month') {
    this.viewMode.set(mode);
  }

  // --- CALENDAR GRID LOGIC ---
  calendarGrid = computed(() => {
    const date = this.selectedDate();
    const year = date.getFullYear();
    const month = date.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 (Sun) - 6 (Sat)

    // Appointments for this month
    const monthStr = `${year}-${(month + 1).toString().padStart(2, '0')}`;
    const monthAppts = this.db.appointments().filter(a => a.date.startsWith(monthStr));

    const grid: { date: Date | null, day: number | null, appointments: Appointment[] }[] = [];

    // Padding for previous month
    for (let i = 0; i < startDayOfWeek; i++) {
      grid.push({ date: null, day: null, appointments: [] });
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      const dayAppts = monthAppts.filter(a => a.date === currentDateStr);
      // Sort by time
      dayAppts.sort((a, b) => a.time.localeCompare(b.time));

      grid.push({
        date: new Date(year, month, i),
        day: i,
        appointments: dayAppts
      });
    }

    return grid;
  });

  weekDayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];


  editAppointment(id: string) {
    const appt = this.db.appointments().find(a => a.id === id);
    if (!appt) return;

    this.editingAppointmentId.set(id);
    this.newAppointment = {
      patientId: appt.patientId || '',
      patientName: appt.patientName || '',
      date: appt.date,
      time: appt.time,
      type: appt.type,
      status: appt.status,
      observations: appt.observations || ''
    };

    // Determine external state based on presence of patientId
    this.isExternalPatient = !appt.patientId;

    this.showModal.set(true);
  }

  cancelAppointment(id: string) {
    this.appointmentToDeleteId.set(id);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.appointmentToDeleteId.set(null);
  }

  confirmDelete() {
    const id = this.appointmentToDeleteId();
    if (id) {
      this.db.deleteAppointment(id);
      this.closeDeleteModal();
    }
  }

  editingAppointmentId = signal<string | null>(null);

  // Delete Modal State
  showDeleteModal = signal(false);
  appointmentToDeleteId = signal<string | null>(null);

  // View Details Modal State
  viewModal = signal(false);
  selectedAppointment = signal<Appointment | null>(null);

  viewAppointment(appt: Appointment) {
    this.selectedAppointment.set(appt);
    this.viewModal.set(true);
  }

  closeViewModal() {
    this.viewModal.set(false);
    this.selectedAppointment.set(null);
  }

  openModal() {
    this.newAppointment = {
      patientId: '',
      patientName: '',
      date: this.selectedDate().toISOString().split('T')[0],
      time: '08:00',
      type: 'Toma de Muestra',
      status: 'Programado'
    };
    this.isExternalPatient = false;
    this.editingAppointmentId.set(null);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingAppointmentId.set(null);
  }

  isValidAppointment() {
    const hasPatient = this.isExternalPatient
      ? !!this.newAppointment.patientName?.trim()
      : !!this.newAppointment.patientId;

    return hasPatient && this.newAppointment.date && this.newAppointment.time;
  }

  saveAppointment() {
    if (this.isValidAppointment()) {
      const appt: Appointment = {
        id: '',
        patientId: this.newAppointment.patientId!,
        date: this.newAppointment.date!,
        time: this.newAppointment.time!,
        type: this.newAppointment.type || 'Consulta General',
        status: 'Programado',
        observations: this.newAppointment.observations || ''
      };

      // Ensure we don't send empty strings if they are optional
      if (!appt.patientId) delete appt.patientId;
      if (!appt.patientName) delete appt.patientName;

      if (this.isExternalPatient) {
        appt.patientName = this.newAppointment.patientName;
        delete appt.patientId;
      } else {
        appt.patientId = this.newAppointment.patientId;
        delete appt.patientName;
      }

      if (this.editingAppointmentId()) {
        this.db.updateAppointment(this.editingAppointmentId()!, appt);
      } else {
        this.db.addAppointment(appt);
      }

      this.closeModal();

      // Optionally update selected date to the appointment date so user sees it
      const [y, m, d] = appt.date.split('-').map(Number);
      this.selectedDate.set(new Date(y, m - 1, d));
    }
  }
}
