
import { Component, inject } from '@angular/core';
import { DbService } from '../../../core/services/db.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div>
      <div class="flex flex-col items-center justify-center mb-8">
         <img src="/assets/logo_biolab.png" alt="BioSalud Logo" class="h-16 object-contain mb-4">
         <h1 class="text-3xl font-light text-slate-800">Panel de Laboratorio</h1>
      </div>
      
      <!-- Flat KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <!-- Patients -->
        <div class="bg-white p-6 border border-slate-200 flex items-center gap-4 hover:border-blue-400 transition-colors cursor-default">
          <div class="w-12 h-12 bg-blue-50 text-blue-500 flex items-center justify-center text-xl rounded-sm">
            <i class="fas fa-users"></i>
          </div>
          <div>
            <p class="text-xs text-slate-500 uppercase font-bold tracking-wider">Pacientes</p>
            <p class="text-2xl font-bold text-slate-800">{{ db.totalPatients() }}</p>
          </div>
        </div>

        <!-- Appointments -->
        <div class="bg-white p-6 border border-slate-200 flex items-center gap-4 hover:border-teal-400 transition-colors cursor-default">
          <div class="w-12 h-12 bg-teal-50 text-teal-500 flex items-center justify-center text-xl rounded-sm">
            <i class="fas fa-calendar-check"></i>
          </div>
          <div>
            <p class="text-xs text-slate-500 uppercase font-bold tracking-wider">Citas Hoy</p>
            <p class="text-2xl font-bold text-slate-800">{{ db.totalAppointmentsToday() }}</p>
          </div>
        </div>

        <!-- Pending Results -->
        <div class="bg-white p-6 border border-slate-200 flex items-center gap-4 hover:border-orange-400 transition-colors cursor-default">
          <div class="w-12 h-12 bg-orange-50 text-orange-500 flex items-center justify-center text-xl rounded-sm">
            <i class="fas fa-flask"></i>
          </div>
          <div>
            <p class="text-xs text-slate-500 uppercase font-bold tracking-wider">Pendientes</p>
            <p class="text-2xl font-bold text-slate-800">{{ db.pendingResults() }}</p>
          </div>
        </div>

        <!-- Revenue -->
        <div class="bg-white p-6 border border-slate-200 flex items-center gap-4 hover:border-purple-400 transition-colors cursor-default">
          <div class="w-12 h-12 bg-purple-50 text-purple-500 flex items-center justify-center text-xl rounded-sm">
            <i class="fas fa-dollar-sign"></i>
          </div>
          <div>
            <p class="text-xs text-slate-500 uppercase font-bold tracking-wider">Ingresos (Est)</p>
            <p class="text-2xl font-bold text-slate-800">Q12.4k</p>
          </div>
        </div>
      </div>

      <!-- Quick Actions (Full Width) -->
      <div>
        <h2 class="text-lg font-medium text-slate-700 mb-4 flex items-center gap-2">
          <i class="fas fa-bolt text-yellow-500"></i> Acciones Rápidas
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button routerLink="/patients" class="p-6 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-left transition-all">
            <i class="fas fa-user-plus text-blue-500 text-2xl mb-3"></i>
            <div class="font-bold text-slate-700">Nuevo Paciente</div>
            <div class="text-xs text-slate-400 mt-1">Registrar admisión</div>
          </button>
          <button routerLink="/agenda" class="p-6 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-left transition-all">
            <i class="fas fa-calendar-plus text-teal-500 text-2xl mb-3"></i>
            <div class="font-bold text-slate-700">Agendar Cita</div>
            <div class="text-xs text-slate-400 mt-1">Programar examen</div>
          </button>
            <button routerLink="/results" class="p-6 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-left transition-all">
            <i class="fas fa-microscope text-purple-500 text-2xl mb-3"></i>
            <div class="font-bold text-slate-700">Ingresar Resultados</div>
            <div class="text-xs text-slate-400 mt-1">Procesamiento lab</div>
          </button>
          
          @if(db.currentUser()?.role === 'Admin') {
            <button routerLink="/reports" class="p-6 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-left transition-all">
              <i class="fas fa-chart-line text-indigo-500 text-2xl mb-3"></i>
              <div class="font-bold text-slate-700">Analíticas</div>
              <div class="text-xs text-slate-400 mt-1">Visión de negocio</div>
            </button>
          }
        </div>
      </div>

    </div>
  `
})
export class DashboardComponent {
  db = inject(DbService);
}
