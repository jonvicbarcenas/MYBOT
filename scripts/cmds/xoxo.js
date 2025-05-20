const { createCanvas } = require('canvas');
const { getTime, randomNumber } = global.utils;

module.exports = {
	config: {
		name: "xoxo",
		aliases: ["tictactoe"],
		version: "1.0",
		author: "JVB",
		countDown: 5,
		role: 0,
		description: {
			vi: "Game cờ XO (cờ caro)",
			en: "Tic Tac Toe game"
		},
		category: "game",
		guide: {
			vi: "{pn}: tạo một bàn chơi mới và chơi với bot\n{pn} <@tag>: tạo một bàn chơi mới và chơi với người được tag\n{pn} rank <trang>: xem bảng xếp hạng\n{pn} info [<uid> | <@tag> | <reply> | <để trống>]: xem thông tin người chơi",
			en: "{pn}: create a new game and play with bot\n{pn} <@tag>: create a new game and play with the tagged person\n{pn} rank <page>: view the ranking\n{pn} info [<uid> | <@tag> | <reply> | <empty>]: view player information"
		}
	},

	langs: {
		vi: {
			charts: "🏆 | Bảng xếp hạng:\n%1",
			pageInfo: "Trang %1/%2",
			noScore: "⭕ | Hiện tại chưa có ai ghi điểm.",
			notFoundUser: "⚠️ | Không tìm thấy người dùng có id %1 trong bảng xếp hạng.",
			userRankInfo: "🏆 | Thông tin xếp hạng:\nTên: %1\nĐiểm: %2\nSố trận: %3\nThắng: %4\nThua: %5\nHòa: %6\nTỉ lệ thắng: %7%\nThời gian chơi: %8",
			resetRankSuccess: "✅ | Reset bảng xếp hạng thành công.",
			created: "✅ | Đã tạo bàn cờ X-O thành công.",
			alreadyPlaying: "⚠️ | Bạn hoặc đối thủ đang chơi một bàn khác.",
			noPermissionReset: "⚠️ | Bạn không có quyền reset bảng xếp hạng.",
			invalidPosition: "⚠️ | Vui lòng nhập vị trí từ 1-9.",
			positionOccupied: "⚠️ | Vị trí đã được chọn, vui lòng chọn vị trí khác.",
			yourTurn: "🎮 | Đến lượt của bạn, hãy chọn một vị trí từ 1-9:",
			waitForOpponent: "⌛ | Vui lòng đợi đối thủ của bạn hoàn thành lượt chơi.",
			win: "🎉 | %1 đã thắng trò chơi!",
			draw: "🤝 | Trận đấu kết thúc với tỉ số hòa!",
			opponentForfeit: "🏳️ | Đối thủ của bạn đã bỏ cuộc, bạn thắng!",
			forfeit: "🏳️ | Bạn đã bỏ cuộc, đối thủ thắng!",
			playing: "⚠️ | Ván đấu đang diễn ra: %1 vs %2",
			notPlaying: "⚠️ | Hiện tại không có ván đấu nào đang diễn ra.",
			botThinking: "🤖 | Bot đang suy nghĩ...",
			gameTitle: "TIC TAC TOE",
			waitingForPlayer: "⌛ | Đang đợi người chơi %1 tham gia...\nNhập 'join' để tham gia"
		},
		en: {
			charts: "🏆 | Ranking:\n%1",
			pageInfo: "Page %1/%2",
			noScore: "⭕ | There is no one who has scored.",
			notFoundUser: "⚠️ | Could not find user with id %1 in the ranking.",
			userRankInfo: "🏆 | Ranking information:\nName: %1\nScore: %2\nTotal games: %3\nWins: %4\nLosses: %5\nDraws: %6\nWin rate: %7%\nTotal play time: %8",
			resetRankSuccess: "✅ | Reset the ranking successfully.",
			created: "✅ | Created Tic Tac Toe game successfully.",
			alreadyPlaying: "⚠️ | You or your opponent is already playing another game.",
			noPermissionReset: "⚠️ | You do not have permission to reset the ranking.",
			invalidPosition: "⚠️ | Please enter a position from 1-9.",
			positionOccupied: "⚠️ | Position is already occupied, please choose another position.",
			yourTurn: "🎮 | It's your turn, please choose a position from 1-9:",
			waitForOpponent: "⌛ | Please wait for your opponent to complete their turn.",
			win: "🎉 | %1 has won the game!",
			draw: "🤝 | The game ended in a draw!",
			opponentForfeit: "🏳️ | Your opponent forfeited, you win!",
			forfeit: "🏳️ | You forfeited, your opponent wins!",
			playing: "⚠️ | Game in progress: %1 vs %2",
			notPlaying: "⚠️ | There is no game in progress.",
			botThinking: "🤖 | Bot is thinking...",
			gameTitle: "TIC TAC TOE",
			waitingForPlayer: "⌛ | Waiting for player %1 to join...\nType 'join' to join"
		}
	},

	onStart: async function ({ message, event, args, getLang, commandName, usersData, globalData, role }) {
		const { senderID, threadID } = event;

		if (args[0] == "rank") {
			const rankXOXO = await globalData.get("rankXOXO", "data", []);
			if (!rankXOXO.length)
				return message.reply(getLang("noScore"));

			const page = parseInt(args[1]) || 1;
			const maxUserOnePage = 30;

			let rankXOXOHandle = await Promise.all(rankXOXO.slice((page - 1) * maxUserOnePage, page * maxUserOnePage).map(async item => {
				const userName = await usersData.getName(item.id);
				return {
					...item,
					userName,
					winRate: (item.win / (item.win + item.lose + item.draw) * 100) || 0
				};
			}));

			rankXOXOHandle = rankXOXOHandle.sort((a, b) => b.winRate - a.winRate);
			const medals = ["🥇", "🥈", "🥉"];
			const rankXOXOText = rankXOXOHandle.map((item, index) => {
				const medal = medals[index] || (index + 1);
				return `${medal} ${item.userName} - ${item.win} wins - ${item.lose} losses - ${item.draw} draws`;
			}).join("\n");

			return message.reply(getLang("charts", rankXOXOText || getLang("noScore")) + "\n" + getLang("pageInfo", page, Math.ceil(rankXOXO.length / maxUserOnePage)));
		}
		else if (args[0] == "info") {
			const rankXOXO = await globalData.get("rankXOXO", "data", []);
			let targetID;
			if (Object.keys(event.mentions).length)
				targetID = Object.keys(event.mentions)[0];
			else if (event.messageReply)
				targetID = event.messageReply.senderID;
			else if (!isNaN(args[1]))
				targetID = args[1];
			else
				targetID = event.senderID;

			const userDataXOXO = rankXOXO.find(item => item.id == targetID);
			if (!userDataXOXO)
				return message.reply(getLang("notFoundUser", targetID));

			const userName = await usersData.getName(targetID);
			const winRate = ((userDataXOXO.win / (userDataXOXO.win + userDataXOXO.lose + userDataXOXO.draw) * 100) || 0).toFixed(2);
			const playTime = convertTime(userDataXOXO.totalTime || 0);

			return message.reply(getLang("userRankInfo", userName, userDataXOXO.score, (userDataXOXO.win + userDataXOXO.lose + userDataXOXO.draw), userDataXOXO.win, userDataXOXO.lose, userDataXOXO.draw, winRate, playTime));
		}
		else if (args[0] == "reset") {
			if (role < 2)
				return message.reply(getLang("noPermissionReset"));
			await globalData.set("rankXOXO", [], "data");
			return message.reply(getLang("resetRankSuccess"));
		}

		// Check if user is already playing a game
		const xoxoGames = global.GoatBot.xoxo || {};
		for (const gameID in xoxoGames) {
			const game = xoxoGames[gameID];
			if (game.players.includes(senderID))
				return message.reply(getLang("alreadyPlaying"));
		}

		// Check if there are mentions to play against another user
		let opponent = null;
		if (Object.keys(event.mentions).length) {
			opponent = Object.keys(event.mentions)[0];
			
			// Check if opponent is already playing
			for (const gameID in xoxoGames) {
				const game = xoxoGames[gameID];
				if (game.players.includes(opponent))
					return message.reply(getLang("alreadyPlaying"));
			}
		}

		// Create game data
		const gameData = {
			board: [0, 0, 0, 0, 0, 0, 0, 0, 0], // 0: empty, 1: X, 2: O
			currentTurn: 0, // 0: X, 1: O
			players: opponent ? [senderID, opponent] : [senderID, "bot"],
			started: opponent ? false : true, // If playing against bot, game starts immediately
			timeStart: getTime("unix"),
			threadID
		};

		// Generate game ID
		const gameID = `${threadID}_${getTime("unix")}`;
		
		// Save game to global
		if (!global.GoatBot.xoxo) global.GoatBot.xoxo = {};
		global.GoatBot.xoxo[gameID] = gameData;

		// Draw initial board
		const imageStream = await drawXOXOBoard(gameData.board, getLang("gameTitle"));

		if (opponent) {
			const opponentName = await usersData.getName(opponent);
			message.reply({
				body: `${getLang("created")}\n${getLang("waitingForPlayer", opponentName)}`,
				attachment: imageStream
			}, (err, info) => {
				global.GoatBot.onReply.set(info.messageID, {
					commandName,
					messageID: info.messageID,
					author: opponent,
					gameData,
					gameID
				});
			});
		} else {
			// Play against bot
			message.reply({
				body: `${getLang("created")}\n${getLang("yourTurn")}`,
				attachment: imageStream
			}, (err, info) => {
				global.GoatBot.onReply.set(info.messageID, {
					commandName,
					messageID: info.messageID,
					author: senderID,
					gameData,
					gameID
				});
			});
		}
	},

	onReply: async function ({ message, Reply, event, getLang, commandName, globalData, usersData }) {
		const { gameData, gameID, author } = Reply;
		const { senderID } = event;
		const input = event.body.trim().toLowerCase();

		// Check if opponent wants to join the game
		if (!gameData.started && senderID === author && input === 'join') {
			gameData.started = true;
			const player1Name = await usersData.getName(gameData.players[0]);
			const player2Name = await usersData.getName(gameData.players[1]);
			
			const imageStream = await drawXOXOBoard(gameData.board, getLang("gameTitle"));
			message.reply({
				body: `${player2Name} ${getLang("created")}\n${getLang("yourTurn")}`,
				attachment: imageStream
			}, (err, info) => {
				global.GoatBot.onReply.delete(Reply.messageID);
				global.GoatBot.onReply.set(info.messageID, {
					commandName,
					messageID: info.messageID,
					author: gameData.players[gameData.currentTurn],
					gameData,
					gameID
				});
			});
			return;
		}

		// Ensure the game has started
		if (!gameData.started) {
			return message.reply(getLang("waitingForPlayer", await usersData.getName(gameData.players[1])));
		}

		// Check if it's the right player's turn
		if (senderID !== author) {
			return message.reply(getLang("waitForOpponent"));
		}

		if (input === 'exit' || input === 'quit' || input === 'forfeit') {
			global.GoatBot.onReply.delete(Reply.messageID);
			delete global.GoatBot.xoxo[gameID];
			
			// Save forfeit to rankXOXO
			const winner = gameData.players[gameData.currentTurn === 0 ? 1 : 0];
			const loser = gameData.players[gameData.currentTurn];
			
			await updateRankData(globalData, winner, loser, "win", getTime("unix") - gameData.timeStart);
			
			if (winner === "bot") {
				return message.reply(getLang("forfeit"));
			} else {
				const winnerName = await usersData.getName(winner);
				return message.reply(getLang("opponentForfeit", winnerName));
			}
		}

		// Parse player move
		const position = parseInt(input);
		if (isNaN(position) || position < 1 || position > 9) {
			return message.reply(getLang("invalidPosition"));
		}

		// Check if the position is already occupied
		const boardIndex = position - 1;
		if (gameData.board[boardIndex] !== 0) {
			return message.reply(getLang("positionOccupied"));
		}

		// Place the mark on the board
		gameData.board[boardIndex] = gameData.currentTurn === 0 ? 1 : 2; // 1 for X, 2 for O

		// Check for win or draw
		const result = checkGameResult(gameData.board);
		
		// Game continues
		if (result === null) {
			// Switch turns
			gameData.currentTurn = gameData.currentTurn === 0 ? 1 : 0;
			const nextPlayerID = gameData.players[gameData.currentTurn];
			
			// Draw the updated board
			const imageStream = await drawXOXOBoard(gameData.board, getLang("gameTitle"));

			// If next player is bot, simulate bot's move
			if (nextPlayerID === "bot") {
				message.reply({
					body: getLang("botThinking"),
					attachment: imageStream
				});

				// Simulate "thinking" time
				setTimeout(async () => {
					// Make bot move
					const botMove = makeBotMove(gameData.board);
					gameData.board[botMove] = 2; // Bot uses O
					
					// Check for win or draw after bot's move
					const botResult = checkGameResult(gameData.board);
					
					// Draw the updated board after bot's move
					const updatedImageStream = await drawXOXOBoard(gameData.board, getLang("gameTitle"));
					
					if (botResult === null) {
						// Switch back to player
						gameData.currentTurn = 0;
						
						message.reply({
							body: getLang("yourTurn"),
							attachment: updatedImageStream
						}, (err, info) => {
							global.GoatBot.onReply.delete(Reply.messageID);
							global.GoatBot.onReply.set(info.messageID, {
								commandName,
								messageID: info.messageID,
								author: gameData.players[gameData.currentTurn],
								gameData,
								gameID
							});
						});
					} else {
						// Handle game end
						global.GoatBot.onReply.delete(Reply.messageID);
						delete global.GoatBot.xoxo[gameID];
						
						if (botResult === "draw") {
							await updateRankData(globalData, gameData.players[0], "bot", "draw", getTime("unix") - gameData.timeStart);
							message.reply({
								body: getLang("draw"),
								attachment: updatedImageStream
							});
						} else {
							await updateRankData(globalData, "bot", gameData.players[0], "win", getTime("unix") - gameData.timeStart);
							message.reply({
								body: getLang("win", "Bot"),
								attachment: updatedImageStream
							});
						}
					}
				}, randomNumber(1000, 3000)); // Random delay between 1-3 seconds
				
				return;
			}
			
			// Human vs human: prepare for next player
			const nextPlayerName = nextPlayerID === "bot" ? "Bot" : await usersData.getName(nextPlayerID);
			
			message.reply({
				body: `${getLang("yourTurn")}`,
				attachment: imageStream
			}, (err, info) => {
				global.GoatBot.onReply.delete(Reply.messageID);
				global.GoatBot.onReply.set(info.messageID, {
					commandName,
					messageID: info.messageID,
					author: nextPlayerID,
					gameData,
					gameID
				});
			});
		} else {
			// Game ended
			global.GoatBot.onReply.delete(Reply.messageID);
			delete global.GoatBot.xoxo[gameID];
			
			const imageStream = await drawXOXOBoard(gameData.board, getLang("gameTitle"));
			
			if (result === "draw") {
				// It's a draw
				await updateRankData(globalData, gameData.players[0], gameData.players[1], "draw", getTime("unix") - gameData.timeStart);
				message.reply({
					body: getLang("draw"),
					attachment: imageStream
				});
			} else {
				// Someone won
				const winner = gameData.players[gameData.currentTurn];
				const loser = gameData.players[gameData.currentTurn === 0 ? 1 : 0];
				const winnerName = winner === "bot" ? "Bot" : await usersData.getName(winner);
				
				await updateRankData(globalData, winner, loser, "win", getTime("unix") - gameData.timeStart);
				
				message.reply({
					body: getLang("win", winnerName),
					attachment: imageStream
				});
			}
		}
	}
};

