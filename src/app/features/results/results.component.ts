
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
        
        <!-- LEFT COLUMN: Patient Search & Context (3 cols) -->
        <div class="lg:col-span-3 space-y-6">
          
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

        <!-- RIGHT COLUMN: Actions & History (9 cols) -->
        <div class="lg:col-span-9">
          
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
          }
        </div>
      </div>

      <!-- List of Recent Results (Historical Context) - Now Full Width Below Modules -->
      <div class="bg-white border border-slate-200 mt-10 mb-10 shadow-sm animate-fade-in rounded-sm overflow-hidden">
         <div class="p-6 bg-slate-100 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
            <div class="flex items-center gap-4 w-full md:w-auto">
                <h3 class="font-bold text-slate-800 uppercase text-xs tracking-widest">Historial Completo de Resultados</h3>
                <div class="text-xs text-slate-500 font-bold bg-white px-3 py-1 border border-slate-200 rounded-full shadow-sm">Total: {{ filteredHistory().length }}</div>
            </div>
            
            <!-- History Search Bar -->
            <div class="relative w-full md:w-96">
               <i class="fas fa-search absolute left-4 top-3 text-slate-400"></i>
               <input 
                 (input)="updateHistorySearch($event)" 
                 type="text" 
                 placeholder="Buscar por Paciente, Examen, ID o Valor..." 
                 class="w-full pl-10 p-2.5 bg-white border border-slate-300 focus:border-[#3498db] outline-none text-sm text-slate-700 transition-all rounded-sm shadow-sm">
            </div>
         </div>
         
         <!-- TABLE LAYOUT -->
         <div class="overflow-x-auto">
           <table class="w-full text-left border-collapse">
              <thead class="bg-slate-50 text-slate-600 uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th class="p-6 border-b border-slate-200">Fecha</th>
                  <th class="p-6 border-b border-slate-200">Examen</th>
                  <th class="p-6 border-b border-slate-200">Paciente</th>
                  <th class="p-6 border-b border-slate-200">Resumen de Valores</th>
                  <th class="p-6 border-b border-slate-200">Auditoría</th>
                  <th class="p-6 border-b border-slate-200 text-right">Acciones</th>
                </tr>
              </thead>
             <tbody class="divide-y divide-slate-100 bg-white">
               @for (res of paginatedHistory(); track res.id) {
                  <tr class="hover:bg-blue-50/30 transition-colors group">
                    <td class="p-6 text-sm font-mono text-slate-500 whitespace-nowrap">
                      {{ formatDate(res.date) }}
                    </td>
                    <td class="p-6">
                      <div class="font-bold text-slate-800 text-base">{{ res.testName }}</div>
                    </td>
                    <td class="p-6">
                      <div class="text-slate-800 font-medium text-base">{{ getPatientName(res.patientId) }}</div>
                    </td>
                    <td class="p-6">
                       <div class="text-sm font-mono text-slate-600 max-w-[600px] overflow-hidden whitespace-normal break-words py-1 px-2 bg-slate-50 rounded border border-slate-100" title="{{ res.values }}">
                          {{ res.values }}
                       </div>
                    </td>
                    <td class="p-6">
                        <div class="flex flex-col text-xs text-slate-600 gap-1.5">
                           <div class="flex items-center gap-1.5" title="Creado por">
                             <i class="fas fa-plus-circle text-green-500"></i> {{ res.createdBy || 'Sistema' }}
                           </div>
                           @if(res.lastModifiedBy) {
                             <div class="flex items-center gap-1.5" title="Modificado por">
                                <i class="fas fa-pen text-blue-500"></i> {{ res.lastModifiedBy }}
                             </div>
                           }
                        </div>
                    </td>
                    <td class="p-6">
                      <div class="flex gap-2 justify-end">
                         <!-- Edit Button -->
                         <button (click)="editResult(res)" class="text-amber-600 text-xs font-bold uppercase border border-amber-300 px-4 py-2 hover:bg-amber-600 hover:text-white transition-all rounded shadow-sm flex items-center gap-2" title="Editar Resultado">
                             <i class="fas fa-edit"></i> Editar
                         </button>

                         <!-- Email Button -->
                         <button (click)="openEmailModal(res)" class="text-slate-600 text-xs font-bold uppercase border border-slate-300 px-4 py-2 hover:bg-slate-700 hover:text-white transition-all rounded shadow-sm flex items-center gap-2" title="Enviar por Correo">
                             <i class="fas fa-envelope"></i> Email
                         </button>

                         <!-- View PDF Button -->
                         <button (click)="generatePdf(res, 'view')" class="text-blue-600 text-xs font-bold uppercase border border-blue-300 px-4 py-2 hover:bg-blue-600 hover:text-white transition-all rounded shadow-sm flex items-center gap-2" title="Ver Reporte">
                            <i class="fas fa-eye"></i> Ver
                        </button>

                        <!-- Download PDF Button -->
                        <button (click)="generatePdf(res, 'download')" class="text-red-600 text-xs font-bold uppercase border border-red-300 px-4 py-2 hover:bg-red-600 hover:text-white transition-all rounded shadow-sm flex items-center gap-2" title="Descargar Reporte PDF">
                            <i class="fas fa-file-pdf"></i> PDF
                        </button>
                      </div>
                    </td>
                  </tr>
               }
             </tbody>
           </table>
         </div>

         <!-- Pagination Controls -->
         <div class="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
            <button (click)="prevHistoryPage()" [disabled]="historyPage() === 1" class="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold uppercase hover:bg-[#3498db] hover:text-white transition-all rounded-sm shadow-sm disabled:opacity-30">
              <i class="fas fa-arrow-left mr-2"></i>Anterior
            </button>
            <span class="font-bold text-slate-700">Página {{ historyPage() }} de {{ historyTotalPages() || 1 }}</span>
            <button (click)="nextHistoryPage()" [disabled]="historyPage() >= historyTotalPages()" class="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold uppercase hover:bg-[#3498db] hover:text-white transition-all rounded-sm shadow-sm disabled:opacity-30">
              Siguiente<i class="fas fa-arrow-right ml-2"></i>
            </button>
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

      <!-- EDIT RESULT MODAL -->
      @if (showEditModal()) {
        <div class="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
           <div class="bg-white max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col rounded-sm">
              <div class="bg-slate-800 text-white p-5 flex justify-between items-center">
                 <h3 class="font-bold text-lg flex items-center gap-2">
                    <i class="fas fa-edit text-amber-400"></i> Modificar Resultado
                 </h3>
                 <button (click)="closeEditModal()" class="text-slate-400 hover:text-white transition-colors">
                    <i class="fas fa-times text-xl"></i>
                 </button>
              </div>
              <div class="p-6">
                 <form [formGroup]="editForm" class="space-y-4">
                    <div>
                       <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre del Examen/Reporte</label>
                       <input formControlName="testName" type="text" class="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#3498db] outline-none transition-colors text-slate-700 font-bold">
                    </div>
                    <div>
                       <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Valores y Detalles</label>
                       <textarea formControlName="values" rows="12" class="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#3498db] outline-none transition-colors text-slate-700 font-mono text-sm"></textarea>
                    </div>
                 </form>
              </div>
              <div class="p-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                 <button (click)="closeEditModal()" [disabled]="isProcessing()" class="px-6 py-2 text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors">Descartar</button>
                 <button (click)="saveEdit()" [disabled]="editForm.invalid || isProcessing()" class="bg-[#27ae60] text-white px-8 py-2 hover:bg-[#219150] disabled:opacity-50 font-bold uppercase text-xs tracking-wide transition-colors shadow-sm flex items-center gap-2">
                    @if(isProcessing()) { <i class="fas fa-circle-notch fa-spin"></i> Guardando... }
                    @else { <i class="fas fa-save"></i> Guardar Cambios }
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

   // Edit Modal State
   showEditModal = signal(false);
   resultToEdit = signal<LabResult | null>(null);

   resultForm = this.fb.group({
      examId: ['', Validators.required],
      values: ['', Validators.required]
   });

   editForm = this.fb.group({
      testName: ['', Validators.required],
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

   formatDate(dateStr: string): string {
      if (!dateStr) return '';
      // If it's ISO format, take the date part
      const datePart = dateStr.split('T')[0];
      const parts = datePart.split('-');
      if (parts.length === 3) {
         // Return DD/MM/YYYY
         return `${parts[parts.length - 1]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
   }

   // --- EDIT ACTION ---
   editResult(res: LabResult) {
      this.resultToEdit.set(res);
      this.editForm.patchValue({
         testName: res.testName,
         values: res.values
      });
      this.showEditModal.set(true);
   }

   async saveEdit() {
      const res = this.resultToEdit();
      if (!res || this.editForm.invalid) return;

      this.isProcessing.set(true);
      try {
         const updatedData = {
            testName: this.editForm.value.testName!,
            values: this.editForm.value.values!
         };

         await this.db.updateFullResult(res.id, updatedData);
         this.showEditModal.set(false);
         this.resultToEdit.set(null);
      } catch (error) {
         console.error('Error updating result:', error);
         alert('Error al actualizar el resultado.');
      } finally {
         this.isProcessing.set(false);
      }
   }

   closeEditModal() {
      this.showEditModal.set(false);
      this.resultToEdit.set(null);
      this.editForm.reset();
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

      try {
         // Generate PDF as Base64 using html2pdf and the new 'email' mode (self-contained CSS)
         const html = this.getReportHtml(result, 'email');
         const worker = (window as any).html2pdf().from(html).set({
            margin: 0,
            filename: `Resultado_${patient.name.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
               scale: 3,
               useCORS: true,
               letterRendering: true
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
         });

         const pdfBase64 = await worker.outputPdf('datauristring').then((dataUri: string) => {
            return dataUri.split(',')[1];
         });

         const success = await this.db.sendResultEmail(patient.email, patient.name, result, pdfBase64);

         if (success) {
            this.emailStatus.set('success');
            setTimeout(() => {
               this.closeEmailModal();
            }, 2000);
         } else {
            alert('Error al enviar el correo. Verifique la conexión con la función Backend.');
            this.emailStatus.set('idle');
         }
      } catch (error) {
         console.error('PDF Generation error:', error);
         alert('Error al generar o enviar el PDF.');
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
      const printWindow = window.open('', '', 'width=900,height=1100');
      if (!printWindow) return;

      const html = this.getReportHtml(res, mode);
      printWindow.document.write(html);
      printWindow.document.close();
   }

   getReportHtml(res: LabResult, mode: 'view' | 'download' | 'email'): string {
      const patient = this.db.patients().find(p => p.id === res.patientId);
      if (!patient) return '';

      // Check for signature
      const rawSig = this.db.labSignature();
      const sigImage = typeof rawSig === 'string' ? rawSig : null;

      // Check for logo
      const rawLogo = this.db.labLogo();
      const logoImage = typeof rawLogo === 'string' ? rawLogo : null;

      const signatureHtml = sigImage
         ? `<img src="${sigImage}" style="height: 70px; display: block; margin: 0 auto 5px auto;" alt="Firma">`
         : `<div style="height:40px;"></div><span style="font-family: 'Brush Script MT', cursive; font-size: 20px; color: #475569; font-weight: bold; font-style: italic;">${res.createdBy || 'Bioquímico'}</span>`;

      const logoHtml = logoImage
         ? `<img src="${logoImage}" style="width: 110px; height: auto; display: block; margin-bottom: 5px;" alt="Logo">`
         : `<svg width="80" height="80" viewBox="0 0 100 100" style="margin-bottom: 10px;">
                 <path d="M50 90 C10 60 5 35 25 15 A20 20 0 0 1 50 35 A20 20 0 0 1 75 15 C95 35 90 60 50 90" fill="none" stroke="#1abc9c" stroke-width="3"/>
                 <path d="M20 50 L35 50 L45 30 L55 70 L65 50 L80 50" fill="none" stroke="#1abc9c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>`;

      const watermarkHtml = logoImage
         ? `<img src="${logoImage}" style="width: 100%; height: auto;" alt="Watermark">`
         : `<svg viewBox="0 0 512 512" fill="#000" style="width: 100%;"><path d="M416 96c-44.2 0-80 35.8-80 80 0-44.2-35.8-80-80-80s-80 35.8-80 80c0-44.2-35.8-80-80-80S16 131.8 16 176c0 88.4 128 240 240 240s240-151.6 240-240c0-44.2-35.8-80-80-80z"/></svg>`;

      const printScript = mode === 'download' ? `<script>setTimeout(() => { window.print(); }, 500);</script>` : '';

      // --- PARSING LOGIC FOR TABLE (Simplified and Robust) ---
      let tableRowsHtml = '';
      const resValuesStr = String(res.values || '');
      const lines = resValuesStr.split('\n');

      let tTmp = '';
      let cT = '', cR = '', cU = '', cV = '';
      for (const line of lines) {
         const l = line.trim();
         if (!l) continue;
         if (l.startsWith('■')) {
            if (tTmp) tableRowsHtml += `<tbody style="page-break-inside: avoid;">${tTmp}</tbody>`;
            tTmp = `<tr><td colspan="4" style="padding: 10px; border: 2px solid #334155; font-weight: bold; font-size: 14px; text-align: center; background: #f1f5f9; text-transform: uppercase;">${l.replace('■', '').trim()}</td></tr>`;
         } else if (l.startsWith('►')) {
            cT = l.replace('►', '').trim(); cR = ''; cU = ''; cV = '';
         } else if (l.startsWith('Rango Ref:')) { cR = l.replace('Rango Ref:', '').trim(); }
         else if (l.startsWith('Unidad:')) { cU = l.replace('Unidad:', '').trim(); }
         else if (l.startsWith('Valor:')) {
            cV = l.replace('Valor:', '').trim();
            tTmp += `
                <tr>
                   <td style="padding: 10px; border: 1px solid #94a3b8; font-weight: bold; font-size: 12px;">${cT}</td>
                   <td style="padding: 10px; border: 1px solid #94a3b8; font-weight: bold; font-size: 13px; text-align: center; color: #0f172a;">${cV}</td>
                   <td style="padding: 10px; border: 1px solid #94a3b8; font-size: 11px; text-align: center; color: #475569;">${cR}</td>
                   <td style="padding: 10px; border: 1px solid #94a3b8; font-size: 11px; text-align: center; color: #64748b;">${cU}</td>
                </tr>
             `;
         }
      }
      if (tTmp) tableRowsHtml += `<tbody style="page-break-inside: avoid;">${tTmp}</tbody>`;
      if (!tableRowsHtml) {
         tableRowsHtml = `
             <tbody>
                <tr>
                   <td style="padding: 12px; border: 1px solid #94a3b8; font-weight: bold; font-size: 12px; width: 40%;">${res.testName}</td>
                   <td style="padding: 12px; border: 1px solid #94a3b8; font-size: 12px; font-family: monospace; text-align: center;">${resValuesStr}</td>
                   <td style="padding: 12px; border: 1px solid #94a3b8; font-size: 12px; text-align: center;">-</td>
                   <td style="padding: 12px; border: 1px solid #94a3b8; font-size: 12px; text-align: center;">-</td>
                </tr>
             </tbody>
           `;
      }

      return `
       <!DOCTYPE html>
       <html lang="es">
       <head>
         <meta charset="UTF-8">
         <style>
             @page { size: auto; margin: 0; }
             body {
                 margin: 0; padding: 1.5cm;
                 font-family: 'Helvetica', 'Arial', sans-serif;
                 background-color: white;
                 color: #1e293b;
                 line-height: 1.4;
             }
             .header-container { display: flex; align-items: flex-start; margin-bottom: 20px; }
             .logo-box { width: 20%; text-align: center; }
             .details-box { flex: 1; text-align: center; }
             .patient-box { 
                 border: 2px solid #1e293b; 
                 border-radius: 15px; 
                 padding: 15px; 
                 margin-bottom: 25px;
                 display: grid;
                 grid-template-columns: 1fr 1fr;
                 gap: 5px;
             }
             .patient-item { display: flex; font-size: 13px; }
             .patient-label { font-weight: bold; width: 85px; }
             .table-results { 
                 width: 100%; border-collapse: collapse; margin-bottom: 30px; 
             }
             .table-results th { 
                 border: 1px solid #64748b; padding: 10px; background-color: #f8fafc;
                 text-transform: uppercase; font-size: 11px;
             }
             .watermark {
                 position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                 opacity: 0.05; z-index: -1; width: 70%;
             }
             .footer-disclaimer {
                 font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0;
                 padding-top: 10px; text-align: justify; margin-bottom: 40px;
             }
             .signature-section { text-align: center; width: 250px; margin: 0 auto; }
             .signature-line { border-bottom: 1px solid black; margin-bottom: 5px; height: 75px; display: flex; align-items: flex-end; justify-content: center; }
             .page-footer {
                 position: fixed; bottom: 0.5cm; left: 1.5cm; right: 1.5cm;
                 font-size: 9px; color: #94a3b8; display: flex; justify-content: space-between;
                 border-top: 0.5px solid #cbd5e1; padding-top: 5px;
             }
             @media print { 
                 .no-print { display: none; }
                 body { padding: 1.5cm; }
             }
         </style>
       </head>
       <body>
          <div class="watermark">${watermarkHtml}</div>
          
          <div class="header-container">
             <div class="logo-box">${logoHtml}</div>
             <div class="details-box">
                <h1 style="font-weight: bold; font-size: 20px; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: -0.5px;">LABORATORIO CLÍNICO BIOSALUD HUEHUETENANGO</h1>
                <p style="font-size: 11px; margin: 2px 0;">Manzana G, Casa 24 Residenciales Valle del Quetzal Km. 28 zona 0,</p>
                <p style="font-size: 11px; margin: 2px 0;">San Juan Sacatepéquez, Guatemala</p>
                <p style="font-size: 11px; font-weight: 500; margin: 2px 0;">TEL: 4240-7376 | e-mail: biosalud.lcb@gmail.com</p>
                <p style="font-size: 13px; font-weight: bold; margin-top: 5px;">Licda. Yénnifer Soto - Química Bióloga (Col. 6,808)</p>
             </div>
          </div>

          <div class="patient-box">
             <div class="patient-item"><span class="patient-label">NOMBRE:</span> <span style="text-transform: uppercase;">${patient.name}</span></div>
             <div class="patient-item"><span class="patient-label">DPI:</span> <span>${patient.dpi}</span></div>
             <div class="patient-item"><span class="patient-label">ORDEN:</span> <span>${res.orderNumber || res.id.substring(0, 8)}</span></div>
             <div class="patient-item"><span class="patient-label">FECHA:</span> <span>${res.date.split('T')[0].split('-').reverse().join('/')}</span></div>
             <div class="patient-item"><span class="patient-label">EDAD:</span> <span>${patient.age} años</span></div>
             <div class="patient-item"><span class="patient-label">GENERO:</span> <span>${patient.gender}</span></div>
             <div class="patient-item" style="grid-column: span 2;"><span class="patient-label">MÉDICO:</span> <span>${patient.doctor || 'Particular'}</span></div>
          </div>

          <div style="text-align: center; font-weight: bold; font-size: 16px; text-transform: uppercase; margin-bottom: 25px; color: #1e293b; border-bottom: 2px solid #e2e8f0; display: inline-block; width: 100%; padding-bottom: 5px;">
             REPORTE DE: ${res.testName}
          </div>

          <table class="table-results">
             <thead>
                <tr>
                   <th>Estudio</th>
                   <th>Resultado</th>
                   <th>Referencia</th>
                   <th>Unidad</th>
                </tr>
             </thead>
             ${tableRowsHtml}
          </table>

          <div class="footer-disclaimer">
             Nuestro proceso analítico completo se somete a rigurosos controles de calidad, utilizando herramientas estadísticas avanzadas para laboratorios clínicos. Esto garantiza la precisión y confiabilidad de todos nuestros resultados.
             <br><br>
             <span style="font-weight: bold; color: black;">El original de este documento se encuentra en los archivos de Laboratorio BioSalud Huehuetenango. El uso de este documento es responsabilidad exclusiva del cliente.</span>
          </div>

          <div class="signature-section">
             <div class="signature-line">${signatureHtml}</div>
             <p style="font-weight: bold; font-size: 12px; margin: 0;">Licda. Yénnifer Soto</p>
             <p style="font-size: 10px; color: #64748b; margin: 0;">Química Bióloga, Colegiado No. 6, 808</p>
          </div>

          <div class="page-footer">
             <div>Impreso el: ${new Date().toLocaleString('es-GT')}</div>
             <div>Laboratorio BioSalud Huehuetenango</div>
          </div>

          ${printScript}
       </body>
       </html>
       `;
   }
}
