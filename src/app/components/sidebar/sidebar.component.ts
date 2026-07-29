import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar">
      <div class="brand-header">
        <div class="logo-box">
          <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        </div>
        <div>
          <div class="brand-title">BulkWhatsApp</div>
          <div class="brand-sub">Banking CRM · v1.0</div>
        </div>
      </div>

      <nav class="nav-list">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
          <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
          <span class="nav-text">Dashboard</span>
        </a>
        <a routerLink="/whatsapp" routerLinkActive="active" class="nav-item">
          <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          <span class="nav-text">Vincular WhatsApp</span>
        </a>
        <a routerLink="/data-cleansing" routerLinkActive="active" class="nav-item">
          <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>
          <span class="nav-text">Limpieza de Datos</span>
        </a>
        <a routerLink="/logs" routerLinkActive="active" class="nav-item">
          <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <span class="nav-text">Historial & Logs</span>
        </a>
        <a *ngIf="isAdmin()" routerLink="/users" routerLinkActive="active" class="nav-item">
          <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span class="nav-text">Usuarios y Roles</span>
        </a>
        <a routerLink="/settings" routerLinkActive="active" class="nav-item">
          <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          <span class="nav-text">Configuración</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="status-box">
          <span class="pulse-dot"></span>
          <span>Evolution API v2</span>
        </div>

        <button class="logout-sidebar-btn" (click)="authService.logout()">
          <svg class="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      position: sticky;
      top: 0;
      height: 100vh;
      width: 250px;
      overflow-y: auto;
      background-color: var(--bg-sidebar);
      backdrop-filter: blur(16px);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 1.5rem 1rem;
      transition: all 0.2s ease;
      z-index: 100;
    }
    @media (max-width: 992px) {
      .sidebar {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid var(--border-color);
        padding: 1rem;
      }
    }
    .brand-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding-bottom: 1.25rem;
      margin-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
    }
    .logo-box {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background-color: var(--accent-cyan-light);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent-cyan);
      border: 1px solid var(--accent-cyan-glow);
    }
    .svg-icon {
      width: 22px;
      height: 22px;
    }
    .brand-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .brand-sub {
      font-size: 0.7rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .nav-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
    }
    @media (max-width: 992px) {
      .nav-list {
        flex-direction: row;
        overflow-x: auto;
      }
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
      text-decoration: none;
    }
    .nav-svg {
      width: 18px;
      height: 18px;
    }
    .nav-item:hover {
      background-color: var(--bg-card-hover);
      color: var(--text-primary);
    }
    .nav-item.active {
      background-color: var(--accent-cyan-light);
      color: var(--accent-cyan);
      font-weight: 600;
      border-left: 3px solid var(--accent-cyan);
    }
    .sidebar-footer {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }
    .status-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 0.85rem;
      background-color: var(--status-success-bg);
      border: 1px solid var(--status-success-border);
      border-radius: 10px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--status-success-text);
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #22c55e;
      box-shadow: 0 0 10px #22c55e;
    }
    .logout-sidebar-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.75rem;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #ef4444;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .logout-sidebar-btn:hover {
      background: #ef4444;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }
    .logout-icon {
      width: 16px;
      height: 16px;
    }
  `]
})
export class SidebarComponent {
  constructor(public authService: AuthService) {}

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }
}
