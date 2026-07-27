import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExcelService, FinancialContact } from '../../core/services/excel.service';

@Component({
  selector: 'app-contacts-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card table-card">
      <!-- Tabs & Search Header -->
      <div class="table-header">
        <div class="tab-buttons">
          <button class="tab-btn" [class.active]="activeTab() === 'valid'" (click)="activeTab.set('valid')">
            <span class="status-dot dot-valid"></span>
            <span>Listos para WhatsApp ({{ excelService.validContacts().length }})</span>
          </button>
          <button class="tab-btn" [class.active]="activeTab() === 'invalid'" (click)="activeTab.set('invalid')">
            <span class="status-dot dot-invalid"></span>
            <span>Seguimiento Call Center ({{ excelService.invalidContacts().length }})</span>
          </button>
        </div>

        <div class="search-box">
          <div class="search-input-wrapper">
            <svg class="search-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" class="form-control search-input" placeholder="Buscar cliente, CTA, agencia..." [(ngModel)]="searchQuery" />
          </div>
        </div>
      </div>

      <!-- Data Table -->
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>CTA BT</th>
              <th>Nombre Completo (Limpio)</th>
              <th>Teléfono Envío</th>
              <th>Producto</th>
              <th>Oferta (S/)</th>
              <th>Tasa (%)</th>
              <th>Plazo</th>
              <th>Agencia</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let contact of filteredContacts()" 
                [class.selected-row]="excelService.selectedContact()?.id === contact.id"
                (click)="excelService.selectContact(contact)"
                class="clickable-row">
              <td><code class="cta-code">{{ contact.ctaBt }}</code></td>
              <td>
                <div class="name-cell">
                  <span class="full-name">{{ contact.nombreCompleto }}</span>
                  <small class="name-tags">Primer: {{ contact.primerNombre }} | Pat: {{ contact.apellidoPaterno }}</small>
                </div>
              </td>
              <td>
                <span class="phone-tag" *ngIf="contact.telefonoValido">
                  +{{ contact.telefonoValido }}
                </span>
                <span class="phone-tag phone-invalid" *ngIf="!contact.telefonoValido">
                  Sin Celular
                </span>
              </td>
              <td><span class="badge badge-warning">{{ contact.producto }}</span></td>
              <td class="amount-cell"><strong>S/ {{ contact.oferta | number:'1.2-2' }}</strong></td>
              <td>{{ contact.tasa }}%</td>
              <td>{{ contact.plazo }}m</td>
              <td>{{ contact.agencia }}</td>
              <td>
                <span class="badge" [ngClass]="{
                  'badge-success': contact.estado === 'Enviado' || contact.estado === 'Interesado',
                  'badge-warning': contact.estado === 'Pendiente',
                  'badge-error': contact.estado === 'Fallido' || contact.estado === 'Sin Telefono'
                }">
                  {{ contact.estado }}
                </span>
              </td>
            </tr>
            <tr *ngIf="filteredContacts().length === 0">
              <td colspan="9" class="empty-cell">
                <span>No se encontraron registros. ¡Carga un archivo Excel arriba o presiona "Cargar Datos de Prueba"!</span>
                <br />
                <button class="btn btn-outline btn-sm mt-2" (click)="excelService.loadMockData()">
                  <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                  <span>Cargar Datos de Prueba Bancarios</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .table-card {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .table-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .tab-buttons {
      display: flex;
      gap: 0.5rem;
      background-color: var(--bg-input);
      padding: 0.35rem;
      border-radius: 12px;
      border: 1px solid var(--border-color);
      flex-wrap: wrap;
    }
    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.55rem 1.1rem;
      border: none;
      background: none;
      color: var(--text-secondary);
      font-size: 0.85rem;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .tab-btn.active {
      background-color: var(--bg-card);
      color: var(--text-primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
    }
    .dot-valid { background-color: #22c55e; box-shadow: 0 0 6px #22c55e; }
    .dot-invalid { background-color: #f43f5e; box-shadow: 0 0 6px #f43f5e; }
    .search-box {
      width: 300px;
    }
    @media (max-width: 640px) {
      .search-box {
        width: 100%;
      }
    }
    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-svg {
      position: absolute;
      left: 0.85rem;
      width: 16px;
      height: 16px;
      color: var(--text-muted);
    }
    .search-input {
      padding-left: 2.35rem;
    }
    .table-responsive {
      width: 100%;
      overflow-x: auto;
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
      min-width: 850px;
    }
    .data-table th, .data-table td {
      padding: 0.85rem 1rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }
    .data-table th {
      background-color: var(--bg-card-hover);
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.725rem;
      letter-spacing: 0.05em;
    }
    .clickable-row {
      cursor: pointer;
      transition: background-color 0.15s ease;
    }
    .clickable-row:hover {
      background-color: var(--bg-card-hover);
    }
    .selected-row {
      background-color: var(--accent-cyan-light) !important;
      border-left: 3px solid var(--accent-cyan);
    }
    .cta-code {
      font-family: monospace;
      background-color: var(--bg-input);
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      color: var(--accent-cyan);
    }
    .name-cell {
      display: flex;
      flex-direction: column;
    }
    .full-name {
      font-weight: 600;
      color: var(--text-primary);
    }
    .name-tags {
      font-size: 0.7rem;
      color: var(--text-muted);
    }
    .phone-tag {
      font-family: monospace;
      font-size: 0.8rem;
      color: var(--status-success-text);
      font-weight: 600;
    }
    .phone-invalid {
      color: var(--status-error-text);
    }
    .amount-cell {
      color: var(--accent-cyan);
    }
    .empty-cell {
      text-align: center;
      padding: 3rem;
      color: var(--text-muted);
    }
    .btn-svg {
      width: 14px;
      height: 14px;
    }
    .mt-2 {
      margin-top: 0.75rem;
    }
  `]
})
export class ContactsTableComponent {
  public activeTab = signal<'valid' | 'invalid'>('valid');
  public searchQuery = '';

  constructor(public excelService: ExcelService) {}

  public filteredContacts = computed(() => {
    const list = this.activeTab() === 'valid' ? this.excelService.validContacts() : this.excelService.invalidContacts();
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) return list;

    return list.filter(c => 
      c.nombreCompleto.toLowerCase().includes(query) ||
      c.ctaBt.toLowerCase().includes(query) ||
      c.agencia.toLowerCase().includes(query) ||
      c.telefonoValido.includes(query)
    );
  });
}
