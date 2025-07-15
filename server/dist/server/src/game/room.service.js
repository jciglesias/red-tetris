"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const src_1 = require("../../../shared/src");
const piece_service_1 = require("./piece.service");
let RoomService = class RoomService {
    pieceService;
    rooms = new Map();
    constructor(pieceService) {
        this.pieceService = pieceService;
    }
    createRoom(name, hostPlayer) {
        const room = {
            id: (0, uuid_1.v4)(),
            name,
            state: src_1.GameState.WAITING,
            players: [hostPlayer],
            hostId: hostPlayer.id,
            maxPlayers: 4,
            pieceSequence: this.pieceService.generatePieceSequence(1000),
            currentPieceIndex: 0,
        };
        this.rooms.set(name, room);
        return room;
    }
    getRoom(name) {
        return this.rooms.get(name);
    }
    getAllRooms() {
        return Array.from(this.rooms.values());
    }
    addPlayerToRoom(roomName, player) {
        const room = this.rooms.get(roomName);
        if (!room)
            return null;
        if (room.players.length >= room.maxPlayers) {
            return null;
        }
        if (room.state === src_1.GameState.PLAYING) {
            return null;
        }
        if (room.players.some(p => p.name === player.name)) {
            return null;
        }
        room.players.push(player);
        this.rooms.set(roomName, room);
        return room;
    }
    removePlayerFromRoom(roomName, playerId) {
        const room = this.rooms.get(roomName);
        if (!room)
            return null;
        room.players = room.players.filter(p => p.id !== playerId);
        if (room.players.length === 0) {
            this.rooms.delete(roomName);
            return null;
        }
        if (room.hostId === playerId && room.players.length > 0) {
            room.hostId = room.players[0].id;
            room.players[0].isHost = true;
        }
        this.rooms.set(roomName, room);
        return room;
    }
    updatePlayerInRoom(roomName, updatedPlayer) {
        const room = this.rooms.get(roomName);
        if (!room)
            return null;
        const playerIndex = room.players.findIndex(p => p.id === updatedPlayer.id);
        if (playerIndex === -1)
            return null;
        room.players[playerIndex] = updatedPlayer;
        this.rooms.set(roomName, room);
        return room;
    }
    startGame(roomName) {
        const room = this.rooms.get(roomName);
        if (!room || room.state !== src_1.GameState.WAITING)
            return null;
        room.state = src_1.GameState.PLAYING;
        room.currentPieceIndex = 0;
        room.players.forEach(player => {
            player.state = 'PLAYING';
        });
        this.rooms.set(roomName, room);
        return room;
    }
    endGame(roomName) {
        const room = this.rooms.get(roomName);
        if (!room)
            return null;
        room.state = src_1.GameState.FINISHED;
        this.rooms.set(roomName, room);
        return room;
    }
    resetGame(roomName) {
        const room = this.rooms.get(roomName);
        if (!room)
            return null;
        room.state = src_1.GameState.WAITING;
        room.currentPieceIndex = 0;
        room.pieceSequence = this.pieceService.generatePieceSequence(1000);
        this.rooms.set(roomName, room);
        return room;
    }
    getNextPiece(roomName) {
        const room = this.rooms.get(roomName);
        if (!room)
            return null;
        const piece = this.pieceService.getNextPieceFromSequence(room.pieceSequence, room.currentPieceIndex);
        if (piece) {
            room.currentPieceIndex++;
            this.rooms.set(roomName, room);
        }
        return piece;
    }
    updateRoomState(roomName, state) {
        const room = this.rooms.get(roomName);
        if (!room)
            return null;
        room.state = state;
        this.rooms.set(roomName, room);
        return room;
    }
    getRoomByPlayerId(playerId) {
        for (const [roomName, room] of this.rooms.entries()) {
            if (room.players.some(p => p.id === playerId)) {
                return { room, roomName };
            }
        }
        return null;
    }
};
exports.RoomService = RoomService;
exports.RoomService = RoomService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [piece_service_1.PieceService])
], RoomService);
//# sourceMappingURL=room.service.js.map