async function drawXOXOBoard(board, title) {
	const squareSize = 100;
	const lineWidth = 5;
	const canvasSize = squareSize * 3 + lineWidth * 2;
	const margin = 50;
	
	const canvas = createCanvas(canvasSize + margin * 2, canvasSize + margin * 2);
	const ctx = canvas.getContext('2d');
	
	// Draw background
	ctx.fillStyle = '#F0F2F5';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	
	// Draw title
	ctx.font = 'bold 36px Arial';
	ctx.textAlign = 'center';
	ctx.fillStyle = '#404040';
	ctx.fillText(title, canvas.width / 2, margin / 2 + 20);
	
	// Draw game board
	ctx.strokeStyle = '#404040';
	ctx.lineWidth = lineWidth;
	
	// Draw the grid
	for (let i = 1; i < 3; i++) {
		// Vertical lines
		ctx.beginPath();
		ctx.moveTo(margin + i * squareSize + (i - 1) * lineWidth, margin);
		ctx.lineTo(margin + i * squareSize + (i - 1) * lineWidth, margin + canvasSize - lineWidth);
		ctx.stroke();
		
		// Horizontal lines
		ctx.beginPath();
		ctx.moveTo(margin, margin + i * squareSize + (i - 1) * lineWidth);
		ctx.lineTo(margin + canvasSize - lineWidth, margin + i * squareSize + (i - 1) * lineWidth);
		ctx.stroke();
	}
	
	// Draw X and O on the board
	for (let i = 0; i < 9; i++) {
		const row = Math.floor(i / 3);
		const col = i % 3;
		
		const x = margin + col * (squareSize + lineWidth) + squareSize / 2;
		const y = margin + row * (squareSize + lineWidth) + squareSize / 2;
		
		if (board[i] === 1) { // X
			drawX(ctx, x, y, squareSize * 0.4);
		} else if (board[i] === 2) { // O
			drawO(ctx, x, y, squareSize * 0.4);
		} else {
			// Draw position number for empty squares
			ctx.font = '24px Arial';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillStyle = '#888888';
			ctx.fillText((i + 1).toString(), x, y);
		}
	}
	
	const imageStream = canvas.createPNGStream();
	imageStream.path = `xoxoGame_${Date.now()}.png`;
	
	return imageStream;
}

