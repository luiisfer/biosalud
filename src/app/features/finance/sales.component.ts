
import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray, FormGroup } from '@angular/forms';
import { DbService, Sale, Exam, Patient, LabResult } from '../../../core/services/db.service';

@Component({
   selector: 'app-sales',
   standalone: true,
   imports: [CommonModule, ReactiveFormsModule],
   template: `
    <div>
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
           <h1 class="text-2xl font-light text-slate-800">Caja y Ventas</h1>
           <p class="text-slate-400 text-sm mt-1">Gestión de transacciones y cobros de laboratorio</p>
        </div>
        
        <!-- Action Bar -->
        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
           <div class="flex items-center bg-white border border-slate-300 rounded-sm overflow-hidden">
              <span class="pl-3 text-slate-400 text-xs font-bold uppercase"><i class="far fa-calendar-alt"></i></span>
              <input 
                type="date" 
                [value]="filterDate()" 
                (input)="updateFilterDate($event)"
                class="p-2 text-sm text-slate-700 outline-none border-none focus:ring-0 bg-transparent"
              >
           </div>

           <button (click)="openModal()" class="bg-[#3498db] text-white px-6 py-2 hover:bg-[#2980b9] transition-colors text-sm font-bold uppercase flex items-center gap-2 shadow-sm ml-auto md:ml-0">
             <i class="fas fa-plus"></i> Venta Manual
           </button>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white p-5 border border-slate-200 border-l-4 border-l-[#27ae60] shadow-sm">
           <p class="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Ingresos Hoy</p>
           <p class="text-2xl font-bold text-slate-800 tracking-tight">Q{{ totalRevenue() | number:'1.2-2' }}</p>
        </div>
        <div class="bg-white p-5 border border-slate-200 border-l-4 border-l-[#3498db] shadow-sm">
           <p class="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Transacciones</p>
           <p class="text-2xl font-bold text-slate-800 tracking-tight">{{ filteredSales().length }}</p>
        </div>
        <div class="bg-white p-5 border border-slate-200 border-l-4 border-l-[#f39c12] shadow-sm">
           <p class="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Por Cobrar</p>
           <p class="text-2xl font-bold text-slate-800 tracking-tight">{{ pendingResults().length }}</p>
        </div>
        <div class="bg-white p-5 border border-slate-200 border-l-4 border-l-[#9b59b6] shadow-sm">
           <p class="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Caja Total</p>
           <p class="text-2xl font-bold text-slate-800 tracking-tight">Q{{ (totalRevenue()) | number:'1.2-2' }}</p>
        </div>
      </div>

      <!-- QUICK BILLING SECTION (TODAY'S RESULTS) -->
      @if (pendingResults().length > 0 && isTodaySelected()) {
        <div class="mb-8 bg-[#fdfaf5] border-2 border-[#f39c12]/20 rounded-sm overflow-hidden">
           <div class="bg-[#f39c12] text-white p-3 flex justify-between items-center">
              <h3 class="font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                 <i class="fas fa-hand-holding-usd"></i> Resultados Pendientes de Cobro ({{ pendingResults().length }})
              </h3>
              <span class="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase">Acción Requerida</span>
           </div>
           
           <div class="overflow-x-auto">
              <table class="w-full text-left">
                 <thead class="bg-[#f39c12]/5 text-[#a8700d] text-[10px] font-bold uppercase tracking-wider border-b border-[#f39c12]/10">
                    <tr>
                       <th class="p-3">Paciente</th>
                       <th class="p-3">Exámenes / Perfil</th>
                       <th class="p-3">Total</th>
                       <th class="p-3">Método de Pago</th>
                       <th class="p-3 text-center">Acción</th>
                    </tr>
                 </thead>
                 <tbody class="divide-y divide-[#f39c12]/10">
                    @for (res of pendingResults(); track res.id) {
                       <tr class="hover:bg-white transition-colors">
                          <td class="p-3">
                             <div class="font-bold text-slate-800 text-sm italic">{{ getPatientName(res.patientId) }}</div>
                             <div class="text-[10px] text-slate-400">Orden: {{ res.orderNumber || 'S/N' }}</div>
                          </td>
                          <td class="p-3 text-xs text-slate-600">
                             {{ res.testName }}
                          </td>
                          <td class="p-3 font-mono font-bold text-[#2c3e50] text-sm">
                             Q{{ (res.price || 0) | number:'1.2-2' }}
                          </td>
                          <td class="p-3">
                             <select #methodSelect class="text-xs p-1.5 border border-slate-200 bg-white focus:border-[#f39c12] outline-none rounded-sm">
                                <option value="Efectivo">Efectivo</option>
                                <option value="Tarjeta">Tarjeta</option>
                                <option value="Transferencia">Transferencia</option>
                                <option value="Seguro">Seguro</option>
                             </select>
                          </td>
                          <td class="p-3 text-center">
                             <button (click)="processResultAsSale(res, methodSelect.value)" 
                                     class="bg-[#27ae60] text-white px-4 py-1.5 hover:bg-[#219150] transition-colors text-[10px] font-bold uppercase rounded-sm shadow-sm">
                                Cobrar
                             </button>
                          </td>
                       </tr>
                    }
                 </tbody>
              </table>
           </div>
        </div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <!-- LEFT: Transactions History -->
         <div class="lg:col-span-3 bg-white border border-slate-200 shadow-sm">
            <div class="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
               <h3 class="font-bold text-slate-700 uppercase text-xs tracking-widest">Historial de Transacciones</h3>
               <span class="text-xs font-bold text-slate-400 uppercase tracking-tighter">{{ filteredSales().length }} REGISTROS</span>
            </div>
            
            <div class="overflow-x-auto">
               <table class="w-full text-left">
                 <thead class="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-widest border-b border-slate-200">
                   <tr>
                     <th class="p-4">Hora</th>
                     <th class="p-4">Paciente</th>
                     <th class="p-4">Detalle</th>
                     <th class="p-4">Método</th>
                     <th class="p-4 text-right">Total</th>
                   </tr>
                 </thead>
                 <tbody class="divide-y divide-slate-100">
                   @for (sale of filteredSales(); track sale.id) {
                     <tr class="hover:bg-slate-50/50 transition-colors">
                       <td class="p-4 text-slate-500 text-xs font-mono">
                          {{ sale.date | date:'HH:mm' }} <span class="text-[10px] text-slate-300 ml-1">GT</span>
                       </td>
                       <td class="p-4">
                          <div class="font-bold text-slate-700 text-sm uppercase">{{ sale.patientName }}</div>
                       </td>
                       <td class="p-4">
                          <div class="flex flex-wrap gap-1">
                             @for (item of sale.items; track item) {
                                <span class="bg-blue-50 text-blue-700 text-[9px] px-1.5 py-0.5 rounded-sm uppercase font-bold border border-blue-100">{{ item }}</span>
                             }
                          </div>
                       </td>
                       <td class="p-4">
                          <span class="text-[10px] font-bold uppercase px-2 py-1 rounded-full" 
                                [ngClass]="{
                                   'bg-green-100 text-green-700': sale.method === 'Efectivo',
                                   'bg-blue-100 text-blue-700': sale.method === 'Tarjeta',
                                   'bg-purple-100 text-purple-700': sale.method === 'Transferencia',
                                   'bg-orange-100 text-orange-700': sale.method === 'Seguro'
                                }">
                             {{ sale.method }}
                          </span>
                       </td>
                       <td class="p-4 text-slate-800 font-bold font-mono text-right text-sm">Q{{ sale.total | number:'1.2-2' }}</td>
                     </tr>
                   } @empty {
                     <tr>
                       <td colspan="5" class="p-10 text-center text-slate-400">
                          <div class="flex flex-col items-center opacity-50">
                             <i class="fas fa-inbox text-4xl mb-3"></i>
                             <p class="text-sm">No hay ventas registradas para este filtro</p>
                          </div>
                       </td>
                     </tr>
                   }
                 </tbody>
               </table>
            </div>
         </div>
      </div>

      <!-- NEW SALE MODAL -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
           <div class="bg-white w-full max-w-lg border border-slate-200 shadow-2xl flex flex-col">
              <!-- Header -->
              <div class="bg-[#2c3e50] text-white p-5 flex justify-between items-center">
                 <h3 class="font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                    <i class="fas fa-plus-circle text-[#3498db]"></i> Pago Directo
                 </h3>
                 <button (click)="closeModal()" class="text-slate-400 hover:text-white transition-colors">
                    <i class="fas fa-times text-xl"></i>
                 </button>
              </div>

              <!-- Body -->
              <div class="p-8 bg-slate-50 space-y-6">
                 <form [formGroup]="saleForm" class="space-y-6">
                    <div>
                       <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Paciente</label>
                       <select formControlName="patientId" class="w-full p-3 bg-white border border-slate-300 focus:border-[#3498db] outline-none text-slate-700 text-sm font-medium">
                          <option value="" disabled>Seleccione un paciente</option>
                          @for (p of db.patients(); track p.id) {
                             <option [value]="p.id">{{ p.name }}</option>
                          }
                       </select>
                    </div>

                    <div>
                       <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Servicios Agregados</label>
                       <div class="bg-white border border-slate-300 max-h-48 overflow-y-auto p-1">
                          @for (exam of db.exams(); track exam.id) {
                             <label class="flex items-center justify-between p-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0">
                                <div class="flex items-center gap-3">
                                   <input type="checkbox" [value]="exam.id" (change)="toggleExam(exam, $event)" class="w-4 h-4 text-[#3498db] rounded focus:ring-0">
                                   <div class="text-xs font-bold text-slate-600">{{ exam.name }}</div>
                                </div>
                                <div class="font-mono text-xs font-bold text-slate-400 pl-4">Q{{ exam.price }}</div>
                             </label>
                          }
                       </div>
                    </div>

                    <div>
                       <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Forma de Pago</label>
                       <div class="grid grid-cols-2 gap-3">
                          @for (m of ['Efectivo', 'Tarjeta', 'Transferencia', 'Seguro']; track m) {
                             <label class="flex items-center gap-3 p-3 bg-white border border-slate-200 cursor-pointer hover:border-[#3498db] transition-colors rounded-sm group">
                                <input type="radio" formControlName="method" [value]="m" class="text-[#3498db]">
                                <span class="text-xs font-bold text-slate-500 group-hover:text-slate-800">{{ m }}</span>
                             </label>
                          }
                       </div>
                    </div>
                 </form>
              </div>

              <!-- Footer -->
              <div class="p-6 bg-white border-t border-slate-100 flex justify-between items-center shadow-inner">
                 <div>
                    <p class="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Monto Total</p>
                    <p class="text-xl font-bold text-[#2c3e50] tracking-tighter">Q{{ currentTotal() | number:'1.2-2' }}</p>
                 </div>
                 <div class="flex gap-2">
                    <button (click)="closeModal()" class="px-5 py-2 text-slate-400 font-bold text-xs uppercase hover:text-slate-600">Volver</button>
                    <button (click)="submitSale()" [disabled]="saleForm.invalid || currentTotal() === 0" class="bg-[#2c3e50] text-white px-8 py-3 hover:bg-[#1a252f] disabled:opacity-30 disabled:cursor-not-allowed font-bold uppercase text-[10px] tracking-widest shadow-md transition-all">
                       Vender
                    </button>
                 </div>
              </div>
           </div>
        </div>
      }
    </div>
  `,
   styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in { animation: fadeIn 0.2s ease-out; }
  `]
})
export class SalesComponent {
   db = inject(DbService);
   fb: FormBuilder = inject(FormBuilder);

   showModal = signal(false);
   selectedExams = signal<Exam[]>([]);
   filterDate = signal<string>(new Date().toISOString().split('T')[0]);

   saleForm = this.fb.group({
      patientId: ['', Validators.required],
      method: ['Efectivo', Validators.required]
   });

   // Computed: Results from "today" that haven't been billed yet
   pendingResults = computed(() => {
      const today = new Date().toISOString().split('T')[0];
      const allResults = this.db.labResults();
      const allSales = this.db.sales();

      // Filter results for today
      const todayResults = allResults.filter(r => r.date.startsWith(today));

      // A result is pending if its patientId + date + testName combination isn't in a sale today
      return todayResults.filter(res => {
         const alreadyBilled = allSales.some(s =>
            s.patientId === res.patientId &&
            s.date.startsWith(today) &&
            s.items.includes(res.testName)
         );
         return !alreadyBilled;
      });
   });

   isTodaySelected = computed(() => {
      const today = new Date().toISOString().split('T')[0];
      return this.filterDate() === today;
   });

   // Computed: Returns sales based on the date filter
   filteredSales = computed(() => {
      const selectedDate = this.filterDate();
      const allSales = this.db.sales();
      if (!selectedDate) return allSales;
      return allSales.filter(sale => sale.date.startsWith(selectedDate));
   });

   // KPIs
   totalRevenue = computed(() => {
      return this.filteredSales().reduce((acc, curr) => acc + curr.total, 0);
   });

   // Average Ticket
   averageTicket = computed(() => {
      const count = this.filteredSales().length;
      return count > 0 ? this.totalRevenue() / count : 0;
   });

   currentTotal = computed(() => {
      return this.selectedExams().reduce((acc, ex) => acc + ex.price, 0);
   });

   getPatientName(id: string) {
      return this.db.patients().find(p => p.id === id)?.name || 'Paciente Desconocido';
   }

   // --- ACTIONS ---
   updateFilterDate(event: Event) {
      const val = (event.target as HTMLInputElement).value;
      this.filterDate.set(val);
   }

   openModal() {
      this.saleForm.reset({ method: 'Efectivo', patientId: '' });
      this.selectedExams.set([]);
      this.showModal.set(true);
   }

   closeModal() {
      this.showModal.set(false);
   }

   toggleExam(exam: Exam, event: Event) {
      const checked = (event.target as HTMLInputElement).checked;
      if (checked) {
         this.selectedExams.update(list => [...list, exam]);
      } else {
         this.selectedExams.update(list => list.filter(e => e.id !== exam.id));
      }
   }

   async submitSale() {
      if (this.saleForm.invalid || this.selectedExams().length === 0) return;

      const formVal = this.saleForm.value;
      const patient = this.db.patients().find(p => p.id === formVal.patientId);
      if (!patient) return;

      const newSale: Sale = {
         id: Math.floor(Math.random() * 100000).toString(),
         date: new Date().toISOString(),
         patientId: patient.id,
         patientName: patient.name,
         items: this.selectedExams().map(e => e.name),
         total: this.currentTotal(),
         method: formVal.method as any,
         createdBy: 'Admin' // Should ideally come from auth
      };

      await this.db.addSale(newSale);
      this.closeModal();
   }

   async processResultAsSale(res: LabResult, method: any) {
      const patient = this.db.patients().find(p => p.id === res.patientId);
      if (!patient) return;

      const newSale: Sale = {
         id: Math.floor(Math.random() * 100000).toString(),
         date: new Date().toISOString(),
         patientId: patient.id,
         patientName: patient.name,
         items: [res.testName],
         total: res.price || 0,
         method: method,
         createdBy: 'Sistema'
      };

      await this.db.addSale(newSale);
   }
}
