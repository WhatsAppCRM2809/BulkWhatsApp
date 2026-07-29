import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FinancialContact } from './excel.service';
import { AuthService } from './auth.service';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface CampaignStats {
  total: number;
  sent: number;
  failed: number;
  interested: number;
  progressPercent: number;
  status: 'idle' | 'running' | 'paused' | 'completed';
}

export interface WhatsAppInstanceResponse {
  id: number;
  instanceName: string;
  ownerJid?: string;
  profileName?: string;
  profilePicUrl?: string;
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED';
  qrCodeBase64?: string;
}

export const DEFAULT_BANK_TEMPLATE = `Hola {PRIMER_NOMBRE}, ¡tenemos excelentes noticias! En la agencia {AGENCIA} tienes pre-aprobado un Crédito de S/{OFERTA} a una tasa preferencial del {TASA}% a {PLAZO} meses.\n\nResponde SÍ para comunicarte con tu asesor financiero personal.`;

@Injectable({
  providedIn: 'root'
})
export class WhatsAppService {
  private apiUrl = `${environment.apiUrl}/whatsapp`;

  public isConnected = signal<boolean>(false);
  public connectedNumber = signal<string>('Sin Vincular');
  public riskLevel = signal<RiskLevel>('low');

  public messageTemplate = signal<string>(DEFAULT_BANK_TEMPLATE);

