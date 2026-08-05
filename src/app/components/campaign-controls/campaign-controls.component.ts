import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WhatsAppService } from '../../core/services/whatsapp.service';
import { ExcelService } from '../../core/services/excel.service';

@Component({
  selector: 'app-campaign-controls',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card controls-card">
      <div class="controls-grid">
        <!-- Anti-Ban Risk Selector -->
        <div class="risk-selector-zone">
          <div class="section-title">
            <svg class="title-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <span>Nivel de Protección Anti-Baneo:</span>
          </div>
          <div class="risk-pills">
            <button class="risk-btn" [class.active-low]="waService.riskLevel() === 'low'" (click)="waService.setRiskLevel('low')">
              Riesgo Bajo (Recomendado)
            </button>
            <button class="risk-btn" [class.active-med]="waService.riskLevel() === 'medium'" (click)="waService.setRiskLevel('medium')">
              Riesgo Medio
            </button>
            <button class="risk-btn" [class.active-high]="waService.riskLevel() === 'high'" (click)="waService.setRiskLevel('high')">
              Riesgo Alto
            </button>
          </div>
          <small class="risk-sub">{{ waService.getDelayRange().label }}</small>
        </div>

        <!-- Action Control Buttons -->
        <div class="action-buttons-zone">
          <button class="btn btn-primary btn-lg" 
                  [disabled]="waService.campaignStats().status === 'running' || excelService.validContacts().length === 0"
                  (click)="onStartCampaign()">
            <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            <span>{{ getStartButtonLabel() }}</span>
          </button>

          <button class="btn btn-secondary" 
                  *ngIf="waService.campaignStats().status === 'running'"
                  (click)="waService.pauseCampaign()">
            <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
            <span>Pausar</span>
          </button>

          <button class="btn btn-danger" 
                  *ngIf="waService.campaignStats().status === 'running' || waService.campaignStats().status === 'paused'"
                  (click)="waService.cancelCampaign()">
            <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
            <span>Cancelar</span>
          </button>
        </div>
      </div>

      <!-- Live Progress Bar -->
      <div class="progress-zone" *ngIf="waService.campaignStats().status !== 'idle'">
        <div class="progress-label-row">
          <span>Progreso del Envío: <strong>{{ waService.campaignStats().sent }} / {{ waService.campaignStats().total }}</strong></span>
          <span>{{ waService.campaignStats().progressPercent }}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" [style.width.%]="waService.campaignStats().progressPercent"></div>
        </div>
      </div>

      <!-- Post Campaign Download Report -->
      <div class="report-zone" *ngIf="waService.campaignStats().status === 'completed'">
        <span class="report-success">Campaña Finalizada Exitosamente (Enviados: {{ waService.campaignStats().sent }} | Fallidos: {{ waService.campaignStats().failed }})</span>
        <button class="btn btn-outline btn-sm" (click)="downloadFinalReport()">
          <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          <span>Descargar Reporte Final (.xlsx)</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .controls-card {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .controls-grid {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .risk-selector-zone {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .section-title {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .title-svg {
      width: 16px;
      height: 16px;
      color: var(--accent-cyan);
    }
    .risk-pills {
      display: flex;
      gap: 0.4rem;
    }
    .risk-btn {
      padding: 0.45rem 0.85rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background-color: var(--bg-input);
      color: var(--text-secondary);
      font-size: 0.775rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
    }
    .risk-btn:hover {
      border-color: var(--border-subtle);
    }
    .active-low {
      background-color: var(--status-success-bg);
      color: var(--status-success-text);
      border-color: var(--status-success-border);
    }
    .active-med {
      background-color: var(--status-warning-bg);
      color: var(--status-warning-text);
      border-color: var(--status-warning-border);
    }
    .active-high {
      background-color: var(--status-error-bg);
      color: var(--status-error-text);
      border-color: var(--status-error-border);
    }
    .risk-sub {
      font-size: 0.725rem;
      color: var(--text-muted);
    }
    .action-buttons-zone {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .btn-lg {
      padding: 0.8rem 1.75rem;
      font-size: 1rem;
    }
    .btn-svg {
      width: 16px;
      height: 16px;
    }
    .progress-zone {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--border-color);
    }
    .progress-label-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
    .progress-track {
      width: 100%;
      height: 10px;
      background-color: var(--bg-input);
      border-radius: var(--radius-full);
      overflow: hidden;
      border: 1px solid var(--border-color);
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #0284c7 0%, #06b6d4 100%);
      transition: width 0.3s ease;
    }
    .report-zone {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background-color: var(--status-success-bg);
      border: 1px solid var(--status-success-border);
      border-radius: var(--radius-md);
    }
    .report-success {
      color: var(--status-success-text);
      font-weight: 600;
      font-size: 0.85rem;
    }
  `]
})
export class CampaignControlsComponent {
  constructor(
    public waService: WhatsAppService,
    public excelService: ExcelService
  ) {}

  public getStartButtonLabel(): string {
    const selectedCount = this.excelService.selectedIds().size;
    const targetCount = this.excelService.getTargetContactsForCampaign().length;

    if (selectedCount > 0) {
      return `Iniciar Campaña (${targetCount} Seleccionados)`;
    }
    return `Iniciar Campaña Masiva (${targetCount} Clientes)`;
  }

  public onStartCampaign(): void {
    const targets = this.excelService.getTargetContactsForCampaign();
    if (targets.length === 0) {
      alert('¡Debes cargar un archivo Excel o seleccionar contactos válidos antes de iniciar!');
      return;
    }
    this.waService.startCampaign(targets);
  }

  public downloadFinalReport(): void {
    const valid = this.excelService.validContacts();
    const timestamp = new Date().toISOString().slice(0, 10);
    this.excelService.exportContactsToExcel(valid, `Reporte_Final_Campana_${timestamp}.xlsx`);
  }
}
