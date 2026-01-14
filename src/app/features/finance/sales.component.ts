
import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray, FormGroup } from '@angular/forms';
import { DbService, Sale, Exam, Patient } from '../../../core/services/db.service';

@Component({
   selector: 'app-sales',
   standalone: true,
   imports: [CommonModule, ReactiveFormsModule],
   template: `
    <div>
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
           <h1 class="text-2xl font-light text-slate-800">Registro de Ventas</h1>
           <p class="text-slate-400 text-sm mt-1">Gestión de transacciones y caja diaria</p>
        </div>
        
        <!-- Action Bar: Date Filter & Buttons -->
        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
           
           <!-- Date Filter -->
           <div class="flex items-center bg-white border border-slate-300 rounded-sm overflow-hidden">
              <span class="pl-3 text-slate-400 text-xs font-bold uppercase"><i class="far fa-calendar-alt"></i></span>
              <input 
                type="date" 
                [value]="filterDate()" 
                (input)="updateFilterDate($event)"
                class="p-2 text-sm text-slate-700 outline-none border-none focus:ring-0 bg-transparent"
              >
              @if(filterDate()) {
                <button (click)="clearFilter()" class="pr-3 text-slate-400 hover:text-red-500 transition-colors" title="Ver todo el historial">
                   <i class="fas fa-times"></i>
                </button>
              }
           </div>

           <button (click)="openModal()" class="bg-[#1abc9c] text-white px-6 py-2 hover:bg-[#16a085] transition-colors text-sm font-bold uppercase flex items-center gap-2 shadow-sm ml-auto md:ml-0">
             <i class="fas fa-cash-register"></i> Nueva Venta
           </button>
           <button class="bg-white border border-slate-300 text-slate-600 px-4 py-2 hover:bg-slate-50 transition-colors text-sm font-bold uppercase flex items-center gap-2">
             <i class="fas fa-download"></i> Exportar
           </button>
        </div>
      </div>

      <!-- KPI Cards (Based on Filter) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white p-6 border border-slate-200 border-l-4 border-l-green-500 shadow-sm transition-all">
           <p class="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">
             Ingresos {{ filterDate() ? 'del Día' : 'Totales' }}
           </p>
           <p class="text-3xl font-bold text-slate-800">Q{{ totalRevenue() | number:'1.2-2' }}</p>
        </div>
        <div class="bg-white p-6 border border-slate-200 border-l-4 border-l-blue-500 shadow-sm transition-all">
           <p class="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Transacciones</p>
           <p class="text-3xl font-bold text-slate-800">{{ filteredSales().length }}</p>
        </div>
        <div class="bg-white p-6 border border-slate-200 border-l-4 border-l-purple-500 shadow-sm transition-all">
           <p class="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Ticket Promedio</p>
           <p class="text-3xl font-bold text-slate-800">Q{{ averageTicket() | number:'1.2-2' }}</p>
        </div>
      </div>

      <!-- Transactions Table -->
      <div class="bg-white border border-slate-200">
        <div class="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 class="font-bold text-slate-700 uppercase text-xs tracking-wide">
              {{ filterDate() ? 'Transacciones: ' + filterDate() : 'Historial Completo' }}
            </h3>
            <span class="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-sm">
               {{ filteredSales().length }} reg.
            </span>
        </div>
        <table class="w-full text-left border-collapse">
          <thead class="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
            <tr>
              <th class="p-4 border-b border-slate-200">Hora / Fecha</th>
              <th class="p-4 border-b border-slate-200">Paciente</th>
              <th class="p-4 border-b border-slate-200">Detalle (Items)</th>
              <th class="p-4 border-b border-slate-200">Método Pago</th>
              <th class="p-4 border-b border-slate-200 text-right">Total</th>
              <th class="p-4 border-b border-slate-200">Registrado Por</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (sale of filteredSales(); track sale.id) {
              <tr class="hover:bg-slate-50 transition-colors group">
                <td class="p-4 text-slate-500 text-sm font-mono whitespace-nowrap">
                   @if(filterDate()) {
                      {{ sale.date | date:'HH:mm' }} <span class="text-xs text-slate-300 ml-1">hrs</span>
                   } @else {
                      {{ sale.date | date:'dd/MM/yyyy HH:mm' }}
                   }
                </td>
                <td class="p-4 font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">{{ sale.patientName }}</td>
                <td class="p-4 text-slate-600 text-xs">
                   <div class="flex flex-wrap gap-1">
                      @for (item of sale.items; track item) {
                         <span class="bg-slate-100 px-2 py-0.5 rounded-sm border border-slate-200">{{ item }}</span>
                      }
                   </div>
                </td>
                <td class="p-4 text-slate-500 text-xs uppercase font-bold">
                   <i class="fas fa-credit-card mr-1" *ngIf="sale.method === 'Tarjeta'"></i>
                   <i class="fas fa-money-bill-wave mr-1" *ngIf="sale.method === 'Efectivo'"></i>
                   {{ sale.method }}
                </td>
                <td class="p-4 text-slate-800 font-bold font-mono text-right">Q{{ sale.total | number:'1.2-2' }}</td>
                <td class="p-4 text-xs text-slate-500">
                   {{ sale.createdBy || 'Sistema' }}
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="p-8 text-center text-slate-400">
                   <div class="flex flex-col items-center">
                      <i class="fas fa-search text-3xl mb-2 text-slate-300"></i>
                      <p>No se encontraron ventas para esta fecha.</p>
                   </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- NEW SALE MODAL -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
           <div class="bg-white w-full max-w-2xl border border-slate-200 shadow-2xl flex flex-col max-h-[90vh]">
              <!-- Header -->
              <div class="bg-[#2c3e50] text-white p-5 flex justify-between items-center">
                 <h3 class="font-bold text-lg flex items-center gap-2">
                    <i class="fas fa-cash-register text-[#1abc9c]"></i> Registrar Nueva Venta
                 </h3>
                 <button (click)="closeModal()" class="text-slate-400 hover:text-white transition-colors">
                    <i class="fas fa-times text-xl"></i>
                 </button>
              </div>

              <!-- Body -->
              <div class="p-6 overflow-y-auto flex-1 bg-slate-50">
                 <form [formGroup]="saleForm" class="space-y-6">
                    
                    <!-- Patient Select -->
                    <div>
                       <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Paciente</label>
                       <select formControlName="patientId" class="w-full p-3 bg-white border border-slate-300 focus:border-[#3498db] outline-none text-slate-700">
                          <option value="" disabled>Seleccione un paciente</option>
                          @for (p of db.patients(); track p.id) {
                             <option [value]="p.id">{{ p.name }} (DPI: {{ p.dpi }})</option>
                          }
                       </select>
                    </div>

                    <!-- Exam Multi-Select (Simple Checkbox List for now) -->
                    <div>
                       <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Servicios / Exámenes</label>
                       <div class="bg-white border border-slate-300 h-48 overflow-y-auto p-2 space-y-1">
                          @for (exam of db.exams(); track exam.id) {
                             <label class="flex items-center justify-between p-2 hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100 transition-colors rounded-sm">
                                <div class="flex items-center gap-3">
                                   <input type="checkbox" [value]="exam.id" (change)="toggleExam(exam, $event)" class="w-4 h-4 text-[#3498db] rounded focus:ring-0">
                                   <div>
                                      <div class="font-bold text-sm text-slate-700">{{ exam.name }}</div>
                                      <div class="text-xs text-slate-400">{{ exam.code }}</div>
                                   </div>
                                </div>
                                <div class="font-mono text-sm font-bold text-slate-600">Q{{ exam.price }}</div>
                             </label>
                          }
                       </div>
                    </div>

                    <!-- Payment Method -->
                    <div>
                       <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Método de Pago</label>
                       <div class="grid grid-cols-2 gap-4">
                          <label class="flex items-center gap-2 p-3 bg-white border border-slate-300 cursor-pointer">
                             <input type="radio" formControlName="method" value="Efectivo" class="text-[#3498db]">
                             <span class="text-sm font-medium">Efectivo</span>
                          </label>
                          <label class="flex items-center gap-2 p-3 bg-white border border-slate-300 cursor-pointer">
                             <input type="radio" formControlName="method" value="Tarjeta" class="text-[#3498db]">
                             <span class="text-sm font-medium">Tarjeta / POS</span>
                          </label>
                          <label class="flex items-center gap-2 p-3 bg-white border border-slate-300 cursor-pointer">
                             <input type="radio" formControlName="method" value="Seguro" class="text-[#3498db]">
                             <span class="text-sm font-medium">Seguro Médico</span>
                          </label>
                          <label class="flex items-center gap-2 p-3 bg-white border border-slate-300 cursor-pointer">
                             <input type="radio" formControlName="method" value="Transferencia" class="text-[#3498db]">
                             <span class="text-sm font-medium">Transferencia</span>
                          </label>
                       </div>
                    </div>

                 </form>
              </div>

              <!-- Footer (Totals & Actions) -->
              <div class="p-5 bg-white border-t border-slate-200 flex justify-between items-center shadow-lg z-10">
                 <div>
                    <p class="text-xs text-slate-500 uppercase font-bold">Total a Pagar</p>
                    <p class="text-2xl font-bold text-[#2c3e50]">Q{{ currentTotal() | number:'1.2-2' }}</p>
                 </div>
                 <div class="flex gap-3">
                    <button (click)="closeModal()" class="px-6 py-3 text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors">Cancelar</button>
                    <button (click)="submitSale()" [disabled]="saleForm.invalid || currentTotal() === 0" class="bg-[#1abc9c] text-white px-8 py-3 hover:bg-[#16a085] disabled:opacity-50 disabled:cursor-not-allowed font-bold uppercase text-sm tracking-wide transition-colors shadow-sm">
                       Confirmar Venta
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
   selectedExams = signal<Exam[]>([]); // Stores full exam objects

   // Filter state - Default to Today for "Caja Diaria" view
   filterDate = signal<string>(new Date().toISOString().split('T')[0]);

   saleForm = this.fb.group({
      patientId: ['', Validators.required],
      method: ['Efectivo', Validators.required]
   });

   // Computed: Returns sales based on the date filter
   filteredSales = computed(() => {
      const selectedDate = this.filterDate();
      const allSales = this.db.sales();

      if (!selectedDate) {
         return allSales; // Return everything if filter is cleared
      }

      // Supabase usually returns ISO strings, compare the YYYY-MM-DD part
      return allSales.filter(sale => sale.date.startsWith(selectedDate));
   });

   // KPIs now rely on filteredSales() instead of db.sales()
   totalRevenue = computed(() => {
      return this.filteredSales().reduce((acc, curr) => acc + curr.total, 0);
   });

   averageTicket = computed(() => {
      const count = this.filteredSales().length;
      return count > 0 ? this.totalRevenue() / count : 0;
   });

   currentTotal = computed(() => {
      return this.selectedExams().reduce((acc, ex) => acc + ex.price, 0);
   });

   // --- FILTER ACTIONS ---
   updateFilterDate(event: Event) {
      const val = (event.target as HTMLInputElement).value;
      this.filterDate.set(val);
   }

   clearFilter() {
      this.filterDate.set('');
   }
   // ----------------------

   openModal() {
      this.saleForm.reset({ method: 'Efectivo' });
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

   submitSale() {
      if (this.saleForm.invalid || this.selectedExams().length === 0) return;

      const formVal = this.saleForm.value;
      const patient = this.db.patients().find(p => p.id === formVal.patientId);

      if (!patient) return;

      const newSale: Sale = {
         id: Math.floor(Math.random() * 100000).toString(), // Temp ID until DB assigns
         date: new Date().toISOString(),
         patientId: patient.id,
         patientName: patient.name,
         items: this.selectedExams().map(e => e.name),
         total: this.currentTotal(),
         method: formVal.method as any
      };

      this.db.addSale(newSale);
      this.closeModal();
   }
}
