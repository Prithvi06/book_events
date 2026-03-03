import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgFor, AsyncPipe, DatePipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';

import { TimeSlot } from '../../core/models/slot.model';
import { User } from '../../core/models/user.model';
import { CurrentUserService } from '../../core/services/current-user.service';
import { SlotsService } from '../../core/services/slots.service';
import { UserService } from '../../core/services/user.service';

type CategoryOrAll = 'All' | 'Cat 1' | 'Cat 2' | 'Cat 3';

@Component({
  standalone: true,
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  imports: [
    // Angular
    NgIf,
    NgFor,
    AsyncPipe,
    DatePipe,
    // Material
    MatButtonModule,
    MatChipsModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
})
export class CalendarComponent implements OnInit {
  readonly categories: CategoryOrAll[] = ['All', 'Cat 1', 'Cat 2', 'Cat 3'];

  loading = false;
  weekStart = startOfIsoWeek(new Date());
  weekKey = isoWeekString(this.weekStart);

  selected: Set<CategoryOrAll> = new Set(['All']);

  allSlots: TimeSlot[] = [];
  filteredSlots: TimeSlot[] = [];
  isAdmin = false;
  private currentUserName: string | null = null;

  constructor(
    private readonly slotsService: SlotsService,
    private readonly userService: UserService,
    private readonly currentUser: CurrentUserService,
    private readonly snack: MatSnackBar,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUser.user$.subscribe((user) => {
      this.isAdmin = !!user?.is_admin;
      this.currentUserName = user?.name ?? null;
    });

    // Always load initial data based on the currently selected user ID.
    // This works both after login (where signInAs has set the ID)
    // and after a full page refresh (where the ID is restored from localStorage).
    const userId = this.currentUser.userIdSnapshot;
    this.loadInitialForUser(userId);
  }

  private loadInitialForUser(userId: number): void {
    this.loading = true;

    forkJoin({
      prefs: this.userService.getPreferences(userId),
      slots: this.slotsService.getSlots(this.weekKey),
    }).subscribe({
      next: ({ prefs, slots }) => {
        // Apply preferences to selected categories.
        const allowed: CategoryOrAll[] = ['Cat 1', 'Cat 2', 'Cat 3'];
        const fromPrefs = (prefs || []).filter((p) =>
          allowed.includes(p as CategoryOrAll)
        ) as CategoryOrAll[];
        this.selected =
          fromPrefs.length > 0 ? new Set(fromPrefs) : new Set(['All']);

        // Set slots and apply filter once both responses have arrived.
        this.allSlots = slots;
        this.applyFilter();
        if (this.filteredSlots.length === 0 && this.allSlots.length > 0) {
          this.selected = new Set(['All']);
          this.applyFilter();
        }

        this.loading = false;
        // Ensure view updates immediately even if running outside Angular zone.
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.loading = false;
        this.selected = new Set(['All']);
        this.snack.open(
          e?.error?.error ?? 'Failed to load preferences or slots',
          'Close',
          { duration: 3500 }
        );
        this.cdr.markForCheck();
      },
    });
  }

  get weekRangeLabel(): string {
    const end = new Date(this.weekStart);
    end.setDate(end.getDate() + 6);
    const fmt = new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const fmtNoYear = new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
    });
    const startText = fmtNoYear.format(this.weekStart);
    const endText = fmt.format(end);
    return `${startText} – ${endText}`;
  }

  prevWeek() {
    const d = new Date(this.weekStart);
    d.setDate(d.getDate() - 7);
    this.weekStart = startOfIsoWeek(d);
    this.weekKey = isoWeekString(this.weekStart);
    this.fetchSlots();
  }

  nextWeek() {
    const d = new Date(this.weekStart);
    d.setDate(d.getDate() + 7);
    this.weekStart = startOfIsoWeek(d);
    this.weekKey = isoWeekString(this.weekStart);
    this.fetchSlots();
  }

  toggleCategory(cat: CategoryOrAll) {
    if (cat === 'All') {
      this.selected = new Set(['All']);
    } else {
      const next = new Set(this.selected);
      next.delete('All');
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      if (next.size === 0) next.add('All');
      this.selected = next;
    }

    // Just re-apply filter on the already loaded slots for snappy UX.
    this.applyFilter();
  }

  get slotsByDay(): { label: string; slots: TimeSlot[] }[] {
    const out: { label: string; slots: TimeSlot[] }[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(this.weekStart);
      day.setDate(day.getDate() + i);
      const label = new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(day);
      const slots = this.filteredSlots.filter((s) => isoWeekdayIndex(s.start_time) === i);
      out.push({ label, slots });
    }
    return out;
  }

  isBookedByMe(slot: TimeSlot): boolean {
    return slot.booked_by_user_id === this.currentUser.userIdSnapshot;
  }

  isAvailable(slot: TimeSlot): boolean {
    return slot.booked_by_user_id === null;
  }

  asyncBook(slot: TimeSlot) {
    if (this.isAdmin) {
      this.snack.open('Admins cannot sign up for time slots.', 'Close', {
        duration: 3000,
      });
      return;
    }
    const userId = this.currentUser.userIdSnapshot;
    const original = { ...slot };

    // Optimistic update so the UI reflects the change immediately.
    this.replaceSlot({
      ...slot,
      booked_by_user_id: userId,
      booked_by_name: this.currentUserName ?? slot.booked_by_name ?? 'Someone',
    });

    this.slotsService.bookSlot(slot.id, userId).subscribe({
      next: (updated) => {
        this.replaceSlot(updated);
        this.snack.open('Booked successfully', 'Close', { duration: 2500 });
      },
      error: (e) => {
        if (e?.status === 409) {
          this.snack.open(
            'This slot was just taken. Please choose another.',
            'Close',
            { duration: 3500 }
          );
          this.replaceSlot({
            ...slot,
            booked_by_user_id: -1,
            booked_by_name: 'Someone else',
          });
          return;
        }
        // Revert optimistic update on other errors.
        this.replaceSlot(original);
        this.snack.open(e?.error?.error ?? 'Failed to book slot', 'Close', {
          duration: 3500,
        });
      },
    });
  }

  asyncUnbook(slot: TimeSlot) {
    if (this.isAdmin) {
      this.snack.open('Admins cannot manage bookings here.', 'Close', {
        duration: 3000,
      });
      return;
    }
    const userId = this.currentUser.userIdSnapshot;
    const original = { ...slot };

    // Optimistic update so the UI reflects the change immediately.
    this.replaceSlot({
      ...slot,
      booked_by_user_id: null,
      booked_by_name: null,
    });

    this.slotsService.unbookSlot(slot.id, userId).subscribe({
      next: (updated) => {
        this.replaceSlot(updated);
        this.snack.open('Unsubscribed', 'Close', { duration: 2500 });
      },
      error: (e) => {
        // Revert optimistic update on error.
        this.replaceSlot(original);
        this.snack.open(e?.error?.error ?? 'Failed to unsubscribe', 'Close', {
          duration: 3500,
        });
      },
    });
  }

  private fetchSlots() {
    this.loading = true;
    this.slotsService.getSlots(this.weekKey).subscribe({
      next: (slots) => {
        this.loading = false;
        this.allSlots = slots;
        // First apply the current preference-based filter.
        this.applyFilter();
        // If preferences result in no visible slots for this week but
        // there ARE slots, fall back to showing all categories so the
        // user sees something by default.
        if (this.filteredSlots.length === 0 && this.allSlots.length > 0) {
          this.selected = new Set(['All']);
          this.applyFilter();
        }
      },
      error: (e) => {
        this.loading = false;
        this.snack.open(e?.error?.error ?? 'Failed to load slots', 'Close', {
          duration: 3500,
        });
      },
    });
  }

  private applyFilter() {
    if (this.selected.has('All')) {
      this.filteredSlots = [...this.allSlots];
      return;
    }
    this.filteredSlots = this.allSlots.filter((s) =>
      this.selected.has(s.category as CategoryOrAll)
    );
  }

  private replaceSlot(updated: TimeSlot) {
    this.allSlots = this.allSlots.map((s) => (s.id === updated.id ? updated : s));
    this.applyFilter();
  }
}

function startOfIsoWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  // JS: Sun=0..Sat=6; ISO week starts Monday.
  const day = x.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function isoWeekString(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Thursday in current week determines ISO year.
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const isoYear = date.getUTCFullYear();
  return `${isoYear}-W${String(weekNo).padStart(2, '0')}`;
}

function isoWeekdayIndex(isoUtc: string): number {
  const dt = new Date(isoUtc);
  // Convert to local day index in the displayed week columns (Mon=0..Sun=6)
  const day = dt.getDay(); // 0..6
  return day === 0 ? 6 : day - 1;
}

