
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DbService } from '../../../core/services/db.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto pb-12">
      <h1 class="text-2xl font-light text-slate-800 mb-2">Configuración del Sistema</h1>
      <p class="text-slate-400 text-sm mb-8">Gestione los parámetros generales de su laboratorio.</p>

      <div class="space-y-8">
        <!-- LOGO SECTION -->
        <div class="bg-white p-8 border border-slate-200 shadow-sm">
          <h2 class="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
            <i class="fas fa-image text-[#e67e22]"></i> Logotipo del Laboratorio
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p class="text-sm text-slate-500 mb-4">
                Suba el logotipo de su laboratorio. Este logo aparecerá en la parte superior de todos los informes médicos generados.
              </p>
              
              <div class="relative group">
                <label for="logo-upload" class="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-sm cursor-pointer hover:bg-slate-50 hover:border-[#e67e22] transition-colors">
                  <div class="flex flex-col items-center justify-center pt-5 pb-6">
                    <i class="fas fa-cloud-upload-alt text-3xl text-slate-400 mb-3 group-hover:text-[#e67e22]"></i>
                    <p class="mb-2 text-sm text-slate-500"><span class="font-bold">Subir Logotipo</span></p>
                    <p class="text-xs text-slate-400">PNG, JPG (MAX. 800x400px)</p>
                  </div>
                  <input id="logo-upload" type="file" class="hidden" accept="image/*" (change)="onLogoSelected($event)" />
                </label>
              </div>
            </div>

            <div class="bg-slate-50 p-6 border border-slate-200 flex flex-col items-center justify-center">
               <h3 class="text-xs font-bold uppercase text-slate-400 mb-4 w-full text-center">Vista Previa Logo</h3>
               
               @if (db.labLogo()) {
                 <div class="bg-white p-4 border border-slate-200 mb-4 w-full flex items-center justify-center h-32">
                   <img [src]="db.labLogo()" alt="Logo Actual" class="max-h-full max-w-full object-contain">
                 </div>
                 <button (click)="removeLogo()" class="text-red-500 text-xs hover:underline">Eliminar Logo</button>
               } @else {
                 <div class="bg-white border border-slate-200 mb-4 w-full h-32 flex items-center justify-center text-slate-300 italic text-sm text-center px-4">
                   Sin logotipo configurado
                 </div>
               }
            </div>
          </div>
        </div>

        <!-- SIGNATURE SECTION -->
        <div class="bg-white p-8 border border-slate-200 shadow-sm">
          <h2 class="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
            <i class="fas fa-file-signature text-[#3498db]"></i> Firma Digital y Validación
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Upload Section -->
            <div>
              <p class="text-sm text-slate-500 mb-4">
                Suba la imagen de la firma autorizada (formato .png o .jpg). Esta firma aparecerá automáticamente en los reportes PDF.
              </p>
              
              <div class="relative group">
                <label for="signature-upload" class="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-sm cursor-pointer hover:bg-slate-50 hover:border-[#3498db] transition-colors">
                  <div class="flex flex-col items-center justify-center pt-5 pb-6">
                    <i class="fas fa-cloud-upload-alt text-3xl text-slate-400 mb-3 group-hover:text-[#3498db]"></i>
                    <p class="mb-2 text-sm text-slate-500"><span class="font-bold">Subir Firma</span></p>
                    <p class="text-xs text-slate-400">PNG, JPG (MAX. 500x200px)</p>
                  </div>
                  <input id="signature-upload" type="file" class="hidden" accept="image/*" (change)="onFileSelected($event)" />
                </label>
              </div>
              
              @if (errorMsg()) {
                 <div class="mt-2 text-red-500 text-xs flex items-center gap-1">
                   <i class="fas fa-exclamation-circle"></i> {{ errorMsg() }}
                 </div>
              }
            </div>

            <!-- Preview Section -->
            <div class="bg-slate-50 p-6 border border-slate-200 flex flex-col items-center justify-center">
               <h3 class="text-xs font-bold uppercase text-slate-400 mb-4 w-full text-center">Vista Previa Firma</h3>
               
               @if (db.labSignature()) {
                 <div class="bg-white p-4 border border-slate-200 mb-4 w-full flex items-center justify-center h-32">
                   <img [src]="db.labSignature()" alt="Firma Actual" class="max-h-full max-w-full object-contain">
                 </div>
                 <button (click)="removeSignature()" class="text-red-500 text-xs hover:underline">Eliminar Firma</button>
               } @else {
                 <div class="bg-white border border-slate-200 mb-4 w-full h-32 flex items-center justify-center text-slate-300 italic text-sm">
                   Sin firma configurada
                 </div>
               }
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent {
  db = inject(DbService);
  errorMsg = signal('');

  onLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 2000000) {
        this.errorMsg.set('El logo es demasiado grande (Máx 2MB).');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          this.db.setLogo(reader.result);
          this.errorMsg.set('');
        }
      };
      reader.readAsDataURL(file);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Simple validation
      if (file.size > 2000000) { // 2MB limit
        this.errorMsg.set('La firma es demasiado grande (Máx 2MB).');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          this.db.setSignature(reader.result);
          this.errorMsg.set('');
        }
      };
      reader.readAsDataURL(file);
    }
  }

  removeSignature() {
    this.db.setSignature('');
  }

  removeLogo() {
    this.db.setLogo('');
  }
}
