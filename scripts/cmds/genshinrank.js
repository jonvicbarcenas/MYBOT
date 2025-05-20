const Canvas = require("canvas");
const { randomString } = global.utils;
const percentage = total => total / 100;

let deltaNext;
const expToLevel = (exp, deltaNextLevel = deltaNext) => Math.floor((1 + Math.sqrt(1 + 8 * exp / deltaNextLevel)) / 2);
const levelToExp = (level, deltaNextLevel = deltaNext) => Math.floor(((Math.pow(level, 2) - level) * deltaNextLevel) / 2);

module.exports = {
	config: {
		name: "genshinrank",
		version: "1.0",
		author: "ChatGPT",
		countDown: 5,
		role: 0,
		description: {
			vi: "Xem level của bạn với giao diện Genshin Impact",
			en: "View your level with Genshin Impact themed UI"
		},
		category: "rank",
		guide: {
			vi: "   {pn} [để trống | @tags]",
			en: "   {pn} [empty | @tags]"
		},
		envConfig: {
			deltaNext: 5
		}
	},

	onStart: async function ({ message, event, usersData, threadsData, commandName, envCommands, api }) {
		deltaNext = envCommands[commandName].deltaNext;
		let targetUsers;
		const arrayMentions = Object.keys(event.mentions);

		if (arrayMentions.length == 0)
			targetUsers = [event.senderID];
		else
			targetUsers = arrayMentions;

		const rankCards = await Promise.all(targetUsers.map(async userID => {
			const rankCard = await makeGenshinRankCard(userID, usersData, threadsData, event.threadID, deltaNext, api);
			rankCard.path = `${randomString(10)}.png`;
			return rankCard;
		}));

		return message.reply({
			attachment: rankCards
		});
	},

	onChat: async function ({ usersData, event }) {
		let { exp } = await usersData.get(event.senderID);
		if (isNaN(exp) || typeof exp != "number")
			exp = 0;
		try {
			await usersData.set(event.senderID, {
				exp: exp + 1
			});
		}
		catch (e) { }
	}
};

const defaultGenshinDesign = {
	widthCard: 2000,
	heightCard: 800,
	mainBackground: "#1a3753", // Dark blue background
	elementalColor: "#4fc3f7", // Light blue accent (Hydro element)
	goldAccent: "#f9d77e", // Genshin gold
	visionBorder: "#e6d2b5", // Vision border
	uiAccent: "#6bc6e8", // UI accent blue
	textPrimary: "#ffffff", // White text
	textSecondary: "#e6d2b5", // Light gold text
	expBar: "#6bc6e8", // Exp bar color
	expBg: "#1a3753", // Exp bar background
	borderAccent: "#f9d77e", // Border accent
	starColor: "#f9d77e", // Star color for level display
	rarity: 5 // 5-star by default
};

async function makeGenshinRankCard(userID, usersData, threadsData, threadID, deltaNext, api = global.GoatBot.fcaApi) {
	const { exp } = await usersData.get(userID);
	const levelUser = expToLevel(exp, deltaNext);

	const expNextLevel = levelToExp(levelUser + 1, deltaNext) - levelToExp(levelUser, deltaNext);
	const currentExp = expNextLevel - (levelToExp(levelUser + 1, deltaNext) - exp);

	const allUser = await usersData.getAll();
	allUser.sort((a, b) => b.exp - a.exp);
	const rank = allUser.findIndex(user => user.userID == userID) + 1;
	const userName = await usersData.getName(userID);

	const dataLevel = {
		exp: currentExp,
		expNextLevel,
		name: userName,
		rank: `#${rank}`,
		totalUsers: allUser.length,
		level: levelUser,
		avatar: await usersData.getAvatarUrl(userID)
	};

	// Get custom design if available
	const customRankCard = await threadsData.get(threadID, "data.customGenshinRankCard") || {};
	const configRankCard = {
		...defaultGenshinDesign,
		...customRankCard
	};

	// Create the Genshin Impact themed rank card
	const image = new GenshinRankCard({
		...configRankCard,
		...dataLevel
	});
	return await image.buildCard();
}

