
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
                             Q{{ getPriceForResult(res.testName, res.price) | number:'1.2-2' }}
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
                             <button (click)="initPendingSale(res, methodSelect.value)" 
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
                     <th class="p-4">Registrado Por</th>
                     <th class="p-4 text-right">Desc.</th>
                     <th class="p-4 text-right">IVA</th>
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
                       <td class="p-4">
                          <div class="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                             <i class="fas fa-user-circle text-slate-300"></i> {{ sale.creator?.name || 'Sistema' }}
                          </div>
                      </td>
                       <td class="p-4 text-right font-mono text-xs text-amber-600">
                          @if(sale.discount && sale.discount > 0) {
                             -Q{{ sale.discount | number:'1.2-2' }}
                          } @else {
                             <span class="text-slate-300">-</span>
                          }
                       </td>
                       <td class="p-4 text-right font-mono text-xs text-red-400">
                          @if(sale.tax && sale.tax > 0) {
                             -Q{{ sale.tax | number:'1.2-2' }}
                          } @else {
                              <span class="text-slate-300">-</span>
                          }
                       </td>
                       <td class="p-4 text-slate-800 font-bold font-mono text-right text-sm">
                          Q{{ sale.finalTotal || sale.total | number:'1.2-2' }}
                       </td>
                     </tr>
                   } @empty {
                     <tr>
                       <td colspan="7" class="p-10 text-center text-slate-400">
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
                           @for (item of availableItems(); track item.id) {
                              <label class="flex items-center justify-between p-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0">
                                 <div class="flex items-center gap-3">
                                    <input type="checkbox" [value]="item.id" (change)="toggleItem(item, $event)" [checked]="isItemSelected(item.id)" class="w-4 h-4 text-[#3498db] rounded focus:ring-0">
                                    <div class="flex flex-col">
                                       <span class="text-xs font-bold text-slate-600">{{ item.name }}</span>
                                       <span class="text-[9px] text-slate-400 uppercase font-black tracking-tighter">{{ item.type === 'profile' ? 'Perfil' : 'Examen' }}</span>
                                    </div>
                                 </div>
                                 <div class="font-mono text-xs font-bold text-slate-400 pl-4">Q{{ item.price | number:'1.2-2' }}</div>
                              </label>
                           }
                        </div>
                    </div>

                    <div>
                       <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Forma de Pago</label>
                       <div class="grid grid-cols-2 gap-3">
                          @for (m of ['Efectivo', 'Tarjeta', 'Transferencia', 'Seguro']; track m) {
                             <label class="flex items-center gap-3 p-3 bg-white border border-slate-200 cursor-pointer hover:border-[#3498db] transition-colors rounded-sm group">
                                <input type="radio" formControlName="method" [value]="m" (change)="paymentMethod.set(m)" class="text-[#3498db]">
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
                    <button (click)="openConfirmModal()" [disabled]="saleForm.invalid || currentTotal() === 0" class="bg-[#2c3e50] text-white px-8 py-3 hover:bg-[#1a252f] disabled:opacity-30 disabled:cursor-not-allowed font-bold uppercase text-[10px] tracking-widest shadow-md transition-all">
                       Cobrar
                    </button>
                 </div>
              </div>
           </div>
        </div>
      }

       <!-- CONFIRMATION MODAL -->
       @if (showConfirmModal()) {
         <div class="fixed inset-0 bg-slate-900/90 flex items-center justify-center p-4 z-[60] backdrop-blur-sm animate-fade-in">
            <div class="bg-white max-w-sm w-full shadow-2xl rounded-sm overflow-hidden flex flex-col">
               <div class="bg-slate-800 text-white p-5 text-center">
                  <h3 class="font-bold text-lg uppercase tracking-wider">Confirmar Cobro</h3>
                  <p class="text-xs text-slate-400 mt-1">Verifique los montos antes de procesar</p>
               </div>
               
               <div class="p-6 space-y-4">
                  <!-- Subtotal -->
                  <div class="flex justify-between items-center text-slate-600">
                     <span class="text-xs font-bold uppercase">Subtotal Venta</span>
                     <span class="font-mono font-bold">Q{{ calculations().subtotal | number:'1.2-2' }}</span>
                  </div>

                  <!-- Card Discount (5%) -->
                  @if (saleForm.get('method')?.value === 'Tarjeta') {
                     <div class="flex justify-between items-center text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                        <span class="text-xs font-bold uppercase flex items-center gap-1">
                           <i class="fas fa-credit-card"></i> Desc. Tarjeta (5%)
                        </span>
                        <span class="font-mono font-bold">-Q{{ calculations().cardDiscount | number:'1.2-2' }}</span>
                     </div>
                  }

                  <!-- IVA (12%) -->
                  <div class="flex justify-between items-center text-red-500">
                     <span class="text-xs font-bold uppercase">IVA (12%)</span>
                     <span class="font-mono font-bold">-Q{{ calculations().iva | number:'1.2-2' }}</span>
                  </div>

                  <!-- Divider -->
                  <div class="border-t border-slate-200 border-dashed my-2"></div>

                  <!-- Final Total -->
                  <div class="flex justify-between items-center bg-slate-50 p-3 rounded border border-slate-200">
                     <span class="text-sm font-black uppercase text-slate-800">Total Líquido</span>
                     <span class="font-mono text-xl font-black text-[#27ae60]">Q{{ calculations().finalTotal | number:'1.2-2' }}</span>
                  </div>
               </div>

               <div class="p-5 bg-slate-50 border-t border-slate-200 flex gap-3">
                  <button (click)="showConfirmModal.set(false)" class="flex-1 py-3 text-slate-500 font-bold text-xs uppercase hover:bg-slate-200 rounded-sm transition-colors">Cancelar</button>
                  <button (click)="submitSale()" class="flex-1 bg-[#27ae60] text-white py-3 font-bold text-xs uppercase hover:bg-[#219150] rounded-sm shadow-md transition-colors flex items-center justify-center gap-2">
                     <i class="fas fa-check"></i> Confirmar
                  </button>
               </div>
            </div>
         </div>
       }

      <!-- CONFIRMATION MODAL -->
       @if (showConfirmModal()) {
         <div class="fixed inset-0 bg-slate-900/90 flex items-center justify-center p-4 z-[60] backdrop-blur-sm animate-fade-in">
            <div class="bg-white max-w-sm w-full shadow-2xl rounded-sm overflow-hidden flex flex-col">
               <div class="bg-slate-800 text-white p-5 text-center">
                  <h3 class="font-bold text-lg uppercase tracking-wider">Confirmar Cobro</h3>
                  <p class="text-xs text-slate-400 mt-1">Verifique los montos antes de procesar</p>
               </div>
               
               <div class="p-6 space-y-4">
                  <!-- Subtotal -->
                  <div class="flex justify-between items-center text-slate-600">
                     <span class="text-xs font-bold uppercase">Subtotal Venta</span>
                     <span class="font-mono font-bold">Q{{ calculations().subtotal | number:'1.2-2' }}</span>
                  </div>

                  <!-- Card Discount (5%) -->
                  @if (saleForm.get('method')?.value === 'Tarjeta') {
                     <div class="flex justify-between items-center text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                        <span class="text-xs font-bold uppercase flex items-center gap-1">
                           <i class="fas fa-credit-card"></i> Desc. Tarjeta (5%)
                        </span>
                        <span class="font-mono font-bold">-Q{{ calculations().cardDiscount | number:'1.2-2' }}</span>
                     </div>
                  }

                  <!-- IVA (12%) -->
                  <div class="flex justify-between items-center text-red-500">
                     <span class="text-xs font-bold uppercase">IVA (12%)</span>
                     <span class="font-mono font-bold">-Q{{ calculations().iva | number:'1.2-2' }}</span>
                  </div>

                  <!-- Divider -->
                  <div class="border-t border-slate-200 border-dashed my-2"></div>

                  <!-- Final Total -->
                  <div class="flex justify-between items-center bg-slate-50 p-3 rounded border border-slate-200">
                     <span class="text-sm font-black uppercase text-slate-800">Total Líquido</span>
                     <span class="font-mono text-xl font-black text-[#27ae60]">Q{{ calculations().finalTotal | number:'1.2-2' }}</span>
                  </div>
               </div>

               <div class="p-5 bg-slate-50 border-t border-slate-200 flex gap-3">
                  <button (click)="showConfirmModal.set(false)" class="flex-1 py-3 text-slate-500 font-bold text-xs uppercase hover:bg-slate-200 rounded-sm transition-colors">Cancelar</button>
                  <button (click)="submitSale()" class="flex-1 bg-[#27ae60] text-white py-3 font-bold text-xs uppercase hover:bg-[#219150] rounded-sm shadow-md transition-colors flex items-center justify-center gap-2">
                     <i class="fas fa-check"></i> Confirmar
                  </button>
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
   showConfirmModal = signal(false);

   selectedItems = signal<any[]>([]); // { id, name, price, type }
   pendingSaleItem = signal<{ res: LabResult, method: string } | null>(null);
   paymentMethod = signal('Efectivo');
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
      return this.filteredSales().reduce((acc, curr) => acc + (curr.total || 0), 0);
   });

   // Computed: Combined list of Exams and Profiles for selection
   availableItems = computed(() => {
      const exams = this.db.exams().map(e => ({ ...e, type: 'exam', price: e.price || 0 }));
      const profiles = this.db.profiles().map(p => ({ ...p, type: 'profile', price: p.price || 0 }));
      return [...exams, ...profiles].sort((a, b) => a.name.localeCompare(b.name));
   });

   // Average Ticket
   averageTicket = computed(() => {
      const count = this.filteredSales().length;
      return count > 0 ? this.totalRevenue() / count : 0;
   });

   currentTotal = computed(() => {
      // If pending sale item exists, use that. Otherwise use selected items.
      if (this.pendingSaleItem()) {
         const { res } = this.pendingSaleItem()!;
         return this.getPriceForResult(res.testName, res.price);
      }
      return this.selectedItems().reduce((acc, item) => acc + (item.price || 0), 0);
   });

   getPriceForResult(testName: string, fallbackPrice: number = 0): number {
      // 1. Check Profiles
      const profile = this.db.profiles().find(p => p.name === testName);
      if (profile && profile.price) return profile.price;

      // 2. Check Exams
      const exam = this.db.exams().find(e => e.name === testName);
      if (exam && exam.price) return exam.price;

      return fallbackPrice || 0;
   }

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
      this.paymentMethod.set('Efectivo');
      this.selectedItems.set([]);
      this.pendingSaleItem.set(null);
      this.showModal.set(true);
   }

   closeModal() {
      this.showModal.set(false);
   }

   toggleItem(item: any, event: Event) {
      const checked = (event.target as HTMLInputElement).checked;
      if (checked) {
         this.selectedItems.update(list => [...list, item]);
      } else {
         this.selectedItems.update(list => list.filter(i => i.id !== item.id));
      }
   }

   isItemSelected(id: string): boolean {
      return this.selectedItems().some(i => i.id === id);
   }

   // --- CALCULATIONS FOR CONFIRMATION ---
   calculations = computed(() => {
      const subtotal = this.currentTotal();
      const method = this.paymentMethod();

      let cardDiscount = 0;
      if (method === 'Tarjeta') {
         cardDiscount = subtotal * 0.05;
      }

      const amountAfterDiscount = subtotal - cardDiscount;
      const iva = subtotal * 0.12; // User requested 12% on SOLD amount (gross), typically tax is distinct but user said "12% sobre lo vendido"
      // Wait, is 'lo vendido' the original subtotal? Yes.
      // Final total = Subtotal - Discount - Tax? Or is Tax just informational?
      // "se descuenta el 5% ... y tambien el IVA" implies deduction from revenue calculation?
      // OR they want to charge Customer: Subtotal. And show Net Revenue?
      // Assuming "Liquid Total" displayed is Subtotal - Discounts - Tax.
      // If user meant to ADD tax, they would usually say "agregar IVA". "descuenta el IVA" means it's taken out.

      const finalTotal = subtotal - cardDiscount - iva;

      return { subtotal, cardDiscount, iva, finalTotal };
   });

   openConfirmModal() {
      if (this.saleForm.invalid || this.selectedItems().length === 0) return;
      this.showConfirmModal.set(true);
   }

   async submitSale() {
      // Check if it's a manual sale or a pending item sale
      if (this.pendingSaleItem()) {
         const { res, method } = this.pendingSaleItem()!;
         await this.processResultAsSale(res, method);
         this.showConfirmModal.set(false);
         this.pendingSaleItem.set(null);
         return;
      }

      if (this.saleForm.invalid || this.selectedItems().length === 0) return;

      const formVal = this.saleForm.value;
      const patient = this.db.patients().find(p => p.id === formVal.patientId);
      if (!patient) return;

      const calcs = this.calculations();

      const newSale: Sale = {
         id: Math.floor(Math.random() * 100000).toString(),
         date: new Date().toISOString(),
         patientId: patient.id,
         patientName: patient.name,
         items: this.selectedItems().map(e => e.name),
         total: calcs.subtotal,
         subtotal: calcs.subtotal,
         discount: calcs.cardDiscount,
         tax: calcs.iva,
         finalTotal: calcs.finalTotal,
         method: formVal.method as any
      };

      await this.db.addSale(newSale);
      this.showConfirmModal.set(false);
      this.closeModal();
   }

   // Prepare pending sale and open confirmation
   initPendingSale(res: LabResult, method: any) {
      // Need to "mock" form state so calculations computed works
      this.saleForm.patchValue({ method: method });
      this.paymentMethod.set(method);
      this.pendingSaleItem.set({ res, method });
      this.showConfirmModal.set(true);
   }

   async processResultAsSale(res: LabResult, method: any) {
      const patient = this.db.patients().find(p => p.id === res.patientId);
      if (!patient) return;

      // We need accurate calculations for this single item too.
      // Since 'calculations' computed relies on currentTotal() which relies on PENDING ITEM or SELECTED EXAMS,
      // and we set pendingSaleItem in initPendingSale, the calculations() signal should already be correct 
      // when this is called via submitSale -> processResultAsSale.
      // HOWEVER, if called directly (which we removed), checking state is good.
      // Let's grab the current calculations state which should currently reflect this transaction.
      const calcs = this.calculations();

      const newSale: Sale = {
         id: Math.floor(Math.random() * 100000).toString(),
         date: new Date().toISOString(),
         patientId: patient.id,
         patientName: patient.name,
         items: [res.testName],
         total: calcs.subtotal,
         subtotal: calcs.subtotal,
         discount: calcs.cardDiscount,
         tax: calcs.iva,
         finalTotal: calcs.finalTotal,
         method: method
      };

      await this.db.addSale(newSale);
   }
}
