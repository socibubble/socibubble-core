⚠️ Mirror repository

This is a read-only mirror for visibility.

Canonical source:
https://codeberg.org/socibubble/socibubble-core

# SociBubble-core

Early, experimental interest-based matching engine. Core concepts are original; implementation of this entire project is AI-assisted.

## Conceptual Overview

SociBubble-Core is designed to **improve the likelihood of users forming genuine, authentic, and meaningful friendships** through algorithmic matching.

### How It Works – Part One

#### 1. Meaningful Friendships
* **Authentic and Genuine:** A meaningful friendship arises when users connect with someone presenting their true self. Each user has a natural **archetype or persona** representing who they are most authentically.
* **Positive Connection:** Traditionally, friendships form from shared interests. SociBubble-Core extends this to include **shared or complementary archetypes/personas**, allowing connections to form even when interests differ.

#### 2. Archetypes / Personas
* **Definition:** Each archetype/persona has a **creative name, descriptive traits, and interest alignments**.
* **Flexible Alignment:** Users "put on their archetype/persona cap" for interactions, allowing for **enhanced compatibility** even with differing interests.

#### 3. Beyond Shared Interests
* Matching is based on **shared or complementary archetypes/personas**, not just identical interests.
* Complementary archetypes can create **unexpectedly positive connections**, enabling the "opposites attract" phenomenon.

#### 4. Group Dynamics and Synergy
* Positive connections are influenced by **how archetypes interact within groups**, not just pairwise similarity.
* **Synergy:** Complementary archetypes can enhance group interactions, creating **meaningful social dynamics**.

#### 5. Quantifying Alignment
* Users select **5-7 interests out of 52**, which are used to calculate alignment scores with each archetype.
* Scores are adjusted with **predefined multipliers based on rank**, ensuring a **predictable distribution** of archetype assignments.
* Alignment scores are presented to users, showing **potential compatibility** with different archetypes.

#### 6. Core Idea
By combining **archetype-based matching** with **interest-based scoring**, SociBubble-Core:
* Moves beyond surface-level shared interests.
* Encourages authentic connections through personas.
* Enables unique and rare connections.
* Leverages group dynamics to enhance the probability of meaningful friendships.

---

## 🚀 Running the Project Locally

### Prerequisites

- **Node.js** (v16 or higher)
- **PostgreSQL** (v13 or higher)
- **npm** or **yarn**

### 1. Database Setup

First, create a PostgreSQL database and run the schema migration:

```bash
# Create a new database (from psql or your preferred tool)
createdb persona_matching

# Run the schema migration
psql -d persona_matching -f persona-matching/database/migrations/001_create_core_schema/schema.sql
```

### 2. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd persona-matching/backend
npm install
```

Create a `.env` file in the `backend` directory with your database credentials:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/persona_matching
PORT=3000
NODE_ENV=development
```

Start the backend server:

```bash
npm run dev
```

The server will run on `http://localhost:3000`

### 3. Frontend Setup

In a new terminal, navigate to the frontend directory:

```bash
cd persona-matching/frontend
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### 4. Verify Installation

- Backend health check: `http://localhost:3000/health`
- Frontend interface: `http://localhost:5173`

---

## 📁 Project Structure

```
persona-matching/
├── backend/          # Express API server
│   ├── config/       # Database configuration
│   ├── controllers/  # Route controllers
│   ├── db/          # Database queries
│   ├── middleware/  # Express middleware
│   ├── routes/      # API routes
│   └── utils/       # Utility functions
├── database/        # SQL migrations
│   └── migrations/
└── frontend/        # React + TypeScript UI
    ├── src/
    │   ├── api/     # API client functions
    │   ├── components/  # React components
    │   ├── pages/   # Page components
    │   └── types/   # TypeScript types
    └── public/
```

## 🛠️ Development

- **Backend**: Runs with nodemon for auto-reload on file changes
- **Frontend**: Uses Vite for fast HMR (Hot Module Replacement)

## 📊 Features

- **User Registry**: Manage users with version control
- **Persona Trait Management**: Define and track user personas
- **Matrix-Based Archetype Definitions**: Configure archetype patterns
- **Matching Calculator**: Calculate alignment scores between users
- **Lobby Mode**: Group matching and compatibility analysis
- **Pair Matching**: One-on-one connection recommendations

---

## 📝 License

This project is licensed under the [GNU Affero General Public License v3.0 (AGPL-3.0-only)](https://www.gnu.org/licenses/agpl-3.0.html). Use of this software as a networked service requires that **modifications to the core engine be made publicly available under the same license**.
