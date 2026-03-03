import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { TimeSlot } from '../models/slot.model';

type ApiResponse<T> = { data: T; error: string | null };

@Injectable({ providedIn: 'root' })
export class SlotsService {
  constructor(private readonly http: HttpClient) {}

  getSlots(week?: string, category?: string): Observable<TimeSlot[]> {
    let params = new HttpParams();
    if (week) params = params.set('week', week);
    if (category) params = params.set('category', category);
    return this.http
      .get<ApiResponse<TimeSlot[]>>(`${environment.apiUrl}/slots`, { params })
      .pipe(map((res) => res.data ?? []));
  }

  bookSlot(slotId: number, userId: number): Observable<TimeSlot> {
    return this.http
      .post<ApiResponse<TimeSlot>>(`${environment.apiUrl}/slots/${slotId}/book`, {
        user_id: userId,
      })
      .pipe(map((res) => res.data));
  }

  unbookSlot(slotId: number, userId: number): Observable<TimeSlot> {
    return this.http
      .delete<ApiResponse<TimeSlot>>(`${environment.apiUrl}/slots/${slotId}/book`, {
        body: { user_id: userId },
      })
      .pipe(map((res) => res.data));
  }

  createSlot(slot: Partial<TimeSlot>, userId: number): Observable<TimeSlot> {
    return this.http
      .post<ApiResponse<TimeSlot>>(
        `${environment.apiUrl}/slots`,
        { ...slot, user_id: userId },
        { headers: { 'X-User-Id': String(userId) } }
      )
      .pipe(map((res) => res.data));
  }

  deleteSlot(slotId: number, userId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<{ deleted: boolean }>>(
        `${environment.apiUrl}/slots/${slotId}`,
        { body: { user_id: userId }, headers: { 'X-User-Id': String(userId) } }
      )
      .pipe(map(() => void 0));
  }
}

