
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
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-light text-slate-800">Catálogo de Exámenes</h1>
        <button (click)="toggleForm()" class="bg-[#3498db] hover:bg-[#2980b9] text-white px-5 py-2 transition-colors flex items-center gap-2 font-medium">
          <i class="fas" [class.fa-plus]="!showForm()" [class.fa-times]="showForm()"></i>
          {{ showForm() ? 'Cerrar Formulario' : 'Agregar Examen' }}
        </button>
      </div>

      @if (showForm()) {
        <div class="bg-white p-8 border border-slate-200 mb-8 animate-fade-in">
          <h2 class="text-lg font-bold mb-6 text-slate-700 border-b pb-2">
            {{ editingId() ? 'Editar Examen' : 'Crear Nuevo Examen' }}
          </h2>
          <form [formGroup]="examForm" (ngSubmit)="onSubmit()" class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
         <div class="relative w-full md:w-1/2">
            <i class="fas fa-search absolute left-4 top-3.5 text-slate-400"></i>
            <input 
              (input)="updateSearch($event)" 
              type="text" 
              placeholder="Buscar por Nombre o Código..." 
              class="w-full pl-10 p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#3498db] outline-none transition-colors text-slate-700 rounded-sm">
         </div>
         <div class="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Mostrando {{ paginatedExams().length }} de {{ filteredExams().length }} registros
         </div>
      </div>

      <div class="bg-white border border-slate-200">
        <table class="w-full text-left border-collapse">
          <thead class="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
            <tr>
              <th class="p-4 border-b border-slate-200">Código</th>
              <th class="p-4 border-b border-slate-200">Nombre</th>
              <th class="p-4 border-b border-slate-200">Rango / Unidad</th>
              <th class="p-4 border-b border-slate-200">Descripción</th>
              <th class="p-4 border-b border-slate-200">Precio</th>
              <th class="p-4 border-b border-slate-200">Auditoría</th>
              <th class="p-4 border-b border-slate-200">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (exam of paginatedExams(); track exam.id) {
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-4 text-slate-400 font-mono text-sm font-bold">{{ exam.code }}</td>
                <td class="p-4 font-semibold text-slate-700">{{ exam.name }}</td>
                <td class="p-4 text-slate-600 text-sm">
                  <span class="block font-mono">{{ exam.range }}</span>
                  <span class="block text-xs text-slate-400">{{ exam.unit }}</span>
                </td>
                <td class="p-4 text-slate-600 text-sm max-w-md truncate">{{ exam.description }}</td>
                <td class="p-4 text-slate-700 font-mono font-bold">Q{{ exam.price | number:'1.2-2' }}</td>
                <td class="p-4">
                   <div class="flex flex-col text-[10px] text-slate-500 gap-1">
                      <div class="flex items-center gap-1" title="Creado por">
                        <i class="fas fa-plus-circle text-green-400"></i> {{ exam.createdBy || 'Sistema' }}
                      </div>
                      @if(exam.lastModifiedBy) {
                        <div class="flex items-center gap-1" title="Modificado por">
                           <i class="fas fa-pen text-blue-400"></i> {{ exam.lastModifiedBy }}
                        </div>
                      }
                   </div>
                </td>
                <td class="p-4">
                  <button (click)="editExam(exam)" class="text-[#3498db] hover:text-[#2980b9] mr-4" title="Editar">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="text-[#e74c3c] hover:text-[#c0392b]" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
                </td>
              </tr>
            } @empty {
               <tr>
                 <td colspan="7" class="p-8 text-center text-slate-400">
                    <div class="flex flex-col items-center">
                       <i class="fas fa-flask text-3xl mb-2 text-slate-300"></i>
                       <p>No se encontraron exámenes con ese criterio.</p>
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
  showForm = signal(false);
  editingId = signal<string | null>(null);

  // Search & Pagination State
  searchTerm = signal('');
  currentPage = signal(1);
  itemsPerPage = 10;

  examForm = this.fb.group({
    name: ['', Validators.required],
    code: ['', Validators.required],
    price: [null as number | null, [Validators.required, Validators.min(0)]],
    range: ['', Validators.required],
    unit: ['', Validators.required],
    description: ['']
  });

  // Computed Filtered List
  filteredExams = computed(() => {
     const term = this.searchTerm().toLowerCase();
     if (!term) return this.db.exams();
     
     return this.db.exams().filter(e => 
        e.name.toLowerCase().includes(term) || 
        e.code.toLowerCase().includes(term)
     );
  });

  // Computed Paginated List
  paginatedExams = computed(() => {
     const start = (this.currentPage() - 1) * this.itemsPerPage;
     const end = start + this.itemsPerPage;
     return this.filteredExams().slice(start, end);
  });

  // Computed Total Pages
  totalPages = computed(() => {
     return Math.ceil(this.filteredExams().length / this.itemsPerPage);
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

  toggleForm() {
    if (this.showForm()) {
        this.resetState();
    } else {
        this.showForm.set(true);
    }
  }

  resetState() {
    this.showForm.set(false);
    this.editingId.set(null);
    this.examForm.reset();
  }

  editExam(exam: Exam) {
    this.editingId.set(exam.id);
    this.examForm.patchValue({
      name: exam.name,
      code: exam.code,
      price: exam.price,
      range: exam.range,
      unit: exam.unit,
      description: exam.description
    });
    this.showForm.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onSubmit() {
    if (this.examForm.valid) {
      const formValue = this.examForm.value;

      if (this.editingId()) {
        // Update existing
        this.db.updateExam(this.editingId()!, formValue as any);
      } else {
        // Create new
        const newExam: Exam = {
          id: Math.floor(Math.random() * 10000).toString(),
          ...formValue as any
        };
        this.db.addExam(newExam);
      }
      
      this.resetState();
    }
  }
}
