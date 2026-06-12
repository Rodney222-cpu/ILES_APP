# ILES APP - Setup Guide for Collaborators

## Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL installed and running
- Git

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/Rodney222-cpu/ILES_APP.git
cd ILES_SYSTEM_1
```

## Step 2: Backend Setup (Django)

### 2a. Create a Python virtual environment

```bash
cd my_iles_project
python -m venv venv
```

**Activate it:**
- Windows: `venv\Scripts\activate`
- Mac/Linux: `source venv/bin/activate`

### 2b. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 2c. Create your `.env` file

Copy the example file and fill in YOUR local PostgreSQL credentials:

```bash
cp .env.example .env
```

Then edit `.env`:
```
DEBUG=True
DB_NAME=iles_app_db
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
DB_HOST=127.0.0.1
```

### 2d. Create the PostgreSQL database

Open `psql` or pgAdmin and create the database:

```sql
CREATE DATABASE iles_app_db;
```

### 2e. Run migrations

```bash
python manage.py migrate
```

### 2f. Create a superuser (first time only)

```bash
python manage.py createsuperuser
```

### 2g. Start the Django backend server

```bash
python manage.py runserver
```

The backend runs at: **http://127.0.0.1:8000**

---

## Step 3: Frontend Setup (React)

Open a **new terminal** (keep the backend running in the first one):

```bash
cd frontend
npm install
npm start
```

The frontend runs at: **http://localhost:3000**

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError` | Make sure your virtual environment is activated and run `pip install -r requirements.txt` |
| `django.core.exceptions.ImproperlyConfigured` | Check that your `.env` file exists and has correct database credentials |
| `could not connect to server` | Make sure PostgreSQL is running on your machine |
| Login page not showing | Make sure you run `npm start` inside the `frontend/` folder and open **http://localhost:3000** |
| `npm: command not found` | Install Node.js from https://nodejs.org |
| Port 8000 already in use | Kill the process on port 8000 or run `python manage.py runserver 8080` |

---

## Quick Checklist (every time you pull new code)

```bash
git pull origin main
cd my_iles_project
python manage.py migrate          # Apply any new database migrations
cd ../frontend
npm install                       # Install any new npm packages
npm start                         # Start the frontend
```
