
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DbService, Exam } from '../../../core/services/db.service';

@Component({
  selector: 'app-exams',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div>
      <!-- Modal de Confirmación de Eliminación -->
      @if (deleteConfirmation.show) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div class="bg-white rounded-lg shadow-2xl max-w-sm w-full p-8 border border-slate-200 transform scale-100 transition-all">
            <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <i class="fas fa-exclamation-triangle text-2xl"></i>
            </div>
            <h3 class="text-xl font-bold text-slate-800 text-center mb-2">¿Confirmar Eliminación?</h3>
            <p class="text-slate-500 text-center mb-8">Esta acción no se puede deshacer y podría afectar a otros registros vinculados.</p>
            <div class="flex gap-4">
              <button 
                (click)="cancelDelete()" 
                class="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded hover:bg-slate-200 transition-colors">
                CANCELAR
              </button>
              <button 
                (click)="confirmDelete()" 
                class="flex-1 py-3 bg-red-500 text-white font-bold rounded hover:bg-red-600 transition-colors shadow-lg shadow-red-200">
                ELIMINAR
              </button>
            </div>
          </div>
        </div>
      }

      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-light text-slate-800">Mantenimiento de Catálogo</h1>
        <div class="flex gap-2">
          <button (click)="openForm('methodology')" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 transition-colors flex items-center gap-2 font-medium">
             <i class="fas fa-microscope"></i> + Metodología
          </button>
          <button (click)="openForm('profile')" class="bg-[#1abc9c] hover:bg-[#16a085] text-white px-4 py-2 transition-colors flex items-center gap-2 font-medium">
             <i class="fas fa-layer-group"></i> + Perfil
          </button>
          <button (click)="openForm('exam')" class="bg-[#3498db] hover:bg-[#2980b9] text-white px-4 py-2 transition-colors flex items-center gap-2 font-medium">
             <i class="fas fa-vial"></i> + Examen
          </button>
        </div>
      </div>

      @if (activeForm() === 'methodology') {
        <div class="bg-white p-8 border border-slate-200 mb-8 animate-fade-in border-l-4 border-indigo-500">
           <div class="flex justify-between items-center mb-6">
              <h2 class="text-lg font-bold text-slate-700">Nueva Metodología</h2>
              <button (click)="closeForm()" class="text-slate-400 hover:text-red-500"><i class="fas fa-times"></i></button>
           </div>
           <form [formGroup]="methodologyForm" (ngSubmit)="saveMethodology()" class="grid grid-cols-1 gap-6">
              <div>
                 <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre de la Metodología</label>
                 <input formControlName="name" type="text" placeholder="Ej: Química Sanguínea" class="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none transition-colors text-slate-700">
              </div>
              <div>
                 <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Descripción</label>
                 <textarea formControlName="description" rows="2" class="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none transition-colors text-slate-700"></textarea>
              </div>
              <div class="flex justify-end">
                 <button type="submit" [disabled]="methodologyForm.invalid" class="bg-indigo-600 text-white px-8 py-3 hover:bg-indigo-700 disabled:opacity-50 font-bold uppercase text-sm tracking-wide">
                    Guardar Metodología
                 </button>
              </div>
           </form>
        </div>
      }

      @if (activeForm() === 'profile') {
        <div class="bg-white p-8 border border-slate-200 mb-8 animate-fade-in border-l-4 border-[#1abc9c]">
           <div class="flex justify-between items-center mb-6">
              <h2 class="text-lg font-bold text-slate-700">Nuevo Perfil de Exámenes</h2>
              <button (click)="closeForm()" class="text-slate-400 hover:text-red-500"><i class="fas fa-times"></i></button>
           </div>
           <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="md:col-span-2">
                 <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Metodología Perteneciente</label>
                 <select formControlName="methodology_id" class="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#1abc9c] outline-none transition-colors text-slate-700">
                    <option value="">Seleccione una metodología...</option>
                    @for (m of db.methodologies(); track m.id) {
                       <option [value]="m.id">{{ m.name }}</option>
                    }
                 </select>
              </div>
              <div>
                 <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre del Perfil</label>
                 <input formControlName="name" type="text" placeholder="Ej: Perfil Renal" class="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#1abc9c] outline-none transition-colors text-slate-700">
              </div>
              <div>
                 <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Descripción</label>
                 <textarea formControlName="description" rows="1" class="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#1abc9c] outline-none transition-colors text-slate-700"></textarea>
              </div>
              <div class="md:col-span-2 flex justify-end">
                 <button type="submit" [disabled]="profileForm.invalid" class="bg-[#1abc9c] text-white px-8 py-3 hover:bg-[#16a085] disabled:opacity-50 font-bold uppercase text-sm tracking-wide">
                    Guardar Perfil
                 </button>
              </div>
           </form>
        </div>
      }

      @if (activeForm() === 'exam') {
        <div class="bg-white p-8 border border-slate-200 mb-8 animate-fade-in border-l-4 border-[#3498db]">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-lg font-bold text-slate-700">
              {{ editingId() ? 'Editar Examen' : 'Nuevo Examen Individual' }}
            </h2>
            <button (click)="closeForm()" class="text-slate-400 hover:text-red-500"><i class="fas fa-times"></i></button>
          </div>
          <form [formGroup]="examForm" (ngSubmit)="onSubmit()" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="md:col-span-2">
               <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Perfil al que pertenece (Opcional)</label>
               <select formControlName="profile_id" class="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#3498db] outline-none transition-colors text-slate-700">
                  <option [value]="null">Examen Independiente</option>
                  @for (p of db.profiles(); track p.id) {
                     <option [value]="p.id">{{ p.name }}</option>
                  }
               </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre del Examen</label>
              <input formControlName="name" type="text" class="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#3498db] outline-none transition-colors text-slate-700">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Código Interno</label>
              <input formControlName="code" type="text" class="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#3498db] outline-none transition-colors text-slate-700">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Precio (Q)</label>
              <input formControlName="price" type="number" class="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#3498db] outline-none transition-colors text-slate-700">
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Rango Referencia</label>
                <input formControlName="range" type="text" placeholder="Ej: 70-100" class="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#3498db] outline-none transition-colors text-slate-700">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Unidad</label>
                <input formControlName="unit" type="text" placeholder="Ej: mg/dL" class="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#3498db] outline-none transition-colors text-slate-700">
              </div>
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Descripción</label>
              <textarea formControlName="description" rows="3" class="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#3498db] outline-none transition-colors text-slate-700"></textarea>
            </div>
            <div class="md:col-span-2 flex justify-end">
               <button type="submit" [disabled]="examForm.invalid" class="bg-[#1abc9c] text-white px-8 py-3 hover:bg-[#16a085] disabled:opacity-50 disabled:cursor-not-allowed font-bold uppercase text-sm tracking-wide transition-colors">
                  {{ editingId() ? 'Actualizar Examen' : 'Guardar Examen' }}
               </button>
            </div>
          </form>
        </div>
      }

      <!-- Search & Filters Bar -->
      <div class="bg-white p-4 border border-slate-200 border-b-0 flex flex-col md:flex-row justify-between items-center gap-4">
         <div class="flex bg-slate-100 p-1 rounded-lg">
            <button 
              (click)="view.set('methodology')" 
              [class]="view() === 'methodology' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'"
              class="px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all flex items-center gap-2">
              <i class="fas fa-microscope"></i> Metodologías
            </button>
            <button 
              (click)="view.set('profile')" 
              [class]="view() === 'profile' ? 'bg-white shadow text-[#1abc9c]' : 'text-slate-500 hover:text-slate-700'"
              class="px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all flex items-center gap-2">
              <i class="fas fa-layer-group"></i> Perfiles
            </button>
            <button 
              (click)="view.set('exam')" 
              [class]="view() === 'exam' ? 'bg-white shadow text-[#3498db]' : 'text-slate-500 hover:text-slate-700'"
              class="px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all flex items-center gap-2">
              <i class="fas fa-vial"></i> Exámenes
            </button>
         </div>

         <div class="relative flex-1 md:max-w-md">
            <i class="fas fa-search absolute left-4 top-3.5 text-slate-400"></i>
            <input 
              (input)="updateSearch($event)" 
              type="text" 
              [placeholder]="'Buscar ' + (view() === 'exam' ? 'exámenes' : view() === 'profile' ? 'perfiles' : 'metodologías') + '...'" 
              class="w-full pl-10 p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#3498db] outline-none transition-colors text-slate-700 rounded-sm">
         </div>
         <div class="text-xs text-slate-500 font-bold uppercase tracking-wider whitespace-nowrap">
            {{ paginatedData().length }} de {{ filteredData().length }} registros
         </div>
      </div>

      <div class="bg-white border border-slate-200">
        <table class="w-full text-left border-collapse">
          <thead class="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
            <tr>
              @if (view() === 'exam') {
                <th class="p-4 border-b border-slate-200">Código</th>
                <th class="p-4 border-b border-slate-200">Examen</th>
                <th class="p-4 border-b border-slate-200">Perfil / Metodología</th>
                <th class="p-4 border-b border-slate-200">Rango / Unidad</th>
                <th class="p-4 border-b border-slate-200">Precio</th>
              } @else if (view() === 'profile') {
                <th class="p-4 border-b border-slate-200">Nombre del Perfil</th>
                <th class="p-4 border-b border-slate-200">Metodología</th>
                <th class="p-4 border-b border-slate-200">Descripción</th>
              } @else {
                <th class="p-4 border-b border-slate-200">Nombre de la Metodología</th>
                <th class="p-4 border-b border-slate-200">Descripción</th>
              }
              <th class="p-4 border-b border-slate-200 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (item of paginatedData(); track item.id) {
              <tr class="hover:bg-slate-50 transition-colors">
                @if (view() === 'exam') {
                  <td class="p-4 text-slate-400 font-mono text-sm font-bold">{{ item.code }}</td>
                  <td class="p-4">
                    <div class="font-semibold text-slate-700">{{ item.name }}</div>
                  </td>
                  <td class="p-4">
                     @if (item.profile_id) {
                        <div class="flex flex-col gap-1">
                           <span class="inline-flex items-center gap-1 text-xs font-bold text-[#1abc9c]">
                              {{ getProfileName(item.profile_id) }}
                           </span>
                           <span class="inline-flex items-center gap-1 text-[10px] text-indigo-400">
                              {{ getMethodologyName(item.profile_id) }}
                           </span>
                        </div>
                     } @else {
                        <span class="text-[10px] text-slate-300 italic">Independiente</span>
                     }
                  </td>
                  <td class="p-4 text-slate-600 text-sm">
                    <span class="block font-mono font-bold">{{ item.range }}</span>
                    <span class="block text-[10px] text-slate-400 uppercase">{{ item.unit }}</span>
                  </td>
                  <td class="p-4 text-slate-700 font-mono font-bold">Q{{ item.price | number:'1.2-2' }}</td>
                } @else if (view() === 'profile') {
                  <td class="p-4 font-semibold text-slate-700">{{ item.name }}</td>
                  <td class="p-4">
                    <span class="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold uppercase">
                      {{ getMethodologyNameRaw(item.methodology_id) }}
                    </span>
                  </td>
                  <td class="p-4 text-slate-500 text-sm">{{ item.description }}</td>
                } @else {
                  <td class="p-4 font-semibold text-slate-700">{{ item.name }}</td>
                  <td class="p-4 text-slate-500 text-sm">{{ item.description }}</td>
                }
                
                <td class="p-4">
                  <div class="flex justify-center gap-3">
                    <button (click)="onEdit(item)" class="w-8 h-8 rounded-full flex items-center justify-center bg-blue-50 text-[#3498db] hover:bg-[#3498db] hover:text-white transition-all shadow-sm" title="Editar">
                      <i class="fas fa-edit text-xs"></i>
                    </button>
                    <button (click)="onDelete(item.id)" class="w-8 h-8 rounded-full flex items-center justify-center bg-red-50 text-[#e74c3c] hover:bg-[#e74c3c] hover:text-white transition-all shadow-sm" title="Eliminar">
                      <i class="fas fa-trash-alt text-xs"></i>
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
               <tr>
                 <td colspan="6" class="p-8 text-center text-slate-400">
                    <div class="flex flex-col items-center">
                       <i class="fas fa-search text-3xl mb-2 text-slate-300"></i>
                       <p>No se encontraron registros.</p>
                    </div>
                 </td>
               </tr>
            }
          </tbody>
        </table>

        <!-- Pagination Controls -->
        <div class="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
           <button 
             (click)="prevPage()" 
             [disabled]="currentPage() === 1"
             class="px-4 py-2 bg-white border border-slate-300 text-slate-600 text-xs font-bold uppercase hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
             <i class="fas fa-chevron-left mr-1"></i> Anterior
           </button>
           
           <span class="text-xs font-bold text-slate-500">
              Página {{ currentPage() }} de {{ totalPages() || 1 }}
           </span>
           
           <button 
             (click)="nextPage()" 
             [disabled]="currentPage() >= totalPages()"
             class="px-4 py-2 bg-white border border-slate-300 text-slate-600 text-xs font-bold uppercase hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
             Siguiente <i class="fas fa-chevron-right ml-1"></i>
           </button>
        </div>
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
export class ExamsComponent {
  db = inject(DbService);
  private fb: FormBuilder = inject(FormBuilder);
  activeForm = signal<'none' | 'exam' | 'profile' | 'methodology'>('none');
  showForm = computed(() => this.activeForm() !== 'none');
  editingId = signal<string | null>(null);
  deleteConfirmation = { show: false, id: '' };

