import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WhatsAppService, LogEvent } from '../../core/services/whatsapp.service';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="logs-page">
      <div class="page-header">
        <div>
          <h2>Historial & Logs de Ejecución</h2>
          <p class="subtitle">Eventos en tiempo real de envíos, entregas, errores y pausas anti-baneo</p>
        </div>
        <button class="btn btn-outline" (click)="downloadLogs()" *ngIf="waService.logs().length > 0">
          <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          <span>Descargar Logs (.txt)</span>
        </button>
      </div>

      <!-- Filter Bar -->
      <div class="card filter-card">
        <div class="filter-buttons">
          <button class="btn btn-xs" [class.btn-primary]="activeFilter() === 'all'" (click)="activeFilter.set('all')">Todos</button>
          <button class="btn btn-xs" [class.btn-primary]="activeFilter() === 'success'" (click)="activeFilter.set('success')">Success</button>
          <button class="btn btn-xs" [class.btn-primary]="activeFilter() === 'warn'" (click)="activeFilter.set('warn')">Warn</button>
          <button class="btn btn-xs" [class.btn-primary]="activeFilter() === 'error'" (click)="activeFilter.set('error')">Error</button>
          <button class="btn btn-xs" [class.btn-primary]="activeFilter() === 'info'" (click)="activeFilter.set('info')">Info</button>
        </div>
        <div class="stream-tag-box">
          <span class="pulse-dot"></span>
          <span class="live-stream-tag">Streaming en vivo activo ({{ waService.logs().length }} eventos)</span>
        </div>
      </div>

      <!-- Logs Stream List -->
      <div class="card logs-list-card">
        <div class="log-row" *ngFor="let log of filteredLogs()">
          <span class="log-ts">{{ log.ts }}</span>
          <span class="log-actor">{{ log.actor }}</span>
          <span class="badge" [ngClass]="{
            'badge-success': log.level === 'success',
            'badge-warning': log.level === 'warn',
            'badge-error': log.level === 'error',
            'badge-cyan': log.level === 'info'
          }">
            {{ log.level | uppercase }}
          </span>
          <span class="log-msg">{{ log.msg }}</span>
        </div>
        
        <div class="empty-logs" *ngIf="filteredLogs().length === 0">
          <p>No se registraron eventos en este filtro.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .logs-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    h2 {
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }
    .subtitle {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .btn-svg {
      width: 16px;
      height: 16px;
    }
    .filter-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1.25rem;
    }
    .filter-buttons {
      display: flex;
      gap: 0.5rem;
    }
    .btn-xs {
      padding: 0.3rem 0.6rem;
      font-size: 0.75rem;
    }
    .stream-tag-box {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #22c55e;
      box-shadow: 0 0 8px #22c55e;
    }
    .live-stream-tag {
      font-size: 0.75rem;
      color: var(--status-success-text);
      font-weight: 600;
    }
    .logs-list-card {
      display: flex;
      flex-direction: column;
      padding: 0;
      overflow: hidden;
    }
    .log-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.85rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
      font-size: 0.825rem;
    }
    .log-row:hover {
      background-color: var(--bg-card-hover);
    }
    .log-ts {
      font-family: monospace;
      color: var(--text-muted);
      font-size: 0.75rem;
    }
    .log-actor {
      font-family: monospace;
      font-weight: 700;
      font-size: 0.7rem;
      color: var(--text-secondary);
      background-color: var(--bg-input);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
    }
    .log-msg {
      color: var(--text-primary);
      flex: 1;
    }
    .badge-cyan {
      background-color: var(--accent-cyan-light);
      color: var(--accent-cyan);
      border-color: var(--accent-cyan-glow);
    }
    .empty-logs {
      padding: 2rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.85rem;
    }
  `]
})
export class LogsComponent {
  public activeFilter = signal<string>('all');

  constructor(public waService: WhatsAppService) {}

  public filteredLogs = () => {
    const filter = this.activeFilter();
    const all = this.waService.logs();
    if (filter === 'all') return all;
    return all.filter(l => l.level === filter);
  };

  public downloadLogs(): void {
    const logs = this.waService.logs();
    if (logs.length === 0) return;

    const content = logs
      .map(l => `[${l.ts}] [${l.level.toUpperCase()}] [${l.actor}] ${l.msg}`)
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Logs_Ejecucion_CRM_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
