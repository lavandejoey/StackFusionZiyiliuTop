# Stack Fusion ZiyiLiu.top Monorepo

A unified workspace hosting a TypeScript-powered Express API backend and a React/Vite frontend.

## 🚀 Features

- **Backend**: Express, TypeScript, Redis, MySQL
- **Frontend**: React, TypeScript, Vite
- **Monorepo**: Managed with npm workspaces and shared scripts

## 📂 Project Structure

- `backend/` – REST API server
- `frontend/` – Vite-powered React app
- Root – workspace configuration & orchestration scripts

## 🔧 Getting Started

### Prerequisites

- Node.js (>=16) & npm
- Redis
- MySQL

### Install Dependencies

```bash
npm install
npm run install:all
```

### Development

```bash
npm run dev:all      # Start backend + frontend in dev mode
```

### Build & Production

```bash
npm run build:all    # Compile & bundle both packages
npm start            # Build & start backend in production
```

## 📜 Scripts

Root shortcuts:

- `dev:all`, `dev:backend`, `dev:frontend`
- `build:all`, `build:backend`, `build:frontend`
- `install:all`, `start`

Backend (`backend`):

- `dev`, `build`, `start`

Frontend (`frontend`):

- `dev`, `build`, `lint`, `preview`

## ⚖️ License

This project is licensed under the MIT License (see `LICENSE`).