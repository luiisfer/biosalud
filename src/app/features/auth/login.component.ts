
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DbService } from '../../../core/services/db.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-100">
      <div class="bg-white p-10 border border-slate-200 w-full max-w-md shadow-sm">
        
        <div class="flex flex-col items-center mb-8">
           <img src="/assets/logo_biolab.png" alt="BioSalud Logo" class="h-20 object-contain mb-4">
           <h1 class="text-2xl font-bold text-slate-700 tracking-tight">BioSalud</h1>
           <p class="text-slate-400 text-sm mt-1">Gestión Inteligente de Laboratorios</p>
        </div>

        @if (errorMsg()) {
          <div class="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold uppercase flex items-center gap-2">
            <i class="fas fa-exclamation-circle"></i> {{ errorMsg() }}
          </div>
        }

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Correo Electrónico</label>
            <div class="relative">
              <i class="fas fa-envelope absolute left-4 top-4 text-slate-300"></i>
              <input formControlName="email" type="email" placeholder="admin@biosalud.com" 
                class="w-full p-3 pl-10 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#3498db] outline-none transition-colors text-slate-700">
            </div>
          </div>
          
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Contraseña</label>
            <div class="relative">
              <i class="fas fa-lock absolute left-4 top-4 text-slate-300"></i>
              <input formControlName="password" type="password" placeholder="••••••••"
                class="w-full p-3 pl-10 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#3498db] outline-none transition-colors text-slate-700">
            </div>
          </div>

          <button type="submit" 
            [disabled]="loginForm.invalid || isLoading()"
            class="w-full bg-[#2c3e50] text-white py-4 hover:bg-[#34495e] transition-colors font-bold uppercase text-xs tracking-widest flex justify-center items-center gap-2 disabled:opacity-50">
            @if (isLoading()) {
                <i class="fas fa-circle-notch fa-spin"></i> Verificando...
            } @else {
                Ingresar al Sistema <i class="fas fa-arrow-right"></i>
            }
          </button>
        </form>

        <div class="mt-8 text-center">
          <p class="text-xs text-slate-400 mb-4">¿Olvidó su contraseña? Contacte al administrador de TI.</p>
          
          <div class="border-t border-slate-100 pt-4 w-full">
            <div class="flex items-center justify-center gap-2 text-xs bg-slate-50 p-2 rounded-sm border border-slate-100">
                <span class="font-bold text-slate-500 uppercase">Estado BD:</span>
                @if(db.connectionStatus() === 'checking') {
                    <span class="text-yellow-600 flex items-center gap-1"><i class="fas fa-circle-notch fa-spin"></i> Verificando...</span>
                }
                @if(db.connectionStatus() === 'connected') {
                    <span class="text-green-600 font-bold flex items-center gap-1"><i class="fas fa-check-circle"></i> Conectado</span>
                }
                @if(db.connectionStatus() === 'error') {
                    <span class="text-red-600 font-bold flex items-center gap-1"><i class="fas fa-times-circle"></i> Falló</span>
                }
            </div>
             @if(db.connectionStatus() === 'error') {
                <p class="text-[10px] text-red-500 text-center mt-2 max-w-xs mx-auto border border-red-100 bg-red-50 p-2 rounded-sm">
                   {{ db.connectionError() }}
                </p>
                <div class="text-center mt-2">
                   <button (click)="db.testConnection()" class="text-[10px] text-[#3498db] hover:underline uppercase font-bold">Reintentar Conexión</button>
                </div>
             }
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  db = inject(DbService);
  private router = inject(Router);
  private fb: FormBuilder = inject(FormBuilder);

  errorMsg = signal('');
  isLoading = signal(false);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  async onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMsg.set('');

      const { email, password } = this.loginForm.value;
      const success = await this.db.login(email!, password!);

      this.isLoading.set(false);

      if (success) {
        // Explicitly navigate to ensure view update
        this.router.navigate(['/dashboard']);
      } else {
        this.errorMsg.set('Credenciales inválidas o error de conexión.');
      }
    }
  }
}
