import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface MessageTemplateItem {
  id: number;
  name: string;
  content: string;
  isDefault: boolean;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  private apiUrl = `${environment.apiUrl}/templates`;

  public userTemplates = signal<MessageTemplateItem[]>([]);

  constructor(private http: HttpClient, private authService: AuthService) {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadUserTemplates();
      } else {
        this.userTemplates.set([]);
      }
    });
  }

  public loadUserTemplates(): void {
    this.http.get<MessageTemplateItem[]>(this.apiUrl).subscribe({
      next: (data) => this.userTemplates.set(data || []),
      error: (err) => console.warn('Could not load user templates:', err)
    });
  }

  public createTemplate(name: string, content: string): Observable<MessageTemplateItem> {
    return this.http.post<MessageTemplateItem>(this.apiUrl, { name, content }).pipe(
      tap(() => this.loadUserTemplates())
    );
  }

  public updateTemplate(id: number, name: string, content: string): Observable<MessageTemplateItem> {
    return this.http.put<MessageTemplateItem>(`${this.apiUrl}/${id}`, { name, content }).pipe(
      tap(() => this.loadUserTemplates())
    );
  }

  public deleteTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loadUserTemplates())
    );
  }
}
