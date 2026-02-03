import { Component, ElementRef, OnInit, ViewChild, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DbService } from '../../../core/services/db.service';

declare const d3: any;

type ReportType = 'financial' | 'operational' | 'medical';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col">
      <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h1 class="text-2xl font-light text-slate-800">Centro de Inteligencia de Negocios</h1>
        
        <!-- Controls -->
        <div class="flex flex-wrap gap-4 items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-400 font-bold uppercase">Desde</span>
            <input type="date" [ngModel]="startDateStr()" (ngModelChange)="setStartDate($event)" 
              class="border-none bg-slate-50 text-slate-700 text-sm focus:ring-2 focus:ring-[#3498db] rounded px-2 py-1 outline-none">
          </div>
          <div class="hidden md:block w-px h-6 bg-slate-200"></div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-400 font-bold uppercase">Hasta</span>
            <input type="date" [ngModel]="endDateStr()" (ngModelChange)="setEndDate($event)" 
              class="border-none bg-slate-50 text-slate-700 text-sm focus:ring-2 focus:ring-[#3498db] rounded px-2 py-1 outline-none">
          </div>
          
          <!-- Presets -->
          <div class="flex gap-1 ml-2 border-l border-slate-200 pl-2">
             <button (click)="setPreset('today')" class="px-2 py-1 text-xs font-medium text-slate-500 hover:text-[#3498db] hover:bg-slate-50 rounded transition-colors" title="Hoy">Hoy</button>
             <button (click)="setPreset('week')" class="px-2 py-1 text-xs font-medium text-slate-500 hover:text-[#3498db] hover:bg-slate-50 rounded transition-colors" title="Últimos 7 Días">7D</button>
             <button (click)="setPreset('month')" class="px-2 py-1 text-xs font-medium text-slate-500 hover:text-[#3498db] hover:bg-slate-50 rounded transition-colors" title="Este Mes">Mes</button>
          </div>


        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="flex border-b border-slate-200 mb-6 overflow-x-auto">
        <button (click)="setTab('financial')" 
          [class.border-b-2]="activeTab() === 'financial'" 
          [class.border-[#3498db]]="activeTab() === 'financial'" 
          [class.text-[#3498db]]="activeTab() === 'financial'" 
          class="px-6 py-3 font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap">
          <i class="fas fa-chart-line"></i> Financiero
        </button>
        <button (click)="setTab('operational')" 
          [class.border-b-2]="activeTab() === 'operational'" 
          [class.border-[#3498db]]="activeTab() === 'operational'" 
          [class.text-[#3498db]]="activeTab() === 'operational'" 
          class="px-6 py-3 font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap">
          <i class="fas fa-cogs"></i> Operativo
        </button>
        <button (click)="setTab('medical')" 
          [class.border-b-2]="activeTab() === 'medical'" 
          [class.border-[#3498db]]="activeTab() === 'medical'" 
          [class.text-[#3498db]]="activeTab() === 'medical'" 
          class="px-6 py-3 font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap">
          <i class="fas fa-user-md"></i> Red Médica
        </button>
      </div>

      <!-- KPI Section -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        @switch (activeTab()) {
          @case ('financial') {
            <div class="bg-white p-6 border border-slate-200 border-l-4 border-l-[#3498db] shadow-sm rounded-r-lg">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ingresos Totales (Período)</div>
              <div class="text-3xl font-bold text-slate-800">Q{{ getFinancialKPIs().total | number:'1.2-2' }}</div>
            </div>
            <div class="bg-white p-6 border border-slate-200 border-l-4 border-l-[#3498db] shadow-sm rounded-r-lg">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ticket Promedio</div>
              <div class="text-3xl font-bold text-slate-800">Q{{ getFinancialKPIs().average | number:'1.2-2' }}</div>
            </div>
            <div class="bg-white p-6 border border-slate-200 border-l-4 border-l-[#3498db] shadow-sm rounded-r-lg">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transacciones</div>
              <div class="text-3xl font-bold text-slate-800">{{ getFinancialKPIs().count }}</div>
            </div>
          }
          @case ('operational') {
             <div class="bg-white p-6 border border-slate-200 border-l-4 border-l-[#1abc9c] shadow-sm rounded-r-lg">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Exámenes</div>
              <div class="text-3xl font-bold text-slate-800">{{ getOperationalKPIs().totalExams }}</div>
            </div>
            <div class="bg-white p-6 border border-slate-200 border-l-4 border-l-[#1abc9c] shadow-sm rounded-r-lg">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pruebas Distintas</div>
              <div class="text-3xl font-bold text-slate-800">{{ getOperationalKPIs().uniqueTests }}</div>
            </div>
          }
          @case ('medical') {
             <div class="bg-white p-6 border border-slate-200 border-l-4 border-l-[#f1c40f] shadow-sm rounded-r-lg">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Referencias</div>
              <div class="text-3xl font-bold text-slate-800">{{ getMedicalKPIs().totalReferrals }}</div>
            </div>
            <div class="bg-white p-6 border border-slate-200 border-l-4 border-l-[#f1c40f] shadow-sm rounded-r-lg">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Médicos Activos</div>
              <div class="text-3xl font-bold text-slate-800">{{ getMedicalKPIs().activeDoctors }}</div>
            </div>
          }
        }
      </div>

      <div class="flex flex-col lg:flex-row gap-6 h-[600px] lg:h-[500px] mb-6">
        <!-- Chart Container -->
        <div class="flex-1 bg-white p-6 border border-slate-200 flex flex-col shadow-sm rounded-lg">
           <div class="flex justify-between items-center mb-4">
             <h3 class="font-bold text-slate-700 uppercase tracking-wide text-xs">
               @switch (activeTab()) {
                 @case ('financial') { Tendencia de Ingresos }
                 @case ('operational') { Distribución de Pruebas }
                 @case ('medical') { Top Médicos Referidores }
               }
             </h3>
             <button (click)="refreshChart()" class="text-slate-400 hover:text-[#3498db] transition-colors" title="Actualizar Gráfico"><i class="fas fa-sync-alt"></i></button>
           </div>
           <div #chartContainer class="flex-1 w-full relative"></div>
        </div>

        <!-- Detail Table Sidebar -->
        <div class="w-full lg:w-1/3 bg-white border border-slate-200 shadow-sm flex flex-col overflow-hidden rounded-lg">
             <div class="p-4 border-b border-slate-100 bg-slate-50">
               <h3 class="font-bold text-slate-700 uppercase tracking-wide text-xs">Desglose Detallado</h3>
             </div>
             <div class="flex-1 overflow-y-auto custom-scrollbar">
               <table class="w-full text-sm text-left">
                  <thead class="text-xs text-slate-500 bg-slate-50 sticky top-0 z-10">
                    <tr>
                      <th class="px-4 py-2 font-medium">Concepto</th>
                      <th class="px-4 py-2 text-right font-medium">Valor</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (item of tableData(); track $index) {
                      <tr class="hover:bg-slate-50 transition-colors">
                        <td class="px-4 py-3 text-slate-600 truncate max-w-[150px]" [title]="item.label">{{ item.label }}</td>
                        <td class="px-4 py-3 text-right font-medium text-slate-800">{{ item.value }}</td>
                      </tr>
                    }
                    @if (tableData().length === 0) {
                      <tr>
                        <td colspan="2" class="text-center py-6 text-slate-400 italic">No hay datos en este período</td>
                      </tr>
                    }
                  </tbody>
               </table>
             </div>
        </div>
      </div>
      
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    :host { display: block; height: 100%; }
  `]
})
export class ReportsComponent implements OnInit {
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;
  db = inject(DbService);

  activeTab = signal<ReportType>('financial');

  // Date State
  startDateStr = signal<string>(this.formatDate(this.getFirstDayOfMonth()));
  endDateStr = signal<string>(this.formatDate(new Date()));

  // Computed Table Data
  tableData = computed(() => {
    switch (this.activeTab()) {
      case 'financial': return this.getFinancialTableData();
      case 'operational': return this.getOperationalTableData();
      case 'medical': return this.getMedicalTableData();
      default: return [];
    }
  });

  constructor() {
    effect(() => {
      // Trigger update when dates or tab change
      this.startDateStr();
      this.endDateStr();
      const currentTab = this.activeTab();
      // Wait for View Update
      setTimeout(() => this.renderChart(), 50);
    });
  }

  ngOnInit() {
    // Initial render handled by effect
  }

  // --- Date Helpers ---
  private getFirstDayOfMonth(): Date {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  private formatDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  setStartDate(val: string) { this.startDateStr.set(val); }
  setEndDate(val: string) { this.endDateStr.set(val); }

  setTab(tab: ReportType) {
    this.activeTab.set(tab);
  }

  setPreset(type: 'today' | 'week' | 'month') {
    const now = new Date();
    let start = new Date();

    switch (type) {
      case 'today':
        start = now;
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    this.startDateStr.set(this.formatDate(start));
    this.endDateStr.set(this.formatDate(now));
  }

  refreshChart() {
    this.renderChart();
  }

  // --- Data Getter with Filtering ---

  private getDateRange() {
    // End date should be end of day
    return {
      start: new Date(this.startDateStr()),
      end: new Date(this.endDateStr() + 'T23:59:59')
    };
  }

  private isWithinRange(dateStr: string): boolean {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const { start, end } = this.getDateRange();
    return d >= start && d <= end;
  }

  // --- KPIs and Aggregations ---

  getFinancialKPIs() {
    const sales = this.db.sales().filter(s => this.isWithinRange(s.date));
    const total = sales.reduce((acc, s) => acc + (s.total || 0), 0);
    return {
      total,
      count: sales.length,
      average: sales.length ? total / sales.length : 0
    };
  }

  getOperationalKPIs() {
    const results = this.db.labResults().filter(r => this.isWithinRange(r.date));
    const uniqueTests = new Set(results.map(r => r.testName.split('/')[0].trim())).size;
    return {
      totalExams: results.length,
      uniqueTests
    };
  }

  getMedicalKPIs() {
    const results = this.db.labResults().filter(r => this.isWithinRange(r.date));
    const patients = this.db.patients();
    const patientMap = new Map(patients.map(p => [p.id, p]));

    const relevantDoctors = new Set<string>();
    let referrals = 0;

    results.forEach(r => {
      const p = patientMap.get(r.patientId);
      if (p && p.doctor) {
        relevantDoctors.add(p.doctor);
        referrals++;
      }
    });

    return {
      totalReferrals: referrals,
      activeDoctors: relevantDoctors.size
    };
  }

  // --- Table Data Generators ---

  getFinancialTableData() {
    const sales = this.db.sales().filter(s => this.isWithinRange(s.date));
    return sales
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(s => ({
        label: `${s.patientName} (${s.date.substring(0, 10)})`,
        value: `Q${(s.total || 0).toFixed(2)}`
      }));
  }

  getOperationalTableData() {
    const results = this.db.labResults().filter(r => this.isWithinRange(r.date));
    const counts: Record<string, number> = {};
    results.forEach(r => {
      const name = r.testName.split('/')[0].trim();
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ label: name, value: count.toString() }));
  }

  getMedicalTableData() {
    const results = this.db.labResults().filter(r => this.isWithinRange(r.date));
    const patients = this.db.patients();
    const patientMap = new Map(patients.map(p => [p.id, p]));
    const doctorCounts: Record<string, number> = {};

    results.forEach(r => {
      const p = patientMap.get(r.patientId);
      if (p && p.doctor) {
        doctorCounts[p.doctor] = (doctorCounts[p.doctor] || 0) + 1;
      }
    });

    return Object.entries(doctorCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ label: name, value: `${count} exámenes` }));
  }

  // --- Export ---

  exportReport() {
    const data = this.tableData();
    if (!data.length) return;

    const bom = "\uFEFF"; // Byte Order Mark for Excel
    const csvContent = "data:text/csv;charset=utf-8," + bom
      + "Concepto,Valor\n"
      + data.map(row => `"${row.label}","${row.value}"`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateRange = `${this.startDateStr()}_${this.endDateStr()}`;
    link.setAttribute("download", `reporte_${this.activeTab()}_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  // --- Chart Rendering ---

  renderChart() {
    const element = this.chartContainer.nativeElement;
    // Clear previous
    d3.select(element).selectAll("*").remove();

    const width = element.offsetWidth;
    const height = element.offsetHeight;
    // Debounce/Safety for resizing or init
    if (width === 0 || height === 0) return;

    switch (this.activeTab()) {
      case 'financial': this.renderFinancialChart(element, width, height); break;
      case 'operational': this.renderOperationalChart(element, width, height); break;
      case 'medical': this.renderMedicalChart(element, width, height); break;
    }
  }

  renderFinancialChart(element: any, width: number, height: number) {
    const sales = this.db.sales().filter(s => this.isWithinRange(s.date));
    const dailyMap = new Map<string, number>();

    sales.forEach(s => {
      const day = s.date.substring(0, 10);
      dailyMap.set(day, (dailyMap.get(day) || 0) + (s.total || 0));
    });

    let data = Array.from(dailyMap.entries())
      .map(([day, value]) => ({ day, value }))
      .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());

    // If empty data, show empty state or return
    if (data.length === 0) {
      d3.select(element).append("text")
        .attr("x", width / 2).attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("fill", "#94a3b8")
        .text("No hay datos para mostrar");
      return;
    }

    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const svg = d3.select(element).append("svg")
      .attr("width", width).attr("height", height)
      .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // X scale
    const x = d3.scalePoint().domain(data.map(d => d.day)).range([0, w]);

    // Y scale
    const yMax = d3.max(data, (d: any) => d.value) || 100;
    const y = d3.scaleLinear().domain([0, yMax * 1.1]).range([h, 0]);

    // Area
    const area = d3.area()
      .x((d: any) => x(d.day))
      .y0(h)
      .y1((d: any) => y(d.value))
      .curve(d3.curveMonotoneX);

    svg.append("path")
      .datum(data)
      .attr("fill", "#dbeafe")
      .attr("d", area);

    // Line
    const line = d3.line()
      .x((d: any) => x(d.day))
      .y((d: any) => y(d.value))
      .curve(d3.curveMonotoneX);

    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 3)
      .attr("d", line);

    // Dots
    svg.selectAll(".dot")
      .data(data).enter().append("circle")
      .attr("cx", (d: any) => x(d.day))
      .attr("cy", (d: any) => y(d.value))
      .attr("r", 4)
      .attr("fill", "#2563eb")
      .append("title")
      .text((d: any) => `${d.day}\nQ${d.value.toFixed(2)}`);

    // Axes
    const xAxis = d3.axisBottom(x);
    // Limit ticks if too many
    if (data.length > 8) {
      const step = Math.ceil(data.length / 8);
      xAxis.tickValues(x.domain().filter((_: any, i: number) => i % step === 0));
    }

    svg.append("g").attr("transform", `translate(0,${h})`)
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    svg.append("g").call(d3.axisLeft(y).ticks(5).tickFormat((d: any) => `Q${d}`));
  }

  renderOperationalChart(element: any, width: number, height: number) {
    const data = this.getOperationalTableData().slice(0, 8);

    if (data.length === 0) {
      d3.select(element).append("text")
        .attr("x", width / 2).attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("fill", "#94a3b8")
        .text("No hay datos para mostrar");
      return;
    }

    const radius = Math.min(width, height) / 2 - 20;
    const svg = d3.select(element).append("svg")
      .attr("width", width).attr("height", height)
      .append("g").attr("transform", `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal()
      .range(["#3498db", "#1abc9c", "#9b59b6", "#f1c40f", "#e67e22", "#e74c3c", "#34495e", "#95a5a6"]);

    const pie = d3.pie().value((d: any) => parseFloat(d.value));
    const arc = d3.arc().innerRadius(radius * 0.5).outerRadius(radius);
    const hoverArc = d3.arc().innerRadius(radius * 0.5).outerRadius(radius + 10);

    const g = svg.selectAll('.arc')
      .data(pie(data))
      .enter().append('g')
      .attr('class', 'arc');

    g.append('path')
      .attr('d', arc)
      .attr('fill', (d: any) => color(d.data.label))
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
      .on("mouseover", function (this: any) { d3.select(this).transition().duration(200).attr("d", hoverArc); })
      .on("mouseout", function (this: any) { d3.select(this).transition().duration(200).attr("d", arc); })
      .append("title").text((d: any) => `${d.data.label}: ${d.data.value}`);
  }

  renderMedicalChart(element: any, width: number, height: number) {
    const rawData = this.getMedicalTableData().slice(0, 10);
    const data = rawData.map(d => ({ name: d.label, value: parseInt(d.value.split(' ')[0]) }));

    if (data.length === 0) {
      d3.select(element).append("text")
        .attr("x", width / 2).attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("fill", "#94a3b8")
        .text("No hay datos para mostrar");
      return;
    }

    const margin = { top: 20, right: 20, bottom: 80, left: 40 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const svg = d3.select(element).append("svg")
      .attr("width", width).attr("height", height)
      .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .range([0, w])
      .padding(0.3)
      .domain(data.map(d => d.name));

    const yMax = d3.max(data, (d: any) => d.value) || 10;
    const y = d3.scaleLinear()
      .range([h, 0])
      .domain([0, yMax * 1.1]);

    svg.selectAll(".bar")
      .data(data).enter().append("rect")
      .attr("class", "bar")
      .attr("x", (d: any) => x(d.name))
      .attr("width", x.bandwidth())
      .attr("y", (d: any) => y(d.value))
      .attr("height", (d: any) => h - y(d.value))
      .attr("fill", "#e74c3c")
      .append("title").text((d: any) => `${d.name}: ${d.value}`);

    svg.append("g").attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    svg.append("g").call(d3.axisLeft(y).ticks(5));
  }
}
