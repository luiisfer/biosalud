
import { Component, ElementRef, OnInit, ViewChild, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DbService } from '../../../core/services/db.service';
declare const d3: any;

type ReportType = 'financial' | 'operational' | 'medical';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h1 class="text-2xl font-light text-slate-800 mb-6">Centro de Inteligencia de Negocios</h1>

      <!-- Tabs Navigation -->
      <div class="flex border-b border-slate-200 mb-8">
        <button (click)="setTab('financial')" 
          [class.border-b-2]="activeTab() === 'financial'" 
          [class.border-[#3498db]]="activeTab() === 'financial'" 
          [class.text-[#3498db]]="activeTab() === 'financial'" 
          class="px-6 py-3 font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2">
          <i class="fas fa-chart-line"></i> Financiero
        </button>
        <button (click)="setTab('operational')" 
          [class.border-b-2]="activeTab() === 'operational'" 
          [class.border-[#3498db]]="activeTab() === 'operational'" 
          [class.text-[#3498db]]="activeTab() === 'operational'" 
          class="px-6 py-3 font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2">
          <i class="fas fa-cogs"></i> Operativo
        </button>
        <button (click)="setTab('medical')" 
          [class.border-b-2]="activeTab() === 'medical'" 
          [class.border-[#3498db]]="activeTab() === 'medical'" 
          [class.text-[#3498db]]="activeTab() === 'medical'" 
          class="px-6 py-3 font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2">
          <i class="fas fa-user-md"></i> Red Médica
        </button>
      </div>

      <!-- KPI Section -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white p-6 border border-slate-200 border-l-4 border-l-[#3498db] shadow-sm">
          <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Exámenes este Mes</div>
          <div class="text-3xl font-bold text-slate-800">{{ db.getMonthlyExamCount() }}</div>
          <div class="text-[10px] text-green-500 mt-2"><i class="fas fa-arrow-up"></i> Actividad Operativa</div>
        </div>

        <div class="bg-white p-6 border border-slate-200 border-l-4 border-l-[#1abc9c] shadow-sm">
          <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Pacientes</div>
          <div class="text-3xl font-bold text-slate-800">{{ db.patients().length }}</div>
          <div class="text-[10px] text-slate-400 mt-2">Base de datos acumulada</div>
        </div>

        <div class="bg-white p-6 border border-slate-200 border-l-4 border-l-[#f1c40f] shadow-sm">
          <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Efectividad Médica</div>
          <div class="text-3xl font-bold text-slate-800">94%</div>
          <div class="text-[10px] text-blue-400 mt-2">Calidad de reporte</div>
        </div>
      </div>

      <!-- Chart Container (Full Width) -->
      <div class="bg-white p-6 border border-slate-200 h-[500px] flex flex-col mb-8 shadow-sm">
         <div class="flex justify-between items-center mb-4">
           <h3 class="font-bold text-slate-700 uppercase tracking-wide text-xs">
             @switch (activeTab()) {
               @case ('financial') { Tendencia de Ingresos (Últimos 7 Días) }
               @case ('operational') { Distribución de Pruebas Frecuentes }
               @case ('medical') { Top Médicos Referidores }
             }
           </h3>
           <button (click)="refreshChart()" class="text-slate-400 hover:text-[#3498db]" title="Actualizar Gráfico"><i class="fas fa-sync-alt"></i></button>
         </div>
         <div #chartContainer class="flex-1 w-full"></div>
      </div>
      
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  `]
})
export class ReportsComponent implements OnInit {
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;
  db = inject(DbService);

  activeTab = signal<ReportType>('financial');

  ngOnInit() {
    this.renderChart();
  }

  setTab(tab: ReportType) {
    this.activeTab.set(tab);
    // Small timeout to allow DOM update if needed, though mostly for visual reset feel
    setTimeout(() => this.renderChart(), 0);
  }

  refreshChart() {
    this.renderChart();
  }

  renderChart() {
    const element = this.chartContainer.nativeElement;
    d3.select(element).selectAll("*").remove(); // Clean canvas

    const width = element.offsetWidth;
    const height = element.offsetHeight;

    // Safety check if element isn't sized yet
    if (width === 0 || height === 0) return;

    switch (this.activeTab()) {
      case 'financial':
        this.renderFinancialChart(element, width, height);
        break;
      case 'operational':
        this.renderOperationalChart(element, width, height);
        break;
      case 'medical':
        this.renderMedicalChart(element, width, height);
        break;
    }
  }

  // --- Chart Implementations ---

  renderFinancialChart(element: any, width: number, height: number) {
    const data = this.db.getRevenueHistory();
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const svg = d3.select(element).append("svg")
      .attr("width", width).attr("height", height)
      .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scalePoint().domain(data.map((d: any) => d.day)).range([0, w]);
    const y = d3.scaleLinear().domain([0, d3.max(data, (d: any) => d.value) * 1.2]).range([h, 0]);

    // Area
    const area = d3.area()
      .x((d: any) => x(d.day))
      .y0(h)
      .y1((d: any) => y(d.value))
      .curve(d3.curveMonotoneX);

    svg.append("path")
      .datum(data)
      .attr("fill", "#dbeafe") // blue-100
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
      .attr("r", 5)
      .attr("fill", "#2563eb");

    // Axes
    svg.append("g").attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x)).style("color", "#94a3b8");
    svg.append("g").call(d3.axisLeft(y).ticks(5).tickFormat((d: any) => `Q${d}`))
      .style("color", "#94a3b8");
    svg.selectAll(".domain").remove();
  }

  renderOperationalChart(element: any, width: number, height: number) {
    const data = this.db.getExamDistribution();
    const radius = Math.min(width, height) / 2 - 20;

    const svg = d3.select(element).append("svg")
      .attr("width", width).attr("height", height)
      .append("g").attr("transform", `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal()
      .domain(data.map((d: any) => d.name))
      .range(["#3498db", "#1abc9c", "#9b59b6", "#f1c40f"]);

    const pie = d3.pie().value((d: any) => d.value).sort(null);
    const arc = d3.arc().innerRadius(radius * 0.5).outerRadius(radius);

    // Segments
    svg.selectAll('path')
      .data(pie(data))
      .enter().append('path')
      .attr('d', arc)
      .attr('fill', (d: any) => color(d.data.name))
      .attr('stroke', 'white')
      .style('stroke-width', '2px');

    // Labels
    svg.selectAll('text')
      .data(pie(data))
      .enter().append('text')
      .text((d: any) => `${d.data.name}`)
      .attr("transform", (d: any) => `translate(${arc.centroid(d)})`)
      .style("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "white")
      .style("font-weight", "bold");
  }

  renderMedicalChart(element: any, width: number, height: number) {
    const data = this.db.getMedicalReferrals();
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const svg = d3.select(element).append("svg")
      .attr("width", width).attr("height", height)
      .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().range([0, w]).padding(0.3);
    const y = d3.scaleLinear().range([h, 0]);

    x.domain(data.map((d: any) => d.name));
    y.domain([0, d3.max(data, (d: any) => d.value) * 1.1]);

    svg.selectAll(".bar")
      .data(data).enter().append("rect")
      .attr("class", "bar")
      .attr("x", (d: any) => x(d.name))
      .attr("width", x.bandwidth())
      .attr("y", (d: any) => y(d.value))
      .attr("height", (d: any) => h - y(d.value))
      .attr("fill", "#e74c3c");

    svg.append("g").attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x)).style("color", "#94a3b8");
    svg.append("g").call(d3.axisLeft(y).ticks(5))
      .style("color", "#94a3b8");
    svg.selectAll(".domain").remove();
  }
}
