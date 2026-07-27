import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WhatsAppService } from '../../core/services/whatsapp.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-page">
      <div class="page-header">
        <div>
          <h2>Configuración del Sistema</h2>
          <p class="subtitle">Ajustes del motor de envío, sesión de WhatsApp y parámetros anti-baneo</p>
        </div>
        <button class="btn btn-primary" (click)="saveSettings()">
          <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
          <span>Guardar Cambios</span>
        </button>
      </div>

      <div class="settings-grid">
        <!-- 1. WhatsApp Connection Box -->
        <div class="card settings-card">
          <div class="card-header-title">
            <svg class="card-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
            <h3>Sesión de WhatsApp Web</h3>
          </div>
          <div class="form-group">
            <label>Número Vinculado:</label>
            <input type="text" class="form-control" [value]="waService.connectedNumber()" readonly />
          </div>
          <div class="form-group">
            <label>Estado de Conexión:</label>
            <span class="badge badge-success">Sesión Activa (Evolution API)</span>
          </div>
          <button class="btn btn-danger btn-sm mt-2" (click)="resetSession()">
            <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
            <span>Desconectar y Recargar QR</span>
          </button>
        </div>

        <!-- 2. Anti-Ban Parameters Box -->
        <div class="card settings-card">
          <div class="card-header-title">
            <svg class="card-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <h3>Parámetros Avanzados Anti-Baneo</h3>
          </div>
          <div class="form-group">
            <label>Simular "Escribiendo..." (Composing):</label>
            <div class="checkbox-row">
              <input type="checkbox" [(ngModel)]="enableTypingSimulation" id="chkTyping" />
              <label for="chkTyping" class="chk-label">Muestra "Escribiendo..." 3 a 5 segundos antes de soltar cada mensaje</label>
            </div>
          </div>
          <div class="form-group">
            <label>Pausa Automática por Bloques:</label>
            <select class="form-control" [(ngModel)]="pauseInterval">
              <option value="50">Pausar 10 minutos cada 50 mensajes</option>
              <option value="100">Pausar 5 minutos cada 100 mensajes</option>
              <option value="none">Sin pausas intermedias</option>
            </select>
          </div>
        </div>

        <!-- 3. API REST Endpoint Box -->
        <div class="card settings-card">
          <div class="card-header-title">
            <svg class="card-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            <h3>Conexión de API REST (Backend Spring Boot / Node)</h3>
          </div>
          <div class="form-group">
            <label>URL del Backend API:</label>
            <input type="text" class="form-control" [(ngModel)]="apiUrl" />
          </div>
          <div class="form-group">
            <label>Webhook de Respuestas (Interesados):</label>
            <input type="text" class="form-control" [(ngModel)]="webhookUrl" />
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-page {
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
    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    .settings-card {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .card-header-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
    }
    .card-svg {
      width: 18px;
      height: 18px;
      color: var(--accent-cyan);
    }
    .settings-card h3 {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .form-group label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .checkbox-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .chk-label {
      font-size: 0.775rem !important;
      font-weight: 400 !important;
      color: var(--text-muted) !important;
      cursor: pointer;
    }
    .btn-sm {
      padding: 0.4rem 0.8rem;
      font-size: 0.8rem;
    }
    .mt-2 {
      margin-top: 0.5rem;
    }
  `]
})
export class SettingsComponent {
  public enableTypingSimulation = true;
  public pauseInterval = '50';
  public apiUrl = 'http://localhost:8080/api/v1';
  public webhookUrl = 'http://localhost:8080/api/v1/webhooks/whatsapp';

  constructor(public waService: WhatsAppService) {}

  public saveSettings(): void {
    alert('Configuración guardada exitosamente.');
  }

  public resetSession(): void {
    alert('Sesión desconectada. Generando nuevo QR...');
  }
}
