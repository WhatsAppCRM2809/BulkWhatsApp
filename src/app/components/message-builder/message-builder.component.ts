import { Component, ElementRef, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExcelService, FinancialContact } from '../../core/services/excel.service';
import { WhatsAppService, DEFAULT_BANK_TEMPLATE } from '../../core/services/whatsapp.service';
import { TemplateService, MessageTemplateItem } from '../../core/services/template.service';

@Component({
  selector: 'app-message-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="message-grid">
      <!-- Editor Panel -->
      <div class="card editor-card">
        <div class="card-header">
          <div class="header-title">
            <svg class="header-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            <h3>Editor de Plantilla Dinámica</h3>
          </div>
          <span class="spintax-badge">Soporta Spintax &#123;Hola|Estimado/a&#125;</span>
        </div>

        <!-- Saved Templates Bar -->
        <div class="saved-templates-bar">
          <div class="templates-header-group">
            <label class="templates-label">Mis Plantillas Guardadas:</label>
            <div class="templates-select-wrapper" *ngIf="templateService.userTemplates().length > 0">
              <select class="form-control select-template-dropdown" [ngModel]="selectedTemplateId" (ngModelChange)="onSelectSavedTemplate($event)">
                <option [ngValue]="null">-- Seleccionar Plantilla Guardada --</option>
                <option *ngFor="let t of templateService.userTemplates()" [ngValue]="t.id">
                  📁 {{ t.name }}
                </option>
              </select>
              <button class="btn btn-outline btn-xs delete-template-btn" 
                      *ngIf="selectedTemplateId" 
                      (click)="onDeleteSelectedTemplate()" 
                      title="Eliminar esta plantilla de PostgreSQL">
                <svg class="btn-svg text-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
            <span class="no-templates-tag" *ngIf="templateService.userTemplates().length === 0">
              Sin plantillas guardadas en la biblioteca
            </span>
          </div>
        </div>

        <!-- Tag Pills -->
        <div class="tags-container">
          <span class="tags-label">Variables de Excel:</span>
          <div class="tags-wrapper">
            <button class="tag-pill" (click)="insertTag('{PRIMER_NOMBRE}')">&#123;PRIMER_NOMBRE&#125;</button>
            <button class="tag-pill" (click)="insertTag('{NOMBRES}')">&#123;NOMBRES&#125;</button>
            <button class="tag-pill" (click)="insertTag('{APELLIDO_PATERNO}')">&#123;APELLIDO_PATERNO&#125;</button>
            <button class="tag-pill" (click)="insertTag('{DOC}')">&#123;DOC&#125;</button>
            <button class="tag-pill" (click)="insertTag('{PROPENSION}')">&#123;PROPENSION&#125;</button>
            <button class="tag-pill" (click)="insertTag('{OFERTA}')">&#123;OFERTA&#125;</button>
            <button class="tag-pill" (click)="insertTag('{TASA}')">&#123;TASA&#125;</button>
            <button class="tag-pill" (click)="insertTag('{PLAZO}')">&#123;PLAZO&#125;</button>
            <button class="tag-pill" (click)="insertTag('{AGENCIA}')">&#123;AGENCIA&#125;</button>
            <button class="tag-pill" (click)="insertTag('{DISTRITO}')">&#123;DISTRITO&#125;</button>
          </div>
        </div>

        <!-- Textarea -->
        <textarea #templateTextArea 
                  class="form-control message-textarea" 
                  rows="6" 
                  [ngModel]="waService.messageTemplate()" 
                  (ngModelChange)="onTextareaChange($event)"></textarea>

        <!-- Template Action Buttons -->
        <div class="template-actions-row">
          <button class="btn btn-primary btn-sm save-template-btn" (click)="onSaveTemplateManual()" [disabled]="isSaving">
            <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
            <span>Guardar Plantilla Principal</span>
          </button>

          <button class="btn btn-secondary btn-sm save-as-new-btn" (click)="openSaveModal()">
            <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
            <span>Guardar Nueva en Biblioteca</span>
          </button>

          <button class="btn btn-outline btn-sm reset-template-btn" (click)="onResetDefaultTemplate()">
            <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
            <span>Cargar Texto Predeterminado</span>
          </button>

          <span class="save-toast-notice" *ngIf="showSaveNotice">{{ saveNoticeText }}</span>
        </div>

        <!-- Media Attachment -->
        <div class="media-attach-zone">
          <svg class="attach-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
          <div>
            <span class="attach-title">Adjuntar Flyer o PDF de Campaña</span>
            <small class="attach-sub">Imágenes (.png, .jpg) o propuesta de préstamo (.pdf)</small>
          </div>
        </div>
      </div>

      <!-- Smartphone Live Preview Panel -->
      <div class="card phone-preview-card">
        <div class="phone-header-row">
          <div class="phone-header">
            <svg class="header-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
            <span>Previsualizador WhatsApp</span>
          </div>

          <!-- Manual Refresh Button -->
          <button class="btn btn-outline btn-xs refresh-btn" (click)="refreshPreview()" title="Actualizar Vista Previa">
            <svg class="btn-svg" [class.spin-icon]="isRefreshing" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
            <span>Actualizar</span>
          </button>
        </div>

        <div class="phone-frame">
          <div class="wa-chat-header">
            <div class="wa-avatar">
              <svg class="avatar-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"></path><path d="M3 10h18"></path><path d="M5 6l7-3 7 3"></path><path d="M4 10v11"></path><path d="M20 10v11"></path><path d="M8 14v3"></path><path d="M12 14v3"></path><path d="M16 14v3"></path></svg>
            </div>
            <div class="wa-user-info">
              <span class="wa-name">{{ currentClientName() }}</span>
              <span class="wa-status">en línea</span>
            </div>
          </div>

          <div class="wa-chat-body">
            <div class="wa-message-bubble">
              <p class="wa-text">{{ compiledPreview() }}</p>
              <span class="wa-time">10:45 AM ✔️</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Guardar Nueva Plantilla en Biblioteca -->
    <div class="modal-backdrop" *ngIf="isSaveModalOpen">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Guardar Plantilla en Biblioteca</h3>
          <button class="close-btn" (click)="closeSaveModal()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Nombre de la Campaña / Plantilla:</label>
            <input type="text" 
                   class="form-control" 
                   [(ngModel)]="newTemplateName" 
                   placeholder="Ej: Campaña Efectivo Preferente Julio" 
                   required />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline btn-sm" (click)="closeSaveModal()">Cancelar</button>
          <button class="btn btn-primary btn-sm" (click)="onConfirmSaveNewTemplate()" [disabled]="!newTemplateName.trim() || isSaving">
            📁 Guardar Plantilla
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .message-grid {
      display: grid;
      grid-template-columns: 1.3fr 1fr;
      gap: 1.5rem;
    }
    @media (max-width: 992px) {
      .message-grid {
        grid-template-columns: 1fr;
      }
    }
    .editor-card {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .header-svg {
      width: 18px;
      height: 18px;
      color: var(--accent-cyan);
    }
    h3 {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }
    .spintax-badge {
      font-size: 0.7rem;
      color: var(--accent-cyan);
      background-color: var(--accent-cyan-light);
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
    }
    .saved-templates-bar {
      background-color: var(--bg-tertiary);
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
    }
    .templates-header-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .templates-label {
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .templates-select-wrapper {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
    }
    .select-template-dropdown {
      padding: 0.35rem 0.6rem;
      font-size: 0.8rem;
      height: auto;
      border-radius: var(--radius-sm);
    }
    .delete-template-btn {
      padding: 0.25rem 0.4rem;
    }
    .text-danger {
      color: #ef4444 !important;
    }
    .no-templates-tag {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-style: italic;
    }
    .tags-container {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .tags-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 600;
    }
    .tags-wrapper {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .message-textarea {
      resize: vertical;
      font-family: var(--font-family);
      line-height: 1.5;
    }
    .template-actions-row {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      flex-wrap: wrap;
    }
    .save-template-btn, .save-as-new-btn, .reset-template-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
    .btn-secondary {
      background-color: #3b82f6;
      color: #ffffff;
      border: none;
    }
    .btn-secondary:hover {
      background-color: #2563eb;
    }
    .save-toast-notice {
      font-size: 0.775rem;
      color: #22c55e;
      font-weight: 600;
      animation: fadeIn 0.3s ease-in-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-2px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .media-attach-zone {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border: 1.5px dashed var(--border-color);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: var(--transition);
    }
    .media-attach-zone:hover {
      border-color: var(--accent-cyan);
      background-color: var(--accent-cyan-light);
    }
    .attach-svg {
      width: 20px;
      height: 20px;
      color: var(--accent-cyan);
    }
    .attach-title {
      font-size: 0.85rem;
      font-weight: 600;
      display: block;
      color: var(--text-primary);
    }
    .attach-sub {
      font-size: 0.7rem;
      color: var(--text-muted);
    }
    .phone-preview-card {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: center;
    }
    .phone-header-row {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .phone-header {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    .refresh-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
    .btn-xs {
      padding: 0.25rem 0.6rem;
      font-size: 0.75rem;
    }
    .btn-svg {
      width: 14px;
      height: 14px;
    }
    .spin-icon {
      animation: spin 0.6s ease-in-out;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .phone-frame {
      width: 100%;
      max-width: 320px;
      height: 380px;
      background-color: #0b141a;
      border-radius: 24px;
      border: 4px solid var(--border-color);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: var(--shadow-lg);
    }
    .wa-chat-header {
      background-color: #202c33;
      padding: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .wa-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: #00a884;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
    }
    .avatar-svg {
      width: 20px;
      height: 20px;
    }
    .wa-user-info {
      display: flex;
      flex-direction: column;
    }
    .wa-name {
      color: #e9edef;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .wa-status {
      color: #00a884;
      font-size: 0.7rem;
    }
    .wa-chat-body {
      flex: 1;
      padding: 1rem;
      background: url('https://user-images.githubusercontent.com/15075759/28719144-86ed0f74-7127-11e7-81c7-bc9b867d768f.png');
      background-size: cover;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }
    .wa-message-bubble {
      background-color: #005c4b;
      color: #e9edef;
      padding: 0.65rem 0.85rem;
      border-radius: 8px;
      border-top-left-radius: 0;
      max-width: 90%;
      font-size: 0.825rem;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      word-break: break-word;
    }
    .wa-text {
      white-space: pre-wrap;
      margin: 0;
    }
    .wa-time {
      font-size: 0.65rem;
      color: rgba(255, 255, 255, 0.6);
      display: block;
      text-align: right;
      margin-top: 0.25rem;
    }
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.6);
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
      max-width: 440px;
      padding: 1.25rem;
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      gap: 1rem;
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
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
  `]
})
export class MessageBuilderComponent {
  @ViewChild('templateTextArea') templateTextArea!: ElementRef<HTMLTextAreaElement>;

  public isRefreshing = false;
  public isSaving = false;
  public showSaveNotice = false;
  public saveNoticeText = '';

  public selectedTemplateId: number | null = null;
  public isSaveModalOpen = false;
  public newTemplateName = '';

  constructor(
    public excelService: ExcelService,
    public waService: WhatsAppService,
    public templateService: TemplateService
  ) {}

  public onTextareaChange(value: string): void {
    this.waService.setLocalTemplate(value);
  }

  public onSelectSavedTemplate(idVal: any): void {
    if (idVal === null || idVal === undefined || idVal === '') {
      this.selectedTemplateId = null;
      return;
    }
    const targetId = Number(idVal);
    this.selectedTemplateId = targetId;

    const list = this.templateService.userTemplates();
    const found = list.find(t => Number(t.id) === targetId);

    if (found && found.content) {
      this.waService.setLocalTemplate(found.content);
      if (this.templateTextArea && this.templateTextArea.nativeElement) {
        this.templateTextArea.nativeElement.value = found.content;
      }
      this.saveNoticeText = `ℹ️ Plantilla "${found.name}" cargada en el editor`;
      this.showSaveNotice = true;
      setTimeout(() => { this.showSaveNotice = false; }, 3500);
    }
  }

  public onDeleteSelectedTemplate(): void {
    if (!this.selectedTemplateId) return;
    const targetId = Number(this.selectedTemplateId);
    const found = this.templateService.userTemplates().find(t => Number(t.id) === targetId);
    if (!found) return;

    if (confirm(`¿Eliminar la plantilla "${found.name}" de la base de datos?`)) {
      this.templateService.deleteTemplate(found.id).subscribe({
        next: () => {
          this.selectedTemplateId = null;
          this.saveNoticeText = '✓ Plantilla eliminada correctamente';
          this.showSaveNotice = true;
          setTimeout(() => { this.showSaveNotice = false; }, 3000);
        }
      });
    }
  }

  public openSaveModal(): void {
    this.newTemplateName = '';
    this.isSaveModalOpen = true;
  }

  public closeSaveModal(): void {
    this.isSaveModalOpen = false;
  }

  public onConfirmSaveNewTemplate(): void {
    const current = this.waService.messageTemplate();
    if (!this.newTemplateName.trim()) return;

    this.isSaving = true;
    this.templateService.createTemplate(this.newTemplateName.trim(), current).subscribe({
      next: (created) => {
        this.isSaving = false;
        this.isSaveModalOpen = false;
        this.selectedTemplateId = created.id;
        this.saveNoticeText = `✓ Plantilla "${created.name}" guardada en biblioteca`;
        this.showSaveNotice = true;
        setTimeout(() => { this.showSaveNotice = false; }, 3500);
      },
      error: () => {
        this.isSaving = false;
      }
    });
  }

  public onSaveTemplateManual(): void {
    const current = this.waService.messageTemplate();
    this.isSaving = true;
    this.waService.saveTemplateInDatabase(current).subscribe({
      next: () => {
        this.isSaving = false;
        this.saveNoticeText = '✓ Plantilla Principal guardada en PostgreSQL';
        this.showSaveNotice = true;
        setTimeout(() => { this.showSaveNotice = false; }, 3000);
      },
      error: () => {
        this.isSaving = false;
      }
    });
  }

  public onResetDefaultTemplate(): void {
    this.waService.setLocalTemplate(DEFAULT_BANK_TEMPLATE);
    if (this.templateTextArea && this.templateTextArea.nativeElement) {
      this.templateTextArea.nativeElement.value = DEFAULT_BANK_TEMPLATE;
    }
    this.saveNoticeText = 'ℹ️ Texto predeterminado cargado. Presiona "Guardar Plantilla Principal" si deseas guardarlo.';
    this.showSaveNotice = true;
    setTimeout(() => { this.showSaveNotice = false; }, 4000);
  }

  public insertTag(tag: string): void {
    const textarea = this.templateTextArea.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = this.waService.messageTemplate();

    const updated = current.substring(0, start) + tag + current.substring(end);
    this.waService.setLocalTemplate(updated);
    textarea.value = updated;
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  }

  public refreshPreview(): void {
    this.isRefreshing = true;
    this.waService.setLocalTemplate(this.waService.messageTemplate());
    setTimeout(() => {
      this.isRefreshing = false;
    }, 600);
  }

  public currentClientName = computed(() => {
    const sel = this.excelService.selectedContact();
    if (sel) {
      return `${sel.nombreCompleto} (+${sel.telefonoValido})`;
    }
    return 'Banco - Asesor de Crédito';
  });

  public compiledPreview = computed(() => {
    const sel = this.excelService.selectedContact();
    const valid = this.excelService.validContacts();
    const sample: FinancialContact = sel || (valid.length > 0 ? valid[0] : {
      id: 'mock-1',
      ctaBt: '45812901',
      doc: '18872565',
      nombreCompleto: 'JULIO CESAR CAPRISTAN CABALLERO',
      primerNombre: 'Julio',
      nombres: 'Julio Cesar',
      apellidoPaterno: 'Capristan',
      direccion: 'CAL. BOLIVAR MZ 74 LT 3A',
      distrito: 'RAZURI',
      departamento: 'LA LIBERTAD',
      telefonoT1: '948982502',
      telefonoT2: '',
      telefonoValido: '51948982502',
      hasWhatsApp: true,
      producto: 'ET',
      oferta: 16900,
      tasa: 39.5,
      plazo: 36,
      agencia: 'CASAGRANDE',
      campana: 'EFECT TARJET CLIENTE',
      propension: '8',
      edad: 56,
      estado: 'Pendiente',
      importedAt: '10:00'
    });

    return this.waService.replaceVariables(this.waService.messageTemplate(), sample);
  });
}
