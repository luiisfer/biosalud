
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { DbService, LabResult, Patient, Exam } from '../../../core/services/db.service';

@Component({
   selector: 'app-results',
   standalone: true,
   imports: [CommonModule, ReactiveFormsModule],
   template: `
    <div>
      <h1 class="text-2xl font-light text-slate-800 mb-6">Gestión de Resultados</h1>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <!-- LEFT COLUMN: Patient Search & Context (4 cols) -->
        <div class="lg:col-span-4 space-y-6">
          
          <!-- Search Box (For Adding New Result) -->
          <div class="bg-white p-6 border border-slate-200">
             <h2 class="text-xs font-bold text-slate-500 uppercase mb-4">Buscar Paciente</h2>
             <div class="relative">
               <i class="fas fa-search absolute left-4 top-3.5 text-slate-400"></i>
               <input 
                 [formControl]="searchControl" 
                 (input)="updateSearch($event)"
                 type="text" 
                 placeholder="Nombre o DPI..." 
                 class="w-full pl-10 p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#3498db] outline-none transition-colors text-slate-700">
             </div>

             @if (searchTerm() && filteredPatients().length > 0) {
               <div class="mt-4 space-y-2 max-h-60 overflow-y-auto">
                 @for (patient of filteredPatients(); track patient.id) {
                   <div (click)="selectPatient(patient)" 
                     class="p-3 border border-slate-100 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors flex justify-between items-center group">
                      <div>
                        <div class="font-bold text-slate-700 group-hover:text-blue-700">{{ patient.name }}</div>
                        <div class="text-xs text-slate-400">DPI: {{ patient.dpi }}</div>
                      </div>
                      <i class="fas fa-chevron-right text-slate-300 group-hover:text-blue-400"></i>
                   </div>
                 }
               </div>
             }
          </div>

          <!-- Patient Profile Card (If Selected) -->
          @if (selectedPatient(); as p) {
            <div class="bg-white p-0 border border-slate-200 animate-fade-in overflow-hidden">
               <div class="bg-[#2c3e50] p-4 text-white flex justify-between items-center">
                 <span class="font-bold text-lg">Paciente Actual</span>
                 <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
               </div>
               <div class="p-6">
                  <div class="flex items-center gap-4 mb-6">
                    <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-2xl text-slate-400">
                      <i class="fas fa-user"></i>
                    </div>
                    <div>
                      <h3 class="text-xl font-bold text-slate-800">{{ p.name }}</h3>
                      <p class="text-sm text-slate-500">{{ p.age }} años • {{ p.phone }}</p>
                    </div>
                  </div>
                  <div class="text-sm border-t border-slate-100 pt-4 mb-6">
                     <p class="text-slate-400 text-xs uppercase font-bold mb-1">Historial Clínico</p>
                     <p class="text-slate-700 italic">{{ p.history || 'Sin antecedentes registrados.' }}</p>
                  </div>
                  
                  <button (click)="clearSelection()" class="w-full py-2 border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-red-500 transition-colors text-xs font-bold uppercase tracking-wider flex justify-center items-center gap-2">
                    <i class="fas fa-times"></i> Cambiar Paciente
                  </button>
               </div>
            </div>
          }
        </div>

        <!-- RIGHT COLUMN: Actions & History (8 cols) -->
        <div class="lg:col-span-8">
          
          @if (selectedPatient()) {
             <!-- FORM: Add New Result -->
             <div class="bg-white p-8 border border-slate-200 mb-8 animate-fade-in relative overflow-hidden">
                <div class="absolute top-0 left-0 w-1 h-full bg-[#3498db]"></div>
                
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-lg font-bold text-slate-700 flex items-center gap-2">
                       <i class="fas fa-flask text-[#3498db]"></i> Ingresar Nuevo Resultado
                    </h2>
                </div>
                
                <form [formGroup]="resultForm" (ngSubmit)="addToQueue()" class="space-y-6">
                   <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      <!-- REPLACED SELECT WITH SEARCHABLE AUTOCOMPLETE -->
                      <div class="relative">
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Examen Realizado</label>
                        
                        <!-- Search Input -->
                        <div class="relative">
                           <input 
                              [formControl]="examSearchControl"
                              (focus)="showExamDropdown.set(true)"
                              (input)="updateExamSearch($event)"
                              (blur)="onExamBlur()"
                              type="text" 
                              placeholder="Buscar examen por nombre o código..." 
                              class="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#3498db] outline-none text-slate-700 transition-colors"
                              [class.border-red-300]="resultForm.get('examId')?.invalid && resultForm.get('examId')?.touched"
                           >
                           @if(selectedExamId()) {
                             <button type="button" (click)="clearExamSelection()" class="absolute right-3 top-3 text-slate-400 hover:text-red-500">
                                <i class="fas fa-times"></i>
                             </button>
                           } @else {
                             <i class="fas fa-search absolute right-3 top-3.5 text-slate-300 pointer-events-none"></i>
                           }
                        </div>

                        <!-- Dropdown List -->
                        @if (showExamDropdown() && filteredExamList().length > 0) {
                           <div class="absolute z-20 w-full mt-1 bg-white border border-slate-200 shadow-lg max-h-60 overflow-y-auto rounded-sm animate-fade-in">
                              @for (exam of filteredExamList(); track exam.id) {
                                 <div (mousedown)="selectExamFromSearch(exam)" class="p-3 border-b border-slate-50 hover:bg-blue-50 cursor-pointer transition-colors group">
                                    <div class="flex justify-between">
                                       <span class="font-bold text-slate-700 group-hover:text-[#3498db]">{{ exam.name }}</span>
                                       <span class="text-xs font-mono text-slate-400 bg-slate-100 px-1 rounded">{{ exam.code }}</span>
                                    </div>
                                    @if(exam.unit) {
                                      <div class="text-xs text-slate-500 mt-1">Unidad: {{ exam.unit }}</div>
                                    }
                                 </div>
                              }
                           </div>
                        }
                      </div>
                      
                      <div>
                         <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Fecha del Análisis</label>
                         <input type="date" class="w-full p-3 bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed" [value]="todayDate" disabled>
                      </div>
                   </div>

                   <div>
                      <div class="flex justify-between items-end mb-2">
                         <label class="block text-xs font-bold text-slate-500 uppercase">Valores Obtenidos</label>
                      </div>

                      <!-- Reference Range Hint -->
                      @if (currentExam(); as exam) {
                         <div class="bg-blue-50 border border-blue-100 p-3 mb-2 rounded-sm text-sm text-blue-800 flex items-start gap-2 animate-fade-in">
                            <i class="fas fa-info-circle mt-0.5"></i>
                            <div>
                               <div class="font-bold text-xs uppercase tracking-wide opacity-80">Referencia</div>
                               <div>Rango esperado: <span class="font-mono font-bold">{{ exam.range }}</span></div>
                               @if(exam.unit) { <div class="text-xs">Unidad: {{ exam.unit }}</div> }
                               @if(exam.description) { <div class="text-xs mt-1 italic text-blue-600">{{ exam.description }}</div> }
                            </div>
                         </div>
                      }

                      <textarea formControlName="values" rows="4" placeholder="Ej: 110" class="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#3498db] outline-none transition-colors text-slate-700 font-mono"></textarea>
                   </div>

                   <div class="flex justify-end gap-3 border-t border-slate-100 pt-4">
                      <button type="button" (click)="resetForm()" class="px-6 py-3 text-slate-500 hover:text-slate-800 transition-colors font-medium text-sm flex items-center gap-2">
                        <i class="fas fa-eraser"></i> Limpiar
                      </button>
                      <button type="submit" [disabled]="resultForm.invalid" class="bg-white border-2 border-[#3498db] text-[#3498db] px-8 py-3 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed font-bold uppercase text-sm tracking-wide transition-colors flex items-center gap-2 shadow-sm">
                         <i class="fas fa-plus-circle"></i> Agregar a la Cola
                      </button>
                   </div>
                </form>
             </div>

             <!-- STAGED RESULTS (Batch List) -->
             @if (stagedResults().length > 0) {
               <div class="bg-[#f8fafc] p-8 border border-slate-200 border-l-4 border-l-[#27ae60] mb-8 animate-fade-in shadow-md">
                 <div class="flex justify-between items-center mb-6">
                    <div>
                      <h3 class="text-lg font-bold text-slate-700 flex items-center gap-2">
                        <i class="fas fa-list-check text-[#27ae60]"></i> Resultados Pendientes de Guardar
                      </h3>
                      <p class="text-sm text-slate-500">Estos exámenes se consolidarán en un único reporte.</p>
                    </div>
                    <span class="bg-[#27ae60] text-white px-3 py-1 rounded-full text-xs font-bold">{{ stagedResults().length }} ítems</span>
                 </div>

                 <div class="space-y-3 mb-6">
                    @for (item of stagedResults(); track $index) {
                       <div class="bg-white p-4 border border-slate-200 flex justify-between items-start shadow-sm">
                          <div>
                             <div class="font-bold text-slate-700">{{ item.testName }}</div>
                             <div class="text-xs text-slate-500 font-mono mt-1">{{ item.values }}</div>
                          </div>
                          <button (click)="removeStaged($index)" class="text-red-400 hover:text-red-600 p-1" title="Quitar de la lista">
                             <i class="fas fa-trash-alt"></i>
                          </button>
                       </div>
                    }
                 </div>

                 <div class="flex justify-end">
                    <button (click)="finalizeBatch()" [disabled]="isProcessing()" class="bg-[#27ae60] text-white px-8 py-4 hover:bg-[#219150] font-bold uppercase text-sm tracking-wide transition-colors flex items-center gap-2 shadow-sm w-full md:w-auto justify-center">
                       @if (isProcessing()) { 
                          <i class="fas fa-circle-notch fa-spin"></i> Procesando Reporte... 
                       } @else {
                          <i class="fas fa-file-pdf"></i> Guardar y Generar PDF Unificado
                       }
                    </button>
                 </div>
               </div>
             }
          } @else {
             <!-- Empty State / Dashboard of Results -->
             <div class="bg-white p-8 border border-slate-200 mb-8 flex flex-col items-center justify-center text-center h-64 border-dashed border-2">
                <i class="fas fa-search text-4xl text-slate-300 mb-4"></i>
                <h3 class="text-lg font-medium text-slate-600">Comenzar Ingreso</h3>
                <p class="text-slate-400 text-sm max-w-sm mt-2">Busque y seleccione un paciente en el panel izquierdo para ingresar nuevos resultados de laboratorio.</p>
             </div>
          }

          <!-- List of Recent Results (Historical Context) -->
          <div class="bg-white border border-slate-200">
             <div class="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div class="flex items-center gap-4 w-full md:w-auto">
                    <h3 class="font-bold text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap">Historial de Resultados</h3>
                    <div class="text-xs text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-sm">Total: {{ filteredHistory().length }}</div>
                </div>
                
                <!-- History Search Bar -->
                <div class="relative w-full md:w-64">
                   <i class="fas fa-search absolute left-3 top-2.5 text-slate-400 text-xs"></i>
                   <input 
                     (input)="updateHistorySearch($event)" 
                     type="text" 
                     placeholder="Buscar por Paciente, Examen..." 
                     class="w-full pl-8 p-2 bg-white border border-slate-200 focus:border-[#3498db] outline-none text-xs text-slate-700 transition-colors rounded-sm shadow-sm">
                </div>
             </div>
             
             <!-- TABLE LAYOUT -->
             <div class="overflow-x-auto">
               <table class="w-full text-left border-collapse">
                 <thead class="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                   <tr>
                     <th class="p-4 border-b border-slate-200">Fecha</th>
                     <th class="p-4 border-b border-slate-200">Examen</th>
                     <th class="p-4 border-b border-slate-200">Paciente</th>
                     <th class="p-4 border-b border-slate-200">Resumen de Valores</th>
                     <th class="p-4 border-b border-slate-200">Auditoría</th>
                     <th class="p-4 border-b border-slate-200 text-right">Acciones</th>
                   </tr>
                 </thead>
                 <tbody class="divide-y divide-slate-100">
                   @for (res of paginatedHistory(); track res.id) {
                     <tr class="hover:bg-slate-50 transition-colors group">
                       <td class="p-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                         {{ res.date }}
                       </td>
                       <td class="p-4 font-bold text-slate-700">
                         {{ res.testName }}
                       </td>
                       <td class="p-4 text-slate-600 text-sm">
                         {{ getPatientName(res.patientId) }}
                       </td>
                       <td class="p-4 text-xs font-mono text-slate-500 max-w-[200px] truncate" title="{{ res.values }}">
                         {{ res.values }}
                       </td>
                       <td class="p-4">
                           <div class="flex flex-col text-[10px] text-slate-500 gap-1">
                              <div class="flex items-center gap-1" title="Creado por">
                                <i class="fas fa-plus-circle text-green-400"></i> {{ res.createdBy || 'Sistema' }}
                              </div>
                              @if(res.lastModifiedBy) {
                                <div class="flex items-center gap-1" title="Modificado por">
                                   <i class="fas fa-pen text-blue-400"></i> {{ res.lastModifiedBy }}
                                </div>
                              }
                           </div>
                       </td>
                       <td class="p-4">
                         <div class="flex gap-2 justify-end">
                           <!-- Email Button hidden per user request -->
                           <!-- <button (click)="openEmailModal(res)" class="text-slate-500 text-[10px] font-bold uppercase border border-slate-200 px-3 py-1.5 hover:bg-slate-600 hover:text-white transition-colors rounded-sm flex items-center gap-1" title="Enviar por Correo">
                               <i class="fas fa-envelope"></i>
                           </button> -->

                           <!-- View PDF Button -->
                           <button (click)="generatePdf(res, 'view')" class="text-blue-500 text-[10px] font-bold uppercase border border-blue-200 px-3 py-1.5 hover:bg-blue-500 hover:text-white transition-colors rounded-sm flex items-center gap-1" title="Ver Reporte">
                               <i class="fas fa-eye"></i> Ver
                           </button>

                           <!-- Download PDF Button -->
                           <button (click)="generatePdf(res, 'download')" class="text-red-500 text-[10px] font-bold uppercase border border-red-200 px-3 py-1.5 hover:bg-red-500 hover:text-white transition-colors rounded-sm flex items-center gap-1" title="Descargar Reporte PDF">
                               <i class="fas fa-file-pdf"></i> PDF
                           </button>
                         </div>
                       </td>
                     </tr>
                   } @empty {
                      <tr>
                        <td colspan="6" class="p-8 text-center text-slate-400">
                           <div class="flex flex-col items-center">
                              <i class="fas fa-search text-2xl mb-2 text-slate-300"></i>
                              <p class="text-xs">No se encontraron resultados.</p>
                           </div>
                        </td>
                      </tr>
                   }
                 </tbody>
               </table>
             </div>

             <!-- Pagination Controls -->
             <div class="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                <button 
                  (click)="prevHistoryPage()" 
                  [disabled]="historyPage() === 1"
                  class="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 text-[10px] font-bold uppercase hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-sm">
                  <i class="fas fa-chevron-left mr-1"></i> Anterior
                </button>
                
                <span class="text-[10px] font-bold text-slate-500">
                   Página {{ historyPage() }} de {{ historyTotalPages() || 1 }}
                </span>
                
                <button 
                  (click)="nextHistoryPage()" 
                  [disabled]="historyPage() >= historyTotalPages()"
                  class="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 text-[10px] font-bold uppercase hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-sm">
                  Siguiente <i class="fas fa-chevron-right ml-1"></i>
                </button>
             </div>
          </div>

        </div>
      </div>

      <!-- EMAIL CONFIRMATION MODAL -->
      @if (showEmailModal()) {
        <div class="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
           <div class="bg-white max-w-md w-full border border-slate-200 shadow-2xl flex flex-col rounded-sm">
              <div class="bg-[#2c3e50] text-white p-5 flex justify-between items-center">
                 <h3 class="font-bold text-lg flex items-center gap-2">
                    <i class="fas fa-envelope-open-text text-[#3498db]"></i> Confirmar Envío
                 </h3>
                 <button (click)="closeEmailModal()" class="text-slate-400 hover:text-white transition-colors">
                    <i class="fas fa-times text-xl"></i>
                 </button>
              </div>
              <div class="p-6 text-center">
                 <div class="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#3498db] text-2xl">
                    <i class="fas fa-paper-plane"></i>
                 </div>
                 
                 <h4 class="font-bold text-slate-800 mb-2">Enviar Resultados por Correo</h4>
                 <p class="text-sm text-slate-500 mb-6">
                    Se enviará el reporte PDF del examen <span class="font-bold text-slate-700">{{ resultToEmail()?.testName }}</span> a la dirección registrada:
                 </p>
                 
                 <div class="bg-slate-50 border border-slate-200 p-3 mb-6 rounded-sm">
                    <p class="font-mono text-sm font-bold text-slate-700">{{ emailTarget()?.email }}</p>
                    <p class="text-xs text-slate-400 mt-1">Paciente: {{ emailTarget()?.name }}</p>
                 </div>

                 @if(emailStatus() === 'sending') {
                    <div class="text-[#3498db] font-bold text-sm animate-pulse">
                       <i class="fas fa-circle-notch fa-spin mr-2"></i> Conectando con servidor de correo...
                    </div>
                 }
                 @if(emailStatus() === 'success') {
                    <div class="text-green-600 font-bold text-sm">
                       <i class="fas fa-check-circle mr-2"></i> ¡Correo enviado exitosamente!
                    </div>
                 }
              </div>
              
              <div class="p-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                 <button (click)="closeEmailModal()" [disabled]="emailStatus() === 'sending'" class="px-4 py-2 text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors">Cancelar</button>
                 <button (click)="confirmSendEmail()" [disabled]="emailStatus() === 'sending' || emailStatus() === 'success'" class="bg-[#3498db] text-white px-6 py-2 hover:bg-[#2980b9] disabled:opacity-50 disabled:cursor-not-allowed font-bold uppercase text-xs tracking-wide transition-colors shadow-sm flex items-center gap-2">
                    Enviar PDF
                 </button>
              </div>
           </div>
        </div>
      }

    </div>
  `,
   styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
  `]
})
export class ResultsComponent {
   db = inject(DbService);
   fb: FormBuilder = inject(FormBuilder);

   // Left Column State (New Entry)
   searchControl = new FormControl('');
   searchTerm = signal('');
   selectedPatient = signal<Patient | null>(null);
   selectedExamId = signal<string>('');
   stagedResults = signal<LabResult[]>([]);
   isProcessing = signal(false);
   successMessage = signal(false);

   // AutoComplete Exam State
   examSearchControl = new FormControl('');
   showExamDropdown = signal(false);
   examSearchTerm = signal('');

   // Right Column State (History Table)
   historySearchTerm = signal('');
   historyPage = signal(1);
   historyItemsPerPage = 10;

   // Email Modal State
   showEmailModal = signal(false);
   emailTarget = signal<Patient | null>(null);
   resultToEmail = signal<LabResult | null>(null);
   emailStatus = signal<'idle' | 'sending' | 'success'>('idle');

   resultForm = this.fb.group({
      examId: ['', Validators.required],
      values: ['', Validators.required]
   });

   todayDate = new Date().toISOString().split('T')[0];

   // --- COMPUTED FOR NEW ENTRY ---
   filteredPatients = computed(() => {
      const term = this.searchTerm().toLowerCase();
      if (!term) return [];
      return this.db.patients().filter(p =>
         p.name.toLowerCase().includes(term) ||
         p.dpi.includes(term)
      );
   });

   filteredExamList = computed(() => {
      const term = this.examSearchTerm().toLowerCase();
      return this.db.exams().filter(e =>
         e.name.toLowerCase().includes(term) ||
         e.code.toLowerCase().includes(term)
      );
   });

   currentExam = computed(() => {
      const id = this.selectedExamId();
      if (!id) return null;
      return this.db.exams().find(e => e.id === id);
   });

   // --- COMPUTED FOR HISTORY TABLE ---
   sortedResults = computed(() => {
      return [...this.db.labResults()].reverse();
   });

   filteredHistory = computed(() => {
      const term = this.historySearchTerm().toLowerCase();
      const list = this.sortedResults();

      if (!term) return list;

      return list.filter(res => {
         const patientName = this.getPatientName(res.patientId).toLowerCase();
         const testName = res.testName.toLowerCase();
         const date = res.date.toLowerCase();
         return patientName.includes(term) || testName.includes(term) || date.includes(term);
      });
   });

   paginatedHistory = computed(() => {
      const start = (this.historyPage() - 1) * this.historyItemsPerPage;
      const end = start + this.historyItemsPerPage;
      return this.filteredHistory().slice(start, end);
   });

   historyTotalPages = computed(() => {
      return Math.ceil(this.filteredHistory().length / this.historyItemsPerPage);
   });
   // ---------------------------------

   // --- ACTIONS ---
   updateSearch(event: Event) {
      const val = (event.target as HTMLInputElement).value;
      this.searchTerm.set(val);
   }

   updateExamSearch(event: Event) {
      const val = (event.target as HTMLInputElement).value;
      this.examSearchTerm.set(val);
      this.showExamDropdown.set(true);
   }

   updateHistorySearch(event: Event) {
      const val = (event.target as HTMLInputElement).value;
      this.historySearchTerm.set(val);
      this.historyPage.set(1); // Reset to first page
   }

   nextHistoryPage() {
      if (this.historyPage() < this.historyTotalPages()) {
         this.historyPage.update(p => p + 1);
      }
   }

   prevHistoryPage() {
      if (this.historyPage() > 1) {
         this.historyPage.update(p => p - 1);
      }
   }

   // --- Exam Autocomplete Logic ---
   selectExamFromSearch(exam: Exam) {
      this.selectedExamId.set(exam.id);
      this.resultForm.get('examId')?.setValue(exam.id);
      this.examSearchControl.setValue(exam.name);
      this.examSearchTerm.set(exam.name); // Keep sync
      this.showExamDropdown.set(false);
   }

   clearExamSelection() {
      this.selectedExamId.set('');
      this.resultForm.get('examId')?.setValue('');
      this.examSearchControl.setValue('');
      this.examSearchTerm.set('');
      this.showExamDropdown.set(false);
   }

   onExamBlur() {
      setTimeout(() => {
         this.showExamDropdown.set(false);
      }, 200);
   }

   // -------------------------------

   selectPatient(p: Patient) {
      this.selectedPatient.set(p);
      this.searchControl.setValue('');
      this.searchTerm.set('');
      this.resetForm();
      this.stagedResults.set([]); // Clear stage when changing patient
   }

   resetForm() {
      this.resultForm.reset();
      this.selectedExamId.set('');
      this.examSearchControl.setValue('');
      this.examSearchTerm.set('');
   }

   clearSelection() {
      this.selectedPatient.set(null);
      this.resetForm();
      this.stagedResults.set([]);
   }

   getPatientName(id: string): string {
      return this.db.patients().find(p => p.id === id)?.name || 'Desconocido';
   }

   // --- EMAIL ACTIONS ---

   openEmailModal(res: LabResult) {
      const patient = this.db.patients().find(p => p.id === res.patientId);
      if (!patient) {
         alert('Error: Paciente no encontrado.');
         return;
      }
      if (!patient.email || patient.email.trim() === '') {
         alert('El paciente no tiene un correo electrónico registrado.');
         return;
      }

      this.emailTarget.set(patient);
      this.resultToEmail.set(res);
      this.emailStatus.set('idle');
      this.showEmailModal.set(true);
   }

   closeEmailModal() {
      this.showEmailModal.set(false);
      this.emailTarget.set(null);
      this.resultToEmail.set(null);
   }

   async confirmSendEmail() {
      const patient = this.emailTarget();
      const result = this.resultToEmail();

      if (!patient || !result) return;

      this.emailStatus.set('sending');

      const success = await this.db.sendResultEmail(patient.email, patient.name, result);

      if (success) {
         this.emailStatus.set('success');
         setTimeout(() => {
            this.closeEmailModal();
         }, 2000);
      } else {
         alert('Error al enviar el correo. Verifique la conexión con la función Backend.');
         this.emailStatus.set('idle');
      }
   }


   // --- BATCH LOGIC START ---

   addToQueue() {
      if (this.resultForm.invalid || !this.selectedPatient()) return;

      const formVal = this.resultForm.value;
      const exam = this.db.exams().find(e => e.id === formVal.examId);

      if (!exam) return;

      const newResult: LabResult = {
         id: Math.floor(Math.random() * 100000).toString(),
         patientId: this.selectedPatient()!.id,
         testName: exam.name,
         date: this.todayDate,
         values: formVal.values!,
         status: 'Pendiente'
      };

      this.stagedResults.update(list => [...list, newResult]);
      this.resetForm();
   }

   removeStaged(index: number) {
      this.stagedResults.update(list => list.filter((_, i) => i !== index));
   }

   async finalizeBatch() {
      if (this.stagedResults().length === 0) return;

      this.isProcessing.set(true);

      const uniqueTests = [...new Set(this.stagedResults().map(r => r.testName))];
      const combinedName = uniqueTests.length > 1
         ? `Panel Integral (${uniqueTests.length} Exámenes)`
         : (uniqueTests[0] || 'Resultado General');

      let combinedValues = "";
      this.stagedResults().forEach((res, index) => {
         const examDef = this.db.exams().find(e => e.name === res.testName);
         const rangeStr = examDef ? examDef.range : 'No especificado';
         const unitStr = examDef ? examDef.unit : '';

         combinedValues += `► ${res.testName.toUpperCase()}\n`;
         combinedValues += `   Rango Ref: ${rangeStr}\n`;
         combinedValues += `   Unidad:    ${unitStr}\n`;
         combinedValues += `   Valor:     ${res.values}\n`;

         if (index < this.stagedResults().length - 1) {
            combinedValues += `\n`;
         }
      });

      const newResult: LabResult = {
         id: Math.floor(Math.random() * 100000).toString(),
         patientId: this.selectedPatient()!.id,
         testName: combinedName,
         date: this.todayDate,
         values: combinedValues,
         status: 'Finalizado'
      };

      this.db.addLabResult(newResult);

      const savedResult = this.db.labResults()[0];
      if (savedResult) {
         this.generatePdf(savedResult, 'download');
      }

      this.isProcessing.set(false);
      this.stagedResults.set([]);
      this.selectedPatient.set(null);
      this.successMessage.set(true);
      setTimeout(() => this.successMessage.set(false), 3000);
   }

   // --- BATCH LOGIC END ---

   generatePdf(res: LabResult, mode: 'view' | 'download' = 'download') {
      const patient = this.db.patients().find(p => p.id === res.patientId);
      if (!patient) return;

      const printWindow = window.open('', '', 'width=900,height=1100');
      if (!printWindow) return;

      // Check for signature
      const rawSig = this.db.labSignature();
      const sigImage = typeof rawSig === 'string' ? rawSig : null;

      const signatureHtml = sigImage
         ? `<img src="${sigImage}" style="height: 60px; display: block; margin: 0 auto 5px auto;" alt="Firma">`
         : `<div style="height:40px;"></div><span class="font-cursive text-xl text-slate-600 font-bold italic" style="font-family: 'Brush Script MT', cursive;">${res.createdBy || 'Bioquímico'}</span>`;

      // Only inject print script if downloading
      const printScript = mode === 'download'
         ? `<script>
            setTimeout(() => {
                window.print();
            }, 500);
         </script>`
         : '';

      // --- PARSING LOGIC FOR TABLE ---
      let tableRowsHtml = '';
      const resValuesStr = String(res.values || '');
      const lines = resValuesStr.split('\n');
      let currentTest = '';
      let currentRef = '';
      let currentUnit = '';
      let currentValue = '';

      const isFormatted = resValuesStr.includes('►') || resValuesStr.includes('Valor:');

      if (!isFormatted) {
         tableRowsHtml += `
          <tr>
             <td class="p-2 border border-slate-300 font-bold text-xs">${res.testName}</td>
             <td class="p-2 border border-slate-300 text-xs font-mono">${resValuesStr}</td>
             <td class="p-2 border border-slate-300 text-xs text-center">-</td>
             <td class="p-2 border border-slate-300 text-xs text-center">-</td>
          </tr>
        `;
      } else {
         for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            if (line.startsWith('►')) {
               currentTest = line.replace('►', '').trim();
               currentRef = '';
               currentUnit = '';
               currentValue = '';
            } else if (line.startsWith('Rango Ref:')) {
               currentRef = line.replace('Rango Ref:', '').trim();
            } else if (line.startsWith('Unidad:')) {
               currentUnit = line.replace('Unidad:', '').trim();
            } else if (line.startsWith('Valor:')) {
               currentValue = line.replace('Valor:', '').trim();

               tableRowsHtml += `
                  <tr>
                     <td class="p-2 border border-slate-400 font-bold text-xs text-slate-800">${currentTest}</td>
                     <td class="p-2 border border-slate-400 text-xs text-center font-bold text-slate-900">${currentValue}</td>
                     <td class="p-2 border border-slate-400 text-xs text-center text-slate-600">${currentRef}</td>
                     <td class="p-2 border border-slate-400 text-xs text-center text-slate-500">${currentUnit}</td>
                  </tr>
                `;
            }
         }
      }

      const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <title>Reporte BioSalud - ${patient.name}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            body { 
                padding: 40px; 
                font-family: 'Arial', sans-serif; 
                -webkit-print-color-adjust: exact; 
                background: white;
                max-width: 900px;
                margin: 0 auto;
            }
            .watermark {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                opacity: 0.05;
                z-index: -1;
                width: 400px;
            }
            @media print { 
                body { padding: 0; margin: 20px; }
                .no-print { display: none; } 
            }
        </style>
      </head>
      <body>
        
        <!-- Watermark (Heart Pulse SVG) -->
        <div class="watermark">
           <svg viewBox="0 0 512 512" fill="#000">
              <path d="M416 96c-44.2 0-80 35.8-80 80 0-44.2-35.8-80-80-80s-80 35.8-80 80c0-44.2-35.8-80-80-80S16 131.8 16 176c0 88.4 128 240 240 240s240-151.6 240-240c0-44.2-35.8-80-80-80z"/>
           </svg>
        </div>

        <!-- HEADER -->
        <div class="flex justify-between items-start mb-6">
           <!-- Logo Section -->
           <div class="flex flex-col items-center w-1/4">
              <!-- Custom BioSalud Logo SVG -->
              <svg width="80" height="80" viewBox="0 0 100 100" class="mb-2">
                 <path d="M50 90 C10 60 5 35 25 15 A20 20 0 0 1 50 35 A20 20 0 0 1 75 15 C95 35 90 60 50 90" fill="none" stroke="#1abc9c" stroke-width="3"/>
                 <path d="M20 50 L35 50 L45 30 L55 70 L65 50 L80 50" fill="none" stroke="#1abc9c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <div class="text-[#1abc9c] font-bold text-xs text-center leading-tight">
                 BioSalud<br>Huehuetenango
              </div>
              <div class="text-[8px] text-center text-slate-400 leading-tight mt-1">
                 Laboratorio Clínico, Nivel II<br>
                 Manzana G, Casa 24 Residenciales Valle
              </div>
           </div>

           <!-- Center Info -->
           <div class="text-center w-2/4 pt-2">
              <h1 class="font-bold text-xl text-slate-800 tracking-wide uppercase mb-1">Laboratorio Clínico BioSalud Huehuetenango</h1>
              <p class="text-xs text-slate-600 mb-1">Manzana G, Casa 24 Residenciales Valle del Quetzal Km. 28 zona 0,</p>
              <p class="text-xs text-slate-600 mb-1">San Juan Sacatepéquez, Guatemala</p>
              <p class="text-xs text-slate-800 font-bold mb-1">TEL: 4240-7376</p>
              <p class="text-xs text-slate-600 mb-2">e-mail: biosalud.lcb@gmail.com</p>
              
              <div class="mt-2">
                 <p class="text-sm font-bold text-slate-800">Licda. Yénnifer Soto</p>
                 <p class="text-xs text-slate-600">Química Bióloga, Colegiado No. 6,808</p>
              </div>
           </div>

           <!-- Spacer for alignment -->
           <div class="w-1/4"></div>
        </div>

        <!-- PATIENT INFO BOX -->
        <div class="border border-slate-800 rounded-2xl p-4 mb-8 text-sm">
           <div class="grid grid-cols-2 gap-x-8 gap-y-1">
              <div class="flex">
                 <span class="font-bold w-20">NOMBRE:</span>
                 <span class="uppercase">${patient.name}</span>
              </div>
              <div class="flex">
                 <span class="font-bold w-16">DPI.:</span>
                 <span>${patient.dpi}</span>
              </div>
              
              <div class="flex">
                 <span class="font-bold w-20">ORDEN:</span>
                 <span>${res.id}</span>
              </div>
              <div class="flex">
                 <span class="font-bold w-16">EDAD:</span>
                 <span>${patient.age} años</span>
              </div>

              <div class="flex">
                 <span class="font-bold w-20">FECHA:</span>
                 <span>${res.date}</span>
              </div>
              <div class="flex">
                 <span class="font-bold w-16">GENERO:</span>
                 <span>${patient.gender}</span>
              </div>

              <div class="col-span-2 flex">
                 <span class="font-bold w-20">MÉDICO:</span>
                 <span>${patient.doctor || 'Particular'}</span>
              </div>
           </div>
        </div>

        <!-- SECTION TITLE -->
        <div class="text-center font-bold text-lg uppercase mb-2 border-b border-transparent">
           ${res.testName.split(' ')[0] || 'RESULTADOS'} 
        </div>
        
        <!-- SUBTITLE (Exact Test Name) -->
        <div class="font-bold text-xs uppercase mb-4 pl-2">
           ${res.testName}
        </div>

        <!-- RESULTS TABLE -->
        <table class="w-full border-collapse border border-slate-400 mb-8">
           <thead>
              <tr>
                 <th class="border border-slate-400 p-2 text-xs uppercase bg-white">Estudio</th>
                 <th class="border border-slate-400 p-2 text-xs uppercase bg-white">Resultado</th>
                 <th class="border border-slate-400 p-2 text-xs uppercase bg-white">Referencia</th>
                 <th class="border border-slate-400 p-2 text-xs uppercase bg-white">Unidad</th>
              </tr>
           </thead>
           <tbody>
              ${tableRowsHtml}
           </tbody>
        </table>

        <!-- OBSERVATIONS -->
        <div class="mb-12">
           <h3 class="font-bold text-xs uppercase mb-2">Observaciones</h3>
           <div class="border border-slate-800 rounded-xl h-24 p-2"></div>
        </div>

        <!-- FOOTER & DISCLAIMER -->
        <div class="text-[10px] text-slate-500 text-justify leading-tight border-t border-slate-200 pt-4 mb-8">
           Nuestro proceso analítico completo se somete a rigurosos controles de calidad, utilizando herramientas estadísticas avanzadas para laboratorios clínicos. Esto garantiza la precisión y confiabilidad de todos nuestros resultados.
           <br><br>
           <span class="font-bold text-black">El original de este documento se encuentra en los archivos de Laboratorio BioSalud Huehuetenango. El uso de este documento es responsabilidad exclusiva del cliente.</span>
        </div>

        <!-- SIGNATURE -->
        <div class="flex justify-center mt-4">
           <div class="text-center w-64">
              <div class="border-b border-black mb-1 pb-1 flex flex-col items-center justify-end h-20">
                 ${signatureHtml}
              </div>
              <p class="font-bold text-xs text-slate-800">Licda. Yénnifer Soto</p>
              <p class="text-[10px] text-slate-600">Química Bióloga, Colegiado No. 6,808</p>
           </div>
        </div>

        ${printScript}
      </body>
      </html>
    `;

      printWindow.document.write(html);
      printWindow.document.close();
   }
}
