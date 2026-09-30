# 🎮 Tic Tac Duel — Backend

The backend server for **Tic Tac Duel**, providing REST APIs, real-time multiplayer communication, room management, player management, request validation, and PostgreSQL database integration.

---

## 🛠️ Tech Stack

* **Runtime:** Node.js
* **Language:** TypeScript
* **Framework:** Express 5
* **Real-time:** Socket.IO
* **Database:** PostgreSQL
* **ORM:** Drizzle ORM
* **Validation:** Zod
* **CORS:** CORS
* **Environment:** dotenv
* **Development:** Nodemon + TSX
* **Containerization:** Docker & Docker Compose

---

## 📂 Backend Structure

```text
backend/
├── src/
│   ├── config/
│   │   └── env.ts
│   │
│   ├── controllers/
│   │   ├── player_controller.ts
│   │   └── room_controller.ts
│   │
│   ├── core/
│   │   ├── constants/
│   │   │   └── socket_events.ts
│   │   └── utils/
│   │       ├── logger.ts
│   │       ├── response.ts
│   │       └── socket_response.ts
│   │
│   ├── db/
│   │   ├── index.ts
│   │   ├── schema.ts
│   │   └── types.ts
│   │
│   ├── models/
│   │   └── room_model.ts
│   │
│   ├── routes/
│   │   ├── player_routes.ts
│   │   └── room_routes.ts
│   │
│   ├── services/
│   │   ├── player_service.ts
│   │   └── room_service.ts
│   │
│   ├── sockets/
│   │   ├── room_socket.ts
│   │   └── socket_service.ts
│   │
│   ├── validators/
│   │   ├── player_validator.ts
│   │   └── room_validator.ts
│   │
│   ├── app.ts
│   └── index.ts
│
├── drizzle/
│   └── # Generated Drizzle migrations
│
├── .env
├── .env.web
├── .env.db
├── .env.example
├── compose.yaml
├── Dockerfile
├── drizzle.config.ts
├── nodemon.json
├── package.json
├── package-lock.json
└── tsconfig.json
```

### 📁 Directory Responsibilities

| Directory         | Responsibility                                       |
| ----------------- | ---------------------------------------------------- |
| `config/`         | Application and environment configuration            |
| `controllers/`    | Handles HTTP requests and API responses              |
| `core/constants/` | Shared backend constants, including Socket.IO events |
| `core/utils/`     | Logging and standardized HTTP/Socket responses       |
| `db/`             | Database connection, schema, and database types      |
| `models/`         | Application-level data models                        |
| `routes/`         | Express REST API route definitions                   |
| `services/`       | Business logic and database operations               |
| `sockets/`        | Socket.IO connection and room event handling         |
| `validators/`     | Request validation schemas                           |
| `drizzle/`        | Generated Drizzle database migrations                |

---

## 📋 Prerequisites

Make sure the following are installed:

