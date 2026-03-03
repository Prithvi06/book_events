import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

type ApiResponse<T> = { data: T; error: string | null };

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private readonly http: HttpClient) {}

  getUser(userId: number): Observable<User> {
    return this.http
      .get<ApiResponse<User>>(`${environment.apiUrl}/users/${userId}`)
      .pipe(map((res) => res.data));
  }

  getPreferences(userId: number): Observable<string[]> {
    return this.http
      .get<ApiResponse<string[]>>(
        `${environment.apiUrl}/users/${userId}/preferences`
      )
      .pipe(map((res) => res.data ?? []));
  }

  updatePreferences(userId: number, prefs: string[]): Observable<string[]> {
    return this.http
      .put<ApiResponse<string[]>>(
        `${environment.apiUrl}/users/${userId}/preferences`,
        { preferences: prefs }
      )
      .pipe(map((res) => res.data ?? []));
  }
}

