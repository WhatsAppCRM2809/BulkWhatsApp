import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService, AuthResponse, RegisterRequest } from '../../core/services/auth.service';
import { ModalService } from '../../core/services/modal.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  agents: AuthResponse[] = [];
  isLoading = false;
  isSubmitting = false;
  showCreateModal = false;
  showEditModal = false;
  message = '';
  isSuccess = false;
  customDaysInput: { [userId: number]: number } = {};

  newUser: RegisterRequest = {
    username: '',
    email: '',
    password: '',
    agentName: '',
    contactPhone: '',
    initialDays: 30
  };

  editingUser: {
    userId: number;
    username: string;
    email: string;
    agentName: string;
    role: string;
  } | null = null;

  constructor(
    private authService: AuthService,
    private modalService: ModalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAgents();
  }

  loadAgents(showToast = false): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.authService.getAllAgents().pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (data) => {
        console.log('Usuarios recibidos del backend:', data);
        this.agents = data ? [...data] : [];
        this.cdr.detectChanges();

        if (showToast) {
          this.message = 'Listado de usuarios actualizado en tiempo real.';
          this.isSuccess = true;
          this.cdr.detectChanges();
          setTimeout(() => {
            this.message = '';
            this.cdr.detectChanges();
          }, 3000);
        }
      },
      error: (err) => {
        console.error('Error cargando usuarios', err);
        if (err.status !== 401) {
          this.modalService.show({
            title: '⚠️ Error de Conexión',
            message: 'No se pudo conectar con el servidor backend. Por favor verifica que el backend esté corriendo.',
            type: 'error',
            confirmText: 'Reintentar',
            onConfirm: () => this.loadAgents()
          });
        }
        this.cdr.detectChanges();
      }
    });
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'Sin fecha';
    try {
      const sanitized = dateStr.replace(/(\.\d{3})\d+/, '$1');
      const date = new Date(sanitized);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  }

  toggleCreateModal(): void {
    this.showCreateModal = !this.showCreateModal;
    if (!this.showCreateModal) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.newUser = {
      username: '',
      email: '',
      password: '',
      agentName: '',
      contactPhone: '',
      initialDays: 30
    };
  }

  onCreateUser(): void {
    if (!this.newUser.agentName || !this.newUser.email) {
      this.modalService.show({
        title: '⚠️ Datos Incompletos',
        message: 'El Nombre del Agente y el Correo Gmail son campos obligatorios (*).',
        type: 'warning',
        confirmText: 'Entendido'
      });
      return;
    }

    this.isSubmitting = true;
    this.authService.registerAgent(this.newUser).subscribe({
      next: (created) => {
        this.modalService.show({
          title: '✅ Usuario Creado Exitosamente',
          message: `El usuario '${created.agentName}' ha sido registrado.\n\nUsuario: ${created.username}\nContraseña: ${this.newUser.password || '123456'}`,
          type: 'success',
          confirmText: 'Aceptar'
        });
        this.showCreateModal = false;
        this.resetForm();
        this.isSubmitting = false;
        this.loadAgents();
      },
      error: (err) => {
        console.error('Error registrando usuario:', err);
        if (err.status !== 401) {
          this.modalService.show({
            title: '❌ Error al Registrar',
            message: err.error?.message || 'Error al registrar el nuevo usuario.',
            type: 'error',
            confirmText: 'Cerrar'
          });
        }
        this.isSubmitting = false;
      }
    });
  }

  openEditModal(agent: AuthResponse): void {
    this.editingUser = {
      userId: agent.userId,
      username: agent.username,
      email: agent.email,
      agentName: agent.agentName || '',
      role: agent.role || 'ROLE_AGENT'
    };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingUser = null;
  }

  onSaveEdit(): void {
    if (!this.editingUser) return;
    if (!this.editingUser.email || !this.editingUser.agentName) {
      this.modalService.show({
        title: '⚠️ Datos Incompletos',
        message: 'El correo Gmail y el nombre del agente no pueden estar vacíos.',
        type: 'warning',
        confirmText: 'Entendido'
      });
      return;
    }

    this.isSubmitting = true;
    this.authService.updateAgent(this.editingUser.userId, {
      email: this.editingUser.email,
      agentName: this.editingUser.agentName,
      role: this.editingUser.role
    }).subscribe({
      next: (updated) => {
        this.modalService.show({
          title: '✅ Usuario Actualizado',
          message: `El usuario '${updated.username}' ha sido actualizado correctamente.`,
          type: 'success',
          confirmText: 'Aceptar'
        });
        this.closeEditModal();
        this.isSubmitting = false;
        this.loadAgents();
      },
      error: (err) => {
        console.error('Error actualizando usuario:', err);
        if (err.status !== 401) {
          this.modalService.show({
            title: '❌ Error al Actualizar',
            message: err.error?.message || 'Error al actualizar la información del usuario.',
            type: 'error',
            confirmText: 'Cerrar'
          });
        }
        this.isSubmitting = false;
      }
    });
  }

  getCustomDays(userId: number): number {
    if (this.customDaysInput[userId] === undefined || this.customDaysInput[userId] === null) {
      return 30;
    }
    return this.customDaysInput[userId];
  }

  onAddDays(userId: number, days: number): void {
    const daysAmount = Number(days);
    if (!daysAmount || daysAmount <= 0) {
      this.modalService.show({
        title: '⚠️ Cantidad Inválida',
        message: 'Por favor ingresa una cantidad de días mayor a 0.',
        type: 'warning',
        confirmText: 'Entendido'
      });
      return;
    }

    this.authService.addDaysToAgent(userId, daysAmount).subscribe({
      next: (updatedAgent) => {
        this.modalService.show({
          title: '✅ Licencia Extendida',
          message: `Se añadieron +${daysAmount} días exitosamente al usuario '${updatedAgent.username}'.`,
          type: 'success',
          confirmText: 'Aceptar'
        });
        this.loadAgents();
      },
      error: (err) => {
        if (err.status !== 401) {
          this.modalService.show({
            title: '❌ Error al Extender Licencia',
            message: err.error?.message || 'Ocurrió un error al extender los días del usuario.',
            type: 'error',
            confirmText: 'Cerrar'
          });
        }
      }
    });
  }
}