* [Node.js](https://nodejs.org/)
* npm
* [Docker](https://www.docker.com/)
* Docker Compose

Verify the installation:

```bash
node --version
npm --version
docker --version
docker compose version
```

---

## ⚙️ Environment Configuration

Tic Tac Duel uses separate environment files for local development and Docker.

### Local Development

Create a `.env` file inside the `backend` directory:

```env
# Application
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Database
DATABASE_URL=postgresql://tictac_duel:your_postgres_password@localhost:5432/tictac_duel

# Logging
LOG_LEVEL=info
```

Start the backend directly with:

```bash
npm run dev
```

### Docker Development

For Docker development, use separate environment files:

#### `.env.docker.web`

```env
# Application
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Database
DATABASE_URL=postgresql://tictac_duel:your_postgres_password@tictac_duel_db:5432/tictac_duel

# Logging
LOG_LEVEL=info
```

#### `.env.docker.db`

```env
# PostgreSQL
POSTGRES_USER=tictac_duel
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DB=tictac_duel
POSTGRES_PORT=5432
```

Start the Docker containers with:

```bash
docker compose --env-file .env.docker.web up --build
```

### Environment Variables

| Variable            | Description               | Example            |
| ------------------- | ------------------------- | ------------------ |
| `PORT`              | HTTP server port          | `3000`             |
| `HOST`              | Server host               | `0.0.0.0`          |
| `NODE_ENV`          | Runtime environment       | `development`      |
| `DATABASE_URL`      | PostgreSQL connection URL | `postgresql://...` |
| `LOG_LEVEL`         | Application log level     | `info`             |
| `POSTGRES_USER`     | PostgreSQL username       | `tictac_duel`      |
| `POSTGRES_PASSWORD` | PostgreSQL password       | `your_password`    |
| `POSTGRES_DB`       | PostgreSQL database name  | `tictac_duel`      |
| `POSTGRES_PORT`     | PostgreSQL port           | `5432`             |

> ⚠️ **Never commit `.env`, `.env.docker.web`, or `.env.docker.db` to Git. Use `.env.example` as the configuration template.**

---

## 📦 Install Dependencies

From the repository root:

```bash
npm install
```

---

## 🐘 PostgreSQL with Docker

Start only the PostgreSQL database:

```bash
docker compose --env-file .env.docker.web up -d tictac_duel_db
```

Check the container:

```bash
docker compose ps
```

PostgreSQL is exposed locally at:

```text
localhost:5432
```

When the backend runs inside Docker Compose, it connects to PostgreSQL using:

```text
tictac_duel_db:5432
```


---

## 🗄️ Database

Tic Tac Duel uses **PostgreSQL** with **Drizzle ORM**.

The database layer is located at:

```text
src/db/
├── index.ts
├── schema.ts
└── types.ts
```

### Generate Migration

After changing the Drizzle schema:

```bash
npm run db:generate
```

### Run Migrations

```bash
npm run db:migrate
```

### Push Schema

For development:

```bash
npm run db:push
```

---

# 🌐 REST API

The backend exposes REST endpoints through Express.

## Server Endpoints

### Server Status

```http
GET /
```

Returns the server status.

### Health Check

```http
GET /health
```

Returns the server health status.

### API Status

```http
GET /api
```

Returns the API status.

---

## 👤 Player API

Base URL:

```text
/api/players
```

### Create Player

```http
POST /api/players
```

### Get Players

```http
GET /api/players
```

### Get Player

```http
GET /api/players/:id
```

### Delete Player

```http
DELETE /api/players/:id
```

Player requests follow the backend service architecture:

```text
Route
  ↓
PlayerController
  ↓
PlayerService
  ↓
Database
```

---

## 🏠 Room API

Base URL:

```text
/api/rooms
```

### Get Rooms

```http
GET /api/rooms
```

### Get Public Rooms

```http
GET /api/rooms/public
```

### Get Room

```http
GET /api/rooms/:id
```

### Create Room

```http
POST /api/rooms
```

### Join Room

```http
POST /api/rooms/join
```

### Delete Room

```http
DELETE /api/rooms/:id
```

Room requests follow the backend service architecture:

```text
Route
  ↓
RoomController
  ↓
RoomService
  ↓
Database
```

---

# ⚡ Real-Time Multiplayer

Tic Tac Duel uses **Socket.IO** for real-time multiplayer communication.

The Socket.IO server is attached directly to the same HTTP server used by Express.

```text
                       HTTP Server
                            │
              ┌─────────────┴─────────────┐
              │                           │
         Express REST                 Socket.IO
              │                           │
       ┌──────┴──────┐             ┌──────┴──────┐
       │             │             │             │
    Players        Rooms        Room Events   Connection
```

Socket.IO endpoint:

```text
http://localhost:3000/socket.io/
```

Socket implementation:

```text
src/sockets/
├── room_socket.ts
└── socket_service.ts
```

Socket event constants:

```text
src/core/constants/socket_events.ts
```

---

# 🔌 Socket.IO Events

Socket events are centralized in `socket_events.ts` to avoid hard-coded event names throughout the application.

## 🏠 Room Socket Events

| Event                | Direction       | Purpose                                                                |
| -------------------- | --------------- | ---------------------------------------------------------------------- |
| `connect_room`       | Client → Server | Connect a player to a room                                             |
| `room_connected`     | Server → Client | Sends the current room state to the connected player                   |
| `player_joined`      | Server → Room   | Notifies existing players that another player joined                   |
| `player_left`        | Server → Room   | Notifies players that a player left while waiting                      |
| `start_game`         | Client → Server | Requests the host to start the game                                    |
| `round_started`      | Server → Room   | Notifies players that a round has started                              |
| `set_ready`          | Client → Server | Marks the connected player as ready                                    |
| `ready_updated`      | Server → Room   | Broadcasts updated player readiness                                    |
| `make_move`          | Client → Server | Submits a player's move                                                |
| `move_made`          | Server → Room   | Broadcasts a successful move                                           |
| `submit_game_result` | Client → Server | Submits the completed round result                                     |
| `round_result`       | Server → Room   | Broadcasts the round result                                            |
| `game_dismissed`     | Server → Room   | Notifies the remaining player when an opponent disconnects during play |
| `room_closed`        | Server → Room   | Notifies players that the host closed the waiting room                 |
| `room_error`         | Server → Client | Reports a room or Socket.IO operation error                            |

---

## 🔄 Socket Event Flow

The current multiplayer flow is:

```text
Connect to Socket.IO
        │
        ▼
  connect_room
        │
        ▼
  room_connected
        │
        ├───────────────┐
        │               │
        ▼               ▼
 player_joined      set_ready
                        │
                        ▼
                  ready_updated
                        │
                        ▼
                    start_game
                        │
                        ▼
                  round_started
                        │
                        ▼
                    make_move
                        │
                        ▼
                    move_made
                        │
                        ▼
               submit_game_result
                        │
                        ▼
                   round_result
```

If a player disconnects, the server handles the room according to its current state:

```text
                     Player Disconnect
                            │
                 ┌──────────┴──────────┐
                 │                     │
              Playing                Waiting
                 │                     │
                 ▼              ┌──────┴──────┐
        Remaining player        │             │
             wins             Host          Guest
                               │             │
                               ▼             ▼
                         room_closed    player_left
                               │             │
                               ▼             ▼
                         Room deleted   Player removed
```

---

# 🔗 Connecting a Player to a Room

The `connect_room` event validates the supplied room connection data before allowing the socket to join the room.

The server:

1. Validates the incoming payload.
2. Finds the room by room code.
3. Verifies that the player belongs to the room.
4. Leaves any previously joined rooms.
5. Joins the requested room.
6. Stores `playerId` and `roomId` in `socket.data`.
7. Sends the current room state through `room_connected`.
8. Notifies existing room members through `player_joined` when appropriate.

The socket stores the player's identity using:

```text
socket.data.playerId
socket.data.roomId
```

This identity is subsequently used to validate Socket.IO operations.

---

# 🎯 Making a Move

Players submit moves through:

```text
make_move
```

The server validates:

* Request payload
* Connected socket player identity
* Socket room membership
* Room state

The move is then processed by:

```text
RoomService.makeMove()
```

After a successful move, the result is broadcast to the room through:

```text
move_made
```

The emitted result contains the room and move information returned by the room service.

---

# 🏁 Submitting a Game Result

After a round is completed, the client submits the result through:

```text
submit_game_result
```

The request contains the relevant:

* Room code
* Player ID
* Winner player ID
* Winning indexes

The server processes the result through:

```text
RoomService.submitGameResult()
```

The resulting round state is then broadcast through:

```text
round_result
```

The result can include information such as:

* Completed round
* Round status
* Winner player ID
* Winning indexes
* Whether the complete game has finished

---

# 🟢 Player Ready State

Players can mark themselves ready using:

```text
set_ready
```

The server retrieves the player's identity and room from:

```text
socket.data.playerId
socket.data.roomId
```

Once the ready state is updated, the server broadcasts:

```text
ready_updated
```

When both players are present and ready, the server starts the round and broadcasts:

```text
round_started
```

The host can also explicitly request:

```text
start_game
```

The server verifies that:

* The socket is connected to a room.
* The requesting player is the room host.
* Exactly two players are present.
* Both players are ready.

---

# 🚪 Disconnect Handling

The backend handles Socket.IO disconnects based on the current room state.

## Playing State

When a player disconnects while a round is being played:

1. The server identifies the remaining connected player.
2. The room is deleted.
3. The remaining player receives `game_dismissed`.
4. The remaining player is identified as the winner because the opponent disconnected.

The event contains:

```text
winnerPlayerId
disconnectedPlayerId
reason
```

The disconnect reason is:

```text
opponent_disconnected
```

---

## Waiting State — Host Leaves

If the host leaves before the game begins:

```text
room_closed
```

is emitted to the remaining room members.

The room is then deleted.

---

## Waiting State — Guest Leaves

If a guest leaves while the room is waiting:

1. The guest is removed from the room.
2. The updated room state is retrieved.
3. The remaining player receives:

```text
player_left
```

The room remains available when appropriate.

---

# 🔐 Socket Validation

Socket requests are validated using Zod schemas before reaching the service layer.

Room-related validators include:

```text
src/validators/room_validator.ts
```

Current socket validators include:

```text
connectRoomValidator
makeMoveValidator
submitGameResultValidator
```

The server also verifies that the player ID supplied by a request matches the identity stored on the connected socket.

```text
socket.data.playerId
```

Room membership is additionally checked before performing room-specific operations.

Invalid requests are returned through:

```text
room_error
```

---

# 📡 Socket Response Format

Socket responses are standardized through:

```text
src/core/utils/socket_response.ts
```

Successful responses are generated through:

```text
SocketResponse.success(...)
```

Errors are generated through:

```text
SocketResponse.error(...)
```

This keeps Socket.IO responses consistent across room operations.

---

# ❌ Socket Error Handling

Validation errors are emitted through:

```text
room_error
```

Server-side socket failures are logged using the centralized logger:

```text
src/core/utils/logger.ts
```

The server then sends a standardized Socket.IO error response to the requesting client.

---

# 🔁 REST + Socket.IO Architecture

The backend uses REST APIs for resource-oriented operations and Socket.IO for real-time multiplayer communication.

```text
                       Flutter Client
                             │
                 ┌───────────┴───────────┐
                 │                       │
              REST API               Socket.IO
                 │                       │
                 ▼                       ▼
             Express               Room Socket
                 │                       │
                 ▼                       ▼
            Controllers              Validators
                 │                       │
                 └───────────┬───────────┘
                             │
                             ▼
                         Services
                             │
                             ▼
                       Drizzle ORM
                             │
                             ▼
                         PostgreSQL
```

---

# 🏗️ Server Architecture

```text
                       ┌──────────────────────┐
                       │    Flutter Client    │
                       └──────────┬───────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │    Tic Tac Duel Backend   │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
             ┌──────▼──────┐             ┌──────▼──────┐
             │   Express   │             │  Socket.IO  │
             │   REST API  │             │ Real-Time   │
             └──────┬──────┘             └──────┬──────┘
                    │                           │
             ┌──────▼──────┐             ┌──────▼──────┐
             │ Controllers │             │ Room Socket │
             └──────┬──────┘             └──────┬──────┘
                    │                           │
                    └─────────────┬─────────────┘
                                  │
                         ┌────────▼────────┐
                         │   Validators    │
                         └────────┬────────┘
                                  │
                         ┌────────▼────────┐
                         │    Services     │
                         └────────┬────────┘
                                  │
                         ┌────────▼────────┐
                         │  Drizzle ORM    │
                         └────────┬────────┘
                                  │
                         ┌────────▼────────┐
                         │   PostgreSQL    │
                         └─────────────────┘
```

---

# 🐳 Docker

Build and start the complete backend environment:

```bash
docker compose up --build
```

Run in detached mode:

```bash
docker compose up -d --build
```

View backend logs:

```bash
docker compose logs -f tictac_duel_backend
```

View all services:

```bash
docker compose ps
```

Stop the services:

```bash
docker compose down
```

Stop the services and remove the PostgreSQL volume:

```bash
docker compose down -v
```

> ⚠️ `docker compose down -v` permanently removes the PostgreSQL data stored in the Docker volume.

---

# 🔌 Development Workflow

## Option 1 — Node.js + Docker PostgreSQL

Run the Node.js backend directly on the host and PostgreSQL through Docker:

```bash
npm install

docker compose --env-file .env.docker.web up -d tictac_duel_db

npm run db:migrate

npm run dev
```

Backend:

```text
http://localhost:3000
```

PostgreSQL:

```text
localhost:5432
```

The local backend connects to PostgreSQL through:

```text
localhost:5432
```

---

## Option 2 — Complete Docker Environment

Run both the backend and PostgreSQL through Docker Compose:

```bash
docker compose --env-file .env.docker.web up --build
```

The backend connects to PostgreSQL internally using:

```text
tictac_duel_db:5432
```

Backend:

```text
http://localhost:3000
```

PostgreSQL:

```text
localhost:5432
```

---

# 📜 Available Scripts

| Command               | Description                                 |
| --------------------- | ------------------------------------------- |
| `npm start`           | Start the backend server                    |
| `npm run dev`         | Start development server with Nodemon + TSX |
| `npm run db:generate` | Generate Drizzle migrations                 |
| `npm run db:migrate`  | Run Drizzle migrations                      |
| `npm run db:push`     | Push schema directly to PostgreSQL          |

---

# 🔐 Database Connection

## Local Development

When Node.js runs directly on the host:

```text
postgresql://tictac_duel:<password>@localhost:5432/tictac_duel
```

## Docker

When the backend runs inside Docker Compose:

```text
postgresql://tictac_duel:<password>@tictac_duel_db:5432/tictac_duel
```

Docker Compose provides the internal database hostname:

```text
tictac_duel_db
```

---

# 🧪 Health Check

After starting the backend, verify the server:

```text
http://localhost:3000/health
```

Root endpoint:

```text
http://localhost:3000/
```

API endpoint:

```text
http://localhost:3000/api
```

Socket.IO endpoint:

```text
http://localhost:3000/socket.io/
```

---

# 📦 Backend Version

```text
v1.0.0
```

The **Tic Tac Duel Backend v1.0.0** provides the server-side foundation for real-time multiplayer gameplay, including:

* REST API infrastructure
* Player management
* Room management
* PostgreSQL persistence
* Drizzle ORM integration
* Zod request validation
* Socket.IO real-time communication
* Room connection management
* Player ready-state management
* Real-time move synchronization
* Round result synchronization
* Player disconnect handling
* Standardized HTTP responses
* Standardized Socket.IO responses
* Centralized Socket.IO event constants
* Centralized logging
* Docker-based PostgreSQL and backend environment
* Graceful server shutdown

The backend is designed to support **room-based multiplayer Tic-Tac-Toe gameplay** between Tic Tac Duel clients.
