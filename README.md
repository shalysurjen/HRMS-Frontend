# 🚀 HRMS – Human Resource Management System (Frontend)

A modern **HRMS (Human Resource Management System)** frontend built using **React, TypeScript, and Vite**.

This application provides a scalable and maintainable UI for managing:

---

## ✨ Features

- Create and manage leave requests
- View leave request status and history
- Manager approval & rejection workflow
- Role-based dashboards (Admin, HR, Manager, Employee)
- Notifications & flash updates
- Attendance & payroll modules (extensible)
- Responsive and user-friendly UI
- Type-safe codebase using TypeScript
- Fast development with Vite (HMR)

---

## 🧰 Tech Stack

- React
- TypeScript
- Vite
- ESLint
- REST API Integration
- Modular Feature-Based Architecture

---

## 📁 Project Structure

```bash
src/
├── app/                    # App entry, routing, global setup
├── assets/                 # Images, SVGs
├── config/                 # Environment configs

├── features/               # Core feature modules
│   ├── auth/
│   ├── dashboard/
│   ├── employee/
│   ├── leave/
│   ├── attendance/
│   ├── payroll/
│   ├── notification/
│   ├── onboarding/
│   ├── landingpage/
│   └── launchpage/

├── services/               # API client & interceptors
├── shared/                 # Reusable components, hooks, utils
├── styles/                 # Global styles
```

### 🧠 Architecture Highlights

- **Feature-based structure** → Scales easily
- Each feature contains:
  - `components/`
  - `pages/`
  - `hooks/`
  - `services/`
  - `types/`
- Shared logic lives in `shared/`
- API handling centralized in `services/`

---

## ⚙️ Prerequisites

Make sure you have:

- Node.js (v18 or higher)
- npm or pnpm
- Git

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/mathankumar-dev/leave-management-system-frontend.git
cd leave-management-system-frontend
```

---

### 2️⃣ Install Dependencies

```bash
npm install
```

---

## ▶️ Running the Application

```bash
npm run dev
```

App will run at:

http://localhost:5173

---

## 🧪 Linting

```bash
npm run lint
```

> Fix all lint issues before pushing code.

---

## 🏗️ Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

---

## 🔐 Environment Variables

Create a `.env` file in the root:

```
VITE_API_BASE_URL=http://localhost:8080/api
```

⚠️ Never commit `.env` files.

---

## 📜 Git & Contribution Rules

### 🌿 Branching Strategy

- `main` → Production-ready
- `feature/feature-name` → New features
- `fix/issue-name` → Bug fixes

### ✅ Rules

- Do NOT push directly to `main`
- Use Pull Requests
- Keep PRs small and focused
- Write meaningful commit messages

---

## 📌 Future Enhancements

- Role-Based Access Control (RBAC)
- Better error handling system
- Unit & integration testing
- Performance optimizations
- Advanced analytics dashboards

---

## 📄 License

This project is intended for:

- Internal use
- Educational purposes
- Startup development

All rights reserved.

---

## 👨‍💻 Author

Developed by **Mathan Kumar & Team**
