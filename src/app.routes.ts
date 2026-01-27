
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
import { LoginComponent } from './app/features/auth/login.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'patients', component: PatientsComponent, canActivate: [authGuard] },
  { path: 'exams', component: ExamsComponent, canActivate: [authGuard] },
  { path: 'agenda', component: AgendaComponent, canActivate: [authGuard] },
  { path: 'results', component: ResultsComponent, canActivate: [authGuard] },
  { path: 'reports', component: ReportsComponent, canActivate: [authGuard] },
  { path: 'sales', component: SalesComponent, canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard, adminGuard] },
  { path: 'users', component: UsersComponent, canActivate: [authGuard, adminGuard] },
];
