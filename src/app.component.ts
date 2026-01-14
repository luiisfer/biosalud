
import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DbService } from './core/services/db.service';
import { LoginComponent } from './app/features/auth/login.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, LoginComponent],
  template: `
    @if (db.currentUser()) {
      <div class="flex h-screen bg-slate-100 font-sans text-slate-700">
        <!-- Sidebar: Flat Dark Blue -->
        <aside class="w-64 bg-[#2c3e50] text-white flex flex-col z-20">
          <div class="p-6 flex items-center gap-3 bg-[#243342]">
             <div class="w-8 h-8 bg-[#1abc9c] rounded-sm flex items-center justify-center">
                <i class="fas fa-flask text-white"></i>
             </div>
             <span class="text-xl font-bold tracking-tight">BioSalud</span>
          </div>

          <nav class="flex-1 overflow-y-auto py-4">
            <ul class="space-y-0">
              <li>
                <a routerLink="/dashboard" routerLinkActive="bg-[#34495e] text-[#1abc9c]" class="flex items-center gap-3 px-6 py-4 text-slate-300 hover:bg-[#34495e] hover:text-white transition-colors cursor-pointer border-l-4 border-transparent router-link-active:border-[#1abc9c]">
                  <i class="fas fa-th-large w-5 text-center"></i> Panel
                </a>
              </li>
              <li>
                <a routerLink="/patients" routerLinkActive="bg-[#34495e] text-[#1abc9c]" class="flex items-center gap-3 px-6 py-4 text-slate-300 hover:bg-[#34495e] hover:text-white transition-colors cursor-pointer border-l-4 border-transparent router-link-active:border-[#1abc9c]">
                  <i class="fas fa-user-injured w-5 text-center"></i> Pacientes
                </a>
              </li>
              <li>
                <a routerLink="/exams" routerLinkActive="bg-[#34495e] text-[#1abc9c]" class="flex items-center gap-3 px-6 py-4 text-slate-300 hover:bg-[#34495e] hover:text-white transition-colors cursor-pointer border-l-4 border-transparent router-link-active:border-[#1abc9c]">
                  <i class="fas fa-dna w-5 text-center"></i> Exámenes
                </a>
              </li>
              <li>
                <a routerLink="/agenda" routerLinkActive="bg-[#34495e] text-[#1abc9c]" class="flex items-center gap-3 px-6 py-4 text-slate-300 hover:bg-[#34495e] hover:text-white transition-colors cursor-pointer border-l-4 border-transparent router-link-active:border-[#1abc9c]">
                  <i class="fas fa-calendar-alt w-5 text-center"></i> Agenda
                </a>
              </li>
              <li>
                <a routerLink="/results" routerLinkActive="bg-[#34495e] text-[#1abc9c]" class="flex items-center gap-3 px-6 py-4 text-slate-300 hover:bg-[#34495e] hover:text-white transition-colors cursor-pointer border-l-4 border-transparent router-link-active:border-[#1abc9c]">
                  <i class="fas fa-vial w-5 text-center"></i> Resultados
                </a>
              </li>
              
              <!-- ADMIN ONLY MODULES -->
              @if (db.currentUser()?.role === 'Admin') {
                <div class="px-6 py-2 mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Administración</div>
                
                <li>
                  <a routerLink="/users" routerLinkActive="bg-[#34495e] text-[#1abc9c]" class="flex items-center gap-3 px-6 py-4 text-slate-300 hover:bg-[#34495e] hover:text-white transition-colors cursor-pointer border-l-4 border-transparent router-link-active:border-[#1abc9c]">
                    <i class="fas fa-users-cog w-5 text-center"></i> Usuarios
                  </a>
                </li>
                <li>
                  <a routerLink="/sales" routerLinkActive="bg-[#34495e] text-[#1abc9c]" class="flex items-center gap-3 px-6 py-4 text-slate-300 hover:bg-[#34495e] hover:text-white transition-colors cursor-pointer border-l-4 border-transparent router-link-active:border-[#1abc9c]">
                    <i class="fas fa-cash-register w-5 text-center"></i> Ventas
                  </a>
                </li>
                <li>
                  <a routerLink="/reports" routerLinkActive="bg-[#34495e] text-[#1abc9c]" class="flex items-center gap-3 px-6 py-4 text-slate-300 hover:bg-[#34495e] hover:text-white transition-colors cursor-pointer border-l-4 border-transparent router-link-active:border-[#1abc9c]">
                    <i class="fas fa-chart-pie w-5 text-center"></i> Reportes
                  </a>
                </li>
                <li>
                  <a routerLink="/settings" routerLinkActive="bg-[#34495e] text-[#1abc9c]" class="flex items-center gap-3 px-6 py-4 text-slate-300 hover:bg-[#34495e] hover:text-white transition-colors cursor-pointer border-l-4 border-transparent router-link-active:border-[#1abc9c]">
                    <i class="fas fa-cog w-5 text-center"></i> Configuración
                  </a>
                </li>
              }
            </ul>
          </nav>

          <!-- User Profile / Logout -->
          <div class="p-4 bg-[#243342]">
             <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                   <div class="w-10 h-10 rounded-sm bg-[#34495e] flex items-center justify-center text-xs font-bold text-white border border-[#46637f]">
                      {{ db.currentUser()?.name?.substring(0,2)?.toUpperCase() }}
                   </div>
                   <div class="overflow-hidden">
                      <p class="text-sm font-semibold truncate text-white w-24">{{ db.currentUser()?.name }}</p>
                      <p class="text-xs text-[#95a5a6]">{{ db.currentUser()?.role }}</p>
                   </div>
                </div>
                <button (click)="db.logout()" class="text-slate-400 hover:text-white transition-colors" title="Cerrar Sesión">
                   <i class="fas fa-sign-out-alt"></i>
                </button>
             </div>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 overflow-y-auto flex flex-col bg-slate-100">
           <!-- Header: Flat White -->
           <header class="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-8 z-10 sticky top-0">
              <h2 class="text-slate-500 text-sm font-medium uppercase tracking-wide">
                 <span class="text-[#2c3e50] font-bold">BioSalud</span> / Sistema de Gestión
              </h2>
              <div class="flex items-center gap-6">
                 <button class="text-slate-400 hover:text-[#2c3e50] transition-colors"><i class="fas fa-search"></i></button>
                 <button class="text-slate-400 hover:text-[#2c3e50] relative transition-colors">
                    <i class="fas fa-bell"></i>
                    <span class="absolute -top-1 -right-1 w-2 h-2 bg-[#e74c3c] rounded-full"></span>
                 </button>
                 @if(db.currentUser()?.role === 'Admin') {
                   <button routerLink="/settings" class="text-slate-400 hover:text-[#2c3e50] transition-colors"><i class="fas fa-cog"></i></button>
                 }
              </div>
           </header>
           
           <!-- View Outlet -->
           <div class="flex-1 p-8">
              <router-outlet></router-outlet>
           </div>
        </main>
      </div>
    } @else {
      <app-login></app-login>
    }
  `
})
export class AppComponent {
  db = inject(DbService);
}