  // Search & Pagination State
  searchTerm = signal('');
  currentPage = signal(1);
  itemsPerPage = 10;

  methodologyForm = this.fb.group({
    name: ['', Validators.required],
    description: ['']
  });

  profileForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    methodology_id: ['', Validators.required]
  });

  examForm = this.fb.group({
    name: ['', Validators.required],
    code: ['', Validators.required],
    price: [null as number | null, [Validators.required, Validators.min(0)]],
    range: ['', Validators.required],
    unit: ['', Validators.required],
    description: [''],
    profile_id: [null as string | null]
  });

  view = signal<'exam' | 'profile' | 'methodology'>('exam');

  // Computed Filtered List
  filteredData = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const currentView = this.view();

    let list: any[] = [];
    if (currentView === 'exam') list = this.db.exams();
    else if (currentView === 'profile') list = this.db.profiles();
    else if (currentView === 'methodology') list = this.db.methodologies();

    if (!term) return list;

    return list.filter(item =>
      item.name.toLowerCase().includes(term) ||
      (item.code && item.code.toLowerCase().includes(term))
    );
  });

  // Computed Paginated List
  paginatedData = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredData().slice(start, end);
  });

  // Computed Total Pages
  totalPages = computed(() => {
    return Math.ceil(this.filteredData().length / this.itemsPerPage);
  });

  // --- Pagination Actions ---
  updateSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchTerm.set(val);
    this.currentPage.set(1); // Reset to first page on search
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(c => c + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(c => c - 1);
    }
  }
  // --------------------------

  openForm(type: 'exam' | 'profile' | 'methodology') {
    this.activeForm.set(type);
    this.editingId.set(null);
  }

  closeForm() {
    this.activeForm.set('none');
    this.resetState();
  }

  resetState() {
    this.editingId.set(null);
    this.examForm.reset();
    this.profileForm.reset();
    this.methodologyForm.reset();
  }

  onEdit(item: any) {
    const currentView = this.view();
    this.editingId.set(item.id);

    if (currentView === 'exam') {
      this.examForm.patchValue({
        name: item.name,
        code: item.code,
        price: item.price,
        range: item.range,
        unit: item.unit,
        description: item.description,
        profile_id: item.profile_id || null
      });
      this.activeForm.set('exam');
    } else if (currentView === 'profile') {
      this.profileForm.patchValue({
        name: item.name,
        description: item.description,
        methodology_id: item.methodology_id
      });
      this.activeForm.set('profile');
    } else if (currentView === 'methodology') {
      this.methodologyForm.patchValue({
        name: item.name,
        description: item.description
      });
      this.activeForm.set('methodology');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onDelete(id: string) {
    this.deleteConfirmation = { show: true, id };
  }

  cancelDelete() {
    this.deleteConfirmation = { show: false, id: '' };
  }

  async confirmDelete() {
    const { id } = this.deleteConfirmation;
    const currentView = this.view();

    if (currentView === 'exam') await this.db.deleteExam(id);
    else if (currentView === 'profile') await this.db.deleteProfile(id);
    else if (currentView === 'methodology') await this.db.deleteMethodology(id);

    this.cancelDelete();
  }

  editExam(exam: Exam) {
    this.onEdit(exam);
  }

  async saveMethodology() {
    if (this.methodologyForm.valid) {
      if (this.editingId()) {
        await this.db.updateMethodology(this.editingId()!, this.methodologyForm.value as any);
      } else {
        await this.db.addMethodology(this.methodologyForm.value as any);
      }
      this.closeForm();
    }
  }

  async saveProfile() {
    if (this.profileForm.valid) {
      if (this.editingId()) {
        await this.db.updateProfile(this.editingId()!, this.profileForm.value as any);
      } else {
        await this.db.addProfile(this.profileForm.value as any);
      }
      this.closeForm();
    }
  }

  getProfileName(profileId: string): string {
    const profile = this.db.profiles().find(p => p.id === profileId);
    return profile ? profile.name : 'N/A';
  }

  getMethodologyName(profileId: string): string {
    const profile = this.db.profiles().find(p => p.id === profileId);
    if (!profile) return 'N/A';
    const methodology = this.db.methodologies().find(m => m.id === profile.methodology_id);
    return methodology ? methodology.name : 'N/A';
  }

  getMethodologyNameRaw(methodologyId: string): string {
    const methodology = this.db.methodologies().find(m => m.id === methodologyId);
    return methodology ? methodology.name : 'N/A';
  }

  async onSubmit() {
    if (this.examForm.valid) {
      const formValue = this.examForm.value;

      if (this.editingId()) {
        this.db.updateExam(this.editingId()!, formValue as any);
      } else {
        const newExam: Exam = {
          id: '', // DB handles this
          ...formValue as any
        };
        this.db.addExam(newExam);
      }
      this.closeForm();
    }
  }
}