class GenshinRankCard {
	constructor(options) {
		this.widthCard = options.widthCard || defaultGenshinDesign.widthCard;
		this.heightCard = options.heightCard || defaultGenshinDesign.heightCard;
		
		// Colors
		this.mainBackground = options.mainBackground || defaultGenshinDesign.mainBackground;
		this.elementalColor = options.elementalColor || defaultGenshinDesign.elementalColor;
		this.goldAccent = options.goldAccent || defaultGenshinDesign.goldAccent;
		this.visionBorder = options.visionBorder || defaultGenshinDesign.visionBorder;
		this.uiAccent = options.uiAccent || defaultGenshinDesign.uiAccent;
		this.textPrimary = options.textPrimary || defaultGenshinDesign.textPrimary;
		this.textSecondary = options.textSecondary || defaultGenshinDesign.textSecondary;
		this.expBar = options.expBar || defaultGenshinDesign.expBar;
		this.expBg = options.expBg || defaultGenshinDesign.expBg;
		this.borderAccent = options.borderAccent || defaultGenshinDesign.borderAccent;
		this.starColor = options.starColor || defaultGenshinDesign.starColor;
		
		// User data
		this.exp = options.exp || 0;
		this.expNextLevel = options.expNextLevel || 100;
		this.name = options.name || "Traveler";
		this.rank = options.rank || "#1";
		this.totalUsers = options.totalUsers || 100;
		this.level = options.level || 1;
		this.avatar = options.avatar;
		this.rarity = options.rarity || defaultGenshinDesign.rarity;
		
		// Use system font
		this.fontName = "Arial, sans-serif";
	}

	async buildCard() {
		// Create canvas
		const canvas = Canvas.createCanvas(this.widthCard, this.heightCard);
		const ctx = canvas.getContext("2d");
		
		// Draw main background
		ctx.fillStyle = this.mainBackground;
		ctx.fillRect(0, 0, this.widthCard, this.heightCard);
        
		// Draw decorative elements
		await this.drawGenshinUI(ctx);
        
		// Draw avatar in vision style frame
		await this.drawAvatar(ctx);
        
		// Draw name and level
		this.drawNameAndLevel(ctx);
        
		// Draw rank
		this.drawRank(ctx);
        
		// Draw experience bar in Genshin style
		this.drawExpBar(ctx);
        
		// Draw stars based on rarity/level
		this.drawStars(ctx);
        
		// Draw decorative frame
		this.drawFrame(ctx);
        
		return canvas.createPNGStream();
	}
    
	async drawGenshinUI(ctx) {
		// Draw top header pattern
		ctx.fillStyle = this.uiAccent;
		ctx.globalAlpha = 0.3;
		ctx.fillRect(0, 0, this.widthCard, 80);
		ctx.globalAlpha = 1;
        
		// Draw diagonal design element
		ctx.fillStyle = this.elementalColor;
		ctx.globalAlpha = 0.15;
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(this.widthCard * 0.7, 0);
		ctx.lineTo(0, this.heightCard * 0.7);
		ctx.closePath();
		ctx.fill();
		ctx.globalAlpha = 1;
        
		// Draw bottom corner accent
		ctx.fillStyle = this.goldAccent;
		ctx.globalAlpha = 0.2;
		ctx.beginPath();
		ctx.moveTo(this.widthCard, this.heightCard);
		ctx.lineTo(this.widthCard * 0.7, this.heightCard);
		ctx.lineTo(this.widthCard, this.heightCard * 0.7);
		ctx.closePath();
		ctx.fill();
		ctx.globalAlpha = 1;
        
		// Draw vision element symbol
		ctx.fillStyle = this.elementalColor;
		ctx.globalAlpha = 0.1;
		ctx.beginPath();
		const centerX = this.widthCard - 300;
		const centerY = 300;
		const radius = 120;
		ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
		ctx.fill();
		ctx.globalAlpha = 1;
	}
    
