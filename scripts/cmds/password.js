const crypto = require('crypto');

module.exports = {
	config: {
		name: "password",
		aliases: ["genpass", "pwgen"],
		version: "1.0",
		author: "JV BARCENAS",
		countDown: 5,
		role: 0,
		description: {
			vi: "Tạo mật khẩu ngẫu nhiên an toàn",
			en: "Generate secure random passwords"
		},
		category: "utility",
		guide: {
			vi: "{pn} [độ dài] [tùy chọn]\n"
				+ "Độ dài: số ký tự của mật khẩu (mặc định: 12)\n"
				+ "Tùy chọn:\n"
				+ "  -l: bao gồm chữ thường\n"
				+ "  -u: bao gồm chữ hoa\n"
				+ "  -n: bao gồm số\n"
				+ "  -s: bao gồm ký tự đặc biệt\n"
				+ "  -a: bao gồm tất cả (mặc định)\n"
				+ "  -x: loại trừ các ký tự dễ gây nhầm lẫn (0, O, 1, l, I, etc.)\n"
				+ "Ví dụ: {pn} 16 -l -n -x (tạo mật khẩu 16 ký tự chỉ có chữ thường, số và không có ký tự dễ nhầm lẫn)",
			en: "{pn} [length] [options]\n"
				+ "Length: number of characters (default: 12)\n"
				+ "Options:\n"
				+ "  -l: include lowercase letters\n"
				+ "  -u: include uppercase letters\n"
				+ "  -n: include numbers\n"
				+ "  -s: include special characters\n"
				+ "  -a: include all (default)\n"
				+ "  -x: exclude ambiguous characters (0, O, 1, l, I, etc.)\n"
				+ "Example: {pn} 16 -l -n -x (generate a 16-character password with only lowercase, numbers, and no ambiguous characters)"
		}
	},

	langs: {
		vi: {
			generated: "🔐 Mật khẩu của bạn: `%1`\n\n💪 Độ mạnh: %2\n🔄 Entropy: %3 bits\n⏱️ Thời gian để bẻ khóa (brute force): %4\n\n🔒 Mẹo: Lưu mật khẩu vào trình quản lý mật khẩu!",
			error: "❌ Lỗi: %1",
			invalidOptions: "❌ Tùy chọn không hợp lệ. Sử dụng -l, -u, -n, -s, -a, hoặc -x",
			noCharacterSets: "❌ Ít nhất một bộ ký tự phải được chọn (-l, -u, -n, hoặc -s)",
			invalidLength: "❌ Độ dài mật khẩu phải từ 4 đến 64 ký tự",
			passwordStrength: {
				"0": "Rất yếu ❌",
				"1": "Yếu ⚠️",
				"2": "Trung bình ⚠️",
				"3": "Mạnh ✅",
				"4": "Rất mạnh 💪"
			}
		},
		en: {
			generated: "🔐 Your password: `%1`\n\n💪 Strength: %2\n🔄 Entropy: %3 bits\n⏱️ Time to crack (brute force): %4\n\n🔒 Tip: Save your password in a password manager!",
			error: "❌ Error: %1",
			invalidOptions: "❌ Invalid options. Use -l, -u, -n, -s, -a, or -x",
			noCharacterSets: "❌ At least one character set must be selected (-l, -u, -n, or -s)",
			invalidLength: "❌ Password length must be between 4 and 64 characters",
			passwordStrength: {
				"0": "Very weak ❌",
				"1": "Weak ⚠️",
				"2": "Medium ⚠️",
				"3": "Strong ✅",
				"4": "Very strong 💪"
			}
		}
	},

	onStart: async function ({ args, message, getLang }) {
		try {
			// Define character sets
			const lowercase = 'abcdefghijkmnopqrstuvwxyz';
			const uppercaseAll = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
			const uppercaseNoAmbig = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
			const numbersAll = '0123456789';
			const numbersNoAmbig = '23456789';
			const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
			
			// Default configurations
			let length = 12;
			let includeLowercase = false;
			let includeUppercase = false;
			let includeNumbers = false;
			let includeSpecial = false;
			let excludeAmbiguous = false;

			// Parse arguments
			let firstArg = parseInt(args[0]);
			if (!isNaN(firstArg)) {
				length = firstArg;
				args.shift();
			}
			
			// Check length limits
			if (length < 4 || length > 64) {
				return message.reply(getLang("invalidLength"));
			}
			
			// Process options
			const options = args.join(' ').split('-').filter(opt => opt.trim());
			
			// If no options or only -a, include all
			if (options.length === 0 || options.some(opt => opt.trim() === 'a')) {
				includeLowercase = true;
				includeUppercase = true;
				includeNumbers = true;
				includeSpecial = true;
			} else {
				// Process specific options
				for (const option of options) {
					const cleanOption = option.trim();
					if (cleanOption === 'l') includeLowercase = true;
					else if (cleanOption === 'u') includeUppercase = true;
					else if (cleanOption === 'n') includeNumbers = true;
					else if (cleanOption === 's') includeSpecial = true;
					else if (cleanOption === 'x') excludeAmbiguous = true;
					else return message.reply(getLang("invalidOptions"));
				}
			}
			
			// Ensure at least one character set is selected
			if (!includeLowercase && !includeUppercase && !includeNumbers && !includeSpecial) {
				return message.reply(getLang("noCharacterSets"));
			}
			
			// Build character set
			let charset = '';
			if (includeLowercase) charset += excludeAmbiguous ? lowercase : lowercase + 'ilo';
			if (includeUppercase) charset += excludeAmbiguous ? uppercaseNoAmbig : uppercaseAll;
			if (includeNumbers) charset += excludeAmbiguous ? numbersNoAmbig : numbersAll;
			if (includeSpecial) charset += special;
			
			// Generate password
			const password = generateSecurePassword(charset, length);
			
			// Calculate entropy and strength
			const entropy = Math.log2(charset.length) * length;
			const strength = getPasswordStrength(entropy);
			
			// Calculate time to crack (rough estimate)
			const crackTime = calculateCrackingTime(entropy);
			
			// Send password to user
			return message.reply(getLang("generated", password, getLang("passwordStrength." + strength), entropy.toFixed(1), crackTime));
			
		} catch (err) {
			console.error("Password generation error:", err);
			return message.reply(getLang("error", err.message));
		}
	}
};

