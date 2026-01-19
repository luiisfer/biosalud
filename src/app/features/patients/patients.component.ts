
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DbService, Patient } from '../../../core/services/db.service';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-light text-slate-800">Gestión de Pacientes</h1>
        <button (click)="toggleForm()" class="bg-[#3498db] hover:bg-[#2980b9] text-white px-5 py-2 transition-colors flex items-center gap-2 font-medium">
          <i class="fas" [class.fa-plus]="!showForm()" [class.fa-times]="showForm()"></i>
          {{ showForm() ? 'Cerrar Formulario' : 'Agregar Paciente' }}
        </button>
      </div>

      @if (showForm()) {
        <div class="bg-white p-8 border border-slate-200 mb-8 animate-fade-in">
          <h2 class="text-lg font-bold mb-6 text-slate-700 border-b pb-2">
            {{ editingId() ? 'Editar Paciente' : 'Registrar Nuevo Paciente' }}
          </h2>
          <form [formGroup]="patientForm" (ngSubmit)="onSubmit()" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre Completo</label>
              <input formControlName="name" type="text" class="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#3498db] outline-none transition-colors text-slate-700">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-2">DPI (CUI)</label>
              <input formControlName="dpi" type="text" placeholder="Ej: 1234 56789 0101" class="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#3498db] outline-none transition-colors text-slate-700">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-2">NIT</label>
              <input formControlName="nit" type="text" placeholder="C/F o NIT" class="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#3498db] outline-none transition-colors text-slate-700">
            </div>
            <div>
               <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Género</label>
               <select formControlName="gender" class="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#3498db] outline-none transition-colors text-slate-700">
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
               </select>
            </div>
            <div>
               <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Fecha de Nacimiento</label>
               <input formControlName="birthDate" (change)="calculateAge($any($event).target.value)" type="date" class="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#3498db] outline-none transition-colors text-slate-700">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Edad</label>
              <input formControlName="age" type="number" readonly class="w-full p-3 bg-slate-100 border border-slate-200 text-slate-500 outline-none cursor-not-allowed">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Email</label>
              <input formControlName="email" type="email" class="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#3498db] outline-none transition-colors text-slate-700">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Teléfono</label>
              <input formControlName="phone" type="text" class="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#3498db] outline-none transition-colors text-slate-700">
            </div>
            <div>
               <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Médico (Opcional)</label>
               <input formControlName="doctor" type="text" placeholder="Nombre del médico" class="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#3498db] outline-none transition-colors text-slate-700">
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Historial Médico / Notas</label>
              <textarea formControlName="history" rows="3" class="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#3498db] outline-none transition-colors text-slate-700"></textarea>
            </div>
            <div class="md:col-span-2 flex justify-end">
               <button type="submit" [disabled]="patientForm.invalid" class="bg-[#1abc9c] text-white px-8 py-3 hover:bg-[#16a085] disabled:opacity-50 disabled:cursor-not-allowed font-bold uppercase text-sm tracking-wide transition-colors">
                 {{ editingId() ? 'Actualizar Paciente' : 'Guardar Paciente' }}
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
              placeholder="Buscar por Nombre o DPI..." 
              class="w-full pl-10 p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#3498db] outline-none transition-colors text-slate-700 rounded-sm">
         </div>
         <div class="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Mostrando {{ paginatedPatients().length }} de {{ filteredPatients().length }} registros
         </div>
      </div>

      <div class="bg-white border border-slate-200 overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[1000px]">
          <thead class="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                <tr>
              <th class="p-4 border-b border-slate-200">DPI</th>
              <th class="p-4 border-b border-slate-200">NIT</th>
              <th class="p-4 border-b border-slate-200">Nombre</th>
              <th class="p-4 border-b border-slate-200">Género</th>
              <th class="p-4 border-b border-slate-200">Edad</th>
              <th class="p-4 border-b border-slate-200">Contacto</th>
              <th class="p-4 border-b border-slate-200">Fecha Nac.</th>
              <th class="p-4 border-b border-slate-200">Auditoría</th>
              <th class="p-4 border-b border-slate-200">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (patient of paginatedPatients(); track patient.id) {
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-4 text-slate-600 font-mono text-sm">
                   <div class="font-bold">{{ patient.dpi }}</div>
                </td>
                <td class="p-4 text-slate-600 font-mono text-sm">
                   {{ patient.nit || 'C/F' }}
                </td>
                <td class="p-4 font-semibold text-slate-700">{{ patient.name }}</td>
                <td class="p-4 text-slate-600">
                  <span class="inline-flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-bold border"
                    [class.bg-blue-50]="patient.gender === 'Masculino'" [class.text-blue-600]="patient.gender === 'Masculino'" [class.border-blue-100]="patient.gender === 'Masculino'"
                    [class.bg-pink-50]="patient.gender === 'Femenino'" [class.text-pink-600]="patient.gender === 'Femenino'" [class.border-pink-100]="patient.gender === 'Femenino'">
                    <i class="fas" [class.fa-mars]="patient.gender === 'Masculino'" [class.fa-venus]="patient.gender === 'Femenino'"></i>
                    {{ patient.gender }}
                  </span>
                </td>
                <td class="p-4 text-slate-600">{{ patient.age }}</td>
                <td class="p-4 text-slate-600">
                  <div class="text-sm">{{ patient.email }}</div>
                  <div class="text-xs text-slate-400">{{ patient.phone }}</div>
                </td>
                <td class="p-4 text-slate-600 text-sm italic">{{ patient.birthDate || 'No reg.' }}</td>
                <td class="p-4">
                   <div class="flex flex-col text-[10px] text-slate-500 gap-1">
                      <div class="flex items-center gap-1" title="Creado por">
                        <i class="fas fa-plus-circle text-green-400"></i> {{ patient.createdBy || 'Sistema' }}
                      </div>
                      @if(patient.lastModifiedBy) {
                        <div class="flex items-center gap-1" title="Modificado por">
                           <i class="fas fa-pen text-blue-400"></i> {{ patient.lastModifiedBy }}
                        </div>
                      }
                   </div>
                </td>
                <td class="p-4">
                  <button (click)="editPatient(patient)" class="text-[#3498db] hover:text-[#2980b9] mr-4" title="Editar"><i class="fas fa-edit"></i></button>
                  <button (click)="viewHistory(patient)" class="text-[#1abc9c] hover:text-[#16a085]" title="Ver Historial de Resultados"><i class="fas fa-file-medical"></i></button>
                </td>
              </tr>
            } @empty {
               <tr>
                 <!-- Adjusted colspan to 8 because of removed column -->
                 <td colspan="8" class="p-8 text-center text-slate-400">
                    <div class="flex flex-col items-center">
                       <i class="fas fa-search text-3xl mb-2 text-slate-300"></i>
                       <p>No se encontraron pacientes con ese criterio.</p>
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

      <!-- HISTORY MODAL -->
      @if (selectedHistoryPatient()) {
        <div class="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
           <div class="bg-white max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 shadow-2xl rounded-sm">
              <!-- Modal Header -->
              <div class="bg-[#2c3e50] text-white p-6 flex justify-between items-center shrink-0">
                 <div>
                    <h3 class="text-lg font-bold flex items-center gap-2">
                       <i class="fas fa-history text-[#1abc9c]"></i> Historial de Resultados
                    </h3>
                    <p class="text-slate-400 text-sm mt-1">
                       {{ selectedHistoryPatient()?.name }} (DPI: {{ selectedHistoryPatient()?.dpi }})
                    </p>
                 </div>
                 <button (click)="closeHistory()" class="text-slate-400 hover:text-white transition-colors text-xl">
                    <i class="fas fa-times"></i>
                 </button>
              </div>

              <!-- Modal Body (Scrollable) -->
              <div class="flex-1 overflow-y-auto p-8 bg-slate-50">
                 @if (patientHistory().length === 0) {
                    <div class="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                       <i class="fas fa-microscope text-4xl mb-3 text-slate-300"></i>
                       <p class="font-medium">No hay resultados registrados para este paciente.</p>
                    </div>
                 } @else {
                    <div class="space-y-6">
                       @for (result of patientHistory(); track result.id) {
                          <div class="bg-white border border-slate-200 shadow-sm relative overflow-hidden group">
                             <!-- Status Bar -->
                             <div class="absolute left-0 top-0 bottom-0 w-1" 
                                [class.bg-green-400]="result.status === 'Finalizado'"
                                [class.bg-yellow-400]="result.status === 'Pendiente'">
                             </div>

                             <div class="p-5 pl-7">
                                <div class="flex justify-between items-start mb-4">
                                   <div>
                                      <h4 class="font-bold text-slate-800 text-lg">{{ result.testName }}</h4>
                                      <p class="text-xs text-slate-500 uppercase font-bold tracking-wide mt-1">
                                         <i class="far fa-calendar-alt mr-1"></i> {{ result.date | date:'dd/MM/yyyy' }}
                                      </p>
                                   </div>
                                   <span class="text-[10px] font-bold uppercase tracking-widest px-2 py-1 border rounded-sm"
                                      [class.text-green-600]="result.status === 'Finalizado'" [class.bg-green-50]="result.status === 'Finalizado'" [class.border-green-100]="result.status === 'Finalizado'"
                                      [class.text-yellow-600]="result.status === 'Pendiente'" [class.bg-yellow-50]="result.status === 'Pendiente'" [class.border-yellow-100]="result.status === 'Pendiente'">
                                      {{ result.status }}
                                   </span>
                                </div>

                                <!-- Values Section -->
                                <div class="bg-slate-50 p-4 border border-slate-100 rounded-sm text-sm font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
                                   {{ result.values }}
                                </div>

                                <!-- Interpretation if available -->
                                @if (result.interpretation) {
                                   <div class="mt-4 pt-4 border-t border-slate-100">
                                      <p class="text-xs font-bold text-slate-400 uppercase mb-1"><i class="fas fa-brain text-purple-400"></i> Interpretación IA</p>
                                      <p class="text-sm text-slate-600 italic">{{ result.interpretation }}</p>
                                   </div>
                                }
                                
                                <div class="mt-4 flex justify-between items-center text-xs text-slate-400">
                                   <div>
                                      Reg. por: {{ result.createdBy || 'Sistema' }}
                                   </div>
                                   <div>Orden: {{ result.orderNumber || 'S/N' }}</div>
                                </div>
                             </div>
                          </div>
                       }
                    </div>
                 }
              </div>

              <!-- Modal Footer -->
              <div class="p-4 bg-white border-t border-slate-200 flex justify-end shrink-0">
                 <button (click)="closeHistory()" class="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm uppercase transition-colors">
                    Cerrar
                 </button>
              </div>
           </div>
        </div>
      }
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
export class PatientsComponent {
  db = inject(DbService);
  private fb: FormBuilder = inject(FormBuilder);
  showForm = signal(false);
  editingId = signal<string | null>(null);

  // Search & Pagination State
  searchTerm = signal('');
  currentPage = signal(1);
  itemsPerPage = 10;

  // History State
  selectedHistoryPatient = signal<Patient | null>(null);

  // Computed Filtered List
  filteredPatients = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.db.patients();

    return this.db.patients().filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.dpi.includes(term) ||
      p.id.includes(term)
    );
  });

  // Computed Paginated List
  paginatedPatients = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredPatients().slice(start, end);
  });

  // Computed Total Pages
  totalPages = computed(() => {
    return Math.ceil(this.filteredPatients().length / this.itemsPerPage);
  });

  patientHistory = computed(() => {
    const patient = this.selectedHistoryPatient();
    if (!patient) return [];
    // Filter results for this patient and sort descending by date
    return this.db.labResults()
      .filter(r => r.patientId === patient.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  patientForm = this.fb.group({
    name: ['', Validators.required],
    dpi: ['', Validators.required],
    nit: [''],
    birthDate: ['', Validators.required],
    gender: ['Masculino', Validators.required],
    age: [{ value: null as number | null, disabled: true }, [Validators.required, Validators.min(0)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    doctor: [''],
    history: ['']
  });

  calculateAge(birthDateStr: string) {
    if (!birthDateStr) return;
    const birthDate = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    this.patientForm.patchValue({ age });
  }

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

  editPatient(patient: Patient) {
    this.editingId.set(patient.id);
    this.patientForm.patchValue({
      name: patient.name,
      dpi: patient.dpi,
      nit: patient.nit || '',
      birthDate: patient.birthDate || '',
      gender: patient.gender,
      age: patient.age,
      email: patient.email,
      phone: patient.phone,
      doctor: patient.doctor || '',
      history: patient.history
    });
    this.showForm.set(true);
    // Scroll to top to see the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- HISTORY ACTIONS ---
  viewHistory(patient: Patient) {
    this.selectedHistoryPatient.set(patient);
  }

  closeHistory() {
    this.selectedHistoryPatient.set(null);
  }
  // -----------------------

  resetState() {
    this.showForm.set(false);
    this.editingId.set(null);
    this.patientForm.reset({ gender: 'Masculino' });
  }

  onSubmit() {
    if (this.patientForm.valid) {
      const formValue = this.patientForm.getRawValue();
      if (this.editingId()) {
        // Update existing patient
        this.db.updatePatient(this.editingId()!, formValue as Partial<Patient>);
      } else {
        // Create new patient
        const newPatient: Patient = {
          id: Math.floor(Math.random() * 10000).toString(),
          ...formValue as any
        };
        this.db.addPatient(newPatient);
      }

      this.resetState();
    }
  }
}
