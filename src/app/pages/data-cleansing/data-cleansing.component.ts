import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExcelService } from '../../core/services/excel.service';

@Component({
  selector: 'app-data-cleansing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cleansing-page">
      <div class="page-header">
        <div>
          <h2>Limpieza & Tratamiento de Datos</h2>
          <p class="subtitle">Normalización automática de nombres, extracción de variables y validación WhatsApp</p>
        </div>
        <button class="btn btn-primary" (click)="exportCleanCsv()">
          <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          <span>Exportar CSV Limpio</span>
        </button>
      </div>

      <!-- Pipeline Steps Banner -->
      <div class="grid-3">
        <div class="card pipeline-card">
          <div class="step-icon">
            <svg class="step-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>
          </div>
          <div>
            <h4>1. Normalización de Nombres</h4>
            <p>Convierte MAYÚSCULAS sostenidas a formato Nombre Propio.</p>
            <span class="badge badge-success">Activo</span>
          </div>
        </div>

        <div class="card pipeline-card">
          <div class="step-icon">
            <svg class="step-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
          </div>
          <div>
            <h4>2. Extracción de Variables</h4>
            <p>Genera &#123;PRIMER_NOMBRE&#125;, &#123;NOMBRES&#125; y &#123;APELLIDO_PATERNO&#125;.</p>
            <span class="badge badge-success">Activo</span>
          </div>
        </div>

        <div class="card pipeline-card">
          <div class="step-icon">
            <svg class="step-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          </div>
          <div>
            <h4>3. Validación WhatsApp (T1 ➔ T2)</h4>
            <p>Cascada inteligente y formato internacional +51.</p>
            <span class="badge badge-success">Activo</span>
          </div>
        </div>
      </div>

      <!-- Before / After Comparison Table -->
      <div class="card table-card">
        <div class="card-title-bar">
          <h3>Comparativa en Tiempo Real: Original (Excel) vs Datos Procesados</h3>
          <span class="badge badge-warning">{{ excelService.allContacts().length }} Registros</span>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Original (Excel)</th>
                <th>➜</th>
                <th>Nombre Limpio (Title Case)</th>
                <th>&#123;PRIMER_NOMBRE&#125;</th>
                <th>&#123;APELLIDO_PATERNO&#125;</th>
                <th>Teléfono Valido</th>
                <th>Estado WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let contact of excelService.allContacts()">
                <td><code class="raw-code">{{ contact.nombreCompleto | uppercase }}</code></td>
                <td class="arrow-cell">➔</td>
                <td><strong>{{ contact.nombreCompleto }}</strong></td>
                <td><span class="var-tag">{{ contact.primerNombre }}</span></td>
                <td><span class="var-tag">{{ contact.apellidoPaterno }}</span></td>
                <td><code>+{{ contact.telefonoValido || 'Sin Teléfono' }}</code></td>
                <td>
                  <span class="badge" [class.badge-success]="contact.hasWhatsApp" [class.badge-error]="!contact.hasWhatsApp">
                    {{ contact.hasWhatsApp ? 'Válido' : 'Inactivo / Sin WA' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cleansing-page {
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
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
    }
    @media (max-width: 992px) {
      .grid-3 {
        grid-template-columns: 1fr;
      }
    }
    .pipeline-card {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }
    .step-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background-color: var(--accent-cyan-light);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent-cyan);
    }
    .step-svg {
      width: 22px;
      height: 22px;
    }
    .pipeline-card h4 {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }
    .pipeline-card p {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }
    .table-card {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .card-title-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-title-bar h3 {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .table-responsive {
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    .data-table th, .data-table td {
      padding: 0.8rem 1rem;
      border-bottom: 1px solid var(--border-color);
      text-align: left;
    }
    .data-table th {
      background-color: var(--bg-card-hover);
      color: var(--text-muted);
      font-size: 0.725rem;
      text-transform: uppercase;
    }
    .raw-code {
      color: var(--text-muted);
      font-size: 0.75rem;
    }
    .arrow-cell {
      color: var(--accent-cyan);
      font-weight: 700;
    }
    .var-tag {
      font-family: monospace;
      color: var(--accent-cyan);
      background-color: var(--accent-cyan-light);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
    }
  `]
})
export class DataCleansingComponent {
  constructor(public excelService: ExcelService) {}

  public exportCleanCsv(): void {
    const contacts = this.excelService.allContacts();
    if (contacts.length === 0) {
      alert('No hay contactos cargados para exportar. Por favor importa una lista primero.');
      return;
    }
    const timestamp = new Date().toISOString().slice(0, 10);
    this.excelService.exportContactsToExcel(contacts, `Base_Datos_Limpia_CRM_${timestamp}.xlsx`);
  }
}
