import { Component, ElementRef, ViewChild, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExcelService } from '../../core/services/excel.service';

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

        <!-- Tag Pills -->
        <div class="tags-container">
          <span class="tags-label">Variables de Excel:</span>
          <div class="tags-wrapper">
            <button class="tag-pill" (click)="insertTag('{PRIMER_NOMBRE}')">+ &#123;PRIMER_NOMBRE&#125;</button>
            <button class="tag-pill" (click)="insertTag('{NOMBRES}')">+ &#123;NOMBRES&#125;</button>
            <button class="tag-pill" (click)="insertTag('{APELLIDO_PATERNO}')">+ &#123;APELLIDO_PATERNO&#125;</button>
            <button class="tag-pill" (click)="insertTag('{OFERTA}')">+ &#123;OFERTA&#125;</button>
            <button class="tag-pill" (click)="insertTag('{TASA}')">+ &#123;TASA&#125;</button>
            <button class="tag-pill" (click)="insertTag('{PLAZO}')">+ &#123;PLAZO&#125;</button>
            <button class="tag-pill" (click)="insertTag('{AGENCIA}')">+ &#123;AGENCIA&#125;</button>
          </div>
        </div>

        <!-- Textarea -->
        <textarea #templateTextArea 
                  class="form-control message-textarea" 
                  rows="6" 
                  [ngModel]="messageTemplate()" 
                  (ngModelChange)="onTextareaChange($event)"></textarea>

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
  `]
})
export class MessageBuilderComponent {
  @ViewChild('templateTextArea') templateTextArea!: ElementRef<HTMLTextAreaElement>;

  public messageTemplate = signal<string>(
    `Hola {PRIMER_NOMBRE}, ¡tenemos excelentes noticias! En la agencia {AGENCIA} tienes pre-aprobado un Crédito de S/{OFERTA} a una tasa preferencial del {TASA}% a {PLAZO} meses.\n\nResponde SÍ para comunicarte con tu asesor financiero personal.`
  );

  public isRefreshing = false;

  constructor(public excelService: ExcelService) {}

  public onTextareaChange(value: string): void {
    this.messageTemplate.set(value);
  }

  public insertTag(tag: string): void {
    const textarea = this.templateTextArea.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = this.messageTemplate();

    const updated = current.substring(0, start) + tag + current.substring(end);
    this.messageTemplate.set(updated);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  }

  public refreshPreview(): void {
    this.isRefreshing = true;
    this.messageTemplate.set(this.messageTemplate());
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
    const sample = sel || (valid.length > 0 ? valid[0] : {
      primerNombre: 'Julio',
      nombres: 'Julio Cesar',
      apellidoPaterno: 'Toical',
      agencia: 'LA ALAMEDA',
      oferta: 17500,
      tasa: 41.5,
      plazo: 12
    });

    let text = this.messageTemplate();
    text = text.replace(/{PRIMER_NOMBRE}/g, sample.primerNombre);
    text = text.replace(/{NOMBRES}/g, sample.nombres || sample.primerNombre);
    text = text.replace(/{APELLIDO_PATERNO}/g, sample.apellidoPaterno || 'Toical');
    text = text.replace(/{OFERTA}/g, sample.oferta ? sample.oferta.toLocaleString() : '17,500');
    text = text.replace(/{TASA}/g, sample.tasa ? sample.tasa.toString() : '41.5');
    text = text.replace(/{PLAZO}/g, sample.plazo ? sample.plazo.toString() : '12');
    text = text.replace(/{AGENCIA}/g, sample.agencia || 'LA ALAMEDA');

    // Spintax resolution {Hola|Buenos días}
    text = text.replace(/\{([^{}]+)\}/g, (match, choicesStr) => {
      if (choicesStr.includes('|')) {
        const choices = choicesStr.split('|');
        return choices[0];
      }
      return match;
    });

    return text;
  });
}