function drawX(ctx, x, y, size) {
	ctx.strokeStyle = '#FF3B30';
	ctx.lineWidth = 8;
	ctx.lineCap = 'round';
	
	ctx.beginPath();
	ctx.moveTo(x - size, y - size);
	ctx.lineTo(x + size, y + size);
	ctx.stroke();
	
	ctx.beginPath();
	ctx.moveTo(x + size, y - size);
	ctx.lineTo(x - size, y + size);
	ctx.stroke();
}

function drawO(ctx, x, y, size) {
	ctx.strokeStyle = '#007AFF';
	ctx.lineWidth = 8;
	
	ctx.beginPath();
	ctx.arc(x, y, size, 0, Math.PI * 2);
	ctx.stroke();
}

function checkGameResult(board) {
	// Win patterns: rows, columns, and diagonals
	const winPatterns = [
		[0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
		[0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
		[0, 4, 8], [2, 4, 6]             // diagonals
	];
	
	// Check for a win
	for (const pattern of winPatterns) {
		const [a, b, c] = pattern;
		if (board[a] !== 0 && board[a] === board[b] && board[a] === board[c]) {
			return board[a] === 1 ? "X" : "O"; // Return the winner
		}
	}
	
	// Check for a draw
	if (board.every(cell => cell !== 0)) {
		return "draw";
	}
	
	// Game still in progress
	return null;
}

function makeBotMove(board) {
	// Check if bot can win in the next move
	const winMove = findWinningMove(board, 2);
	if (winMove !== null) {
		return winMove;
	}
	
	// Block player's winning move
	const blockMove = findWinningMove(board, 1);
	if (blockMove !== null) {
		return blockMove;
	}
	
	// Take center if available
	if (board[4] === 0) {
		return 4;
	}
	
	// Take corners
	const corners = [0, 2, 6, 8];
	const availableCorners = corners.filter(i => board[i] === 0);
	if (availableCorners.length > 0) {
		return availableCorners[Math.floor(Math.random() * availableCorners.length)];
	}
	
	// Take any available spot
	const availableSpots = board.map((val, idx) => val === 0 ? idx : -1).filter(val => val !== -1);
	return availableSpots[Math.floor(Math.random() * availableSpots.length)];
}

function findWinningMove(board, player) {
	// Win patterns: rows, columns, and diagonals
	const winPatterns = [
		[0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
		[0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
		[0, 4, 8], [2, 4, 6]             // diagonals
	];
	
	for (const pattern of winPatterns) {
		const [a, b, c] = pattern;
		// Check if two positions have player's marks and one is empty
		if (board[a] === player && board[b] === player && board[c] === 0) {
			return c;
		}
		if (board[a] === player && board[c] === player && board[b] === 0) {
			return b;
		}
		if (board[b] === player && board[c] === player && board[a] === 0) {
			return a;
		}
	}
	
	return null;
}

async function updateRankData(globalData, winnerId, loserId, result, playTime) {
	const rankXOXO = await globalData.get("rankXOXO", "data", []);
	
	// Skip if bot
	const updatePlayer = async (playerId, outcome) => {
		if (playerId === "bot") return;
		
		const playerIndex = rankXOXO.findIndex(player => player.id === playerId);
		
		if (playerIndex === -1) {
			// New player
			const newPlayer = {
				id: playerId,
				win: outcome === "win" ? 1 : 0,
				lose: outcome === "lose" ? 1 : 0,
				draw: outcome === "draw" ? 1 : 0,
				score: outcome === "win" ? 3 : (outcome === "draw" ? 1 : 0),
				totalTime: playTime
			};
			rankXOXO.push(newPlayer);
		} else {
			// Update existing player
			if (outcome === "win") {
				rankXOXO[playerIndex].win = (rankXOXO[playerIndex].win || 0) + 1;
				rankXOXO[playerIndex].score = (rankXOXO[playerIndex].score || 0) + 3;
			} else if (outcome === "lose") {
				rankXOXO[playerIndex].lose = (rankXOXO[playerIndex].lose || 0) + 1;
			} else if (outcome === "draw") {
				rankXOXO[playerIndex].draw = (rankXOXO[playerIndex].draw || 0) + 1;
				rankXOXO[playerIndex].score = (rankXOXO[playerIndex].score || 0) + 1;
			}
			rankXOXO[playerIndex].totalTime = (rankXOXO[playerIndex].totalTime || 0) + playTime;
		}
	};
	
	if (result === "draw") {
		await updatePlayer(winnerId, "draw");
		await updatePlayer(loserId, "draw");
	} else {
		await updatePlayer(winnerId, "win");
		await updatePlayer(loserId, "lose");
	}
	
	await globalData.set("rankXOXO", rankXOXO, "data");
}

function convertTime(seconds) {
	if (!seconds) return "0 second";
	let temp = seconds;
	const days = Math.floor(temp / 86400);
	temp %= 86400;
	const hours = Math.floor(temp / 3600);
	temp %= 3600;
	const minutes = Math.floor(temp / 60);
	const seconds_ = temp % 60;
	
	let result = "";
	if (days > 0) result += `${days} day${days > 1 ? "s" : ""} `;
	if (hours > 0) result += `${hours} hour${hours > 1 ? "s" : ""} `;
	if (minutes > 0) result += `${minutes} minute${minutes > 1 ? "s" : ""} `;
	if (seconds_ > 0) result += `${seconds_} second${seconds_ > 1 ? "s" : ""}`;
	
	return result.trim();
} 