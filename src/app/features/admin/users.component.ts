
import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DbService, User } from '../../../core/services/db.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div>
      <div class="flex justify-between items-center mb-6">
        <div>
           <h1 class="text-2xl font-light text-slate-800">Gestión de Usuarios</h1>
           <p class="text-sm text-slate-400">Control de perfiles y asignación de roles.</p>
        </div>
        <div class="flex gap-2">
            <button (click)="refreshList()" class="bg-white border border-slate-300 text-slate-600 px-4 py-2 hover:bg-slate-50 transition-colors flex items-center gap-2 font-medium">
              <i class="fas fa-sync-alt" [class.fa-spin]="isLoading()"></i> Actualizar Lista
            </button>
        </div>
      </div>
      
      <!-- User Form (Only shows when editing) -->
      @if (showForm()) {
        <div class="bg-white p-8 border border-slate-200 mb-8 animate-fade-in shadow-sm">
          <h2 class="text-lg font-bold mb-6 text-slate-700 border-b pb-2">
            Editar Perfil
          </h2>
          <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre Completo</label>
              <input formControlName="name" type="text" class="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#3498db] outline-none transition-colors text-slate-700">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Correo Electrónico</label>
              <input formControlName="email" type="email" placeholder="usuario@biosalud.com" class="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#3498db] outline-none transition-colors text-slate-700">
            </div>
            
            <div class="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100">
               <button type="button" (click)="resetState()" class="px-6 py-3 text-slate-500 hover:text-slate-800 transition-colors">Cancelar</button>
               <button type="submit" [disabled]="userForm.invalid" class="bg-[#1abc9c] text-white px-8 py-3 hover:bg-[#16a085] disabled:opacity-50 disabled:cursor-not-allowed font-bold uppercase text-sm tracking-wide transition-colors">
                  Guardar Cambios
               </button>
            </div>
          </form>
        </div>
      }

      <!-- Users Table -->
      <div class="bg-white border border-slate-200 overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead class="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
            <tr>
              <th class="p-4 border-b border-slate-200">Email (Usuario)</th>
              <th class="p-4 border-b border-slate-200">Rol Actual</th>
              <th class="p-4 border-b border-slate-200">Último Acceso</th>
              <th class="p-4 border-b border-slate-200 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (user of db.users(); track user.id) {
              <tr class="hover:bg-slate-50 transition-colors group">
                <td class="p-4">
                    <div class="font-bold text-slate-700">{{ user.name }}</div>
                    <div class="text-xs text-slate-400 font-mono">{{ user.email }}</div>
                </td>
                <td class="p-4">
                  <span class="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm border"
                    [class.bg-purple-50]="user.role === 'Admin'" [class.text-purple-600]="user.role === 'Admin'" [class.border-purple-200]="user.role === 'Admin'"
                    [class.bg-blue-50]="user.role === 'Técnico'" [class.text-blue-600]="user.role === 'Técnico'" [class.border-blue-200]="user.role === 'Técnico'">
                    {{ user.role }}
                  </span>
                </td>
                <td class="p-4 text-xs text-slate-400 font-mono">
                  {{ user.lastLogin ? (user.lastLogin | date:'dd/MM/yyyy HH:mm') : 'Nunca' }}
                </td>
                <td class="p-4 text-right">
                  <button (click)="editUser(user)" class="text-[#3498db] hover:text-[#2980b9] mr-3" title="Editar Perfil"><i class="fas fa-edit"></i></button>
                  @if (db.currentUser()?.email !== user.email) {
                     <button (click)="deleteUser(user.id)" class="text-[#e74c3c] hover:text-[#c0392b]" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-5px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in { animation: fadeIn 0.2s ease-out; }
  `]
})
export class UsersComponent {
  db = inject(DbService);
  private fb: FormBuilder = inject(FormBuilder);
  private router = inject(Router);
  
  showForm = signal(false);
  isLoading = signal(false);
  editingId = signal<string | null>(null);

  userForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['Técnico', Validators.required]
  });

  constructor() {
    // Security check: If not Admin, kick out immediately
    effect(() => {
        const user = this.db.currentUser();
        // Check if user is loaded first to avoid premature redirect on refresh
        if (user && user.role !== 'Admin') {
            console.warn('Unauthorized access attempt to Users module.');
            this.router.navigate(['/dashboard']);
        }
    });
  }

  async refreshList() {
    this.isLoading.set(true);
    await this.db.fetchUsers();
    this.isLoading.set(false);
  }

  editUser(user: User) {
    this.editingId.set(user.id);
    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      role: user.role
    });
    // Disable role control to prevent editing
    this.userForm.get('role')?.disable();
    
    this.showForm.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteUser(id: string) {
    if(confirm('¿Está seguro de eliminar este perfil?')) {
        this.db.deleteUser(id);
    }
  }

  resetState() {
    this.showForm.set(false);
    this.editingId.set(null);
    this.userForm.reset({ role: 'Técnico' });
    // Re-enable in case we use this form for something else later, good practice
    this.userForm.get('role')?.enable();
  }

  onSubmit() {
    if (this.userForm.invalid) return;
    const formVal = this.userForm.value;

    if (this.editingId()) {
      const updates: any = {
          name: formVal.name,
          email: formVal.email
          // Role is intentionally excluded from updates
      };
      this.db.updateUser(this.editingId()!, updates);
    } 
    
    this.resetState();
  }
}
