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
        
        <div class="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div class="flex self-start sm:self-center">
             <button (click)="prevDay()" class="bg-white border border-slate-300 border-r-0 text-slate-600 px-4 py-2 hover:bg-slate-50 transition-colors rounded-l-sm">
               <i class="fas fa-chevron-left"></i>
             </button>
             <button (click)="returnToToday()" class="bg-white border border-slate-300 text-slate-800 px-6 py-2 hover:bg-slate-50 transition-colors font-medium text-sm min-w-[140px]">
               {{ formattedDate() }}
             </button>
             <button (click)="nextDay()" class="bg-white border border-slate-300 border-l-0 text-slate-600 px-4 py-2 hover:bg-slate-50 transition-colors rounded-r-sm">
               <i class="fas fa-chevron-right"></i>
             </button>
          </div>

          <button (click)="openModal()" class="bg-[#3498db] text-white px-6 py-2 rounded shadow-sm hover:bg-[#2980b9] transition-colors font-medium text-sm flex items-center justify-center gap-2">
            <i class="fas fa-plus"></i> Programar Cita
          </button>
        </div>
      </div>

      <div class="space-y-4">
        <!-- Calendar List View -->
        <div class="space-y-4">
          @if (filteredAppointments().length === 0) {
            <div class="text-center py-12 bg-slate-50 border border-slate-200 rounded-lg">
              <p class="text-slate-500">No hay citas programadas para esta fecha.</p>
              <button (click)="openModal()" class="mt-4 text-[#3498db] font-medium hover:underline">
                Programar la primera cita
              </button>
            </div>
          }

          @for (appt of filteredAppointments(); track appt.id) {
            <div class="bg-white p-5 border border-slate-200 flex items-center justify-between hover:border-slate-300 transition-colors group">
              
              <div class="flex items-center gap-6">
                <div class="flex flex-col items-center justify-center bg-slate-50 w-16 h-16 border border-slate-100 text-slate-700">
                   <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">{{ getMonthShort(appt.date) }}</span>
                   <span class="text-2xl font-light">{{ getDay(appt.date) }}</span>
                </div>
                <div>
                  <h3 class="font-bold text-slate-800 text-lg group-hover:text-[#3498db] transition-colors">{{ getPatientName(appt.patientId) }}</h3>
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
      </div>

      <!-- New Appointment Modal -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div class="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 class="font-bold text-slate-800">Nueva Cita</h3>
              <button (click)="closeModal()" class="text-slate-400 hover:text-slate-600">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <div class="p-6 space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Paciente</label>
                <select [(ngModel)]="newAppointment.patientId" class="w-full border border-slate-300 rounded p-2 text-sm focus:outline-none focus:border-[#3498db]">
                  <option value="" disabled selected>Seleccione un paciente</option>
                  @for (patient of db.patients(); track patient.id) {
                    <option [value]="patient.id">{{ patient.name }} - {{ patient.dpi }}</option>
                  }
                </select>
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
    </div>
  `
})
export class AgendaComponent {
  db = inject(DbService);
  selectedDate = signal(new Date());
  showModal = signal(false);

  newAppointment: Partial<Appointment> = {
    patientId: '',
    date: new Date().toISOString().split('T')[0],
    time: '08:00',
    type: 'Toma de Muestra',
    status: 'Programado'
  };

  formattedDate = computed(() => {
    const d = this.selectedDate();
    const today = new Date();

    // Reset hours for comparison
    const dStr = d.toDateString();
    const tStr = today.toDateString();

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const dateStr = d.toLocaleDateString('es-ES', options);

    if (dStr === tStr) return `Hoy, ${dateStr}`;

    return dateStr.replace(/^\w/, (c) => c.toUpperCase());
  });

  filteredAppointments = computed(() => {
    const d = this.selectedDate();
    const dateStr = d.toISOString().split('T')[0];
    return this.db.appointments().filter(a => a.date === dateStr);
  });

  getPatientName(id: string): string {
    const p = this.db.patients().find(pt => pt.id === id);
    return p ? p.name : 'Paciente Desconocido';
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

  prevDay() {
    this.selectedDate.update(d => {
      const newDate = new Date(d);
      newDate.setDate(d.getDate() - 1);
      return newDate;
    });
  }

  nextDay() {
    this.selectedDate.update(d => {
      const newDate = new Date(d);
      newDate.setDate(d.getDate() + 1);
      return newDate;
    });
  }

  returnToToday() {
    this.selectedDate.set(new Date());
  }

  editAppointment(id: string) {
    alert(`Editar cita ${id} - Funcionalidad en desarrollo`);
  }

  cancelAppointment(id: string) {
    if (confirm('¿Está seguro de que desea cancelar esta cita?')) {
      this.db.updateAppointmentStatus(id, 'Cancelado');
    }
  }

  openModal() {
    this.newAppointment = {
      patientId: '',
      date: this.selectedDate().toISOString().split('T')[0],
      time: '08:00',
      type: 'Toma de Muestra',
      status: 'Programado'
    };
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  isValidAppointment() {
    return this.newAppointment.patientId && this.newAppointment.date && this.newAppointment.time;
  }

  saveAppointment() {
    if (this.isValidAppointment()) {
      // Cast to any to delete optional/missing properties if needed or strict compliance
      // We'll create a full object. ID is expected by interface but usually handled by DB.
      // We'll let DbService handle the ID issue or provided a temp one.
      const appt: Appointment = {
        id: '', // Will be ignored/managed by DB service
        patientId: this.newAppointment.patientId!,
        date: this.newAppointment.date!,
        time: this.newAppointment.time!,
        type: this.newAppointment.type || 'Consulta General', // Default if not set
        status: 'Programado'
      };

      this.db.addAppointment(appt);
      this.closeModal();
      // Optionally update selected date to the appointment date so user sees it
      const [y, m, d] = appt.date.split('-').map(Number);
      this.selectedDate.set(new Date(y, m - 1, d));
    }
  }
}
