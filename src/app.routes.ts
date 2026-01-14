
import { Routes } from '@angular/router';
import { DashboardComponent } from './app/features/dashboard/dashboard.component';
import { PatientsComponent } from './app/features/patients/patients.component';
import { AgendaComponent } from './app/features/agenda/agenda.component';
import { ResultsComponent } from './app/features/results/results.component';
import { ReportsComponent } from './app/features/reports/reports.component';
import { ExamsComponent } from './app/features/exams/exams.component';
import { SalesComponent } from './app/features/finance/sales.component';
import { SettingsComponent } from './app/features/settings/settings.component';
import { UsersComponent } from './app/features/admin/users.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'patients', component: PatientsComponent },
  { path: 'exams', component: ExamsComponent },
  { path: 'agenda', component: AgendaComponent },
  { path: 'results', component: ResultsComponent },
  { path: 'reports', component: ReportsComponent },
  { path: 'sales', component: SalesComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'users', component: UsersComponent },
];
