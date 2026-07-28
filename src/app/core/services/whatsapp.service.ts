import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FinancialContact } from './excel.service';

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

@Injectable({
  providedIn: 'root'
})
export class WhatsAppService {
  private apiUrl = `${environment.apiUrl}/whatsapp`;

  public isConnected = signal<boolean>(false);
  public connectedNumber = signal<string>('Sin Vincular');
  public riskLevel = signal<RiskLevel>('low');

  public campaignStats = signal<CampaignStats>({
    total: 0,
    sent: 0,
    failed: 0,
    interested: 0,
    progressPercent: 0,
    status: 'idle'
  });

  private intervalId: any = null;

  constructor(private http: HttpClient) {}

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

  // Campaign State & Risk Management
  public setRiskLevel(level: RiskLevel): void {
    this.riskLevel.set(level);
  }

  public getDelayRange(): { min: number; max: number; label: string } {
    switch (this.riskLevel()) {
      case 'low':
        return { min: 35, max: 90, label: '🟢 Riesgo Bajo (35s - 90s + Pausa cada 50 msgs)' };
      case 'medium':
        return { min: 15, max: 35, label: '🟡 Riesgo Medio (15s - 35s)' };
      case 'high':
        return { min: 5, max: 15, label: '🔴 Riesgo Alto (5s - 15s)' };
    }
  }

  public startCampaign(contacts: FinancialContact[], template: string): void {
    if (contacts.length === 0) return;

    this.campaignStats.set({
      total: contacts.length,
      sent: 0,
      failed: 0,
      interested: 0,
      progressPercent: 0,
      status: 'running'
    });

    let index = 0;
    this.intervalId = setInterval(() => {
      if (index >= contacts.length) {
        this.pauseCampaign();
        this.campaignStats.update(s => ({ ...s, status: 'completed', progressPercent: 100 }));
        return;
      }

      contacts[index].estado = 'Enviado';
      index++;

      const sentCount = index;
      const progress = Math.round((sentCount / contacts.length) * 100);

      this.campaignStats.update(s => ({
        ...s,
        sent: sentCount,
        progressPercent: progress
      }));
    }, 1500);
  }

  public pauseCampaign(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.campaignStats.update(s => ({ ...s, status: 'paused' }));
  }

  public cancelCampaign(): void {
    this.pauseCampaign();
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
