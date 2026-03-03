import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, of, switchMap } from 'rxjs';

import { User } from '../models/user.model';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class CurrentUserService {
  private readonly userIdSubject = new BehaviorSubject<number | null>(
    (() => {
      try {
        const stored = localStorage.getItem('currentUserId');
        const parsed = stored !== null ? Number(stored) : NaN;
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
      } catch {
        return null;
      }
    })()
  );
  readonly userId$: Observable<number | null> = this.userIdSubject.asObservable();

  readonly user$: Observable<User | null> = this.userId$.pipe(
    switchMap((id) => {
      if (!id) return of(null);
      return this.userService.getUser(id).pipe(catchError(() => of(null)));
    })
  );

  constructor(private readonly userService: UserService) {}

  get userIdSnapshot(): number {
    return this.userIdSubject.value ?? 1;
  }

  setUserId(userId: number) {
    this.userIdSubject.next(userId);
    try {
      localStorage.setItem('currentUserId', String(userId));
    } catch {
      // ignore storage errors
    }
  }

  clearUser() {
    this.userIdSubject.next(null);
    try {
      localStorage.removeItem('currentUserId');
    } catch {
      // ignore storage errors
    }
  }
}