// Generate a secure random password
function generateSecurePassword(charset, length) {
	if (!charset || charset.length === 0 || !length || length <= 0) {
		throw new Error("Invalid charset or length");
	}
	
	let password = '';
	// Use crypto for better randomness
	const randomBytes = crypto.randomBytes(length);
	
	for (let i = 0; i < length; i++) {
		const randomIndex = randomBytes[i] % charset.length;
		password += charset[randomIndex];
	}
	
	return password;
}

// Estimate password strength on a scale of 0-4
function getPasswordStrength(entropy) {
	if (entropy < 28) return 0;   // Very weak
	if (entropy < 36) return 1;   // Weak
	if (entropy < 60) return 2;   // Medium
	if (entropy < 80) return 3;   // Strong
	return 4;                     // Very strong
}

// Calculate estimated time to crack (very rough estimate)
function calculateCrackingTime(entropy) {
	// Assume 10 billion guesses per second (high-end)
	const guessesPerSecond = 10000000000;
	const possibleCombinations = Math.pow(2, entropy);
	const secondsToCrack = possibleCombinations / (2 * guessesPerSecond); // Average case is half the max
	
	// Convert to human-readable format
	if (secondsToCrack < 60) {
		return `${Math.round(secondsToCrack)} seconds`;
	} else if (secondsToCrack < 3600) {
		return `${Math.round(secondsToCrack / 60)} minutes`;
	} else if (secondsToCrack < 86400) {
		return `${Math.round(secondsToCrack / 3600)} hours`;
	} else if (secondsToCrack < 31536000) {
		return `${Math.round(secondsToCrack / 86400)} days`;
	} else if (secondsToCrack < 31536000 * 100) {
		return `${Math.round(secondsToCrack / 31536000)} years`;
	} else if (secondsToCrack < 31536000 * 1000) {
		return `${Math.round(secondsToCrack / (31536000 * 100))} centuries`;
	} else if (secondsToCrack < 31536000 * 1000000) {
		return `${Math.round(secondsToCrack / (31536000 * 1000))} millennia`;
	} else {
		return "millions of years+";
	}
} 