	async drawAvatar(ctx) {
		try {
			const avatarSize = this.heightCard * 0.4;
			const avatarX = 180;
			const avatarY = this.heightCard / 2;
            
			// Draw vision style border
			ctx.strokeStyle = this.visionBorder;
			ctx.lineWidth = 10;
			ctx.beginPath();
			ctx.arc(avatarX, avatarY, avatarSize/2 + 20, 0, 2 * Math.PI);
			ctx.stroke();
            
			// Draw elemental accent
			ctx.strokeStyle = this.elementalColor;
			ctx.lineWidth = 5;
			ctx.beginPath();
			ctx.arc(avatarX, avatarY, avatarSize/2 + 30, 0, 2 * Math.PI);
			ctx.stroke();
            
			// Draw avatar
			const avatar = await Canvas.loadImage(this.avatar);
			ctx.save();
			ctx.beginPath();
			ctx.arc(avatarX, avatarY, avatarSize/2, 0, 2 * Math.PI);
			ctx.closePath();
			ctx.clip();
			ctx.drawImage(avatar, avatarX - avatarSize/2, avatarY - avatarSize/2, avatarSize, avatarSize);
			ctx.restore();
            
			// Draw gold accent dots
			const dotCount = 8;
			const dotRadius = 8;
			const dotDistance = avatarSize/2 + 50;
			for (let i = 0; i < dotCount; i++) {
				const angle = (i / dotCount) * Math.PI * 2;
				const dotX = avatarX + Math.cos(angle) * dotDistance;
				const dotY = avatarY + Math.sin(angle) * dotDistance;
                
				ctx.fillStyle = this.goldAccent;
				ctx.beginPath();
				ctx.arc(dotX, dotY, dotRadius, 0, 2 * Math.PI);
				ctx.fill();
			}
		} catch (error) {
			console.error("Error loading avatar:", error);
		}
	}
    
	drawNameAndLevel(ctx) {
		// Draw user name in Genshin style
		ctx.font = `bold ${this.widthCard * 0.03}px ${this.fontName}`;
		ctx.fillStyle = this.textPrimary;
		ctx.textAlign = "left";
		ctx.fillText(this.name, this.widthCard * 0.25, this.heightCard * 0.4);
        
		// Draw "Adventure Rank" text
		ctx.font = `${this.widthCard * 0.02}px ${this.fontName}`;
		ctx.fillStyle = this.textSecondary;
		ctx.fillText("Adventure Rank", this.widthCard * 0.25, this.heightCard * 0.5);
        
		// Draw level number
		ctx.font = `bold ${this.widthCard * 0.05}px ${this.fontName}`;
		ctx.fillStyle = this.goldAccent;
		ctx.fillText(this.level.toString(), this.widthCard * 0.45, this.heightCard * 0.5);
	}
    
	drawRank(ctx) {
		// Draw server rank
		ctx.font = `${this.widthCard * 0.018}px ${this.fontName}`;
		ctx.fillStyle = this.textSecondary;
		ctx.textAlign = "right";
		ctx.fillText("Server Rank", this.widthCard - 100, this.heightCard * 0.4);
        
		// Draw rank number
		ctx.font = `bold ${this.widthCard * 0.03}px ${this.fontName}`;
		ctx.fillStyle = this.textPrimary;
		ctx.fillText(`${this.rank}/${this.totalUsers}`, this.widthCard - 100, this.heightCard * 0.45);
	}
    
