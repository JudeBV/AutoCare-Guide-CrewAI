import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AutoCareResponse } from '../models/chat.models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private readonly chatEndpoint = environment.apiUrl.endsWith('/chat')
    ? environment.apiUrl
    : `${environment.apiUrl.replace(/\/+$/, '')}/chat`;

  constructor(private http: HttpClient) {}

  public sendMessage(message: string): Observable<AutoCareResponse> {
    return this.http.post<AutoCareResponse>(this.chatEndpoint, { message: message.trim() }).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'AutoCare Guide is temporarily unavailable. Please try again.';
        if (error.error && typeof error.error.detail === 'string') {
          errorMessage = error.error.detail;
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}

