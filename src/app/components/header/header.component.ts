import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../core/services/theme.service';
import { ExcelService } from '../../core/services/excel.service';
import { WhatsAppService } from '../../core/services/whatsapp.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header">
      <div class="header-left">
        <h2>Panel de Envíos Masivos & Préstamos</h2>
        <span class="header-badge">Campaña Activa: Efectivo Tarjeta</span>
      </div>

      <div class="header-actions">
        <!-- Import Mode Pill Toggle -->
        <div class="mode-pill-box">
          <span class="mode-label">Modo Carga:</span>
          <button class="mode-btn" 
                  [class.active]="excelService.importMode() === 'append'" 
                  (click)="excelService.importMode.set('append')"
                  title="Conserva clientes anteriores y agrega los nuevos">
            Acumulativo (BD)
          </button>
          <button class="mode-btn" 
                  [class.active]="excelService.importMode() === 'replace'" 
                  (click)="excelService.importMode.set('replace')"
                  title="Sobrescribe la lista actual">
            Reemplazar
          </button>
        </div>

        <!-- Excel Upload Button -->
        <label class="btn btn-primary file-label">
          <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M8 13h2"></path><path d="M8 17h8"></path><path d="M14 13h2"></path></svg>
          <span>Importar Excel (.xlsx)</span>
          <input type="file" (change)="onFileSelected($event)" accept=".xlsx, .xls, .csv" hidden />
        </label>

        <!-- WhatsApp Status Badge & Refresh Button -->
        <div class="wa-status-group">
          <div class="status-badge-pill" [class.connected]="waService.isConnected()">
            <span class="dot" [class.dot-online]="waService.isConnected()"></span>
            <span class="status-text">
              {{ waService.isConnected() ? 'Conectado: ' + waService.connectedNumber() : 'WhatsApp Desconectado' }}
            </span>
          </div>

          <button class="btn btn-outline btn-xs refresh-status-btn" 
                  (click)="checkWhatsAppStatus()" 
                  [disabled]="isCheckingStatus" 
                  title="Comprobar estado actual en Evolution API">
            <svg class="btn-svg" [class.spin-icon]="isCheckingStatus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            <span>Verificar Estado</span>
          </button>
        </div>

        <!-- User Profile Pill -->
        <div class="user-pill" *ngIf="authService.currentUserValue">
          <svg class="user-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span class="user-name">{{ authService.currentUserValue.agentName || authService.currentUserValue.username }}</span>
        </div>

        <!-- Light / Dark Theme Toggle Button -->
        <button class="btn btn-secondary theme-toggle-btn" (click)="themeService.toggleTheme()">
          <svg class="btn-svg" *ngIf="themeService.currentTheme() === 'dark'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          <svg class="btn-svg" *ngIf="themeService.currentTheme() === 'light'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
        </button>

        <!-- Logout Button -->
        <button class="btn btn-logout" (click)="authService.logout()" title="Cerrar Sesión de Agente">
          <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          <span>Salir</span>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      background-color: var(--bg-header);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-color);
      gap: 1rem;
      flex-wrap: wrap;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    h2 {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }
    .header-badge {
      font-size: 0.7rem;
      color: var(--accent-cyan);
      background-color: var(--accent-cyan-light);
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      font-weight: 600;
      border: 1px solid var(--accent-cyan-glow);
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .mode-pill-box {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      background-color: var(--bg-input);
      border: 1px solid var(--border-color);
      padding: 0.25rem 0.5rem;
      border-radius: 10px;
    }
    .mode-label {
      font-size: 0.725rem;
      color: var(--text-muted);
      font-weight: 600;
      margin-right: 0.2rem;
    }
    .mode-btn {
      padding: 0.25rem 0.55rem;
      border-radius: 6px;
      border: none;
      background: none;
      font-size: 0.725rem;
      font-weight: 600;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .mode-btn.active {
      background-color: var(--accent-cyan-light);
      color: var(--accent-cyan);
      border: 1px solid var(--accent-cyan-glow);
    }
    .wa-status-group {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .status-badge-pill {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4rem 0.75rem;
      border-radius: 10px;
      background-color: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.25);
      color: #ef4444;
      font-size: 0.775rem;
      font-weight: 600;
    }
    .status-badge-pill.connected {
      background-color: rgba(34, 197, 94, 0.1);
      border-color: rgba(34, 197, 94, 0.25);
      color: #22c55e;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #ef4444;
      display: inline-block;
    }
    .dot-online {
      background-color: #22c55e;
      box-shadow: 0 0 8px #22c55e;
    }
    .refresh-status-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
    .btn-xs {
      padding: 0.35rem 0.65rem;
      font-size: 0.75rem;
      border-radius: 8px;
    }
    .btn-svg {
      width: 14px;
      height: 14px;
    }
    .spin-icon {
      animation: spin 0.6s ease-in-out infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .user-pill {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      padding: 0.35rem 0.75rem;
      border-radius: 10px;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .user-icon {
      width: 14px;
      height: 14px;
      color: var(--accent-cyan);
    }
    .btn-logout {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #ef4444;
      padding: 0.45rem 0.85rem;
      border-radius: 10px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.2s ease;
    }
    .btn-logout:hover {
      background: #ef4444;
      color: #ffffff;
    }
    .file-label {
      cursor: pointer;
    }
  `]
})
export class HeaderComponent implements OnInit {
  public isCheckingStatus = false;

  constructor(
    public themeService: ThemeService,
    public excelService: ExcelService,
    public waService: WhatsAppService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkWhatsAppStatus();
  }

  public checkWhatsAppStatus(): void {
    this.isCheckingStatus = true;
    this.waService.getStatus().subscribe({
      next: (info) => {
        this.isCheckingStatus = false;
        const isConn = info.status === 'CONNECTED';
        this.waService.isConnected.set(isConn);
        this.waService.connectedNumber.set(info.ownerJid || info.instanceName || 'WhatsApp Activo');
      },
      error: () => {
        this.isCheckingStatus = false;
        this.waService.isConnected.set(false);
      }
    });
  }

  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.excelService.parseExcelFile(input.files[0]);
    }
  }
}
