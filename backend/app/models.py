from __future__ import annotations

from datetime import datetime, timezone, timedelta

from sqlalchemy import CheckConstraint, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .extensions import db


IST = timezone(timedelta(hours=5, minutes=30))


def utcnow() -> datetime:
    # Keep using UTC for generic "now" if ever needed,
    # but all slot times are explicitly managed in IST.
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(db.String(120), nullable=False)
    is_admin: Mapped[bool] = mapped_column(db.Boolean, nullable=False, default=False)
    preferences: Mapped[list[str]] = mapped_column(db.JSON, nullable=False, default=list)

    bookings: Mapped[list["TimeSlot"]] = relationship(
        back_populates="booked_by",
        primaryjoin="User.id==TimeSlot.booked_by_user_id",
    )


class Category(db.Model):
    __tablename__ = "categories"
    __table_args__ = (UniqueConstraint("name", name="uq_category_name"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(db.String(20), nullable=False)

    slots: Mapped[list["TimeSlot"]] = relationship(back_populates="category_rel")


class TimeSlot(db.Model):
    __tablename__ = "time_slots"
    __table_args__ = (
        CheckConstraint("end_time > start_time", name="ck_end_after_start"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), nullable=False)
    category_rel: Mapped[Category] = relationship(back_populates="slots")
    start_time: Mapped[datetime] = mapped_column(db.DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(db.DateTime(timezone=True), nullable=False)

    booked_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )
    booked_by: Mapped[User | None] = relationship(back_populates="bookings")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "category": self.category_rel.name,
            # Expose times in IST so they round-trip with the frontend.
            "start_time": self.start_time.astimezone(IST).isoformat(),
            "end_time": self.end_time.astimezone(IST).isoformat(),
            "booked_by_user_id": self.booked_by_user_id,
            "booked_by_name": self.booked_by.name if self.booked_by else None,
        }

