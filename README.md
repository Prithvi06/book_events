#  Book Events — Demo Event Booking App

A full-stack demo event booking application built with:

- **Frontend:** Angular + Angular Material  
- **Backend:** Flask + SQLAlchemy  
- **Database:** SQLite  

Users can book weekly event timeslots across 3 categories. Admins can manage slots.

---

##  Features

###  User
- Switch between demo users
- Update category preferences
- Book available timeslots
- Unsubscribe from own bookings
- View weekly calendar (Mon–Sun)

###  Admin
- All user features
- Access Admin Panel
- Create new timeslots
- Delete existing timeslots
- View all slots in sortable table

---


#  Prerequisites

Make sure you have:

- **Node.js** (LTS recommended)
- **Angular CLI**
  ```bash
  npm install -g @angular/cli
  ```
- **Python 3.10+**
- **pip** (comes with Python)

---

#  Backend Setup (Flask + SQLite)

## 1️ Navigate to backend

```bash
cd backend
```

## 2️ Install dependencies

```bash
pip install -r requirements.txt
```

## 3️ Seed demo data

```bash
python seed.py
```

This will:
- Create `backend/app.db`
- Insert demo users
- Insert sample timeslots for current and next week

---

##  Run Backend


### Option A — Using Flask (Recommended for Development)

**Windows (PowerShell):**

```powershell
$env:FLASK_APP="run.py"
$env:FLASK_ENV="development"
flask run
```

### Option B — Run Directly

```bash
python run.py
```

---

#  Frontend Setup (Angular + Material)

## 1️ Navigate to frontend

```bash
cd frontend
```

## 2️ Install dependencies

```bash
npm install
```

## 3️ Start Angular app

```bash
ng serve
```
