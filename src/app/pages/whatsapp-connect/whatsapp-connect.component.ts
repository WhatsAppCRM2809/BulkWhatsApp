import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WhatsAppService, WhatsAppInstanceResponse } from '../../core/services/whatsapp.service';
import { ModalService } from '../../core/services/modal.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-whatsapp-connect',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './whatsapp-connect.component.html',
  styleUrls: ['./whatsapp-connect.component.css']
})
export class WhatsappConnectComponent implements OnInit, OnDestroy {
  instanceInfo: WhatsAppInstanceResponse | null = null;
  isLoading = false;
  isGeneratingQr = false;
  qrCodeBase64: string | null = null;

  private pollSubscription?: Subscription;

  constructor(
    private whatsappService: WhatsAppService,
    private modalService: ModalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.checkStatus();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  checkStatus(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.whatsappService.getStatus().subscribe({
      next: (info) => {
        this.updateInstance(info);
        this.isLoading = false;
        this.cdr.detectChanges();

        if (info.status === 'CONNECTING') {
          this.startPolling();
        } else if (info.status === 'CONNECTED') {
          this.stopPolling();
          this.qrCodeBase64 = null;
        }
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  generateQrCode(): void {
    this.isGeneratingQr = true;
    this.cdr.detectChanges();

    this.whatsappService.getQrCode().subscribe({
      next: (info) => {
        this.updateInstance(info);
        this.qrCodeBase64 = info.qrCodeBase64 || null;
        this.isGeneratingQr = false;
        this.startPolling();
        this.cdr.detectChanges();
      },
      error: () => {
        this.isGeneratingQr = false;
        this.modalService.show({
          title: '⚠️ Error de Vinculación',
          message: 'No se pudo contactar al servidor de Evolution API v2 para generar el QR.',
          type: 'error',
          confirmText: 'Entendido'
        });
        this.cdr.detectChanges();
      }
    });
  }

  onLogoutWhatsApp(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.whatsappService.logout().subscribe({
      next: () => {
        this.stopPolling();
        this.qrCodeBase64 = null;
        this.instanceInfo = null;
        this.whatsappService.isConnected.set(false);
        this.whatsappService.connectedNumber.set('Sin Vincular');
        this.isLoading = false;
        this.modalService.show({
          title: '✅ Sesión Desconectada',
          message: 'Tu cuenta de WhatsApp fue desconectada correctamente.',
          type: 'success',
          confirmText: 'Aceptar'
        });
        this.checkStatus();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private updateInstance(info: WhatsAppInstanceResponse): void {
    this.instanceInfo = info;
    const isConn = info.status === 'CONNECTED';
    this.whatsappService.isConnected.set(isConn);
    this.whatsappService.connectedNumber.set(info.ownerJid || info.instanceName || 'WhatsApp Activo');
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollSubscription = interval(4000).subscribe(() => {
      this.whatsappService.getStatus().subscribe({
        next: (info) => {
          const wasNotConnected = this.instanceInfo?.status !== 'CONNECTED';
          this.updateInstance(info);

          if (info.status === 'CONNECTED') {
            this.stopPolling();
            this.qrCodeBase64 = null;
            if (wasNotConnected) {
              this.modalService.show({
                title: '🎉 ¡WhatsApp Conectado!',
                message: 'Tu cuenta de WhatsApp se ha vinculado exitosamente.',
                type: 'success',
                confirmText: 'Excelente'
              });
            }
          }
          this.cdr.detectChanges();
        }
      });
    });
  }

  private stopPolling(): void {
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
      this.pollSubscription = undefined;
    }
  }
}
