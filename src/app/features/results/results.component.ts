
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
      <h1 class="text-3xl font-light text-slate-800 mb-8 border-b border-slate-100 pb-4">Gestión de Resultados</h1>

      <!-- NEW GIGANTIC FULL-WIDTH SEARCH HERO -->
      <div class="mb-10 bg-white p-10 border border-slate-200 shadow-xl rounded-sm animate-fade-in">
         <div class="max-w-4xl mx-auto">
            <h2 class="text-sm font-bold text-slate-500 uppercase mb-6 tracking-[0.2em] text-center">1. Encontrar Expediente de Paciente</h2>
            <div class="relative group">
               <i class="fas fa-search absolute left-6 top-6 text-slate-300 text-3xl group-focus-within:text-[#3498db] transition-colors"></i>
               <input 
                 [formControl]="searchControl" 
                 (input)="updateSearch($event)"
                 type="text" 
                 placeholder="Escriba el nombre, apellido o número de DPI del paciente..." 
                 class="w-full pl-20 p-8 bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-[#3498db] outline-none transition-all text-2xl font-bold text-slate-800 shadow-inner rounded-sm placeholder:text-slate-300 placeholder:font-light">
               
               @if (searchControl.value) {
                  <button (click)="searchControl.setValue(''); searchTerm.set('')" class="absolute right-6 top-7 text-slate-300 hover:text-red-500 transition-colors">
                     <i class="fas fa-times-circle text-2xl"></i>
                  </button>
               }
            </div>

            @if (searchTerm() && filteredPatients().length > 0) {
              <div class="mt-8 space-y-3 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                <div class="text-[10px] font-bold text-[#3498db] uppercase tracking-widest mb-2 px-2">Resultados Encontrados</div>
                @for (patient of filteredPatients(); track patient.id) {
                  <div (click)="selectPatient(patient)" 
                    class="p-6 border border-slate-100 bg-white hover:bg-blue-50/50 hover:border-blue-200 cursor-pointer transition-all flex justify-between items-center group rounded shadow-sm hover:shadow-lg">
                     <div class="flex items-center gap-6">
                        <div class="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-[#3498db] group-hover:text-white transition-all text-xl">
                           <i class="fas fa-user"></i>
                        </div>
                        <div>
                           <div class="font-black text-slate-800 text-2xl group-hover:text-[#3498db] mb-1 transition-colors capitalize">{{ patient.name }}</div>
                           <div class="flex gap-4">
                              <span class="text-xs font-bold text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded inline-block border border-slate-100">DPI: {{ patient.dpi }}</span>
                              <span class="text-xs font-bold text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded inline-block border border-slate-100">NIT: {{ patient.nit || 'C/F' }}</span>
                           </div>
                        </div>
                     </div>
                     <div class="flex flex-col items-end gap-2">
                        <span class="text-[10px] font-bold text-slate-300 uppercase opacity-0 group-hover:opacity-100 transition-all">Seleccionar</span>
                        <i class="fas fa-arrow-right text-slate-200 group-hover:text-[#3498db] group-hover:translate-x-3 transition-all text-3xl"></i>
                     </div>
                  </div>
                }
              </div>
            }
         </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-4 space-y-6">

          <!-- Patient Profile Card (If Selected) -->
          @if (selectedPatient(); as p) {
            <div class="bg-white p-0 border border-slate-200 animate-fade-in overflow-hidden shadow-lg sticky top-6">
               <div class="bg-slate-800 p-5 text-white flex justify-between items-center">
                 <span class="font-bold text-lg uppercase tracking-wider">Expediente Actual</span>
                 <div class="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]"></div>
               </div>
               <div class="p-8">
                  <div class="flex items-center gap-6 mb-8">
                    <div class="w-20 h-20 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center text-3xl text-[#3498db] shadow-inner">
                      <i class="fas fa-id-badge"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="text-2xl font-black text-slate-800 mb-1 leading-tight uppercase truncate">{{ p.name }}</h3>
                      <p class="text-slate-500 font-medium flex items-center gap-2">
                         <i class="fas fa-calendar-alt text-slate-300"></i> {{ p.age }} años • {{ p.gender }}
                      </p>
                    </div>
                  </div>
                  
                  <div class="grid grid-cols-1 gap-4 mb-8">
                     <div class="p-4 bg-slate-50 border border-slate-100 rounded">
                        <div class="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">DPI</div>
                        <div class="font-mono font-bold text-slate-700 text-base">{{ p.dpi }}</div>
                     </div>
                     <div class="p-4 bg-slate-50 border border-slate-100 rounded">
                        <div class="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Teléfono</div>
                        <div class="font-mono font-bold text-slate-700 text-base">{{ p.phone }}</div>
                     </div>
                  </div>

                  <div class="text-sm border-t border-slate-100 pt-6 mb-8">
                     <p class="text-slate-400 text-[10px] uppercase font-bold mb-3 tracking-widest flex items-center gap-2">
                        <i class="fas fa-file-medical text-slate-300"></i> Notas Clínicas
                     </p>
                     <p class="text-slate-700 italic leading-relaxed text-base">{{ p.history || 'Sin antecedentes registrados.' }}</p>
                  </div>
                  
                  <button (click)="clearSelection()" class="w-full py-4 border-2 border-slate-100 text-slate-400 hover:bg-red-50 hover:border-red-100 hover:text-red-500 transition-all text-xs font-black uppercase tracking-widest flex justify-center items-center gap-3">
                    <i class="fas fa-sync-alt"></i> Buscar Otro Paciente
                  </button>
               </div>
            </div>
          } @else {
             <div class="bg-slate-50 p-12 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center rounded-lg text-slate-400 h-full min-h-[400px]">
                <div class="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                   <i class="fas fa-search text-3xl text-slate-200"></i>
                </div>
                <h3 class="font-bold text-slate-600 mb-2 text-lg uppercase tracking-widest">Paso 1</h3>
                <p class="text-sm leading-relaxed font-medium">Use el buscador superior para seleccionar un paciente y habilitar el registro.</p>
             </div>
          }
        </div>

        <!-- RIGHT COLUMN: Actions (8 cols) -->
        <div class="lg:col-span-8">
          
          @if (selectedPatient()) {
             <!-- FORM: Add New Result -->
             <div class="bg-white p-8 border border-slate-200 mb-8 animate-fade-in relative overflow-hidden">
                <div class="absolute top-0 left-0 w-1 h-full bg-[#3498db]"></div>
                
                <div class="flex justify-between items-center mb-8">
                    <h2 class="text-2xl font-black text-slate-800 flex items-center gap-4">
                       <i class="fas fa-flask text-[#3498db]"></i> 2. Ingresar Resultados
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
                              @for (item of filteredExamList(); track item.id) {
                                 <div (mousedown)="selectExamFromSearch(item)" class="p-3 border-b border-slate-50 hover:bg-blue-50 cursor-pointer transition-colors group">
                                    <div class="flex justify-between items-start">
                                       <div>
                                          <span class="font-bold text-slate-700 group-hover:text-[#3498db]">{{ item.name }}</span>
                                          @if(item.isProfile) {
                                            <span class="ml-2 px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-black rounded border border-purple-100 uppercase tracking-tighter">Perfil</span>
                                          } @else {
                                            <span class="ml-2 px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded border border-blue-100 uppercase tracking-tighter">Examen</span>
                                          }
                                       </div>
                                       <span class="text-xs font-mono text-slate-400 bg-slate-100 px-1 rounded">{{ item.code }}</span>
                                    </div>
                                    @if(!item.isProfile && item.unit) {
                                      <div class="text-xs text-slate-500 mt-1">Unidad: {{ item.unit }}</div>
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

                   @if (!selectedProfileId()) {
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
                   } @else {
                      <div class="space-y-4 bg-purple-50/50 p-6 border border-purple-100 rounded-sm animate-fade-in">
                         <div class="flex items-center gap-2 text-purple-800 mb-2">
                            <i class="fas fa-keyboard"></i>
                            <span class="font-bold text-xs uppercase tracking-widest">Ingresar Resultados del Perfil</span>
                         </div>
                         
                         <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            @for (ex of profileExams(); track ex.id) {
                               <div class="bg-white p-3 border border-purple-100 shadow-sm rounded-sm">
                                  <label class="block text-[10px] font-black text-slate-500 mb-2 tracking-tight">
                                     {{ ex.name }} 
                                     @if(ex.unit) { <span class="text-purple-400">({{ ex.unit }})</span> }
                                  </label>
                                  <input 
                                     type="text" 
                                     [placeholder]="ex.range ? 'Ref: ' + ex.range : 'Ingrese Valor'"
                                     (input)="updateProfileValue(ex.id, $event)"
                                     class="w-full p-2 bg-slate-50 border border-slate-100 focus:bg-white focus:border-purple-400 outline-none text-sm font-mono text-slate-700 transition-all">
                               </div>
                            }
                         </div>
                      </div>
                   }

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

                 <!-- Campo de Número de Orden (Separado de los exámenes) -->
                 <div class="mb-6 p-4 bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col md:flex-row md:items-center gap-4 animate-fade-in border-l-4 border-l-[#27ae60]">
                    <div class="flex items-center gap-3 text-slate-600 min-w-max">
                       <i class="fas fa-barcode text-[#27ae60]"></i>
                       <label class="font-bold text-xs uppercase tracking-widest text-slate-500">Número de Orden:</label>
                    </div>
                    <input 
                       type="text" 
                       [value]="orderNumber()"
                       (input)="updateOrderNumber($event)"
                       placeholder="INGRESAR EJ: ORD-001" 
                       class="w-full md:w-64 p-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#27ae60] outline-none text-sm font-mono text-slate-700 transition-all rounded-sm font-bold uppercase shadow-inner placeholder:text-slate-300"
                    >
                    <p class="text-[10px] text-slate-400 font-medium italic">Este identificador aparecerá en el encabezado del reporte PDF.</p>
                 </div>

                 <div class="space-y-3 mb-6">
                    @for (item of stagedResults(); track $index) {
                       <div class="bg-white p-4 border border-slate-200 flex justify-between items-start shadow-sm">
                          <div>
                             <div class="font-bold text-slate-700">{{ item.testName }}</div>
                             <div class="text-xs text-slate-500 font-mono mt-1">{{ item.values }}</div>
                          </div>
                          <div class="flex gap-2">
                             <button (click)="editStaged($index)" class="text-blue-500 hover:text-blue-700 p-1" title="Editar valor">
                                <i class="fas fa-edit"></i>
                             </button>
                             <button (click)="removeStaged($index)" class="text-red-400 hover:text-red-600 p-1" title="Quitar de la lista">
                                <i class="fas fa-trash-alt"></i>
                             </button>
                          </div>
                       </div>
                    }
                 </div>

                 <div class="flex justify-end">
                    <button (click)="finalizeBatch()" [disabled]="isProcessing()" class="bg-[#27ae60] text-white px-8 py-4 hover:bg-[#219150] font-bold uppercase text-sm tracking-wide transition-colors flex items-center gap-2 shadow-sm w-full md:w-auto justify-center">
                       @if (isProcessing()) { 
                          <i class="fas fa-circle-notch fa-spin"></i> Guardando... 
                       } @else {
                          <i class="fas fa-save"></i> Guardar
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
                 placeholder="Buscar por Paciente, Orden, Examen..." 
                 class="w-full pl-10 p-2.5 bg-white border border-slate-300 focus:border-[#3498db] outline-none text-sm text-slate-700 transition-all rounded-sm shadow-sm">
            </div>
         </div>
         
         <!-- TABLE LAYOUT -->
         <div class="overflow-x-auto">
           <table class="w-full text-left border-collapse">
              <thead class="bg-slate-50 text-slate-600 uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th class="p-6 border-b border-slate-200">Fecha</th>
                  <th class="p-6 border-b border-slate-200">Orden</th>
                  <th class="p-6 border-b border-slate-200">Examen</th>
                  <th class="p-6 border-b border-slate-200">Paciente</th>
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
                       <span class="font-mono text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
                          {{ res.orderNumber || 'S/N' }}
                       </span>
                    </td>
                    <td class="p-6">
                      <div class="font-bold text-slate-800 text-base">{{ res.testName }}</div>
                    </td>
                    <td class="p-6">
                      <div class="text-slate-800 font-medium text-base">{{ getPatientName(res.patientId) }}</div>
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
                         <button (click)="editResult(res)" class="text-amber-600 text-[10px] font-bold uppercase border border-amber-300 px-2 py-1 hover:bg-amber-600 hover:text-white transition-all rounded shadow-sm flex items-center gap-1" title="Editar Resultado">
                             <i class="fas fa-edit"></i> Editar
                         </button>

                         <!-- Email Button -->
                         <button (click)="openEmailModal(res)" class="text-slate-600 text-[10px] font-bold uppercase border border-slate-300 px-2 py-1 hover:bg-slate-700 hover:text-white transition-all rounded shadow-sm flex items-center gap-1" title="Enviar por Correo">
                             <i class="fas fa-envelope"></i> Email
                         </button>

                         <!-- View PDF Button -->
                         <button (click)="generatePdf(res, 'view')" class="text-blue-600 text-[10px] font-bold uppercase border border-blue-300 px-2 py-1 hover:bg-blue-600 hover:text-white transition-all rounded shadow-sm flex items-center gap-1" title="Ver Reporte">
                            <i class="fas fa-eye"></i> Ver
                        </button>

                        <!-- Download PDF Button -->
                        <button (click)="generatePdf(res, 'download')" class="text-red-600 text-[10px] font-bold uppercase border border-red-300 px-2 py-1 hover:bg-red-600 hover:text-white transition-all rounded shadow-sm flex items-center gap-1" title="Descargar Reporte PDF">
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
                    @if (emailTarget()?.email) {
                       <p class="font-mono text-sm font-bold text-slate-700">{{ emailTarget()?.email }}</p>
                    } @else {
                       <p class="text-sm font-bold text-red-500"><i class="fas fa-exclamation-triangle"></i> No hay correo registrado</p>
                    }
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
                 <button (click)="confirmSendEmail()" [disabled]="emailStatus() === 'sending' || emailStatus() === 'success' || !emailTarget()?.email" class="bg-[#3498db] text-white px-6 py-2 hover:bg-[#2980b9] disabled:opacity-50 disabled:cursor-not-allowed font-bold uppercase text-xs tracking-wide transition-colors shadow-sm flex items-center gap-2">
                    Enviar PDF
                 </button>
              </div>
           </div>
        </div>
      }

      <!-- NO EMAIL WARNING MODAL -->
      @if (showNoEmailModal()) {
        <div class="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
           <div class="bg-white max-w-sm w-full border border-slate-200 shadow-2xl flex flex-col rounded-sm">
              <div class="bg-amber-500 text-white p-5 flex justify-between items-center">
                 <h3 class="font-bold text-lg flex items-center gap-2">
                    <i class="fas fa-exclamation-circle text-white"></i> Sin Correo
                 </h3>
                 <button (click)="closeNoEmailModal()" class="text-white/80 hover:text-white transition-colors">
                    <i class="fas fa-times text-xl"></i>
                 </button>
              </div>
              <div class="p-8 text-center">
                 <div class="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5 text-amber-600 text-3xl animate-bounce-subtle">
                    <i class="fas fa-envelope-open"></i>
                 </div>
                 
                 <h4 class="font-bold text-slate-800 text-lg mb-2">No hay correo registrado</h4>
                 <p class="text-slate-500 text-sm mb-6 leading-relaxed px-4">
                    El paciente <span class="font-bold text-slate-700">{{ emailTarget()?.name }}</span> no tiene una dirección de correo electrónico configurada.
                 </p>
                 
                 <button (click)="closeNoEmailModal()" class="w-full bg-slate-800 text-white py-3 rounded-sm font-bold uppercase text-xs hover:bg-slate-700 transition-colors shadow-sm tracking-widest">
                    Entendido
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

   // AutoComplete Item State (Exams & Profiles)
   examSearchControl = new FormControl('');
   showExamDropdown = signal(false);
   examSearchTerm = signal('');
   selectedProfileId = signal<string | null>(null);
   profileValues = signal<Record<string, string>>({});
   orderNumber = signal('');

   // Right Column State (History Table)
   historySearchTerm = signal('');
   historyPage = signal(1);
   historyItemsPerPage = 10;

   // Email Modal State
   showEmailModal = signal(false);
   emailTarget = signal<Patient | null>(null);
   resultToEmail = signal<LabResult | null>(null);
   emailStatus = signal<'idle' | 'sending' | 'success'>('idle');
   showNoEmailModal = signal(false);

   // Edit Modal State
   showEditModal = signal(false);
   stagedEditIndex = signal<number | null>(null);
   resultToEdit = signal<LabResult | null>(null);

   resultForm = this.fb.group({
      examId: ['', Validators.required],
      values: [''] // Made optional here, will validate in addToQueue if not profile
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

      const exams = this.db.exams().map(e => ({ ...e, isProfile: false }));
      const profiles = this.db.profiles().map(p => ({ ...p, isProfile: true, code: 'PERFIL', unit: undefined, range: undefined }));

      const combined = [...exams, ...profiles];

      if (!term) return combined;
      return combined.filter(item =>
         item.name.toLowerCase().includes(term) ||
         (item.code && item.code.toLowerCase().includes(term))
      );
   });

   currentExam = computed(() => {
      const id = this.selectedExamId();
      if (!id) return null;
      return this.db.exams().find(e => e.id === id);
   });

   currentProfile = computed(() => {
      const id = this.selectedProfileId();
      if (!id) return null;
      return this.db.profiles().find(p => p.id === id);
   });

   profileExams = computed(() => {
      const id = this.selectedProfileId();
      if (!id) return [];
      return this.db.exams().filter(e => e.profile_id === id);
   });

   // --- COMPUTED FOR HISTORY TABLE ---
   sortedResults = computed(() => {
      // Sort by created_at desc if available, otherwise fallback to index/reverse
      return [...this.db.labResults()].sort((a, b) => {
         const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
         const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
         return dateB - dateA;
      });
   });

   filteredHistory = computed(() => {
      const term = this.historySearchTerm().toLowerCase();
      const list = this.sortedResults();

      if (!term) return list;

      return list.filter(res => {
         const patientName = this.getPatientName(res.patientId).toLowerCase();
         const testName = res.testName.toLowerCase();
         const date = res.date.toLowerCase();
         const order = (res.orderNumber || '').toLowerCase();
         return patientName.includes(term) || testName.includes(term) || date.includes(term) || order.includes(term);
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

   updateProfileValue(examId: string, event: Event) {
      const value = (event.target as HTMLInputElement).value;
      this.profileValues.update(vals => ({ ...vals, [examId]: value }));
   }

   updateOrderNumber(event: Event) {
      const value = (event.target as HTMLInputElement).value;
      this.orderNumber.set(value);
   }

   // --- Exam/Profile Autocomplete Logic ---
   selectExamFromSearch(item: any) {
      this.profileValues.set({}); // Reset profile values
      if (item.isProfile) {
         this.selectedProfileId.set(item.id);
         this.selectedExamId.set('');
         this.resultForm.get('examId')?.setValue('PROFILE');
      } else {
         this.selectedProfileId.set(null);
         this.selectedExamId.set(item.id);
         this.resultForm.get('examId')?.setValue(item.id);
      }
      this.examSearchControl.setValue(item.name);
      this.examSearchTerm.set(item.name);
      this.showExamDropdown.set(false);
   }

   clearExamSelection() {
      this.selectedExamId.set('');
      this.selectedProfileId.set(null);
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
      this.selectedProfileId.set(null);
      this.profileValues.set({});
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
      this.stagedEditIndex.set(null); // Clear staged index if editing from history
      this.resultToEdit.set(res);
      this.editForm.patchValue({
         testName: res.testName,
         values: res.values
      });
      this.showEditModal.set(true);
   }

   editStaged(index: number) {
      const res = this.stagedResults()[index];
      this.stagedEditIndex.set(index);
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

      const updatedData = {
         testName: this.editForm.value.testName!,
         values: this.editForm.value.values!
      };

      if (this.stagedEditIndex() !== null) {
         // Update staged list (local state only)
         const index = this.stagedEditIndex()!;
         this.stagedResults.update(list => {
            const newList = [...list];
            newList[index] = { ...newList[index], ...updatedData };
            return newList;
         });
         this.closeEditModal();
      } else {
         // Update DB (Historical record)
         this.isProcessing.set(true);
         try {
            await this.db.updateFullResult(res.id, updatedData);
            this.closeEditModal();
         } catch (error) {
            console.error('Error updating result:', error);
            alert('Error al actualizar el resultado.');
         } finally {
            this.isProcessing.set(false);
         }
      }
   }

   closeEditModal() {
      this.showEditModal.set(false);
      this.resultToEdit.set(null);
      this.stagedEditIndex.set(null);
      this.editForm.reset();
   }

   // --- EMAIL ACTIONS ---

   openEmailModal(res: LabResult) {
      const patient = this.db.patients().find(p => p.id === res.patientId);
      if (!patient) {
         alert('Error: Paciente no encontrado.');
         return;
      }

      this.emailTarget.set(patient);
      this.resultToEmail.set(res);
      this.emailStatus.set('idle');

      if (!patient.email || patient.email.trim() === '') {
         this.showNoEmailModal.set(true);
      } else {
         this.showEmailModal.set(true);
      }
   }

   closeEmailModal() {
      this.showEmailModal.set(false);
      this.emailTarget.set(null);
      this.resultToEmail.set(null);
   }

   closeNoEmailModal() {
      this.showNoEmailModal.set(false);
      this.emailTarget.set(null);
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
            margin: 15,
            filename: `Resultado_${patient.name.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
               scale: 3,
               useCORS: true,
               letterRendering: true
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
         });

         const pdfBase64 = await worker.toPdf().get('pdf').then((pdf: any) => {
            const totalPages = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
               pdf.setPage(i);
               pdf.setFontSize(9);
               pdf.setTextColor(148, 163, 184); // slate-400
               const text = `Página ${i} de ${totalPages}`;
               const pageWidth = pdf.internal.pageSize.getWidth();
               const pageHeight = pdf.internal.pageSize.getHeight();
               const textWidth = pdf.getStringUnitWidth(text) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
               pdf.text(text, (pageWidth - textWidth) / 2, pageHeight - 10);
            }
         }).outputPdf('datauristring').then((dataUri: string) => {
            return dataUri.split(',')[1];
         });

         if (!patient.email) throw new Error('Paciente no tiene correo configurado');
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
      const patientId = this.selectedPatient()!.id;

      if (this.selectedProfileId()) {
         // Add all exams in profile
         const exams = this.profileExams();
         const currentVals = this.profileValues();

         const results: LabResult[] = exams.map(exam => ({
            id: Math.floor(Math.random() * 100000).toString(),
            patientId,
            testName: exam.name,
            date: this.todayDate,
            values: currentVals[exam.id] || 'Pendiente',
            status: 'Pendiente',
            price: exam.price
         }));
         this.stagedResults.update(list => [...list, ...results]);
      } else {
         if (!formVal.values) {
            alert('Por favor, ingrese el valor del examen.');
            return;
         }
         const exam = this.db.exams().find(e => e.id === formVal.examId);
         if (!exam) return;

         const newResult: LabResult = {
            id: Math.floor(Math.random() * 100000).toString(),
            patientId,
            testName: exam.name,
            date: this.todayDate,
            values: formVal.values!,
            status: 'Pendiente',
            price: exam.price
         };
         this.stagedResults.update(list => [...list, newResult]);
      }

      this.resetForm();
   }

   removeStaged(index: number) {
      this.stagedResults.update(list => list.filter((_, i) => i !== index));
   }

   async finalizeBatch() {
      if (this.stagedResults().length === 0) return;

      this.isProcessing.set(true);

      const uniqueTests = [...new Set(this.stagedResults().map(r => r.testName))];
      let combinedName = uniqueTests.length > 1
         ? `Panel Integral (${uniqueTests.length} Exámenes)`
         : (uniqueTests[0] || 'Resultado General');

      const exams = this.db.exams();
      const profiles = this.db.profiles();
      const methods = this.db.methodologies();
      const methodSet = new Set<string>();

      this.stagedResults().forEach(r => {
         const e = exams.find(ex => ex.name === r.testName);
         if (e && e.profile_id) {
            const p = profiles.find(pr => pr.id === e.profile_id);
            if (p && p.methodology_id) {
               const m = methods.find(met => met.id === p.methodology_id);
               if (m) methodSet.add(m.name);
            }
         }
      });

      if (methodSet.size > 0) {
         combinedName += ` - Metodología: ${Array.from(methodSet).join(', ')}`;
      }

      let combinedValues = "";

      // Grouping Logic
      const grouped: Record<string, LabResult[]> = {};
      const noProfile: LabResult[] = [];

      // 1. Sort into buckets
      for (const res of this.stagedResults()) {
         const exam = exams.find(e => e.name === res.testName);
         if (exam && exam.profile_id) {
            if (!grouped[exam.profile_id]) grouped[exam.profile_id] = [];
            grouped[exam.profile_id].push(res);
         } else {
            noProfile.push(res);
         }
      }

      // 2. Build String for Profiles
      for (const [profileId, results] of Object.entries(grouped)) {
         const profile = profiles.find(p => p.id === profileId);
         const pName = profile ? profile.name : 'Perfil';

         combinedValues += `■ ${pName}\n`;

         results.forEach(res => {
            const examDef = exams.find(e => e.name === res.testName);
            const rangeStr = examDef ? examDef.range : 'No especificado';
            const unitStr = examDef ? examDef.unit : '';

            combinedValues += `► ${res.testName.toUpperCase()}\n`;
            combinedValues += `   Rango Ref: ${rangeStr}\n`;
            combinedValues += `   Unidad:    ${unitStr}\n`;
            combinedValues += `   Valor:     ${res.values}\n\n`; // Double newline for spacing
         });
      }

      // 3. Build String for Individual Exams
      if (noProfile.length > 0) {
         if (Object.keys(grouped).length > 0) {
            combinedValues += `■ Exámenes Individuales\n`;
         }

         noProfile.forEach(res => {
            const examDef = exams.find(e => e.name === res.testName);
            const rangeStr = examDef ? examDef.range : 'No especificado';
            const unitStr = examDef ? examDef.unit : '';

            combinedValues += `► ${res.testName.toUpperCase()}\n`;
            combinedValues += `   Rango Ref: ${rangeStr}\n`;
            combinedValues += `   Unidad:    ${unitStr}\n`;
            combinedValues += `   Valor:     ${res.values}\n\n`;
         });
      }

      const totalPrice = this.stagedResults().reduce((sum, r) => sum + (r.price || 0), 0);

      const newResult: LabResult = {
         id: Math.floor(Math.random() * 100000).toString(),
         patientId: this.selectedPatient()!.id,
         testName: combinedName,
         date: this.todayDate,
         values: combinedValues.trim(),
         status: 'Finalizado',
         orderNumber: this.orderNumber(),
         price: totalPrice
      };

      this.db.addLabResult(newResult);

      this.isProcessing.set(false);
      this.stagedResults.set([]);
      this.selectedPatient.set(null);
      this.orderNumber.set(''); // Clear order number
      this.successMessage.set(true);
      setTimeout(() => this.successMessage.set(false), 3000);
   }

   // --- BATCH LOGIC END ---

   async generatePdf(res: LabResult, mode: 'view' | 'download' = 'download') {
      const patient = this.db.patients().find(p => p.id === res.patientId);
      const patientName = patient ? patient.name.replace(/\s+/g, '_') : 'Paciente';
      const fileName = `Resultado_${patientName}.pdf`;

      // Always use 'download' mode for HTML to ensure clean base styles (no @page margins interfering)
      const html = this.getReportHtml(res, 'download');

      let printWindow: Window | null = null;
      if (mode === 'view') {
         printWindow = window.open('', '_blank');
         if (printWindow) {
            printWindow.document.write(`
               <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;color:#64748b;">
                  <div style="margin-bottom:10px;font-weight:bold;">Generando Reporte Oficial...</div>
                  <div style="font-size:12px;">Por favor espere</div>
               </div>
            `);
         }
      }

      const worker = (window as any).html2pdf().from(html).set({
         margin: 15,
         filename: fileName,
         image: { type: 'jpeg', quality: 0.98 },
         html2canvas: { scale: 3, useCORS: true, allowTaint: true, letterRendering: true },
         jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
      });

      try {
         // 1. WAIT FOR CRITICAL RESOURCES (Avoids first-run layout shifts)
         await document.fonts.ready;
         const logoUrl = this.db.labLogo();
         if (typeof logoUrl === 'string' && logoUrl.startsWith('http')) {
            const img = new Image();
            img.src = logoUrl;
            await new Promise(r => {
               if (img.complete) r(true);
               else { img.onload = () => r(true); img.onerror = () => r(false); }
            });
         }

         // 2. Start PDF generation with a slightly longer safety delay (1.5s)
         await worker.toContainer();
         await new Promise(resolve => setTimeout(resolve, 1500));
         await worker.toCanvas();
         await worker.toImg();
         await worker.toPdf();

         const pdf = await worker.get('pdf');
         const totalPages = pdf.internal.getNumberOfPages();
         const dateStr = `Impreso el: ${new Date().toLocaleString('es-GT')}`;
         const labName = 'Laboratorio BioSalud Huehuetenango';

         for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8); // Slightly smaller for footer
            pdf.setTextColor(148, 163, 184); // slate-400

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const footerY = pageHeight - 10;

            // Left: Date
            pdf.text(dateStr, 15, footerY);

            // Center: Page Number
            const pageText = `Página ${i} de ${totalPages}`;
            const pageTextWidth = pdf.getStringUnitWidth(pageText) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
            pdf.text(pageText, (pageWidth - pageTextWidth) / 2, footerY);

            // Right: Lab Name
            const labTextWidth = pdf.getStringUnitWidth(labName) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
            pdf.text(labName, pageWidth - 15 - labTextWidth, footerY);

            // Top Line for Footer
            pdf.setDrawColor(203, 213, 225); // slate-300
            pdf.line(15, footerY - 5, pageWidth - 15, footerY - 5);
         }

         if (mode === 'download') {
            await worker.save();
         } else if (mode === 'view' && printWindow) {
            const pdfUrl = await worker.output('bloburl');
            printWindow.location.href = pdfUrl;
         }
      } catch (error) {
         console.error('Pdf Generation Error:', error);
         if (printWindow) printWindow.close();
         alert('Error al generar el documento PDF.');
      }
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
         ? `<img src="${sigImage}" style="height: 70px; object-fit: contain;" alt="Firma">`
         : `<div style="height:40px;"></div><span style="font-family: 'Brush Script MT', cursive; font-size: 20px; color: #475569; font-weight: bold; font-style: italic;">${res.createdBy || 'Bioquímico'}</span>`;

      const logoHtml = logoImage
         ? `<img src="${logoImage}" style="width: 110px; height: auto; display: block; margin: 0 auto;" alt="Logo">`
         : `<svg width="80" height="80" viewBox="0 0 100 100" style="margin-bottom: 10px;">
                 <path d="M50 90 C10 60 5 35 25 15 A20 20 0 0 1 50 35 A20 20 0 0 1 75 15 C95 35 90 60 50 90" fill="none" stroke="#1abc9c" stroke-width="3"/>
                 <path d="M20 50 L35 50 L45 30 L55 70 L65 50 L80 50" fill="none" stroke="#1abc9c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>`;

      const watermarkHtml = logoImage
         ? `<img src="${logoImage}" style="width: 100%; height: auto;" alt="Watermark">`
         : `<svg viewBox="0 0 512 512" fill="#000" style="width: 100%;"><path d="M416 96c-44.2 0-80 35.8-80 80 0-44.2-35.8-80-80-80s-80 35.8-80 80c0-44.2-35.8-80-80-80S16 131.8 16 176c0 88.4 128 240 240 240s240-151.6 240-240c0-44.2-35.8-80-80-80z"/></svg>`;

      const printScript = mode === 'view' ? `<script>setTimeout(() => { window.print(); }, 800);</script>` : '';

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

      // --- METHODOLOGY EXTRACTION ---
      const methodSet = new Set<string>();
      const linesVal = String(res.values || '').split('\n');
      const examNames = linesVal.filter(l => l.trim().startsWith('►')).map(l => l.replace('►', '').trim().toUpperCase());

      const allExams = this.db.exams();
      const allProfiles = this.db.profiles();
      const allMethods = this.db.methodologies();

      if (examNames.length > 0) {
         allExams.forEach(e => {
            if (examNames.includes(e.name.toUpperCase())) {
               if (e.profile_id) {
                  const p = allProfiles.find(pr => pr.id === e.profile_id);
                  if (p && p.methodology_id) {
                     const m = allMethods.find(met => met.id === p.methodology_id);
                     if (m) methodSet.add(m.name);
                  }
               }
            }
         });
      } else {
         const e = allExams.find(x => x.name === res.testName);
         if (e && e.profile_id) {
            const p = allProfiles.find(pr => pr.id === e.profile_id);
            if (p && p.methodology_id) {
               const m = allMethods.find(met => met.id === p.methodology_id);
               if (m) methodSet.add(m.name);
            }
         }
      }

      const methodText = methodSet.size > 0 ? Array.from(methodSet).join(', ') : '';
      const methodHtml = methodText ? `<div style="font-size: 11px; font-weight: normal; margin-top: 5px; color: #475569;">Metodología: ${methodText}</div>` : '';

      return `
       <!DOCTYPE html>
       <html lang="es">
       <head>
         <meta charset="UTF-8">
         <title>Resultado ${patient.name}</title>
         <style>
             ${mode === 'view' ? '@page { size: A4; margin: 0; }' : '@page { size: A4; margin: 1.5cm; }'}
             body {
                 ${mode === 'view' ? 'margin: 1.5cm;' : 'margin: 0;'} padding: 0;
                 font-family: 'Helvetica', 'Arial', sans-serif;
                 background-color: white;
                 color: #1e293b;
                 line-height: 1.4;
             }
             .header-container { display: flex; align-items: center; margin-bottom: 10px; }
             .logo-box { width: 20%; text-align: center; }
             .details-box { flex: 1; text-align: center; }
             .patient-box { 
                 border: 2px solid #1e293b; 
                 border-radius: 15px; 
                 padding: 15px; 
                 margin-bottom: 20px;
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
                 page-break-inside: avoid;
                 break-inside: avoid;
             }
                           .signature-section { text-align: center; width: 250px; margin: 40px auto 0 auto; page-break-inside: avoid; }

                           .signature-line { border-bottom: 2px solid #000; margin-bottom: 5px; height: 75px; position: relative; display: flex; justify-content: center; align-items: flex-end; padding-bottom: 5px; }

             .page-footer {
                 position: fixed; bottom: 0.5cm; left: 1.5cm; right: 1.5cm;
                 font-size: 9px; color: #94a3b8; display: flex; justify-content: space-between;
                 border-top: 0.5px solid #cbd5e1; padding-top: 5px;
             }
             @media print { 
                 .no-print { display: none; }
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
                <p style="font-size: 13px; font-weight: bold; margin-top: 5px;">Licda. Yenifer Soto - Química Bióloga (Col. 6,808)</p>
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

           <!-- Wrap disclaimer and signature to prevent them from splitting separately -->
           <div style="page-break-inside: avoid; break-inside: avoid; margin-top: 20px;">
              <div class="footer-disclaimer">
                 Nuestro proceso analítico completo se somete a rigurosos controles de calidad, utilizando herramientas estadísticas avanzadas para laboratorios clínicos. Esto garantiza la precisión y confiabilidad de todos nuestros resultados.
                 <br><br>
                 <span style="font-weight: bold; color: black;">El original de este documento se encuentra en los archivos de Laboratorio BioSalud Huehuetenango. El uso de este documento es responsabilidad exclusiva del cliente.</span>
              </div>

              <div class="signature-section">
                 <div class="signature-line">${signatureHtml}</div>
                 <p style="font-weight: bold; font-size: 12px; margin: 0;">Licda. Yenifer Soto</p>
                 <p style="font-size: 10px; color: #64748b; margin: 0;">Química Bióloga, Col. 6,808</p>
              </div>
           </div>



          ${printScript}
       </body>
       </html>
       `;
   }
}