  public campaignStats = signal<CampaignStats>({
    total: 0,
    sent: 0,
    failed: 0,
    interested: 0,
    progressPercent: 0,
    status: 'idle'
  });

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Re-fetch template from PostgreSQL database whenever logged in user changes
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.fetchUserTemplateFromPostgres();
      } else {
        this.messageTemplate.set(DEFAULT_BANK_TEMPLATE);
      }
    });
  }

  /**
   * Fetches user's saved message template directly from PostgreSQL database
   */
  public fetchUserTemplateFromPostgres(): void {
    this.http.get<{ template: string }>(`${environment.apiUrl}/user/template`).subscribe({
      next: (res) => {
        if (res && res.template && res.template.trim().length > 0) {
          this.messageTemplate.set(res.template);
        } else {
          this.messageTemplate.set(DEFAULT_BANK_TEMPLATE);
        }
      },
      error: (err) => {
        console.warn('Could not fetch template from PostgreSQL:', err);
        this.messageTemplate.set(DEFAULT_BANK_TEMPLATE);
      }
    });
  }

  /**
   * Updates only local draft in UI (without hitting database)
   */
  public setLocalTemplate(text: string): void {
    this.messageTemplate.set(text);
  }

  /**
   * Explicitly saves current template in PostgreSQL database
   */
  public saveTemplateInDatabase(text: string): Observable<any> {
    this.messageTemplate.set(text);
    return this.http.put(`${environment.apiUrl}/user/template`, { template: text });
  }

  // Evolution API v2 Backend Services
  createInstance(): Observable<WhatsAppInstanceResponse> {
    return this.http.post<WhatsAppInstanceResponse>(`${this.apiUrl}/instance/create`, {});
  }

  getQrCode(): Observable<WhatsAppInstanceResponse> {
    return this.http.get<WhatsAppInstanceResponse>(`${this.apiUrl}/instance/qr`);
  }

  getStatus(): Observable<WhatsAppInstanceResponse> {
    return this.http.get<WhatsAppInstanceResponse>(`${this.apiUrl}/instance/status`);
  }

  logout(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/instance/logout`);
  }

  sendTextMessage(number: string, text: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/send-text`, { number, text });
  }

  // Campaign State & Risk Management
  public setRiskLevel(level: RiskLevel): void {
    this.riskLevel.set(level);
  }

  public getDelaySeconds(): number {
    switch (this.riskLevel()) {
      case 'low':
        return 8; // 8 seconds delay (Anti-ban safe)
      case 'medium':
        return 4; // 4 seconds delay
      case 'high':
        return 2; // 2 seconds delay
    }
  }

  public getDelayRange(): { min: number; max: number; label: string } {
    switch (this.riskLevel()) {
      case 'low':
        return { min: 35, max: 90, label: '🟢 Riesgo Bajo (8s por mensaje + Anti-Ban Segurizado)' };
      case 'medium':
        return { min: 15, max: 35, label: '🟡 Riesgo Medio (4s por mensaje)' };
      case 'high':
        return { min: 5, max: 15, label: '🔴 Riesgo Alto (2s por mensaje)' };
    }
  }

  public replaceVariables(template: string, contact: FinancialContact): string {
    if (!template) return '';
    let text = template;

    text = text.replace(/\{PRIMER_NOMBRE\}|\{primerNombre\}/g, contact.primerNombre || 'Cliente');
    text = text.replace(/\{NOMBRES\}|\{nombres\}/g, contact.nombres || contact.primerNombre || 'Cliente');
    text = text.replace(/\{APELLIDO_PATERNO\}|\{apellidoPaterno\}/g, contact.apellidoPaterno || '');
    text = text.replace(/\{NOMBRE_COMPLETO\}|\{nombreCompleto\}/g, contact.nombreCompleto || 'Cliente');
    text = text.replace(/\{DOC\}|\{doc\}|\{DNI\}|\{dni\}/g, contact.doc || '');
    text = text.replace(/\{CTA_BT\}|\{ctaBt\}/g, contact.ctaBt || '');
    text = text.replace(/\{PRODUCTO\}|\{producto\}/g, contact.producto || 'Préstamo Personal');
    text = text.replace(/\{OFERTA\}|\{oferta\}/g, contact.oferta ? contact.oferta.toLocaleString('es-PE', { minimumFractionDigits: 2 }) : '0.00');
    text = text.replace(/\{TASA\}|\{tasa\}/g, contact.tasa ? contact.tasa.toString() : '0');
    text = text.replace(/\{PLAZO\}|\{plazo\}|\{PLAZOMIN\}/g, contact.plazo ? contact.plazo.toString() : '0');
    text = text.replace(/\{AGENCIA\}|\{agencia\}/g, contact.agencia || '');
    text = text.replace(/\{PROPENSION\}|\{propension\}/g, contact.propension !== undefined ? String(contact.propension) : '');
    text = text.replace(/\{DISTRITO\}|\{distrito\}/g, contact.distrito || '');
    text = text.replace(/\{DEPARTAMENTO\}|\{departamento\}/g, contact.departamento || '');
    text = text.replace(/\{DIRECCION\}|\{direccion\}/g, contact.direccion || '');
    text = text.replace(/\{EDAD\}|\{edad\}/g, contact.edad ? String(contact.edad) : '');
    text = text.replace(/\{COMBO\}|\{combo\}/g, contact.combo || '');

    // Dynamic replacement for any custom attributes from Excel
    if (contact.customAttributes) {
      Object.keys(contact.customAttributes).forEach(key => {
        const val = contact.customAttributes![key];
        if (val !== undefined && val !== null) {
          const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\{${escapedKey}\\}`, 'gi');
          text = text.replace(regex, String(val));
        }
      });
    }

    // Spintax resolution {Hola|Buenos días|Estimado/a}
    text = text.replace(/\{([^{}]+)\}/g, (match, choicesStr) => {
      if (choicesStr.includes('|')) {
        const choices = choicesStr.split('|');
        const randomIndex = Math.floor(Math.random() * choices.length);
        return choices[randomIndex];
      }
      return match;
    });

    return text;
  }

  public async startCampaign(contacts: FinancialContact[]): Promise<void> {
    if (contacts.length === 0) return;

    const templateText = this.messageTemplate();
    const delaySecs = this.getDelaySeconds();

    this.campaignStats.set({
      total: contacts.length,
      sent: 0,
      failed: 0,
      interested: 0,
      progressPercent: 0,
      status: 'running'
    });

    for (let i = 0; i < contacts.length; i++) {
      if (this.campaignStats().status !== 'running') break;

      const contact = contacts[i];
      const message = this.replaceVariables(templateText, contact);

      try {
        const res = await this.sendTextMessage(contact.telefonoValido, message).toPromise();
        if (res?.success) {
          contact.estado = 'Enviado';
          this.campaignStats.update(s => ({ ...s, sent: s.sent + 1 }));
        } else {
          contact.estado = 'Fallido';
          this.campaignStats.update(s => ({ ...s, failed: s.failed + 1 }));
        }
      } catch (err) {
        contact.estado = 'Fallido';
        this.campaignStats.update(s => ({ ...s, failed: s.failed + 1 }));
      }

      const progress = Math.round(((i + 1) / contacts.length) * 100);
      this.campaignStats.update(s => ({ ...s, progressPercent: progress }));

      // Wait anti-ban delay before next message
      if (i < contacts.length - 1 && this.campaignStats().status === 'running') {
        await new Promise(resolve => setTimeout(resolve, delaySecs * 1000));
      }
    }

    if (this.campaignStats().status === 'running') {
      this.campaignStats.update(s => ({ ...s, status: 'completed', progressPercent: 100 }));
    }
  }

  public pauseCampaign(): void {
    this.campaignStats.update(s => ({ ...s, status: 'paused' }));
  }

  public cancelCampaign(): void {
    this.campaignStats.set({
      total: 0,
      sent: 0,
      failed: 0,
      interested: 0,
      progressPercent: 0,
      status: 'idle'
    });
  }
}
