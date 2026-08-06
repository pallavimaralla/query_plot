# Query Plot

A full-stack data visualization platform that converts natural language queries into interactive charts. Upload CSV files, ask questions in plain English, and get visualizations powered by AI.

## ✨ Features

- **CSV Upload** - Drag-and-drop file upload with validation
- **Natural Language Queries** - Convert English questions into Python visualization code using LLM
- **AI-Powered Code Generation** - Uses Ollama (CodeLlama) to generate matplotlib/seaborn code
- **Chart Generation** - Automatically creates visualizations from your data
- **Query History** - Store and retrieve previous queries for reuse
- **Chart Caching** - Redis-based caching for fast retrieval
- **Dark Mode UI** - Modern, responsive dark theme with red accents
- **Secure Execution** - Sandboxed Python environment for safe code execution

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Lucide React (icons)

### Backend
- Node.js + Express 5
- PostgreSQL (query history)
- Redis (chart caching)
- Python (data processing)
- Ollama API (LLM - CodeLlama model)

### Data Processing
- Pandas (data manipulation)
- Matplotlib (chart generation)
- Seaborn (statistical visualizations)

## 📋 Prerequisites

Before running the project, ensure you have installed:

- **Node.js** (v16+) and npm
- **Python** (v3.8+) with pip
- **PostgreSQL** (v12+)
- **Redis** (v6+)
- **Ollama** with CodeLlama model

### Installing Ollama and CodeLlama

```bash
# Install Ollama from https://ollama.ai
# Then pull the CodeLlama model
ollama pull codellama
```

## 📦 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd query_plot
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Install Python dependencies
pip install pandas matplotlib seaborn

# Create .env file with database and Redis credentials
cat > .env << EOF
# PostgreSQL
PGHOST=localhost
PGUSER=query_user
PGPASSWORD=query_pass
PGDATABASE=query_db
PGPORT=5432

# Redis
REDIS_URL=redis://localhost:6379

# Backend
PORT=5050
EOF
```

### 3. Database Setup

Create PostgreSQL database and user:

```bash
# Connect to PostgreSQL
psql -U postgres

# In psql prompt:
CREATE USER query_user WITH PASSWORD 'query_pass';
CREATE DATABASE query_db OWNER query_user;
GRANT ALL PRIVILEGES ON DATABASE query_db TO query_user;
```

Create required tables:

```bash
# Connect to the database
psql -U query_user -d query_db -h localhost

