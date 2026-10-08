# 🎮 Tic Tac Duel — Backend

Backend server for **Tic Tac Duel**, built for real-time multiplayer gameplay.

## 🛠️ Tech Stack

- Node.js
- TypeScript
- Express
- Socket.IO
- Zod
- CORS
- Helmet
- dotenv
- Docker

## 📂 Project Structure

```text
backend/
├── src/
│   ├── config/
│   │   └── env.ts
│   ├── controllers/
│   │   └── room_controller.ts
│   ├── core/
│   │   ├── constants/
│   │   ├── errors/
│   │   └── utils/
│   ├── routes/
│   │   └── room_routes.ts
│   ├── services/
│   │   └── room_service.ts
│   ├── sockets/
│   │   ├── room_socket.ts
│   │   └── socket_service.ts
│   ├── types/
│   │   └── room.ts
│   ├── validators/
│   │   └── room_validator.ts
│   ├── app.ts
│   └── index.ts
│
├── .env
├── .env.example
├── .dockerignore
├── Dockerfile
├── nodemon.json
├── package.json
├── package-lock.json
└── tsconfig.json
```

## ⚙️ Setup

Create `.env`:

```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
```

Install dependencies:

```bash
npm install
```

## 🚀 Run

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

Server:

```text
http://localhost:3000
```

## 🐳 Docker

Build:

```bash
docker build -t tictac-duel-backend .
```

Run:

```bash
docker run --env-file .env -p 3000:3000 tictac-duel-backend
```

## 📜 Scripts

```text
npm run dev    Development server
npm start      Production server
```

---

**Tic Tac Duel Backend — v2.0.0**