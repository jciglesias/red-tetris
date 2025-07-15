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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var GameGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const src_1 = require("../../../shared/src");
const game_service_1 = require("./game.service");
const room_service_1 = require("./room.service");
const player_service_1 = require("./player.service");
const piece_service_1 = require("./piece.service");
let GameGateway = GameGateway_1 = class GameGateway {
    gameService;
    roomService;
    playerService;
    pieceService;
    server;
    logger = new common_1.Logger(GameGateway_1.name);
    clientRooms = new Map();
    clientPlayers = new Map();
    constructor(gameService, roomService, playerService, pieceService) {
        this.gameService = gameService;
        this.roomService = roomService;
        this.playerService = playerService;
        this.pieceService = pieceService;
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
        const roomName = this.clientRooms.get(client.id);
        const playerId = this.clientPlayers.get(client.id);
        if (roomName && playerId) {
            this.handlePlayerLeaveRoom(client, roomName, playerId);
        }
        this.clientRooms.delete(client.id);
        this.clientPlayers.delete(client.id);
    }
    async handleJoinRoom(client, payload) {
        try {
            const { roomName, playerName } = payload;
            if (!roomName || !playerName) {
                this.emitError(client, 'Room name and player name are required');
                return;
            }
            if (this.clientRooms.has(client.id)) {
                this.emitError(client, 'Already in a room');
                return;
            }
            let room = this.roomService.getRoom(roomName);
            let player;
            if (!room) {
                player = this.playerService.createPlayer(playerName, true);
                room = this.roomService.createRoom(roomName, player);
            }
            else {
                player = this.playerService.createPlayer(playerName, false);
                room = this.roomService.addPlayerToRoom(roomName, player) || undefined;
                if (!room) {
                    this.emitError(client, 'Cannot join room (full, game started, or name taken)');
                    return;
                }
            }
            await client.join(roomName);
            this.clientRooms.set(client.id, roomName);
            this.clientPlayers.set(client.id, player.id);
            const roomJoinedPayload = {
                room,
                playerId: player.id,
            };
            client.emit(src_1.SocketEvents.ROOM_JOINED, roomJoinedPayload);
            this.server.to(roomName).emit(src_1.SocketEvents.ROOM_UPDATE, room);
            this.logger.log(`Player ${playerName} joined room ${roomName}`);
        }
        catch (error) {
            this.logger.error('Error joining room:', error);
            this.emitError(client, 'Failed to join room');
        }
    }
    handleLeaveRoom(client) {
        const roomName = this.clientRooms.get(client.id);
        const playerId = this.clientPlayers.get(client.id);
        if (roomName && playerId) {
            this.handlePlayerLeaveRoom(client, roomName, playerId);
        }
    }
    handleStartGame(client) {
        const roomName = this.clientRooms.get(client.id);
        const playerId = this.clientPlayers.get(client.id);
        if (!roomName || !playerId) {
            this.emitError(client, 'Not in a room');
            return;
        }
        const room = this.roomService.getRoom(roomName);
        if (!room) {
            this.emitError(client, 'Room not found');
            return;
        }
        if (room.hostId !== playerId) {
            this.emitError(client, 'Only host can start the game');
            return;
        }
        if (room.state !== src_1.GameState.WAITING) {
            this.emitError(client, 'Game already started');
            return;
        }
        const updatedRoom = this.roomService.startGame(roomName);
        if (!updatedRoom) {
            this.emitError(client, 'Failed to start game');
            return;
        }
        updatedRoom.players.forEach(player => {
            const nextPieceType = this.roomService.getNextPiece(roomName);
            if (nextPieceType) {
                const piece = this.pieceService.createPiece(nextPieceType);
                const updatedPlayer = this.playerService.setCurrentPiece(player, piece);
                const nextNextPieceType = this.roomService.getNextPiece(roomName);
                const finalPlayer = this.playerService.setNextPiece(updatedPlayer, nextNextPieceType);
                this.roomService.updatePlayerInRoom(roomName, finalPlayer);
            }
        });
        this.server.to(roomName).emit(src_1.SocketEvents.GAME_STARTED, updatedRoom);
        this.logger.log(`Game started in room ${roomName}`);
    }
    handleMovePiece(client, payload) {
        const roomName = this.clientRooms.get(client.id);
        const playerId = this.clientPlayers.get(client.id);
        if (!this.validateGameAction(client, roomName, playerId))
            return;
        const { room, player } = this.getRoomAndPlayer(roomName, playerId);
        if (!room || !player || !player.currentPiece)
            return;
        if (this.gameService.canMovePiece(player.board, player.currentPiece, payload.direction)) {
            let dx = 0, dy = 0;
            switch (payload.direction) {
                case src_1.MoveDirection.LEFT:
                    dx = -1;
                    break;
                case src_1.MoveDirection.RIGHT:
                    dx = 1;
                    break;
                case src_1.MoveDirection.DOWN:
                    dy = 1;
                    break;
            }
            const movedPiece = this.pieceService.movePiece(player.currentPiece, dx, dy);
            const updatedPlayer = this.playerService.setCurrentPiece(player, movedPiece);
            this.roomService.updatePlayerInRoom(roomName, updatedPlayer);
            if (payload.direction === src_1.MoveDirection.DOWN &&
                this.gameService.isPieceAtBottom(player.board, movedPiece)) {
                this.placePiece(roomName, updatedPlayer);
            }
            else {
                this.emitPlayerUpdate(roomName, updatedPlayer);
            }
        }
    }
    handleRotatePiece(client, payload) {
        const roomName = this.clientRooms.get(client.id);
        const playerId = this.clientPlayers.get(client.id);
        if (!this.validateGameAction(client, roomName, playerId))
            return;
        const { room, player } = this.getRoomAndPlayer(roomName, playerId);
        if (!room || !player || !player.currentPiece)
            return;
        const clockwise = payload.direction === src_1.RotationDirection.CLOCKWISE;
        if (this.gameService.canRotatePiece(player.board, player.currentPiece, clockwise)) {
            const rotatedPiece = this.pieceService.rotatePiece(player.currentPiece, clockwise);
            const updatedPlayer = this.playerService.setCurrentPiece(player, rotatedPiece);
            this.roomService.updatePlayerInRoom(roomName, updatedPlayer);
            this.emitPlayerUpdate(roomName, updatedPlayer);
        }
    }
    handleHardDrop(client) {
        const roomName = this.clientRooms.get(client.id);
        const playerId = this.clientPlayers.get(client.id);
        if (!this.validateGameAction(client, roomName, playerId))
            return;
        const { room, player } = this.getRoomAndPlayer(roomName, playerId);
        if (!room || !player || !player.currentPiece)
            return;
        const droppedPiece = this.gameService.dropPieceToBottom(player.board, player.currentPiece);
        const updatedPlayer = this.playerService.setCurrentPiece(player, droppedPiece);
        this.roomService.updatePlayerInRoom(roomName, updatedPlayer);
        this.placePiece(roomName, updatedPlayer);
    }
    validateGameAction(client, roomName, playerId) {
        if (!roomName || !playerId) {
            this.emitError(client, 'Not in a room');
            return false;
        }
        const room = this.roomService.getRoom(roomName);
        if (!room || room.state !== src_1.GameState.PLAYING) {
            this.emitError(client, 'Game is not active');
            return false;
        }
        return true;
    }
    getRoomAndPlayer(roomName, playerId) {
        const room = this.roomService.getRoom(roomName);
        if (!room)
            return { room: null, player: null };
        const player = room.players.find(p => p.id === playerId);
        return { room, player };
    }
    placePiece(roomName, player) {
        if (!player.currentPiece)
            return;
        const result = this.playerService.placePieceOnBoard(player, player.currentPiece);
        let updatedPlayer = this.playerService.updatePlayerBoard(player, result.board);
        if (result.linesCleared > 0) {
            updatedPlayer = this.playerService.incrementLinesCleared(updatedPlayer, result.linesCleared);
            const room = this.roomService.getRoom(roomName);
            if (room && result.linesCleared > 1) {
                const penaltyLines = result.linesCleared - 1;
                room.players.forEach(otherPlayer => {
                    if (otherPlayer.id !== player.id && otherPlayer.state === src_1.PlayerState.PLAYING) {
                        const penalizedPlayer = this.playerService.addPenaltyLines(otherPlayer, penaltyLines);
                        this.roomService.updatePlayerInRoom(roomName, penalizedPlayer);
                        this.emitPlayerUpdate(roomName, penalizedPlayer);
                    }
                });
            }
        }
        const nextPieceType = this.roomService.getNextPiece(roomName);
        if (nextPieceType) {
            const nextPiece = this.pieceService.createPiece(nextPieceType);
            updatedPlayer = this.playerService.setCurrentPiece(updatedPlayer, nextPiece);
            const nextNextPieceType = this.roomService.getNextPiece(roomName);
            updatedPlayer = this.playerService.setNextPiece(updatedPlayer, nextNextPieceType);
        }
        if (this.playerService.checkGameOver(updatedPlayer)) {
            updatedPlayer = this.playerService.updatePlayerState(updatedPlayer, src_1.PlayerState.GAME_OVER);
            this.checkGameEnd(roomName);
        }
        this.roomService.updatePlayerInRoom(roomName, updatedPlayer);
        this.emitPlayerUpdate(roomName, updatedPlayer);
    }
    checkGameEnd(roomName) {
        const room = this.roomService.getRoom(roomName);
        if (!room)
            return;
        const playingPlayers = room.players.filter(p => p.state === src_1.PlayerState.PLAYING);
        if (playingPlayers.length <= 1) {
            this.roomService.endGame(roomName);
            this.server.to(roomName).emit(src_1.SocketEvents.GAME_OVER, room);
        }
    }
    handlePlayerLeaveRoom(client, roomName, playerId) {
        const room = this.roomService.removePlayerFromRoom(roomName, playerId);
        client.leave(roomName);
        client.emit(src_1.SocketEvents.ROOM_LEFT);
        if (room) {
            this.server.to(roomName).emit(src_1.SocketEvents.ROOM_UPDATE, room);
            if (room.state === src_1.GameState.PLAYING) {
                this.checkGameEnd(roomName);
            }
        }
        this.logger.log(`Player left room ${roomName}`);
    }
    emitPlayerUpdate(roomName, player) {
        this.server.to(roomName).emit(src_1.SocketEvents.PLAYER_UPDATE, { player });
        this.server.to(roomName).emit(src_1.SocketEvents.SPECTRUM_UPDATE, {
            playerId: player.id,
            spectrum: player.spectrum,
        });
    }
    emitError(client, message, code) {
        const errorPayload = { message, code };
        client.emit(src_1.SocketEvents.ERROR, errorPayload);
    }
};
exports.GameGateway = GameGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], GameGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)(src_1.SocketEvents.JOIN_ROOM),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(src_1.SocketEvents.LEAVE_ROOM),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "handleLeaveRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(src_1.SocketEvents.START_GAME),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "handleStartGame", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(src_1.SocketEvents.MOVE_PIECE),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "handleMovePiece", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(src_1.SocketEvents.ROTATE_PIECE),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "handleRotatePiece", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(src_1.SocketEvents.HARD_DROP),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "handleHardDrop", null);
exports.GameGateway = GameGateway = GameGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:3000',
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [game_service_1.GameService,
        room_service_1.RoomService,
        player_service_1.PlayerService,
        piece_service_1.PieceService])
], GameGateway);
//# sourceMappingURL=game.gateway.js.map