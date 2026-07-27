import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExcelService } from '../../core/services/excel.service';
import { WhatsAppService } from '../../core/services/whatsapp.service';

@Component({
  selector: 'app-kpi-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kpi-grid">
      <!-- Card 1: Total Imported -->
      <div class="card kpi-card">
        <div class="kpi-icon icon-blue">
          <svg class="kpi-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Total Importados</span>
          <h2 class="kpi-value">{{ excelService.allContacts().length }}</h2>
        </div>
      </div>

      <!-- Card 2: Valid WhatsApp -->
      <div class="card kpi-card card-cyan-glow">
        <div class="kpi-icon icon-green">
          <svg class="kpi-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Validados para WhatsApp</span>
          <h2 class="kpi-value text-green">{{ excelService.validContacts().length }}</h2>
        </div>
      </div>

      <!-- Card 3: Invalid / Manual Call List -->
      <div class="card kpi-card">
        <div class="kpi-icon icon-red">
          <svg class="kpi-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Lista Call Center (Sin WA)</span>
          <div class="kpi-value-row">
            <h2 class="kpi-value text-red">{{ excelService.invalidContacts().length }}</h2>
            <button class="btn btn-outline btn-xs" (click)="exportCallList()" *ngIf="excelService.invalidContacts().length > 0">
              <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              <span>Exportar</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Card 4: Campaign Progress -->
      <div class="card kpi-card">
        <div class="kpi-icon icon-cyan">
          <svg class="kpi-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Progreso de Envío</span>
          <h2 class="kpi-value">{{ waService.campaignStats().sent }} / {{ waService.campaignStats().total }}</h2>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
    }
    @media (max-width: 1200px) {
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 640px) {
      .kpi-grid {
        grid-template-columns: 1fr;
      }
    }
    .kpi-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
    }
    .kpi-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bg-card-hover);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
    }
    .kpi-svg {
      width: 24px;
      height: 24px;
    }
    .icon-blue { color: var(--accent-cyan); }
    .icon-green { color: var(--status-success-text); }
    .icon-red { color: var(--status-error-text); }
    .icon-cyan { color: var(--accent-cyan); }
    .kpi-info {
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .kpi-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 500;
    }
    .kpi-value {
      font-size: 1.6rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
      line-height: 1.2;
    }
    .kpi-value-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .text-green { color: var(--status-success-text); }
    .text-red { color: var(--status-error-text); }
    .btn-xs {
      padding: 0.2rem 0.5rem;
      font-size: 0.7rem;
      border-radius: 6px;
    }
    .btn-svg {
      width: 12px;
      height: 12px;
    }
  `]
})
export class KpiCardsComponent {
  constructor(
    public excelService: ExcelService,
    public waService: WhatsAppService
  ) {}

  public exportCallList(): void {
    const data = this.excelService.invalidContacts();
    alert(`Descargando Excel para Call Center con ${data.length} contactos sin WhatsApp.`);
  }
}
