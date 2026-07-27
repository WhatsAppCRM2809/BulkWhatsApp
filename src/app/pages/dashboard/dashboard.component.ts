import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiCardsComponent } from '../../components/kpi-cards/kpi-cards.component';
import { CampaignControlsComponent } from '../../components/campaign-controls/campaign-controls.component';
import { MessageBuilderComponent } from '../../components/message-builder/message-builder.component';
import { ContactsTableComponent } from '../../components/contacts-table/contacts-table.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    KpiCardsComponent,
    CampaignControlsComponent,
    MessageBuilderComponent,
    ContactsTableComponent
  ],
  template: `
    <div class="dashboard-page">
      <div class="page-heading">
        <h2>Dashboard General</h2>
        <p class="subtitle">Vista general de campaña masiva y métricas en tiempo real</p>
      </div>

      <!-- KPI Cards -->
      <app-kpi-cards></app-kpi-cards>

      <!-- Charts & Visual Analytics Bar -->
      <div class="card analytics-card">
        <div class="analytics-header">
          <div class="analytics-title">
            <svg class="header-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            <h3>Rendimiento de Envíos en Tiempo Real</h3>
          </div>
          <span class="badge badge-success">Live Analytics</span>
        </div>
        <div class="charts-grid">
          <!-- Chart 1: Messages Sent Bar Graph -->
          <div class="chart-box">
            <span class="chart-title">Métricas de Envío por Hora</span>
            <div class="bars-container">
              <div class="bar-col"><div class="bar" style="height: 45%"></div><span>10 AM</span></div>
              <div class="bar-col"><div class="bar" style="height: 75%"></div><span>11 AM</span></div>
              <div class="bar-col"><div class="bar" style="height: 90%"></div><span>12 PM</span></div>
              <div class="bar-col"><div class="bar" style="height: 60%"></div><span>01 PM</span></div>
              <div class="bar-col"><div class="bar" style="height: 85%"></div><span>02 PM</span></div>
              <div class="bar-col"><div class="bar active-bar" style="height: 100%"></div><span>Ahora</span></div>
            </div>
          </div>

          <!-- Chart 2: Conversion Metrics Progress -->
          <div class="chart-box">
            <span class="chart-title">Distribución de Respuesta</span>
            <div class="metrics-list">
              <div class="metric-item">
                <div class="metric-meta"><span>Entregados</span><strong>1,420 (85%)</strong></div>
                <div class="meter-track"><div class="meter-fill fill-green" style="width: 85%"></div></div>
              </div>
              <div class="metric-item">
                <div class="metric-meta"><span>Interesados</span><strong>264 (18.5%)</strong></div>
                <div class="meter-track"><div class="meter-fill fill-cyan" style="width: 18.5%"></div></div>
              </div>
              <div class="metric-item">
                <div class="metric-meta"><span>Fallidos / Sin WA</span><strong>350 (15%)</strong></div>
                <div class="meter-track"><div class="meter-fill fill-red" style="width: 15%"></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Campaign Controls -->
      <app-campaign-controls></app-campaign-controls>

      <!-- Message Builder & Live Smartphone Mockup -->
      <app-message-builder></app-message-builder>

      <!-- Tabbed Contacts Table -->
      <app-contacts-table></app-contacts-table>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .page-heading h2 {
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }
    .subtitle {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .analytics-card {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .analytics-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .analytics-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .header-svg {
      width: 18px;
      height: 18px;
      color: var(--accent-cyan);
    }
    .analytics-header h3 {
      font-size: 0.95rem;
      font-weight: 700;
      margin: 0;
      color: var(--text-primary);
    }
    .charts-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    @media (max-width: 768px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
    }
    .chart-box {
      background-color: var(--bg-input);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .chart-title {
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .bars-container {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      height: 120px;
      padding-top: 0.5rem;
    }
    .bar-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      height: 100%;
      justify-content: flex-end;
      flex: 1;
    }
    .bar {
      width: 24px;
      background-color: var(--border-subtle);
      border-radius: 6px 6px 0 0;
      transition: all 0.3s ease;
    }
    .active-bar {
      background: linear-gradient(180deg, #06b6d4 0%, #0284c7 100%);
      box-shadow: 0 0 12px rgba(6, 182, 212, 0.4);
    }
    .bar-col span {
      font-size: 0.675rem;
      color: var(--text-muted);
    }
    .metrics-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .metric-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .metric-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
    .meter-track {
      width: 100%;
      height: 8px;
      background-color: var(--bg-card);
      border-radius: 9999px;
      overflow: hidden;
    }
    .meter-fill {
      height: 100%;
      border-radius: 9999px;
    }
    .fill-green { background-color: #22c55e; }
    .fill-cyan { background-color: #06b6d4; }
    .fill-red { background-color: #f43f5e; }
  `]
})
export class DashboardComponent {}
