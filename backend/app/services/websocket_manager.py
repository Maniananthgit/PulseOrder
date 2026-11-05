import json
import logging
from typing import Dict, List, Set
from fastapi import WebSocket

logger = logging.getLogger("pulseorder.websocket")

class ConnectionManager:
    def __init__(self):
        # Maps room_name -> Set of active WebSockets
        self.active_rooms: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room: str):
        await websocket.accept()
        if room not in self.active_rooms:
            self.active_rooms[room] = set()
        self.active_rooms[room].add(websocket)
        logger.info(f"WebSocket connected to room: {room}. Total in room: {len(self.active_rooms[room])}")

    def disconnect(self, websocket: WebSocket, room: str):
        if room in self.active_rooms and websocket in self.active_rooms[room]:
            self.active_rooms[room].remove(websocket)
            if not self.active_rooms[room]:
                del self.active_rooms[room]
            logger.info(f"WebSocket disconnected from room: {room}")

    async def broadcast(self, room: str, message: dict):
        if room in self.active_rooms:
            dead_connections = set()
            payload = json.dumps(message)
            for connection in self.active_rooms[room]:
                try:
                    await connection.send_text(payload)
                except Exception as e:
                    logger.warning(f"Error broadcasting to connection in room {room}: {e}")
                    dead_connections.add(connection)
            
            for dead in dead_connections:
                self.disconnect(dead, room)

ws_manager = ConnectionManager()

