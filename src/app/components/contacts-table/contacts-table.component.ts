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
                <span>No se encontraron registros. ¡Agrega un cliente manual o presiona "Cargar Datos de Prueba"!</span>
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

    <!-- Modal Form: Agregar Cliente Manual -->
    <div class="modal-overlay" *ngIf="showAddModal" (click)="closeAddModal()">
      <div class="modal-content-glass" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <line x1="19" y1="8" x2="19" y2="14"></line>
              <line x1="16" y1="11" x2="22" y2="11"></line>
            </svg>
          </div>
          <h3>Agregar Cliente Manual</h3>
          <button class="close-btn" (click)="closeAddModal()">✕</button>
        </div>

        <form (ngSubmit)="saveManualContact()" class="modal-form">
          <div class="form-group highlight-field">
            <label>Número de WhatsApp / Teléfono <span class="required-star">* (Obligatorio)</span></label>
            <input type="text" class="form-control" [(ngModel)]="newContactForm.telefono" name="telefono" placeholder="Ej. 961061471 o 51961061471" required autofocus />
            <small class="help-text">Ingrese 9 dígitos o con código de país. Es el único campo obligatorio.</small>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Nombre Completo <small class="optional-tag">(Opcional)</small></label>
              <input type="text" class="form-control" [(ngModel)]="newContactForm.nombre" name="nombre" placeholder="Ej. Julio Cesar Torres" />
            </div>

            <div class="form-group">
              <label>N° Cuenta / CTA BT <small class="optional-tag">(Opcional)</small></label>
              <input type="text" class="form-control" [(ngModel)]="newContactForm.ctaBt" name="ctaBt" placeholder="Ej. 45812999" />
            </div>

            <div class="form-group">
              <label>Producto <small class="optional-tag">(Opcional)</small></label>
              <input type="text" class="form-control" [(ngModel)]="newContactForm.producto" name="producto" placeholder="Préstamo Personal" />
            </div>

            <div class="form-group">
              <label>Monto Oferta (S/) <small class="optional-tag">(Opcional)</small></label>
              <input type="number" class="form-control" [(ngModel)]="newContactForm.oferta" name="oferta" placeholder="15000" />
            </div>

            <div class="form-group">
              <label>Tasa (%) <small class="optional-tag">(Opcional)</small></label>
              <input type="number" step="0.1" class="form-control" [(ngModel)]="newContactForm.tasa" name="tasa" placeholder="35.0" />
            </div>

            <div class="form-group">
              <label>Plazo (Meses) <small class="optional-tag">(Opcional)</small></label>
              <input type="number" class="form-control" [(ngModel)]="newContactForm.plazo" name="plazo" placeholder="12" />
            </div>

            <div class="form-group full-width">
              <label>Agencia / Sede <small class="optional-tag">(Opcional)</small></label>
              <input type="text" class="form-control" [(ngModel)]="newContactForm.agencia" name="agencia" placeholder="Ej. LA ALAMEDA" />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeAddModal()">Cancelar</button>
            <button type="submit" class="btn btn-save">💾 Guardar Cliente</button>
          </div>
        </form>
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
    .header-left {
      display: flex;
      align-items: center;
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
    .action-buttons {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .btn-add-manual {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      border: none;
      padding: 0.55rem 1.1rem;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      transition: all 0.2s ease;
    }
    .btn-add-manual:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(16, 185, 129, 0.45);
    }
    .btn-danger-outline {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(239, 68, 68, 0.1);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
      padding: 0.55rem 1.1rem;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-danger-outline:hover {
      background: rgba(239, 68, 68, 0.25);
      color: #ffffff;
      transform: translateY(-2px);
    }
    .add-icon, .trash-icon {
      width: 15px;
      height: 15px;
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

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .modal-content-glass {
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 20px;
      width: 100%;
      max-width: 600px;
      padding: 2rem;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
      animation: modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      position: relative;
    }

    .header-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .header-icon svg {
      width: 22px;
      height: 22px;
    }

    .modal-header h3 {
      font-size: 1.3rem;
      font-weight: 700;
      color: #f8fafc;
      flex: 1;
    }

    .close-btn {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 1.4rem;
      cursor: pointer;
      padding: 0.2rem 0.5rem;
      border-radius: 8px;
    }

    .close-btn:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.1);
    }

    .highlight-field {
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.25);
      padding: 1rem;
      border-radius: 12px;
      margin-bottom: 1.25rem;
    }

    .required-star {
      color: #f43f5e;
      font-weight: 600;
      font-size: 0.85rem;
    }

    .optional-tag {
      color: #64748b;
      font-weight: 400;
      font-size: 0.75rem;
    }

    .help-text {
      color: #94a3b8;
      font-size: 0.78rem;
      margin-top: 0.35rem;
      display: block;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    @media (max-width: 580px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      display: block;
      font-size: 0.82rem;
      font-weight: 600;
      color: #cbd5e1;
      margin-bottom: 0.4rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.75rem;
      padding-top: 1.25rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 0.65rem 1.4rem;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
    }

    .btn-save {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border: none;
      padding: 0.65rem 1.6rem;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
    }

    .btn-save:hover {
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
    }

    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class ContactsTableComponent {
  public activeTab = signal<'valid' | 'invalid'>('valid');
  public searchQuery = '';

  public showAddModal = false;
  public newContactForm = {
    telefono: '',
    nombre: '',
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

  public openAddModal(): void {
    this.newContactForm = {
      telefono: '',
      nombre: '',
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
