
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DbService, Doctor } from '../../../core/services/db.service';
import { GeminiService } from '../../../core/services/gemini.service';

@Component({
  selector: 'app-crm',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h1 class="text-2xl font-light text-slate-800 mb-8">Gestión de Relaciones Médicas</h1>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        @for (doc of db.doctors(); track doc.id) {
          <div class="bg-white border border-slate-200 hover:border-slate-300 transition-colors">
            <div class="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50">
               <div>
                  <h3 class="font-bold text-lg text-slate-800">{{ doc.name }}</h3>
                  <p class="text-xs text-slate-500 uppercase tracking-wide mt-1">{{ doc.specialty }}</p>
               </div>
               <span class="px-2 py-1 text-[10px] font-bold uppercase tracking-wider border"
                 [class.bg-green-50]="doc.status === 'Activo'" [class.text-green-600]="doc.status === 'Activo'" [class.border-green-100]="doc.status === 'Activo'"
                 [class.bg-red-50]="doc.status === 'En Riesgo'" [class.text-red-600]="doc.status === 'En Riesgo'" [class.border-red-100]="doc.status === 'En Riesgo'"
                 [class.bg-gray-50]="doc.status === 'Inactivo'" [class.text-gray-600]="doc.status === 'Inactivo'" [class.border-gray-200]="doc.status === 'Inactivo'">
                 {{ doc.status }}
               </span>
            </div>
            <div class="p-5">
              <div class="flex justify-between items-center mb-6">
                 <span class="text-slate-500 text-sm">Derivaciones (Mes)</span>
                 <span class="font-bold text-slate-800 text-2xl">{{ doc.referralsLastMonth }}</span>
              </div>
              <div class="text-xs text-slate-400 mb-6 font-mono">Último Contacto: {{ doc.lastContact }}</div>
              
              <button (click)="draftEmail(doc)" 
                 class="w-full border-2 border-[#3498db] text-[#3498db] py-2 hover:bg-[#3498db] hover:text-white transition-colors font-bold text-sm uppercase tracking-wide">
                 <i class="fas fa-envelope-open-text mr-2"></i> Redactar Email
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Email Draft Modal/Section -->
      @if (currentDraft()) {
        <div class="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div class="bg-white max-w-2xl w-full animate-fade-in border border-slate-200">
            <div class="bg-[#2c3e50] p-4 flex justify-between items-center text-white">
               <h3 class="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                 <i class="fas fa-robot text-[#1abc9c]"></i> Email Redactado por IA
               </h3>
               <button (click)="closeDraft()" class="hover:text-slate-300 transition-colors"><i class="fas fa-times"></i></button>
            </div>
            
            <div class="p-8">
              @if (isLoading()) {
                <div class="flex flex-col items-center justify-center py-12 text-slate-400">
                   <i class="fas fa-circle-notch fa-spin text-4xl text-[#3498db] mb-4"></i>
                   <p class="font-medium">Generando email personalizado...</p>
                </div>
              } @else {
                <div class="mb-6">
                  <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Asunto</label>
                  <input type="text" value="Actualización de BioSalud sobre sus derivaciones recientes" class="w-full p-3 bg-slate-50 border border-slate-200 text-slate-700 text-sm focus:border-[#3498db] outline-none">
                </div>
                <div class="mb-8">
                   <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Cuerpo</label>
                   <textarea rows="10" class="w-full p-4 bg-slate-50 border border-slate-200 text-slate-700 text-sm focus:border-[#3498db] outline-none resize-none font-sans leading-relaxed">{{ currentDraft() }}</textarea>
                </div>
                <div class="flex justify-end gap-4">
                   <button (click)="closeDraft()" class="px-6 py-2 text-slate-500 hover:text-slate-800 transition-colors font-medium text-sm">Descartar</button>
                   <button class="px-8 py-2 bg-[#3498db] text-white hover:bg-[#2980b9] transition-colors font-bold uppercase text-xs tracking-wider">Enviar Email</button>
                </div>
              }
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
    .animate-fade-in { animation: fadeIn 0.15s ease-out; }
  `]
})
export class CrmComponent {
  db = inject(DbService);
  gemini = inject(GeminiService);
  
  currentDraft = signal<string | null>(null);
  isLoading = signal(false);

  async draftEmail(doc: Doctor) {
    this.currentDraft.set(" "); // Open modal
    this.isLoading.set(true);
    
    const draft = await this.gemini.generateDoctorEmail(doc.name, {
       referralsLastMonth: doc.referralsLastMonth,
       status: doc.status
    });
    
    this.currentDraft.set(draft);
    this.isLoading.set(false);
  }

  closeDraft() {
    this.currentDraft.set(null);
  }
}