# Create queries table
CREATE TABLE queries (
  id SERIAL PRIMARY KEY,
  file_name VARCHAR(255),
  query TEXT,
  generated_code TEXT,
  chart_path VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

# Create uploads table (optional, for tracking file metadata)
CREATE TABLE uploads (
  id SERIAL PRIMARY KEY,
  file_name VARCHAR(255),
  file_path VARCHAR(255),
  file_size INTEGER,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
VITE_API_BASE_URL=http://localhost:5050/api
EOF
```

## 🚀 Running the Project

### Start Redis

```bash
# In a new terminal
redis-server
```

### Start Ollama

```bash
# In a new terminal
ollama serve
```

### Start Backend Server

```bash
cd backend

# Development mode
npm run dev

# Or with node directly
node src/server.js
```

The backend will run on `http://localhost:5050`

### Start Frontend Dev Server

In another terminal:

```bash
cd frontend

# Development mode
npm run dev
```

The frontend will typically run on `http://localhost:5173` (Vite default)

### Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

## 📡 API Endpoints

All endpoints are prefixed with `/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload a CSV file |
| POST | `/query` | Send a natural language query |
| POST | `/process` | Execute Python code to generate chart |
| GET | `/download/:key` | Download a generated chart |
| GET | `/recent-queries` | Get recent queries for a file |

### Upload CSV

```bash
curl -X POST http://localhost:5050/api/upload \
  -F "file=@data.csv"
```

### Send Query

```bash
curl -X POST http://localhost:5050/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "iris.csv",
    "query": "Create a scatter plot of sepal length vs sepal width colored by species"
  }'
```

## 📁 Project Structure

```
query_plot/
├── frontend/                          # React + TypeScript SPA
│   ├── src/
│   │   ├── App.tsx                   # Main app component
│   │   ├── main.tsx                  # Entry point
│   │   ├── pages/
│   │   │   └── Dashboard.tsx         # Main dashboard
│   │   ├── components/
│   │   │   ├── FileUpload.tsx
│   │   │   ├── QueryInput.tsx
│   │   │   ├── ChartDisplay.tsx
│   │   │   └── DownloadSection.tsx
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript types
│   │   └── utils/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                           # Express.js API server
│   ├── src/
│   │   ├── server.js                 # Entry point
│   │   ├── app.js                    # Express app setup
│   │   ├── routes/
│   │   │   └── index.js              # Route definitions
│   │   ├── controllers/
│   │   │   ├── uploadController.js
│   │   │   ├── queryController.js
│   │   │   ├── processController.js
│   │   │   ├── downloadController.js
│   │   │   └── recentQueriesController.js
│   │   └── services/
│   │       ├── aiService.js          # LLM integration
│   │       ├── pythonExecutor.js     # Python code execution
│   │       ├── postgresService.js
│   │       └── redisService.js
│   ├── python/
│   │   └── sandbox_processor.py      # Sandboxed Python execution
│   ├── util/
│   │   └── read_csv_to_json.py       # CSV to JSON converter
│   ├── uploads/                      # Uploaded CSV files
│   ├── charts/                       # Generated chart images
│   ├── package.json
│   └── .env
│
├── .gitignore
└── README.md
```

## 🔄 Data Flow

```
1. User uploads CSV file
   ↓
2. File stored in backend/uploads/
   ↓
3. User enters natural language query
   ↓
4. QueryController sends query to Ollama (CodeLlama LLM)
   ↓
5. LLM generates Python matplotlib/seaborn code
   ↓
6. ProcessController executes code in sandbox_processor.py
   ↓
7. CSV is converted to JSON DataFrame
   ↓
8. Python code generates chart PNG
   ↓
9. Chart path cached in Redis
   ↓
10. Chart returned to frontend for display
```

## 🔒 Security Features

- **Sandboxed Python Execution** - Python code runs in an isolated environment with restricted built-ins
- **File Upload Validation** - Only CSV files allowed, max 10MB
- **Environment Variables** - Sensitive data stored in .env files

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port 5050 (backend)
lsof -i :5050

# Find process using port 5173 (frontend)
lsof -i :5173

# Kill the process (replace PID with actual process ID)
kill -9 <PID>
```

### PostgreSQL Connection Error

Verify PostgreSQL is running and credentials in `.env` are correct:

```bash
# Test connection
psql -U query_user -d query_db -h localhost
```

### Redis Connection Error

Ensure Redis is running:

```bash
# Check Redis status
redis-cli ping
# Should return: PONG
```

### Ollama Not Available

Make sure Ollama is running:

```bash
# Check Ollama service
curl http://localhost:11434/api/tags

# If not running, start it
ollama serve
```

### Chart Not Generating

1. Check backend logs for Python execution errors
2. Verify the CSV has proper column names
3. Ensure the LLM query is descriptive enough

## 📝 Environment Variables

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:5050/api
```

### Backend (.env)
```
# PostgreSQL
PGHOST=localhost
PGUSER=query_user
PGPASSWORD=query_pass
PGDATABASE=query_db
PGPORT=5432

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=5050
```

## 🚀 Production Deployment

For production deployment:

1. Build frontend: `cd frontend && npm run build`
2. Set secure environment variables
3. Use process manager (PM2) for Node.js
4. Configure reverse proxy (Nginx/Apache)
5. Use SSL/TLS certificates
6. Set up proper database backups

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [Redis Documentation](https://redis.io/documentation)
- [Ollama GitHub](https://github.com/ollama/ollama)
- [Matplotlib Documentation](https://matplotlib.org)

## 📄 License

[Your License Here]

## 👤 Author

Pallavi Maralla Satish

---

**Happy plotting! 📊**
