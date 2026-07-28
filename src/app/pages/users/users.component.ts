import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, AuthResponse } from '../../core/services/auth.service';

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
  selectedDays = 30;
  selectedUserId: number | null = null;
  message = '';
  isSuccess = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadAgents();
  }

  loadAgents(): void {
    this.isLoading = true;
    this.authService.getAllAgents().subscribe({
      next: (data) => {
        this.agents = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading agents', err);
        this.isLoading = false;
      }
    });
  }

  onAddDays(userId: number, days: number): void {
    this.authService.addDaysToAgent(userId, days).subscribe({
      next: (updatedAgent) => {
        this.message = `Días añadidos exitosamente (+${days} días) a ${updatedAgent.username}`;
        this.isSuccess = true;
        this.loadAgents();
        setTimeout(() => this.message = '', 4000);
      },
      error: (err) => {
        this.message = 'Error al extender los días del usuario';
        this.isSuccess = false;
        setTimeout(() => this.message = '', 4000);
      }
    });
  }
}
