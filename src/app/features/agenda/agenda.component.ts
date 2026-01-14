
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DbService } from '../../../core/services/db.service';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 class="text-2xl font-light text-slate-800">Agenda y Turnos</h1>
          <p class="text-slate-400 text-sm mt-1">Gestionar flujo de citas de laboratorio</p>
        </div>
        <div class="mt-4 md:mt-0 flex">
           <button class="bg-white border border-slate-300 border-r-0 text-slate-600 px-4 py-2 hover:bg-slate-50 transition-colors rounded-l-sm">
             <i class="fas fa-chevron-left"></i>
           </button>
           <button class="bg-white border border-slate-300 text-slate-800 px-6 py-2 hover:bg-slate-50 transition-colors font-medium text-sm">
             Hoy, 27 Oct
           </button>
           <button class="bg-white border border-slate-300 border-l-0 text-slate-600 px-4 py-2 hover:bg-slate-50 transition-colors rounded-r-sm">
             <i class="fas fa-chevron-right"></i>
           </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Calendar List View -->
        <div class="lg:col-span-2 space-y-4">
          @for (appt of db.appointments(); track appt.id) {
            <div class="bg-white p-5 border border-slate-200 flex items-center justify-between hover:border-slate-300 transition-colors group">
              
              <div class="flex items-center gap-6">
                <div class="flex flex-col items-center justify-center bg-slate-50 w-16 h-16 border border-slate-100 text-slate-700">
                   <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Oct</span>
                   <span class="text-2xl font-light">{{ appt.date.split('-')[2] }}</span>
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
                      [class.bg-purple-50]="appt.status === 'Resultados Listos'" [class.text-purple-600]="appt.status === 'Resultados Listos'">
                  {{ appt.status }}
                </span>
                <div class="flex gap-4 justify-end">
                    <button class="text-slate-300 hover:text-slate-600 transition-colors" title="Editar"><i class="fas fa-pencil-alt"></i></button>
                    <button class="text-slate-300 hover:text-red-500 transition-colors" title="Cancelar"><i class="fas fa-times"></i></button>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Smart Scheduler Sidebar -->
        <div class="bg-[#eef2f6] p-6 border border-slate-200 h-fit">
          <h3 class="font-bold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide text-sm">
            <i class="fas fa-robot text-[#3498db]"></i> Programación Inteligente
          </h3>
          <p class="text-sm text-slate-500 mb-6 leading-relaxed">
            El análisis de IA sugiere estos horarios para un flujo óptimo del laboratorio basado en la carga actual.
          </p>

          <div class="space-y-3">
             <button class="w-full text-left p-4 bg-white border border-slate-200 hover:border-[#1abc9c] transition-colors group">
                <div class="flex justify-between items-center">
                   <span class="font-bold text-slate-700 group-hover:text-[#1abc9c]">11:00 AM Hoy</span>
                   <span class="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 font-bold uppercase">Eficiente</span>
                </div>
                <div class="text-xs text-slate-400 mt-1">Espacio antes del almuerzo.</div>
             </button>
             <button class="w-full text-left p-4 bg-white border border-slate-200 hover:border-[#3498db] transition-colors group">
                <div class="flex justify-between items-center">
                   <span class="font-bold text-slate-700 group-hover:text-[#3498db]">02:15 PM Hoy</span>
                   <span class="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 font-bold uppercase">Estándar</span>
                </div>
                <div class="text-xs text-slate-400 mt-1">Equipo B disponible.</div>
             </button>
          </div>
          
          <button class="w-full mt-6 bg-[#2c3e50] text-white py-3 hover:bg-[#34495e] transition-colors font-bold uppercase text-xs tracking-wider">
             Auto-rellenar siguiente turno
          </button>
        </div>
      </div>
    </div>
  `
})
export class AgendaComponent {
  db = inject(DbService);

  getPatientName(id: string): string {
    const p = this.db.patients().find(pt => pt.id === id);
    return p ? p.name : 'Paciente Desconocido';
  }
}
