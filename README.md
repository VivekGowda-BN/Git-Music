# Ambient Music Capture & Version Control

An MVP web application for capturing short audio ideas, tagging them using local AI (Ollama), and tracking versions with parent-child relationships.

## Prerequisites

- **Node.js**: v18+ recommended.
- **Python**: v3.9+ recommended.
- **Ollama**: Installed and running locally. You must pull the `llama3` model before running the application.

## Setup Instructions

### 1. Ollama Setup
Run the Ollama server and ensure `llama3` is available.
```bash
ollama serve
# in another terminal:
ollama run llama3
```

### 2. Python Service (FastAPI)
Navigate to the `python-service` directory, install requirements, and run the server.
```bash
cd python-service
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
This service processes audio tagging requests and runs on `http://localhost:8000`.

### 3. Backend (Node.js + Express)
Navigate to the `backend` directory, install dependencies, and run the server.
```bash
cd backend
npm install
npm run dev
```
The backend handles database operations, file storage in the `/uploads` directory, and runs on `http://localhost:3000`.

### 4. Frontend (React + Vite)
Navigate to the `frontend` directory, install dependencies, and run the development server.
```bash
cd frontend
npm install
npm run dev
```
The frontend is the UI for the application and runs on `http://localhost:5173`.
