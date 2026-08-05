import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../core/services/theme.service';
import { ExcelService } from '../../core/services/excel.service';
import { WhatsAppService } from '../../core/services/whatsapp.service';
import { AuthService, AuthResponse } from '../../core/services/auth.service';

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

        <!-- Dynamic Days Remaining Navbar Badge -->
        <div class="days-remaining-pill" 
             [ngClass]="daysClass"
             *ngIf="currentUser"
             (click)="toggleProfileModal($event)"
             title="Días de servicio restantes. Haz clic para ver perfil completo.">
          <svg class="pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 16 14"></polyline>
          </svg>
          <div class="days-pill-text">
            <span class="days-num">{{ daysRemaining }}</span>
            <span class="days-label">días restantes</span>
          </div>
        </div>

        <!-- User Profile Pill & Dropdown Panel -->
        <div class="user-profile-wrapper" *ngIf="currentUser">
          <button class="user-pill-btn" 
                  [class.active]="showProfileModal"
                  (click)="toggleProfileModal($event)"
                  title="Mi Perfil y Suscripción">
            <div class="avatar-mini">
              {{ getUserInitial() }}
            </div>
            <div class="user-pill-info">
              <span class="user-name">{{ currentUser.agentName || currentUser.username }}</span>
              <span class="user-subtag">{{ currentUser.role === 'ROLE_ADMIN' ? 'Administrador' : 'Agente' }}</span>
            </div>
            <svg class="chevron-icon" [class.rotated]="showProfileModal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          <!-- Floating User Profile Dropdown Card -->
          <div class="profile-dropdown-card card" *ngIf="showProfileModal" (click)="$event.stopPropagation()">
            <!-- Card Header -->
            <div class="profile-card-header">
              <div class="avatar-large">
                {{ getUserInitial() }}
              </div>
              <div class="profile-header-meta">
                <h3 class="agent-title">{{ currentUser.agentName || currentUser.username }}</h3>
                <span class="user-handle">&#64;{{ currentUser.username }}</span>
                <span class="role-badge" [class.admin-role]="currentUser.role === 'ROLE_ADMIN'">
                  {{ currentUser.role === 'ROLE_ADMIN' ? '👑 Administrador' : '💼 Agente CRM' }}
                </span>
              </div>
            </div>

            <div class="card-divider"></div>

            <!-- Profile Info Grid -->
            <div class="profile-info-grid">
              <div class="info-item">
                <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <div class="info-text">
                  <span class="info-label">Correo Electrónico</span>
                  <span class="info-value">{{ currentUser.email || 'No registrado' }}</span>
                </div>
              </div>

              <div class="info-item">
                <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 21h18"></path><path d="M3 10h18"></path><path d="M5 6l7-3 7 3"></path><path d="M4 10v11"></path><path d="M20 10v11"></path>
                </svg>
                <div class="info-text">
                  <span class="info-label">Agencia / Banco</span>
                  <span class="info-value">{{ currentUser.bankAgency || 'Agencia General' }}</span>
                </div>
              </div>
            </div>

            <!-- Subscription Details Card -->
            <div class="sub-card" [ngClass]="daysClass">
              <div class="sub-card-header">
                <div class="sub-card-title">
                  <svg class="sub-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>Suscripción & Días Restantes</span>
                </div>

                <button class="btn-refresh-sub" (click)="refreshProfile()" [disabled]="isRefreshingProfile" title="Sincronizar días restantes">
                  <svg class="spin-icon-btn" [class.spin-icon]="isRefreshingProfile" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                  </svg>
                </button>
              </div>

              <div class="sub-counter-box">
                <span class="big-days-val">{{ daysRemaining }}</span>
                <span class="big-days-unit">Días Disponibles</span>
              </div>

              <!-- Progress Bar -->
              <div class="progress-container">
                <div class="progress-bar-fill" [style.width.%]="subscriptionProgress"></div>
              </div>

              <div class="sub-meta-footer">
                <span class="exp-date">Vence: {{ formatExpiryDate(currentUser.expiresAt) }}</span>
                <span class="status-chip" [class.active]="currentUser.status === 'ACTIVE'">
                  {{ currentUser.status === 'ACTIVE' ? 'ACTIVA' : currentUser.status }}
                </span>
              </div>
            </div>

            <!-- Profile Card Actions -->
            <div class="profile-card-actions">
              <button class="btn btn-logout-action" (click)="authService.logout()" title="Cerrar sesión">
                <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="9"></line>
                </svg>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Light / Dark Theme Toggle Button -->
        <button class="btn btn-secondary theme-toggle-btn" (click)="themeService.toggleTheme()" title="Cambiar tema">
          <svg class="btn-svg" *ngIf="themeService.currentTheme() === 'dark'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          <svg class="btn-svg" *ngIf="themeService.currentTheme() === 'light'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
        </button>

        <!-- Direct Logout Header Button -->
        <button class="btn btn-logout" (click)="authService.logout()" title="Cerrar Sesión">
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
      position: relative;
      z-index: 50;
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

    /* DAYS REMAINING NAVBAR BADGE */
    .days-remaining-pill {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.35rem 0.75rem;
      border-radius: 10px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;
    }
    .days-remaining-pill:hover {
      transform: translateY(-1px);
    }
    .pill-icon {
      width: 15px;
      height: 15px;
    }
    .days-pill-text {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .days-num {
      font-weight: 700;
      font-size: 0.875rem;
    }
    .days-label {
      font-size: 0.75rem;
      opacity: 0.9;
    }

    /* DAYS HEALTH VARIANTS */
    .days-healthy {
      background-color: var(--accent-cyan-light);
      border: 1px solid var(--accent-cyan-glow);
      color: var(--accent-cyan);
    }
    .days-healthy:hover {
      box-shadow: 0 0 12px var(--accent-cyan-glow);
    }
    .days-warning {
      background-color: rgba(234, 179, 8, 0.15);
      border: 1px solid rgba(234, 179, 8, 0.35);
      color: #eab308;
    }
    .days-warning:hover {
      box-shadow: 0 0 12px rgba(234, 179, 8, 0.3);
    }
    .days-danger {
      background-color: rgba(244, 63, 94, 0.15);
      border: 1px solid rgba(244, 63, 94, 0.35);
      color: #f43f5e;
      animation: pulseAlert 2s infinite ease-in-out;
    }
    @keyframes pulseAlert {
      0%, 100% { box-shadow: 0 0 0 rgba(244, 63, 94, 0); }
      50% { box-shadow: 0 0 12px rgba(244, 63, 94, 0.4); }
    }

    /* USER PROFILE WRAPPER & DROPDOWN */
    .user-profile-wrapper {
      position: relative;
    }
    .user-pill-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      padding: 0.3rem 0.65rem 0.3rem 0.35rem;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      color: var(--text-primary);
    }
    .user-pill-btn:hover, .user-pill-btn.active {
      border-color: var(--accent-cyan);
      background: var(--bg-card-hover);
    }
    .avatar-mini {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      background: linear-gradient(135deg, #0284c7 0%, #06b6d4 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
      box-shadow: 0 2px 8px rgba(6, 182, 212, 0.3);
    }
    .user-pill-info {
      display: flex;
      flex-direction: column;
      text-align: left;
      line-height: 1.1;
    }
    .user-name {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .user-subtag {
      font-size: 0.65rem;
      color: var(--text-muted);
      font-weight: 500;
    }
    .chevron-icon {
      width: 14px;
      height: 14px;
      color: var(--text-muted);
      transition: transform 0.2s ease;
    }
    .chevron-icon.rotated {
      transform: rotate(180deg);
      color: var(--accent-cyan);
    }

    /* FLOATING PROFILE DROPDOWN CARD */
    .profile-dropdown-card {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 320px;
      background-color: var(--bg-sidebar);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.25rem;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
      z-index: 1000;
      animation: dropdownFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes dropdownFadeIn {
      from { opacity: 0; transform: translateY(-8px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .profile-card-header {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .avatar-large {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: linear-gradient(135deg, #0284c7 0%, #06b6d4 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
      font-weight: 800;
      box-shadow: 0 4px 14px rgba(6, 182, 212, 0.4);
    }
    .profile-header-meta {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .agent-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
      line-height: 1.2;
    }
    .user-handle {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .role-badge {
      display: inline-block;
      margin-top: 0.25rem;
      font-size: 0.65rem;
      font-weight: 600;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
      background-color: var(--accent-cyan-light);
      color: var(--accent-cyan);
      border: 1px solid var(--accent-cyan-glow);
      width: fit-content;
    }
    .role-badge.admin-role {
      background-color: rgba(168, 85, 247, 0.15);
      color: #c084fc;
      border-color: rgba(168, 85, 247, 0.3);
    }

    .card-divider {
      height: 1px;
      background-color: var(--border-color);
      margin: 0.9rem 0;
    }

    .profile-info-grid {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      margin-bottom: 0.9rem;
    }
    .info-item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: var(--bg-card);
      padding: 0.5rem 0.75rem;
      border-radius: 10px;
      border: 1px solid var(--border-color);
    }
    .info-icon {
      width: 16px;
      height: 16px;
      color: var(--accent-cyan);
      flex-shrink: 0;
    }
    .info-text {
      display: flex;
      flex-direction: column;
      line-height: 1.15;
    }
    .info-label {
      font-size: 0.65rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
    }
    .info-value {
      font-size: 0.8rem;
      color: var(--text-primary);
      font-weight: 500;
      word-break: break-all;
    }

    /* SUB CARD IN DROPDOWN */
    .sub-card {
      border-radius: 12px;
      padding: 0.85rem;
      border: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .sub-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .sub-card-title {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .sub-icon {
      width: 14px;
      height: 14px;
    }
    .btn-refresh-sub {
      background: none;
      border: none;
      color: currentColor;
      cursor: pointer;
      padding: 0.2rem;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.8;
      transition: opacity 0.2s;
    }
    .btn-refresh-sub:hover {
      opacity: 1;
    }
    .spin-icon-btn {
      width: 14px;
      height: 14px;
    }

    .sub-counter-box {
      display: flex;
      align-items: baseline;
      gap: 0.4rem;
    }
    .big-days-val {
      font-size: 1.8rem;
      font-weight: 800;
      line-height: 1;
    }
    .big-days-unit {
      font-size: 0.8rem;
      font-weight: 600;
      opacity: 0.9;
    }

    .progress-container {
      width: 100%;
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 999px;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      background: currentColor;
      border-radius: 999px;
      transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .sub-meta-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.7rem;
    }
    .exp-date {
      opacity: 0.85;
    }
    .status-chip {
      font-weight: 700;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.15);
    }

    .profile-card-actions {
      margin-top: 0.85rem;
    }
    .btn-logout-action {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      padding: 0.55rem;
      border-radius: 10px;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #ef4444;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-logout-action:hover {
      background: #ef4444;
      color: #ffffff;
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
  public showProfileModal = false;
  public isRefreshingProfile = false;

  constructor(
    public themeService: ThemeService,
    public excelService: ExcelService,
    public waService: WhatsAppService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkWhatsAppStatus();
  }

  public get currentUser(): AuthResponse | null {
    return this.authService.currentUserValue;
  }

  public get daysRemaining(): number {
    return this.currentUser?.daysRemaining ?? 0;
  }

  public get daysClass(): string {
    const days = this.daysRemaining;
    if (days > 10) return 'days-healthy';
    if (days > 3) return 'days-warning';
    return 'days-danger';
  }

  public get subscriptionProgress(): number {
    const days = this.daysRemaining;
    const maxDays = 30;
    const percentage = Math.min(100, Math.max(0, (days / maxDays) * 100));
    return Math.round(percentage);
  }

  public getUserInitial(): string {
    const name = this.currentUser?.agentName || this.currentUser?.username || 'U';
    return name.charAt(0).toUpperCase();
  }

  public formatExpiryDate(dateStr?: string): string {
    if (!dateStr) return 'No especificada';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  public toggleProfileModal(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showProfileModal = !this.showProfileModal;
  }

  public refreshProfile(): void {
    this.isRefreshingProfile = true;
    this.authService.getProfile().subscribe({
      next: () => {
        this.isRefreshingProfile = false;
      },
      error: () => {
        this.isRefreshingProfile = false;
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.showProfileModal && !target.closest('.user-profile-wrapper') && !target.closest('.days-remaining-pill')) {
      this.showProfileModal = false;
    }
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
