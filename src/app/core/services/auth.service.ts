import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: number;
  username: string;
  email: string;
  agentName: string;
  bankAgency?: string;
  role: string;
  daysRemaining: number;
  expiresAt: string;
  status: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  agentName: string;
  bankAgency?: string;
  contactPhone?: string;
  initialDays?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<AuthResponse | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  public get currentUserValue(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  login(usernameOrEmail: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { usernameOrEmail, password }).pipe(
      tap(response => {
        if (response && response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response));
          this.currentUserSubject.next(response);
        }
      })
    );
  }

  registerAgent(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data, {
      headers: this.getAuthHeaders()
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const user = this.currentUserValue;
    const token = localStorage.getItem('token');
    return !!(token && user && user.daysRemaining > 0 && user.status === 'ACTIVE');
  }

  isAdmin(): boolean {
    const user = this.currentUserValue;
    return !!(user && user.role === 'ROLE_ADMIN');
  }

  getAllAgents(): Observable<AuthResponse[]> {
    return this.http.get<AuthResponse[]>(`${this.apiUrl}/agents`, {
      headers: this.getAuthHeaders()
    });
  }

  addDaysToAgent(userId: number, days: number): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${this.apiUrl}/agents/${userId}/add-days?additionalDays=${days}`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  updateAgent(userId: number, data: { email?: string; agentName?: string; bankAgency?: string; role?: string }): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${this.apiUrl}/agents/${userId}`, data, {
      headers: this.getAuthHeaders()
    });
  }

  private getAuthHeaders(): { [header: string]: string } {
    const token = localStorage.getItem('token');
    if (token && token !== 'null' && token !== 'undefined') {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }

  private getStoredUser(): AuthResponse | null {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (e) {
        return null;
      }
    }
    return null;
  }
}
