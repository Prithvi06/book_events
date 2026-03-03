from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app import create_app
from app.extensions import db
from app.models import Category, TimeSlot, User


def iso_week_monday_utc(dt: datetime) -> datetime:
    dt = dt.astimezone(timezone.utc)
    monday = dt - timedelta(days=dt.isoweekday() - 1)
    return monday.replace(hour=0, minute=0, second=0, microsecond=0)


def main():
    app = create_app("development")

    with app.app_context():
        db.drop_all()
        db.create_all()

        cat1 = Category(name="Cat 1")
        cat2 = Category(name="Cat 2")
        cat3 = Category(name="Cat 3")
        db.session.add_all([cat1, cat2, cat3])
        db.session.commit()

        prithvi = User(id=1, name="Prithvi", is_admin=False, preferences=["Cat 1", "Cat 2"])
        admin = User(id=2, name="Admin", is_admin=True, preferences=["Cat 1", "Cat 2", "Cat 3"])
        db.session.add_all([prithvi, admin])
        db.session.commit()

        now = datetime.now(timezone.utc)
        week0 = iso_week_monday_utc(now)
        week1 = week0 + timedelta(days=7)

        # Create at least 10 slots spread across current + next week.
        categories = {"Cat 1": cat1, "Cat 2": cat2, "Cat 3": cat3}
        slots: list[TimeSlot] = []

        def add_slot(day_start: datetime, hour_start: int, duration_hours: int, category: str):
            start = day_start.replace(hour=hour_start, minute=0)
            end = start + timedelta(hours=duration_hours)
            slots.append(
                TimeSlot(
                    category_id=categories[category].id,
                    start_time=start,
                    end_time=end,
                )
            )

        # Current week: Mon/Wed/Fri
        for i, day_offset in enumerate([0, 2, 4]):
            day = week0 + timedelta(days=day_offset)
            c = ["Cat 1", "Cat 2", "Cat 3"]
            add_slot(day, 9, 1, c[i % 3])
            add_slot(day, 11, 1, c[(i + 1) % 3])

        # Next week: Tue/Thu/Sat/Sun
        for i, day_offset in enumerate([1, 3, 5, 6]):
            day = week1 + timedelta(days=day_offset)
            c = ["Cat 1", "Cat 2", "Cat 3"]
            add_slot(day, 10, 1, c[i % 3])
            add_slot(day, 14, 2, c[(i + 2) % 3])

        db.session.add_all(slots)
        db.session.commit()

        print(f"Seeded users: {prithvi.id}={prithvi.name}, {admin.id}={admin.name}")
        print(f"Seeded slots: {len(slots)}")


if __name__ == "__main__":
    main()

