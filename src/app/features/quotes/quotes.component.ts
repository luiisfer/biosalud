import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { DbService, Exam, Profile, Quote } from '../../../core/services/db.service';

@Component({
  selector: 'app-quotes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="animate-fade-in">
      <div class="mb-8">
        <h1 class="text-2xl font-light text-slate-800">Cotizaciones</h1>
        <p class="text-slate-400 text-sm mt-1">Generar cotizaciones rápidas para clientes potenciales</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- FORM SECTION -->
        <div class="bg-white p-6 border border-slate-200 shadow-sm rounded-sm">
          <h2 class="text-lg font-bold text-slate-700 mb-6 uppercase tracking-wider text-xs border-b border-slate-100 pb-2">Datos del Cliente</h2>
          
          <form [formGroup]="quoteForm" class="space-y-5">
            <div>
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nombre del Cliente</label>
              <input type="text" formControlName="name" placeholder="Ej. Juan Pérez" class="w-full p-3 bg-slate-50 border border-slate-200 focus:border-[#3498db] outline-none text-slate-700 text-sm transition-all rounded-sm">
            </div>

            <div>
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Teléfono / WhatsApp</label>
              <input type="tel" formControlName="phone" placeholder="Ej. 5555-5555" class="w-full p-3 bg-slate-50 border border-slate-200 focus:border-[#3498db] outline-none text-slate-700 text-sm transition-all rounded-sm">
            </div>
          </form>

          <h2 class="text-lg font-bold text-slate-700 mt-10 mb-4 uppercase tracking-wider text-xs border-b border-slate-100 pb-2">Selección de Exámenes</h2>
          
          <div class="relative mb-4">
             <i class="fas fa-search absolute left-3 top-3 text-slate-300 text-sm"></i>
             <input 
               type="text" 
               [formControl]="searchControl" 
               placeholder="Buscar examen o perfil..." 
               class="w-full pl-9 p-2.5 bg-slate-50 border border-slate-200 focus:border-[#3498db] outline-none text-sm rounded-sm transition-all"
             >
          </div>

          <div class="border border-slate-200 bg-white rounded-sm overflow-hidden h-96 flex flex-col">
            <div class="overflow-y-auto flex-1 p-1">
              @for (item of filteredItems(); track item.uniqueId) {
                <label class="flex items-center justify-between p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors group">
                  <div class="flex items-center gap-3">
                     <div class="relative">
                       <input type="checkbox" [checked]="isItemSelected(item)" (change)="toggleItem(item)" class="peer sr-only">
                       <div class="w-4 h-4 border-2 border-slate-300 rounded-sm peer-checked:bg-[#3498db] peer-checked:border-[#3498db] transition-all flex items-center justify-center">
                         <i class="fas fa-check text-white text-[10px] opacity-0 peer-checked:opacity-100"></i>
                       </div>
                     </div>
                     <div class="flex flex-col">
                        <span class="text-xs font-bold text-slate-600 group-hover:text-slate-800 transition-colors">{{ item.name }}</span>
                        <span class="text-[9px] text-slate-400 uppercase font-bold tracking-tighter" [ngClass]="{'text-purple-400': item.type === 'profile', 'text-blue-400': item.type === 'exam'}">{{ item.type === 'profile' ? 'Perfil' : 'Examen' }}</span>
                     </div>
                  </div>
                  <div class="font-mono text-xs font-bold text-slate-400 group-hover:text-[#3498db]">Q{{ item.price | number:'1.2-2' }}</div>
                </label>
              }
              @if (filteredItems().length === 0) {
                <div class="p-8 text-center text-slate-400">
                  <i class="far fa-frown text-2xl mb-2"></i>
                  <p class="text-xs">No se encontraron exámenes</p>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- PREVIEW SECTION -->
        <div class="flex flex-col h-full">
          <div class="bg-white p-6 border border-slate-200 shadow-sm flex-1 flex flex-col relative rounded-sm">
             <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#3498db] to-[#2980b9]"></div>
             
             <div class="flex justify-between items-start mb-6">
               <div>
                 <h2 class="text-lg font-bold text-slate-800 uppercase tracking-widest">Resumen</h2>
                 <p class="text-xs text-slate-400 mt-1">Cotización preliminar</p>
               </div>
               <div class="text-right">
                  <div class="text-xs text-slate-400 font-bold uppercase tracking-widest">Total Estimado</div>
                  <div class="text-3xl font-black text-[#2c3e50] tracking-tighter">Q{{ total() | number:'1.2-2' }}</div>
               </div>
             </div>

             <div class="bg-slate-50 flex-1 border border-slate-100 rounded-sm p-4 overflow-y-auto mb-6">
                @if (selectedItems().length > 0) {
                  <ul class="space-y-3">
                    @for (item of selectedItems(); track item.uniqueId) {
                      <li class="flex justify-between items-center group">
                        <div>
                          <p class="text-xs font-bold text-slate-700">{{ item.name }}</p>
                          <p class="text-[9px] text-slate-400 uppercase">{{ item.type === 'profile' ? 'Perfil' : 'Examen' }}</p>
                        </div>
                        <div class="flex items-center gap-3">
                           <span class="font-mono text-xs font-bold text-slate-600">Q{{ item.price | number:'1.2-2' }}</span>
                           <button (click)="toggleItem(item)" class="text-slate-300 hover:text-red-400 transition-colors">
                             <i class="fas fa-times"></i>
                           </button>
                        </div>
                      </li>
                    }
                  </ul>
                } @else {
                  <div class="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
                    <i class="fas fa-receipt text-4xl mb-4"></i>
                    <p class="text-sm font-medium">Seleccione exámenes para ver el detalle</p>
                  </div>
                }
             </div>

             <button 
                (click)="generateQuote()" 
                [disabled]="quoteForm.invalid || selectedItems().length === 0 || isGenerating()"
                class="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-4 font-bold text-sm uppercase tracking-widest shadow-lg shadow-green-200 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 rounded-sm"
             >
                @if (isGenerating()) {
                    <i class="fas fa-spinner fa-spin text-lg"></i> Procesando...
                } @else {
                    <i class="fab fa-whatsapp text-lg"></i> Generar Cotización
                }
             </button>
          </div>
        </div>
      </div>
      
      <!-- HISTORY SECTION -->
      <div class="mt-8 bg-white p-6 border border-slate-200 shadow-sm rounded-sm">
        <h2 class="text-lg font-bold text-slate-700 mb-6 uppercase tracking-wider text-xs border-b border-slate-100 pb-2">Historial de Cotizaciones Recientes</h2>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="text-[10px] uppercase tracking-widest text-slate-400 border-b border-slate-100">
                <th class="p-3 font-bold">No.</th>
                <th class="p-3 font-bold">Fecha</th>
                <th class="p-3 font-bold">Cliente</th>
                <th class="p-3 font-bold text-right">Total</th>
                <th class="p-3 font-bold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="text-sm text-slate-600">
              @for (quote of db.quotes(); track quote.id) {
                <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td class="p-3 font-mono text-xs text-slate-400">#{{ quote.id }}</td>
                  <td class="p-3">{{ quote.created_at | date:'dd/MM/yyyy' }}</td>
                  <td class="p-3 font-medium">{{ quote.client_name }}</td>
                  <td class="p-3 text-right font-mono font-bold text-slate-700">Q{{ quote.total | number:'1.2-2' }}</td>
                  <td class="p-3 text-center">
                   <div class="flex items-center justify-center"> <!-- Added flex container -->
                    <button (click)="viewQuoteHistory(quote)" class="text-[#3498db] hover:text-[#2980b9] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1">
                      <i class="fas fa-eye"></i> Ver
                    </button>
                    <button (click)="deleteQuote(quote)" class="text-slate-300 hover:text-red-500 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1 ml-4" title="Eliminar">
                       <i class="fas fa-trash-alt"></i>
                    </button>
                  </div>
                  </td>
                </tr>
              }
              @if (db.quotes().length === 0) {
                <tr>
                   <td colspan="5" class="p-8 text-center text-slate-300 italic text-xs">
                      No hay historial de cotizaciones aún.
                   </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- RESULT MODAL -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
           <div class="bg-white w-full max-w-md border border-slate-200 shadow-2xl rounded-sm overflow-hidden flex flex-col">
              <div class="bg-[#2c3e50] text-white p-4 flex justify-between items-center">
                 <h3 class="font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                    <i class="fab fa-whatsapp text-[#25D366]"></i> Cotización {{ viewingQuoteId() ? '#' + viewingQuoteId() : 'Lista' }}
                 </h3>
                 <button (click)="closeModal()" class="text-slate-400 hover:text-white transition-colors">
                    <i class="fas fa-times"></i>
                 </button>
              </div>

              <div class="p-6 bg-slate-50">
                 <p class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Mensaje Generado</p>
                 <div class="bg-white border border-slate-200 p-4 rounded-sm shadow-sm relative group">
                    <textarea 
                      readonly 
                      class="w-full h-64 text-sm text-slate-700 bg-transparent outline-none resize-none font-sans"
                      [value]="generatedMessage()"
                    ></textarea>
                 </div>
              </div>

              <div class="p-4 bg-white border-t border-slate-100 flex gap-3">
                 <button (click)="closeModal()" class="flex-1 py-2 text-slate-400 font-bold text-xs uppercase hover:text-slate-600">Cerrar</button>
                 <button (click)="copyToClipboard()" class="flex-1 bg-[#3498db] text-white py-2 font-bold text-xs uppercase hover:bg-[#2980b9] shadow-md transition-all rounded-sm flex items-center justify-center gap-2">
                    <i class="fas fa-copy"></i> Copiar Texto
                 </button>
              </div>
           </div>
        </div>
      }
      
      <!-- DELETE CONFIRMATION MODAL -->
      @if (showDeleteModal()) {
        <div class="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
           <div class="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden border border-red-100">
              <div class="bg-red-50 p-6 flex flex-col items-center text-center">
                 <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <i class="fas fa-trash-alt text-red-500 text-xl"></i>
                 </div>
                 <h3 class="text-lg font-bold text-slate-800 mb-2">¿Eliminar Cotización?</h3>
                 <p class="text-sm text-slate-500">Esta acción no se puede deshacer. ¿Desea continuar?</p>
              </div>
              <div class="flex border-t border-slate-100">
                 <button (click)="closeDeleteModal()" class="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-50 transition-colors text-sm">Cancelar</button>
                 <button (click)="confirmDeleteQuote()" class="flex-1 py-3 bg-red-500 text-white font-bold hover:bg-red-600 transition-colors text-sm">Eliminar</button>
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
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
  `]
})
export class QuotesComponent {
  db = inject(DbService);
  fb = inject(FormBuilder);

  quoteForm = this.fb.group({
    name: ['', Validators.required],
    phone: ['']
  });

  searchControl = this.fb.control('');

  // Use a map or a unique ID strategy because IDs might collide between exams and profiles if not careful,
  // although in DB they are UUIDs so it should be fine. I'll add a type prefix just in case or use the object reference.
  selectedItems = signal<any[]>([]);
  showModal = signal(false);
  generatedMessage = signal('');
  isGenerating = signal(false);
  viewingQuoteId = signal<number | null>(null);

  // Delete Modal State
  showDeleteModal = signal(false);
  quoteToDeleteId = signal<number | null>(null);

  availableItems = computed(() => {
    const exams = this.db.exams().map(e => ({ ...e, type: 'exam', price: e.price || 0, uniqueId: 'exam-' + e.id }));
    const profiles = this.db.profiles().map(p => ({ ...p, type: 'profile', price: p.price || 0, uniqueId: 'profile-' + p.id }));
    return [...exams, ...profiles].sort((a, b) => a.name.localeCompare(b.name));
  });

  filteredItems = computed(() => {
    const search = this.searchTerm().toLowerCase();
    return this.availableItems().filter(item =>
      item.name.toLowerCase().includes(search)
    );
  });

  total = computed(() => {
    return this.selectedItems().reduce((sum, item) => sum + item.price, 0);
  });

  constructor() {
    this.searchControl.valueChanges.subscribe(val => {
      this.searchTerm.set(val || '');
    });
  }

  searchTerm = signal('');

  toggleItem(item: any) {
    this.selectedItems.update(items => {
      const exists = items.some(i => i.uniqueId === item.uniqueId);
      if (exists) {
        return items.filter(i => i.uniqueId !== item.uniqueId);
      } else {
        return [...items, item];
      }
    });
  }

  isItemSelected(item: any) {
    return this.selectedItems().some(i => i.uniqueId === item.uniqueId);
  }

  async generateQuote() {
    if (this.quoteForm.invalid || this.selectedItems().length === 0) return;

    this.isGenerating.set(true);
    this.viewingQuoteId.set(null);

    try {
      const name = this.quoteForm.get('name')?.value || '';
      const phone = this.quoteForm.get('phone')?.value || '';
      const items = this.selectedItems();
      const total = this.total();

      const quoteData: Quote = {
        client_name: name,
        client_phone: phone,
        items: items.map(i => ({
          name: i.name,
          price: i.price,
          type: i.type,
          id: i.id,
          description: i.description,
          indication_id: i.indication_id
        })),
        total: total
      };

      const savedQuote = await this.db.addQuote(quoteData);

      this.generatedMessage.set(this.buildQuoteText(quoteData));
      this.showModal.set(true);

    } catch (e) {
      console.error("Error generating quote:", e);
      alert("Hubo un error al guardar la cotización. Intente de nuevo.");
    } finally {
      this.isGenerating.set(false);
    }
  }

  private buildQuoteText(quote: any): string {
    let message = `📄 COTIZACIÓN DE EXÁMENES DE LABORATORIO\n\n`;
    message += `🧪 Examen:\n\n`;

    // Items
    const items = quote.items || [];
    items.forEach((item: any) => {
      message += `${item.name} ……………………… Q. ${item.price.toFixed(2)}\n`;
    });

    message += `\nSubtotal: Q. ${quote.total.toFixed(2)}\n`;
    message += `💰 Total a pagar: Q. ${quote.total.toFixed(2)}\n\n`;

    // Conditions / Indications
    const uniqueIndications = new Set<string>();
    items.forEach((item: any) => {
      if (item.type === 'exam' && item.indication_id) {
        const indication = this.db.indications().find(ind => ind.id === item.indication_id);
        if (indication && indication.description) {
          uniqueIndications.add(indication.description);
        }
      }
    });

    message += `📝 Condiciones del paciente:\n\n`;
    if (uniqueIndications.size > 0) {
      uniqueIndications.forEach(ind => {
        // Clean up bullets if they exist in DB to match strict format or just append
        // User example has raw text lines.
        message += `${ind}\n\n`;
      });
    } else {
      message += `No requiere condiciones especiales.\n\n`;
    }

    // Descriptions
    items.forEach((item: any) => {
      if (item.description) {
        message += `🧪 ${item.description}\n\n`;
      }
    });

    // Payment Methods
    message += `💳 Formas de pago:\n\n`;
    message += `Efectivo\nTransferencia\nTarjeta\n\n`;

    // Location
    message += `📍 Atención con previa cita\n`;
    message += `Dirección: Residenciales Los Volcanes, G24, Sector Tacaná, Ciudad Quetzal, San Juan Sacatepéquez.\n\n`;

    // Footer
    message += `💙 Laboratorio Clínico BioSalud`;

    return message;
  }

  viewQuoteHistory(quote: Quote) {
    this.viewingQuoteId.set(quote.id || null);

    // Reconstruct message
    this.viewingQuoteId.set(quote.id || null);
    this.generatedMessage.set(this.buildQuoteText(quote));
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.viewingQuoteId.set(null);
  }

  async copyToClipboard() {
    try {
      await navigator.clipboard.writeText(this.generatedMessage());
      // Could show a toast here. For now just visual feedback could be nice but native alert is disruptive.
      // I'll assume the user knows it copied if they clicked it.
    } catch (err) {
      console.error('Failed to copy', err);
    }
  }

  deleteQuote(quote: Quote) {
    if (quote.id) {
      this.quoteToDeleteId.set(quote.id);
      this.showDeleteModal.set(true);
    }
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.quoteToDeleteId.set(null);
  }

  confirmDeleteQuote() {
    const id = this.quoteToDeleteId();
    if (id) {
      this.db.deleteQuote(id);
      this.closeDeleteModal();
    }
  }
}
