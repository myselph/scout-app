#!/bin/bash

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

start_servers() {
    echo "Starting Backend..."
    cd "$BACKEND_DIR"
    nohup ./start.sh > backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > .backend.pid
    echo "Backend started (PID: $BACKEND_PID, logs: backend/backend.log)"

    echo "Starting Frontend..."
    cd "$FRONTEND_DIR"
    nohup npm run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > .frontend.pid
    echo "Frontend started (PID: $FRONTEND_PID, logs: frontend/frontend.log)"
    
    echo "Servers are starting. Frontend should be available at http://localhost:5173"
}

stop_servers() {
    echo "Stopping Backend..."
    if [ -f "$BACKEND_DIR/.backend.pid" ]; then
        PID=$(cat "$BACKEND_DIR/.backend.pid")
        pkill -P $PID 2>/dev/null || true
        kill $PID 2>/dev/null || true
        rm "$BACKEND_DIR/.backend.pid"
    fi
    # Fallback to ensure python server is killed
    pkill -f "python server.py" 2>/dev/null || true
    echo "Backend stopped."

    echo "Stopping Frontend..."
    if [ -f "$FRONTEND_DIR/.frontend.pid" ]; then
        PID=$(cat "$FRONTEND_DIR/.frontend.pid")
        pkill -P $PID 2>/dev/null || true
        kill $PID 2>/dev/null || true
        rm "$FRONTEND_DIR/.frontend.pid"
    fi
    # Fallback to ensure Vite is killed
    pkill -f "vite" 2>/dev/null || true
    echo "Frontend stopped."
}

case "$1" in
    start)
        start_servers
        ;;
    stop)
        stop_servers
        ;;
    restart)
        stop_servers
        sleep 2
        start_servers
        ;;
    status)
        if pgrep -f "python server.py" > /dev/null; then
            echo "Backend is RUNNING"
        else
            echo "Backend is STOPPED"
        fi
        
        if pgrep -f "vite" > /dev/null; then
            echo "Frontend is RUNNING"
        else
            echo "Frontend is STOPPED"
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
esac
