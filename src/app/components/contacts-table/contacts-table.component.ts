import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExcelService, FinancialContact } from '../../core/services/excel.service';
import { ModalService } from '../../core/services/modal.service';

@Component({
  selector: 'app-contacts-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card table-card">
      <!-- Tabs, Actions & Search Header -->
      <div class="table-header">
        <div class="header-left">
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

          <div class="action-buttons">
            <button class="btn btn-add-manual" (click)="openAddModal()">
              <svg class="add-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Agregar Cliente</span>
            </button>

            <button class="btn btn-outline export-btn" (click)="onExportContacts()" title="Exportar esta lista a Excel (.xlsx)">
              <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              <span>Exportar Excel</span>
            </button>

            <button class="btn btn-danger-outline" (click)="confirmClearTable()">
              <svg class="trash-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <span>Limpiar Tabla</span>
            </button>
          </div>
        </div>

        <div class="search-box">
          <div class="search-input-wrapper">
            <svg class="search-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" class="form-control search-input" placeholder="Buscar cliente, DNI, CTA, agencia..." [ngModel]="searchQuery()" (ngModelChange)="onSearchChange($event)" />
          </div>
        </div>
      </div>

      <!-- Data Table -->
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th (click)="toggleSort('doc')" class="sortable-header" [class.active-sort-th]="sortColumn() === 'doc'">
                DOC / DNI
                <span class="sort-icon" *ngIf="sortColumn() === 'doc'">{{ sortDirection() === 'desc' ? '▼' : '▲' }}</span>
              </th>
              <th>CTA BT</th>
              <th (click)="toggleSort('nombreCompleto')" class="sortable-header" [class.active-sort-th]="sortColumn() === 'nombreCompleto'">
                Nombre Completo (Limpio)
                <span class="sort-icon" *ngIf="sortColumn() === 'nombreCompleto'">{{ sortDirection() === 'desc' ? '▼' : '▲' }}</span>
              </th>
              <th>Teléfono Envío</th>
              <th (click)="toggleSort('propension')" class="sortable-header" [class.active-sort-th]="sortColumn() === 'propension'" title="Clic para ordenar por Propensión Alta/Baja">
                Propensión
                <span class="sort-icon" *ngIf="sortColumn() === 'propension'">{{ sortDirection() === 'desc' ? '▼ (Mayor a Menor)' : '▲ (Menor a Mayor)' }}</span>
              </th>
              <th>Producto</th>
              <th (click)="toggleSort('oferta')" class="sortable-header" [class.active-sort-th]="sortColumn() === 'oferta'">
                Oferta (S/)
                <span class="sort-icon" *ngIf="sortColumn() === 'oferta'">{{ sortDirection() === 'desc' ? '▼' : '▲' }}</span>
              </th>
              <th (click)="toggleSort('tasa')" class="sortable-header" [class.active-sort-th]="sortColumn() === 'tasa'">
                Tasa (%)
                <span class="sort-icon" *ngIf="sortColumn() === 'tasa'">{{ sortDirection() === 'desc' ? '▼' : '▲' }}</span>
              </th>
              <th>Plazo</th>
              <th>Agencia</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let contact of paginatedContacts()" 
                [class.selected-row]="excelService.selectedContact()?.id === contact.id"
                (click)="excelService.selectedContact.set(contact)"
                class="clickable-row">
              <td><span class="doc-code">{{ contact.doc || '-' }}</span></td>
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
              <td>
                <span class="badge badge-propension" *ngIf="contact.propension !== undefined && contact.propension !== ''">
                  {{ contact.propension }}
                </span>
                <span class="text-muted" *ngIf="contact.propension === undefined || contact.propension === ''">-</span>
              </td>
              <td><span class="badge badge-warning">{{ contact.producto }}</span></td>
              <td class="amount-cell">S/ {{ contact.oferta | number:'1.2-2' }}</td>
              <td class="rate-cell">{{ contact.tasa }}%</td>
              <td>{{ contact.plazo }}m</td>
              <td>{{ contact.agencia }}</td>
              <td>
                <span class="badge" 
                      [class.badge-secondary]="contact.estado === 'Pendiente'"
                      [class.badge-success]="contact.estado === 'Enviado' || contact.estado === 'Interesado'"
                      [class.badge-danger]="contact.estado === 'Fallido' || contact.estado === 'Sin Telefono'">
                  {{ contact.estado }}
                </span>
              </td>
            </tr>

            <!-- Empty State -->
            <tr *ngIf="filteredContacts().length === 0">
              <td colspan="11" class="empty-state-cell">
                <div class="empty-state">
                  <svg class="empty-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  <p class="empty-title" *ngIf="searchQuery().trim().length > 0">No se encontraron clientes para "{{ searchQuery() }}"</p>
                  <p class="empty-title" *ngIf="searchQuery().trim().length === 0">No hay contactos cargados en la base de datos</p>
                  <p class="empty-sub">Importa una base de datos Excel (.xlsx, .csv) o haz clic en "Agregar Cliente".</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="pagination-footer" *ngIf="filteredContacts().length > 0">
        <div class="page-size-selector">
          <span>Mostrar</span>
          <select class="form-control page-size-select" [ngModel]="pageSize()" (ngModelChange)="onPageSizeChange($event)">
            <option [value]="10">10 por pág.</option>
            <option [value]="25">25 por pág.</option>
            <option [value]="50">50 por pág.</option>
            <option [value]="100">100 por pág.</option>
            <option [value]="500">500 por pág.</option>
          </select>
          <span class="pagination-info">
            Mostrando {{ getStartIndex() }} - {{ getEndIndex() }} de {{ filteredContacts().length }} clientes
          </span>
        </div>

        <div class="pagination-buttons">
          <button class="btn btn-outline nav-page-btn" [disabled]="currentPage() === 1" (click)="goToPage(1)" title="Primera página">
            &laquo;
          </button>
          <button class="btn btn-outline nav-page-btn" [disabled]="currentPage() === 1" (click)="goToPage(currentPage() - 1)" title="Anterior">
            &lt;
          </button>
          <span class="page-indicator">Página {{ currentPage() }} de {{ totalPages() }}</span>
          <button class="btn btn-outline nav-page-btn" [disabled]="currentPage() === totalPages()" (click)="goToPage(currentPage() + 1)" title="Siguiente">
            &gt;
          </button>
          <button class="btn btn-outline nav-page-btn" [disabled]="currentPage() === totalPages()" (click)="goToPage(totalPages())" title="Última página">
            &raquo;
          </button>
        </div>
      </div>
    </div>

    <!-- Modal para Agregar Cliente Manualmente -->
    <div class="modal-backdrop" *ngIf="showAddModal">
      <div class="modal-card">
        <div class="modal-header">
          <h3>➕ Agregar Nuevo Cliente al CRM</h3>
          <button class="close-btn" (click)="closeAddModal()">&times;</button>
        </div>

        <div class="modal-body">
          <div class="form-row">
            <div class="form-group col">
              <label>Nombre Completo (Cliente)*</label>
              <input type="text" class="form-control" [(ngModel)]="newContactForm.nombre" placeholder="Ej: CARLOS EDUARDO SILVA DIAZ" required />
            </div>
            <div class="form-group col">
              <label>Teléfono / Celular WhatsApp*</label>
              <input type="text" class="form-control" [(ngModel)]="newContactForm.telefono" placeholder="Ej: 987654321" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group col">
              <label>Cuenta / Código CTA BT</label>
              <input type="text" class="form-control" [(ngModel)]="newContactForm.ctaBt" placeholder="Ej: 88492019" />
            </div>
            <div class="form-group col">
              <label>Producto Financiero</label>
              <input type="text" class="form-control" [(ngModel)]="newContactForm.producto" placeholder="Ej: Préstamo Personal" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group col">
              <label>Monto Oferta (S/)</label>
              <input type="number" class="form-control" [(ngModel)]="newContactForm.oferta" placeholder="Ej: 15000" />
            </div>
            <div class="form-group col">
              <label>Tasa Preferencial (%)</label>
              <input type="number" class="form-control" [(ngModel)]="newContactForm.tasa" placeholder="Ej: 35.0" />
            </div>
            <div class="form-group col">
              <label>Plazo (Meses)</label>
              <input type="number" class="form-control" [(ngModel)]="newContactForm.plazo" placeholder="Ej: 12" />
            </div>
          </div>

          <div class="form-group">
            <label>Agencia Asignada</label>
            <input type="text" class="form-control" [(ngModel)]="newContactForm.agencia" placeholder="Ej: Agencia San Isidro" />
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-outline" (click)="closeAddModal()">Cancelar</button>
          <button class="btn btn-primary" (click)="saveManualContact()">💾 Guardar y Registrar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table-card {
      padding: 0;
      overflow: hidden;
    }
    .table-header {
      padding: 1.25rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .tab-buttons {
      display: flex;
      background-color: var(--bg-tertiary);
      padding: 0.25rem;
      border-radius: var(--radius-md);
      gap: 0.25rem;
    }
    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.85rem;
      border: none;
      background: none;
      color: var(--text-muted);
      font-size: 0.8rem;
      font-weight: 600;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: var(--transition);
    }
    .tab-btn.active {
      background-color: var(--bg-secondary);
      color: var(--text-primary);
      box-shadow: var(--shadow-sm);
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .dot-valid { background-color: var(--accent-cyan); }
    .dot-invalid { background-color: #f59e0b; }
    
    .action-buttons {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .btn-add-manual {
      background-color: #0284c7;
      color: #ffffff;
      padding: 0.45rem 0.85rem;
      font-size: 0.8rem;
      border: none;
      border-radius: var(--radius-md);
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
    }
    .btn-add-manual:hover {
      background-color: #0369a1;
    }
    .btn-danger-outline {
      background: transparent;
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #ef4444;
      padding: 0.45rem 0.85rem;
      font-size: 0.8rem;
      border-radius: var(--radius-md);
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
    }
    .btn-danger-outline:hover {
      background-color: rgba(239, 68, 68, 0.1);
    }
    .export-btn {
      padding: 0.45rem 0.85rem;
      font-size: 0.8rem;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
    .add-icon, .trash-icon, .btn-svg {
      width: 14px;
      height: 14px;
    }
    .search-box {
      flex: 1;
      max-width: 320px;
    }
    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-svg {
      position: absolute;
      left: 0.75rem;
      width: 16px;
      height: 16px;
      color: var(--text-muted);
    }
    .search-input {
      padding-left: 2.25rem;
      font-size: 0.85rem;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.825rem;
    }
    .data-table th {
      background-color: var(--bg-tertiary);
      color: var(--text-secondary);
      font-weight: 700;
      text-align: left;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-color);
      white-space: nowrap;
    }
    .sortable-header {
      cursor: pointer;
      user-select: none;
      transition: var(--transition);
    }
    .sortable-header:hover {
      color: var(--accent-cyan);
      background-color: var(--bg-hover);
    }
    .active-sort-th {
      color: var(--accent-cyan) !important;
      font-weight: 800 !important;
    }
    .sort-icon {
      font-size: 0.75rem;
      margin-left: 0.25rem;
    }
    .data-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-secondary);
      white-space: nowrap;
    }
    .clickable-row {
      cursor: pointer;
      transition: var(--transition);
    }
    .clickable-row:hover {
      background-color: var(--bg-hover);
    }
    .selected-row {
      background-color: var(--accent-cyan-light) !important;
    }
    .cta-code {
      font-family: monospace;
      color: var(--accent-cyan);
      background-color: var(--bg-tertiary);
      padding: 0.2rem 0.4rem;
      border-radius: var(--radius-sm);
    }
    .doc-code {
      font-family: monospace;
      color: var(--text-secondary);
      background-color: var(--bg-tertiary);
      padding: 0.2rem 0.4rem;
      border-radius: var(--radius-sm);
    }
    .badge-propension {
      background-color: rgba(236, 72, 153, 0.15);
      color: #ec4899;
      font-weight: 700;
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
      font-weight: 600;
      color: var(--accent-cyan);
    }
    .phone-invalid {
      color: #f59e0b;
    }
    .amount-cell {
      font-weight: 700;
      color: var(--text-primary);
    }
    .rate-cell {
      color: var(--accent-cyan);
      font-weight: 600;
    }
    .badge {
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-full);
      font-size: 0.7rem;
      font-weight: 600;
    }
    .badge-warning {
      background-color: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
    }
    .badge-secondary {
      background-color: var(--bg-tertiary);
      color: var(--text-muted);
    }
    .badge-success {
      background-color: var(--status-success-bg);
      color: var(--status-success-text);
    }
    .badge-danger {
      background-color: var(--status-error-bg);
      color: var(--status-error-text);
    }
    .empty-state-cell {
      padding: 3rem 1rem !important;
      text-align: center;
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      max-width: 400px;
      margin: 0 auto;
    }
    .empty-svg {
      width: 48px;
      height: 48px;
      color: var(--text-muted);
      opacity: 0.5;
    }
    .empty-title {
      font-weight: 700;
      font-size: 1rem;
      color: var(--text-primary);
      margin: 0;
    }
    .empty-sub {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin: 0;
      line-height: 1.4;
    }
    
    /* Modal Styles */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }
    .modal-card {
      background-color: var(--bg-secondary);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      width: 100%;
      max-width: 580px;
      padding: 1.5rem;
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .close-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 1.5rem;
      cursor: pointer;
    }
    .modal-body {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .form-row {
      display: flex;
      gap: 1rem;
    }
    .col {
      flex: 1;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
    
    /* Pagination Styles */
    .pagination-footer {
      padding: 0.85rem 1.25rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      background-color: var(--bg-tertiary);
    }
    .page-size-selector {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.825rem;
      color: var(--text-secondary);
    }
    .page-size-select {
      width: auto;
      padding: 0.35rem 0.65rem;
      font-size: 0.8rem;
    }
    .pagination-info {
      color: var(--text-muted);
      font-weight: 500;
    }
    .pagination-buttons {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .nav-page-btn {
      padding: 0.35rem 0.65rem;
      font-size: 0.8rem;
      min-width: 32px;
    }
    .page-indicator {
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--text-primary);
      padding: 0 0.5rem;
    }
  `]
})
export class ContactsTableComponent {
  public activeTab = signal<'valid' | 'invalid'>('valid');
  public searchQuery = signal<string>('');

  public pageSize = signal<number>(50);
  public currentPage = signal<number>(1);

  public sortColumn = signal<'propension' | 'oferta' | 'nombreCompleto' | 'doc' | 'tasa' | 'none'>('propension');
  public sortDirection = signal<'asc' | 'desc'>('desc');

  public showAddModal = false;
  public newContactForm = {
    nombre: '',
    telefono: '',
    ctaBt: '',
    producto: 'Préstamo Personal',
    oferta: 15000,
    tasa: 35.0,
    plazo: 12,
    agencia: ''
  };

  constructor(
    public excelService: ExcelService,
    private modalService: ModalService
  ) {}

  public onSearchChange(query: string): void {
    this.searchQuery.set(query || '');
    this.currentPage.set(1);
  }

  public toggleSort(col: 'propension' | 'oferta' | 'nombreCompleto' | 'doc' | 'tasa'): void {
    if (this.sortColumn() === col) {
      this.sortDirection.set(this.sortDirection() === 'desc' ? 'asc' : 'desc');
    } else {
      this.sortColumn.set(col);
      this.sortDirection.set('desc');
    }
    this.currentPage.set(1);
  }

  public filteredContacts = computed(() => {
    const rawList = this.activeTab() === 'valid' 
      ? this.excelService.validContacts() 
      : this.excelService.invalidContacts();

    let list = rawList;
    const q = this.searchQuery().toLowerCase().trim();

    if (q.length > 0) {
      list = rawList.filter(c => 
        c.nombreCompleto.toLowerCase().includes(q) ||
        (c.doc && c.doc.toLowerCase().includes(q)) ||
        c.ctaBt.toLowerCase().includes(q) ||
        c.telefonoT1.includes(q) ||
        c.telefonoValido.includes(q) ||
        c.agencia.toLowerCase().includes(q) ||
        (c.propension !== undefined && String(c.propension).toLowerCase().includes(q))
      );
    } else {
      list = [...rawList];
    }

    const col = this.sortColumn();
    const dir = this.sortDirection() === 'desc' ? -1 : 1;

    if (col !== 'none') {
      list.sort((a, b) => {
        if (col === 'propension') {
          const valA = Number(a.propension) || 0;
          const valB = Number(b.propension) || 0;
          return (valA - valB) * dir;
        }
        if (col === 'oferta') {
          return ((a.oferta || 0) - (b.oferta || 0)) * dir;
        }
        if (col === 'tasa') {
          return ((a.tasa || 0) - (b.tasa || 0)) * dir;
        }
        if (col === 'nombreCompleto') {
          return a.nombreCompleto.localeCompare(b.nombreCompleto) * dir;
        }
        if (col === 'doc') {
          return (a.doc || '').localeCompare(b.doc || '') * dir;
        }
        return 0;
      });
    }

    return list;
  });

  public totalPages = computed(() => {
    return Math.ceil(this.filteredContacts().length / this.pageSize()) || 1;
  });

  public paginatedContacts = computed(() => {
    const list = this.filteredContacts();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  public onPageSizeChange(newSize: any): void {
    this.pageSize.set(Number(newSize));
    this.currentPage.set(1);
  }

  public goToPage(page: number): void {
    if (page < 1) page = 1;
    if (page > this.totalPages()) page = this.totalPages();
    this.currentPage.set(page);
  }

  public getStartIndex(): number {
    if (this.filteredContacts().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  }

  public getEndIndex(): number {
    const end = this.currentPage() * this.pageSize();
    return end > this.filteredContacts().length ? this.filteredContacts().length : end;
  }

  public onExportContacts(): void {
    const list = this.filteredContacts();
    if (list.length === 0) {
      this.modalService.show({
        title: 'ℹ️ Nada que exportar',
        message: 'No hay contactos en la lista actual para exportar.',
        type: 'info',
        confirmText: 'Entendido'
      });
      return;
    }
    const tabName = this.activeTab() === 'valid' ? 'WhatsApp' : 'CallCenter';
    this.excelService.exportContactsToExcel(list, `Reporte_Clientes_${tabName}_${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  public openAddModal(): void {
    this.newContactForm = {
      nombre: '',
      telefono: '',
      ctaBt: '',
      producto: 'Préstamo Personal',
      oferta: 15000,
      tasa: 35.0,
      plazo: 12,
      agencia: ''
    };
    this.showAddModal = true;
  }

  public closeAddModal(): void {
    this.showAddModal = false;
  }

  public saveManualContact(): void {
    if (!this.newContactForm.telefono || this.newContactForm.telefono.trim().length < 8) {
      this.modalService.show({
        title: '⚠️ Número Obligatorio',
        message: 'Por favor ingrese un número de teléfono / WhatsApp válido (mínimo 8 o 9 dígitos).',
        type: 'error',
        confirmText: 'Entendido'
      });
      return;
    }

    const created = this.excelService.addManualContact(this.newContactForm);
    this.closeAddModal();

    if (created.hasWhatsApp) {
      this.activeTab.set('valid');
      this.modalService.show({
        title: '✅ Cliente Registrado',
        message: `El cliente "${created.nombreCompleto}" con número +${created.telefonoValido} fue agregado exitosamente y listo para el recorrido de WhatsApp.`,
        type: 'success',
        confirmText: 'Genial'
      });
    } else {
      this.activeTab.set('invalid');
      this.modalService.show({
        title: '⚠️ Registrado en Call Center',
        message: `El número ingresado no cumple el formato peruano celular (+51 9XXXXXXXX). Se registró en la pestaña "Seguimiento Call Center".`,
        type: 'warning',
        confirmText: 'Entendido'
      });
    }
  }

  public confirmClearTable(): void {
    if (this.excelService.allContacts().length === 0) {
      this.modalService.show({
        title: 'ℹ️ Tabla Vacía',
        message: 'No hay clientes registrados en la tabla actualmente.',
        type: 'info',
        confirmText: 'Entendido'
      });
      return;
    }

    this.modalService.show({
      title: '⚠️ ¿Limpiar toda la tabla?',
      message: 'Esta acción eliminará todos los clientes de la lista actual. ¿Estás seguro de que deseas continuar?',
      type: 'warning',
      showCancel: true,
      cancelText: 'No, cancelar',
      confirmText: 'Sí, limpiar tabla',
      onConfirm: () => {
        this.excelService.clearDatabase();
        this.modalService.show({
          title: '🗑️ Tabla Limpiada',
          message: 'Se han eliminado correctamente todos los clientes de la tabla.',
          type: 'success',
          confirmText: 'Aceptar'
        });
      }
    });
  }
}
