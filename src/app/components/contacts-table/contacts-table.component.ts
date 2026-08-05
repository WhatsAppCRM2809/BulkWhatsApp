import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExcelService, FinancialContact, ContactStatus } from '../../core/services/excel.service';
import { ModalService } from '../../core/services/modal.service';

@Component({
  selector: 'app-contacts-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card table-card">
      <!-- Status Filter Tabs & Action Bar -->
      <div class="table-header">
        <div class="header-left">
          <!-- Status Filter Tabs -->
          <div class="tab-buttons">
            <button class="tab-btn" [class.active]="activeTab() === 'all'" (click)="setTab('all')">
              <span class="status-dot dot-all"></span>
              <span>Todos ({{ excelService.totalRecords() }})</span>
            </button>
            <button class="tab-btn" [class.active]="activeTab() === 'no_atendido'" (click)="setTab('no_atendido')">
              <span class="status-dot dot-pending"></span>
              <span>No Atendidos ({{ countByStatus('No atendido') }})</span>
            </button>
            <button class="tab-btn" [class.active]="activeTab() === 'enviado'" (click)="setTab('enviado')">
              <span class="status-dot dot-sent"></span>
              <span>Enviados ({{ countByStatus('Enviado') }})</span>
            </button>
            <button class="tab-btn" [class.active]="activeTab() === 'atendido'" (click)="setTab('atendido')">
              <span class="status-dot dot-attended"></span>
              <span>Atendidos ({{ countByStatus('Atendido') }})</span>
            </button>
            <button class="tab-btn" [class.active]="activeTab() === 'invalid'" (click)="setTab('invalid')">
              <span class="status-dot dot-invalid"></span>
              <span>Call Center ({{ excelService.invalidContacts().length }})</span>
            </button>
          </div>

          <!-- Quick Actions Bar -->
          <div class="action-buttons">
            <button class="btn btn-select-all" (click)="toggleSelectAllVisible()">
              <input type="checkbox" [checked]="isAllVisibleSelected()" (click)="$event.stopPropagation(); toggleSelectAllVisible()" />
              <span>{{ isAllVisibleSelected() ? 'Deseleccionar Todos' : 'Seleccionar Todos (' + filteredContacts().length + ')' }}</span>
            </button>

            <button class="btn btn-danger-outline" *ngIf="selectedIds().size > 0" (click)="confirmDeleteSelected()">
              <svg class="trash-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <span>Eliminar Seleccionados ({{ selectedIds().size }})</span>
            </button>

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
              <span>Limpiar Todo</span>
            </button>
          </div>
        </div>

        <!-- Search Box -->
        <div class="search-box">
          <div class="search-input-wrapper">
            <svg class="search-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" class="form-control search-input" placeholder="Buscar cliente, DNI, teléfono..." [ngModel]="searchQuery()" (ngModelChange)="onSearchChange($event)" />
          </div>
        </div>
      </div>

      <!-- Data Table -->
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th class="checkbox-th">
                <input type="checkbox" [checked]="isAllVisibleSelected()" (change)="toggleSelectAllVisible()" title="Seleccionar/Deseleccionar todos los visibles" />
              </th>
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
              <th (click)="toggleSort('propension')" class="sortable-header" [class.active-sort-th]="sortColumn() === 'propension'">
                Propensión
                <span class="sort-icon" *ngIf="sortColumn() === 'propension'">{{ sortDirection() === 'desc' ? '▼' : '▲' }}</span>
              </th>
              <th (click)="toggleSort('oferta')" class="sortable-header" [class.active-sort-th]="sortColumn() === 'oferta'">
                Oferta (S/)
                <span class="sort-icon" *ngIf="sortColumn() === 'oferta'">{{ sortDirection() === 'desc' ? '▼' : '▲' }}</span>
              </th>
              <th>Agencia</th>
              <th (click)="toggleSort('estado')" class="sortable-header" [class.active-sort-th]="sortColumn() === 'estado'">
                Estado de Seguimiento
                <span class="sort-icon" *ngIf="sortColumn() === 'estado'">{{ sortDirection() === 'desc' ? '▼' : '▲' }}</span>
              </th>
              <th class="actions-th">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let contact of paginatedContacts()" 
                [class.selected-row]="selectedIds().has(contact.id)"
                class="clickable-row">
              <td class="checkbox-td" (click)="$event.stopPropagation()">
                <input type="checkbox" [checked]="selectedIds().has(contact.id)" (change)="toggleSelectContact(contact.id)" />
              </td>

              <td>
                <span class="doc-code" *ngIf="editingRowId !== contact.id">{{ contact.doc || '-' }}</span>
                <input *ngIf="editingRowId === contact.id" 
                       type="text" 
                       class="form-control form-control-sm inline-input-doc" 
                       [(ngModel)]="editForm.doc" 
                       (keyup.enter)="saveInlineEdit(contact.id)"
                       placeholder="DNI / DOC" />
              </td>
              <td><code class="cta-code">{{ contact.ctaBt }}</code></td>
              
              <!-- Editable Name -->
              <td>
                <div class="name-cell">
                  <span class="full-name" *ngIf="editingRowId !== contact.id">{{ contact.nombreCompleto }}</span>
                  <input *ngIf="editingRowId === contact.id" 
                         type="text" 
                         class="form-control form-control-sm" 
                         [(ngModel)]="editForm.nombreCompleto" 
                         (keyup.enter)="saveInlineEdit(contact.id)" />
                  <small class="name-tags" *ngIf="editingRowId !== contact.id">Primer: {{ contact.primerNombre }} | Pat: {{ contact.apellidoPaterno }}</small>
                </div>
              </td>

              <!-- Multi-Phone Selector -->
              <td (click)="$event.stopPropagation()">
                <div class="phone-selector-wrapper">
                  <!-- Single phone view or multi phone selector -->
                  <select *ngIf="getPhoneOptions(contact).length > 1" 
                          class="form-control form-control-sm phone-select"
                          [ngModel]="contact.telefonoValido"
                          (ngModelChange)="onPhoneSelected(contact, $event)">
                    <option *ngFor="let p of getPhoneOptions(contact)" [value]="p.value">
                      {{ p.label }} (+{{ p.value }})
                    </option>
                  </select>

                  <span class="phone-tag" *ngIf="getPhoneOptions(contact).length <= 1 && contact.telefonoValido">
                    +{{ contact.telefonoValido }}
                  </span>
                  <span class="phone-tag phone-invalid" *ngIf="getPhoneOptions(contact).length === 0 && !contact.telefonoValido">
                    Sin Celular
                  </span>
                </div>
              </td>

              <td>
                <span class="badge badge-propension" *ngIf="contact.propension !== undefined && contact.propension !== ''">
                  {{ contact.propension }}
                </span>
                <span class="text-muted" *ngIf="contact.propension === undefined || contact.propension === ''">-</span>
              </td>

              <td class="amount-cell">
                <span *ngIf="editingRowId !== contact.id">S/ {{ contact.oferta | number:'1.2-2' }}</span>
                <input *ngIf="editingRowId === contact.id" 
                       type="number" 
                       class="form-control form-control-sm inline-input" 
                       [(ngModel)]="editForm.oferta" 
                       (keyup.enter)="saveInlineEdit(contact.id)" />
              </td>

              <td>{{ contact.agencia || 'Agencia Principal' }}</td>

              <!-- Interactive 1-Click Status Toggle Button -->
              <td (click)="$event.stopPropagation()">
                <button class="status-toggle-badge"
                        [class.badge-no-atendido]="contact.estado === 'No atendido' || contact.estado === 'Pendiente'"
                        [class.badge-atendido]="contact.estado === 'Atendido'"
                        [class.badge-enviado]="contact.estado === 'Enviado'"
                        [class.badge-fallido]="contact.estado === 'Fallido' || contact.estado === 'Sin Telefono'"
                        (click)="toggleStatus(contact)"
                        title="Haz clic para alternar entre 'No atendido' y 'Atendido'">
                  {{ contact.estado }}
                </button>
              </td>

              <!-- Row Action Buttons -->
              <td class="actions-td" (click)="$event.stopPropagation()">
                <button class="row-action-btn edit-btn" *ngIf="editingRowId !== contact.id" (click)="startInlineEdit(contact)" title="Editar datos">
                  <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="row-action-btn save-btn" *ngIf="editingRowId === contact.id" (click)="saveInlineEdit(contact.id)" title="Guardar">
                  <svg class="action-icon icon-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </button>
                <button class="row-action-btn cancel-btn" *ngIf="editingRowId === contact.id" (click)="cancelInlineEdit()" title="Cancelar">
                  <svg class="action-icon icon-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <button class="row-action-btn delete-btn" (click)="confirmDeleteContact(contact)" title="Eliminar fila">
                  <svg class="action-icon icon-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </td>
            </tr>

            <!-- Empty State -->
            <tr *ngIf="filteredContacts().length === 0">
              <td colspan="10" class="empty-state-cell">
                <div class="empty-state">
                  <svg class="empty-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  <p class="empty-title" *ngIf="searchQuery().trim().length > 0">No se encontraron clientes para "{{ searchQuery() }}"</p>
                  <p class="empty-title" *ngIf="searchQuery().trim().length === 0">No hay contactos en esta categoría</p>
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
          <button class="btn btn-outline nav-page-btn" [disabled]="activePage() === 1" (click)="goToPage(1)" title="Primera página">
            &laquo;
          </button>
          <button class="btn btn-outline nav-page-btn" [disabled]="activePage() === 1" (click)="goToPage(activePage() - 1)" title="Anterior">
            &lt;
          </button>
          <span class="page-indicator">Página {{ activePage() }} de {{ totalPages() }}</span>
          <button class="btn btn-outline nav-page-btn" [disabled]="activePage() === totalPages()" (click)="goToPage(activePage() + 1)" title="Siguiente">
            &gt;
          </button>
          <button class="btn btn-outline nav-page-btn" [disabled]="activePage() === totalPages()" (click)="goToPage(totalPages())" title="Última página">
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
              <label>DNI / Documento Identidad</label>
              <input type="text" class="form-control" [(ngModel)]="newContactForm.doc" placeholder="Ej: 74819203" />
            </div>
            <div class="form-group col">
              <label>Cuenta / Código CTA BT</label>
              <input type="text" class="form-control" [(ngModel)]="newContactForm.ctaBt" placeholder="Ej: 88492019" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group col">
              <label>Producto Financiero</label>
              <input type="text" class="form-control" [(ngModel)]="newContactForm.producto" placeholder="Ej: Préstamo Personal" />
            </div>
            <div class="form-group col">
              <label>Agencia Asignada</label>
              <input type="text" class="form-control" [(ngModel)]="newContactForm.agencia" placeholder="Ej: Agencia San Isidro" />
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
      gap: 1.25rem;
      flex-wrap: wrap;
    }
    .tab-buttons {
      display: flex;
      background-color: var(--bg-tertiary);
      padding: 0.25rem;
      border-radius: var(--radius-md);
      gap: 0.25rem;
      flex-wrap: wrap;
    }
    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.45rem 0.75rem;
      border: none;
      background: none;
      color: var(--text-muted);
      font-size: 0.775rem;
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
    .dot-all { background-color: var(--accent-cyan); }
    .dot-pending { background-color: #f59e0b; }
    .dot-sent { background-color: #10b981; }
    .dot-attended { background-color: #3b82f6; }
    .dot-invalid { background-color: #ef4444; }
    
    .action-buttons {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .btn-select-all {
      background-color: var(--bg-tertiary);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      padding: 0.45rem 0.75rem;
      font-size: 0.775rem;
      border-radius: var(--radius-md);
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-weight: 600;
      cursor: pointer;
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
      max-width: 300px;
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
      padding: 0.75rem 0.85rem;
      border-bottom: 1px solid var(--border-color);
      white-space: nowrap;
    }
    .checkbox-th, .checkbox-td {
      width: 36px;
      text-align: center !important;
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
      padding: 0.65rem 0.85rem;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-secondary);
      white-space: nowrap;
    }
    .clickable-row {
      transition: var(--transition);
    }
    .clickable-row:hover {
      background-color: var(--bg-hover);
    }
    .selected-row {
      background-color: rgba(6, 182, 212, 0.08) !important;
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
    .phone-selector-wrapper {
      display: flex;
      align-items: center;
    }
    .phone-select {
      font-family: monospace;
      font-size: 0.775rem;
      font-weight: 600;
      padding: 0.2rem 0.4rem;
      max-width: 140px;
    }
    .phone-tag {
      font-family: monospace;
      font-weight: 600;
      color: var(--accent-cyan);
    }
    .phone-invalid {
      color: #ef4444;
    }
    .amount-cell {
      font-weight: 700;
      color: var(--text-primary);
    }
    .inline-input {
      max-width: 90px;
      padding: 0.2rem 0.4rem;
      font-size: 0.8rem;
    }
    .inline-input-doc {
      max-width: 100px;
      padding: 0.2rem 0.4rem;
      font-size: 0.8rem;
      font-family: monospace;
    }
    
    /* Status Toggle Badge Button (1-Click Fixed Width Capsule) */
    .status-toggle-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.35rem 0.5rem;
      border-radius: 20px;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      user-select: none;
      width: 110px;
      min-width: 110px;
      text-align: center;
      white-space: nowrap;
    }
    .status-toggle-badge:hover {
      transform: translateY(-1px);
      filter: brightness(1.1);
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    }
    .badge-no-atendido {
      background-color: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      border-color: rgba(245, 158, 11, 0.4);
    }
    .badge-atendido {
      background-color: rgba(59, 130, 246, 0.15);
      color: #3b82f6;
      border-color: rgba(59, 130, 246, 0.4);
    }
    .badge-enviado {
      background-color: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border-color: rgba(16, 185, 129, 0.4);
    }
    .badge-fallido {
      background-color: rgba(239, 68, 68, 0.15);
      color: #ef4444;
      border-color: rgba(239, 68, 68, 0.4);
    }

    .action-icon {
      width: 15px;
      height: 15px;
      color: var(--text-secondary);
      vertical-align: middle;
    }
    .icon-success {
      color: #10b981;
    }
    .icon-danger {
      color: #ef4444;
    }

    .actions-th, .actions-td {
      text-align: center !important;
      width: 90px;
    }
    .row-action-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.9rem;
      padding: 0.2rem 0.35rem;
      border-radius: var(--radius-sm);
      transition: var(--transition);
    }
    .row-action-btn:hover {
      background-color: var(--bg-tertiary);
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
  public activeTab = signal<'all' | 'no_atendido' | 'enviado' | 'atendido' | 'invalid'>('all');
  public searchQuery = signal<string>('');

  public pageSize = signal<number>(50);
  public currentPage = signal<number>(1);

  public sortColumn = signal<'propension' | 'oferta' | 'nombreCompleto' | 'doc' | 'estado' | 'none'>('propension');
  public sortDirection = signal<'asc' | 'desc'>('desc');

  // Batch Selection State (Shared with ExcelService)
  public get selectedIds() {
    return this.excelService.selectedIds;
  }

  // Inline Row Editing State
  public editingRowId: string | null = null;
  public editForm = {
    doc: '',
    nombreCompleto: '',
    oferta: 0
  };

  public showAddModal = false;
  public newContactForm = {
    doc: '',
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

  public setTab(tab: 'all' | 'no_atendido' | 'enviado' | 'atendido' | 'invalid'): void {
    this.activeTab.set(tab);
    this.currentPage.set(1);
  }

  public countByStatus(status: ContactStatus): number {
    return this.excelService.allContacts().filter(c => c.estado === status).length;
  }

  public onSearchChange(query: string): void {
    this.searchQuery.set(query || '');
    this.currentPage.set(1);
  }

  public toggleSort(col: 'propension' | 'oferta' | 'nombreCompleto' | 'doc' | 'estado'): void {
    if (this.sortColumn() === col) {
      this.sortDirection.set(this.sortDirection() === 'desc' ? 'asc' : 'desc');
    } else {
      this.sortColumn.set(col);
      this.sortDirection.set('desc');
    }
    this.currentPage.set(1);
  }

  public filteredContacts = computed(() => {
    const all = this.excelService.allContacts();
    const tab = this.activeTab();

    let rawList: FinancialContact[] = [];
    if (tab === 'all') {
      rawList = all;
    } else if (tab === 'no_atendido') {
      rawList = all.filter(c => c.estado === 'No atendido' || c.estado === 'Pendiente');
    } else if (tab === 'enviado') {
      rawList = all.filter(c => c.estado === 'Enviado');
    } else if (tab === 'atendido') {
      rawList = all.filter(c => c.estado === 'Atendido');
    } else if (tab === 'invalid') {
      rawList = all.filter(c => !c.hasWhatsApp || c.estado === 'Sin Telefono');
    }

    let list = rawList;
    const q = this.searchQuery().toLowerCase().trim();

    if (q.length > 0) {
      list = rawList.filter(c => 
        c.nombreCompleto.toLowerCase().includes(q) ||
        (c.doc && c.doc.toLowerCase().includes(q)) ||
        c.ctaBt.toLowerCase().includes(q) ||
        c.telefonoT1.includes(q) ||
        c.telefonoValido.includes(q) ||
        (c.agencia && c.agencia.toLowerCase().includes(q)) ||
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
        if (col === 'nombreCompleto') {
          return a.nombreCompleto.localeCompare(b.nombreCompleto) * dir;
        }
        if (col === 'doc') {
          return (a.doc || '').localeCompare(b.doc || '') * dir;
        }
        if (col === 'estado') {
          return (a.estado || '').localeCompare(b.estado || '') * dir;
        }
        return 0;
      });
    }

    return list;
  });

  public totalPages = computed(() => {
    return Math.ceil(this.filteredContacts().length / this.pageSize()) || 1;
  });

  public activePage = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (current > total) return total;
    if (current < 1) return 1;
    return current;
  });

  public paginatedContacts = computed(() => {
    const list = this.filteredContacts();
    const page = this.activePage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  // Batch Selection Methods
  public toggleSelectContact(id: string): void {
    const currentSet = new Set(this.selectedIds());
    if (currentSet.has(id)) {
      currentSet.delete(id);
    } else {
      currentSet.add(id);
    }
    this.selectedIds.set(currentSet);
  }

  public isAllVisibleSelected(): boolean {
    const visible = this.filteredContacts();
    if (visible.length === 0) return false;
    const currentSet = this.selectedIds();
    return visible.every(c => currentSet.has(c.id));
  }

  public toggleSelectAllVisible(): void {
    const visible = this.filteredContacts();
    const currentSet = new Set(this.selectedIds());

    if (this.isAllVisibleSelected()) {
      visible.forEach(c => currentSet.delete(c.id));
    } else {
      visible.forEach(c => currentSet.add(c.id));
    }

    this.selectedIds.set(currentSet);
  }

  public confirmDeleteSelected(): void {
    const count = this.selectedIds().size;
    if (count === 0) return;

    this.modalService.show({
      title: `⚠️ ¿Eliminar ${count} contactos seleccionados?`,
      message: `Esta acción eliminará permanentemente ${count} registros de la tabla. ¿Deseas continuar?`,
      type: 'warning',
      showCancel: true,
      cancelText: 'No, cancelar',
      confirmText: `Sí, eliminar (${count})`,
      onConfirm: () => {
        const idsArray = Array.from(this.selectedIds());
        this.excelService.deleteContactsBatch(idsArray);
        this.selectedIds.set(new Set());
        this.modalService.show({
          title: '🗑️ Eliminación Completada',
          message: `Se han eliminado los ${count} contactos seleccionados.`,
          type: 'success',
          confirmText: 'Aceptar'
        });
      }
    });
  }

  // Single Row Editing & Deleting
  public startInlineEdit(contact: FinancialContact): void {
    this.editingRowId = contact.id;
    this.editForm = {
      doc: contact.doc || '',
      nombreCompleto: contact.nombreCompleto,
      oferta: contact.oferta || 0
    };
  }

  public saveInlineEdit(contactId: string): void {
    if (this.editForm.nombreCompleto.trim().length > 0) {
      this.excelService.updateContactField(contactId, {
        doc: this.editForm.doc.trim(),
        nombreCompleto: this.editForm.nombreCompleto.trim(),
        oferta: Number(this.editForm.oferta) || 0
      });
    }
    this.editingRowId = null;
  }

  public cancelInlineEdit(): void {
    this.editingRowId = null;
  }

  public confirmDeleteContact(contact: FinancialContact): void {
    this.modalService.show({
      title: '🗑️ ¿Eliminar este cliente?',
      message: `¿Estás seguro de eliminar a "${contact.nombreCompleto}" (${contact.doc || contact.ctaBt}) de la lista?`,
      type: 'warning',
      showCancel: true,
      cancelText: 'Cancelar',
      confirmText: 'Sí, eliminar',
      onConfirm: () => {
        this.excelService.deleteContact(contact.id);
      }
    });
  }

  public toggleStatus(contact: FinancialContact): void {
    const nextStatus: ContactStatus = contact.estado === 'Atendido' ? 'No atendido' : 'Atendido';
    this.excelService.updateContactStatus(contact.id, nextStatus);
  }

  public onStatusChange(contact: FinancialContact, newStatus: any): void {
    this.excelService.updateContactStatus(contact.id, newStatus as ContactStatus);
  }

  public onPhoneSelected(contact: FinancialContact, selectedPhone: any): void {
    this.excelService.updateContactPhone(contact.id, String(selectedPhone));
  }

  public getPhoneOptions(contact: FinancialContact): { label: string; value: string }[] {
    const options: { label: string; value: string }[] = [];
    const seen = new Set<string>();

    const cleanT1 = contact.telefonoT1 ? contact.telefonoT1.replace(/\D/g, '') : '';
    if (cleanT1 && cleanT1.length >= 7) {
      const val = cleanT1.length === 9 ? `51${cleanT1}` : cleanT1;
      options.push({ label: 'Teléfono 1 (T1)', value: val });
      seen.add(val);
    }

    const cleanT2 = contact.telefonoT2 ? contact.telefonoT2.replace(/\D/g, '') : '';
    if (cleanT2 && cleanT2.length >= 7) {
      const val = cleanT2.length === 9 ? `51${cleanT2}` : cleanT2;
      if (!seen.has(val)) {
        options.push({ label: 'Teléfono 2 (T2)', value: val });
        seen.add(val);
      }
    }

    if (contact.phones && contact.phones.length > 0) {
      contact.phones.forEach(p => {
        const clean = p.phoneNumber.replace(/\D/g, '');
        if (clean && clean.length >= 7) {
          const val = clean.length === 9 ? `51${clean}` : clean;
          if (!seen.has(val)) {
            options.push({ label: p.phoneLabel || 'Secundario', value: val });
            seen.add(val);
          }
        }
      });
    }

    if (options.length === 0 && contact.telefonoValido) {
      options.push({ label: 'Principal', value: contact.telefonoValido });
    }

    return options;
  }

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
    const total = this.filteredContacts().length;
    if (total === 0) return 0;
    return (this.activePage() - 1) * this.pageSize() + 1;
  }

  public getEndIndex(): number {
    const total = this.filteredContacts().length;
    if (total === 0) return 0;
    const end = this.activePage() * this.pageSize();
    return end > total ? total : end;
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
    const tabName = this.activeTab().toUpperCase();
    const fileName = `Reporte_Clientes_${tabName}_${new Date().toISOString().slice(0,10)}.xlsx`;
    this.excelService.exportContactsToExcel(list, fileName);

    this.modalService.show({
      title: '📥 Exportación Exitosa',
      message: `Se ha generado el archivo "${fileName}" con ${list.length} registros en formato Excel, incluyendo la columna de Estado de Seguimiento.`,
      type: 'success',
      confirmText: 'Genial'
    });
  }

  public openAddModal(): void {
    this.newContactForm = {
      doc: '',
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
      this.activeTab.set('no_atendido');
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
      confirmText: 'Sí, limpiar todo',
      onConfirm: () => {
        this.excelService.clearDatabase();
        this.selectedIds.set(new Set());
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