	drawExpBar(ctx) {
		const barWidth = this.widthCard * 0.6;
		const barHeight = this.heightCard * 0.04;
		const barX = this.widthCard * 0.25;
		const barY = this.heightCard * 0.6;
		const expPercentage = this.exp / this.expNextLevel;
		const cornerRadius = barHeight / 2;
        
		// Draw exp text
		ctx.font = `${this.widthCard * 0.018}px ${this.fontName}`;
		ctx.fillStyle = this.textSecondary;
		ctx.textAlign = "left";
		ctx.fillText("EXP", barX, barY - 15);
        
		// Draw exp numbers
		ctx.font = `${this.widthCard * 0.016}px ${this.fontName}`;
		ctx.textAlign = "right";
		ctx.fillText(`${this.exp}/${this.expNextLevel}`, barX + barWidth, barY - 15);
        
		// Draw background bar
		this.roundedRect(ctx, barX, barY, barWidth, barHeight, cornerRadius);
		ctx.fillStyle = this.expBg;
		ctx.globalAlpha = 0.5;
		ctx.fill();
		ctx.globalAlpha = 1;
        
		// Draw filled exp bar
		this.roundedRect(ctx, barX, barY, barWidth * expPercentage, barHeight, cornerRadius);
		ctx.fillStyle = this.expBar;
		ctx.fill();
        
		// Draw bar shine effect
		const gradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
		gradient.addColorStop(0, "rgba(255, 255, 255, 0.3)");
		gradient.addColorStop(0.5, "rgba(255, 255, 255, 0)");
		gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        
		this.roundedRect(ctx, barX, barY, barWidth * expPercentage, barHeight / 2, cornerRadius);
		ctx.fillStyle = gradient;
		ctx.fill();
	}
    
	drawStars(ctx) {
		const starCount = Math.min(5, Math.max(1, Math.floor(this.level / 10) + 1));
		const starSize = this.widthCard * 0.02;
		const startX = this.widthCard * 0.25;
		const startY = this.heightCard * 0.7;
		
		for (let i = 0; i < starCount; i++) {
			this.drawStar(ctx, startX + i * (starSize * 1.5), startY, starSize);
		}
	}
    
	drawStar(ctx, cx, cy, size) {
		const spikes = 5;
		const outerRadius = size;
		const innerRadius = size / 2;
        
		ctx.beginPath();
		ctx.fillStyle = this.starColor;
        
		let rot = Math.PI / 2 * 3;
		const step = Math.PI / spikes;
        
		ctx.moveTo(cx, cy - outerRadius);
		for (let i = 0; i < spikes; i++) {
			ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
			rot += step;
			ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
			rot += step;
		}
		ctx.lineTo(cx, cy - outerRadius);
		ctx.closePath();
		ctx.fill();
	}
    
	drawFrame(ctx) {
		// Draw border frame
		ctx.strokeStyle = this.goldAccent;
		ctx.lineWidth = 4;
		ctx.globalAlpha = 0.7;
		ctx.strokeRect(20, 20, this.widthCard - 40, this.heightCard - 40);
		ctx.globalAlpha = 1;
        
		// Draw corner accents
		const cornerSize = 50;
		// Top-left
		ctx.beginPath();
		ctx.moveTo(20, 20 + cornerSize);
		ctx.lineTo(20, 20);
		ctx.lineTo(20 + cornerSize, 20);
		ctx.strokeStyle = this.goldAccent;
		ctx.lineWidth = 8;
		ctx.stroke();
        
		// Top-right
		ctx.beginPath();
		ctx.moveTo(this.widthCard - 20 - cornerSize, 20);
		ctx.lineTo(this.widthCard - 20, 20);
		ctx.lineTo(this.widthCard - 20, 20 + cornerSize);
		ctx.stroke();
        
		// Bottom-left
		ctx.beginPath();
		ctx.moveTo(20, this.heightCard - 20 - cornerSize);
		ctx.lineTo(20, this.heightCard - 20);
		ctx.lineTo(20 + cornerSize, this.heightCard - 20);
		ctx.stroke();
        
		// Bottom-right
		ctx.beginPath();
		ctx.moveTo(this.widthCard - 20 - cornerSize, this.heightCard - 20);
		ctx.lineTo(this.widthCard - 20, this.heightCard - 20);
		ctx.lineTo(this.widthCard - 20, this.heightCard - 20 - cornerSize);
		ctx.stroke();
	}
    
	roundedRect(ctx, x, y, width, height, radius) {
		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.lineTo(x + width - radius, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
		ctx.lineTo(x + width, y + height - radius);
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
		ctx.lineTo(x + radius, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + radius);
		ctx.lineTo(x, y + radius);
		ctx.quadraticCurveTo(x, y, x + radius, y);
		ctx.closePath();
	}
} 