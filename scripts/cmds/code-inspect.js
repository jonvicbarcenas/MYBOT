const axios = require("axios");

module.exports = {
	config: {
		name: "code-inspect",
		version: "1.0",
		author: "JVB",
		countDown: 5,
		role: 0,
		description: {
			vi: "Phân tích và giải thích code",
			en: "Analyze and explain code"
		},
		category: "utility",
		guide: {
			vi: "{pn} <ngôn ngữ> <code>\nVí dụ: {pn} js console.log('Hello World')",
			en: "{pn} <language> <code>\nExample: {pn} js console.log('Hello World')"
		}
	},

	langs: {
		vi: {
			missingInput: "⚠️ Vui lòng nhập ngôn ngữ và code bạn muốn phân tích\nVí dụ: {pn} js console.log('Hello World')",
			analyzing: "🔍 Đang phân tích mã nguồn...",
			supportedLanguages: "Các ngôn ngữ hỗ trợ: javascript (js), python (py), java, c, cpp, php, ruby, go, rust, typescript (ts), html, css, json",
			error: "❌ Đã xảy ra lỗi khi phân tích code: %1"
		},
		en: {
			missingInput: "⚠️ Please enter the language and code you want to analyze\nExample: {pn} js console.log('Hello World')",
			analyzing: "🔍 Analyzing the source code...",
			supportedLanguages: "Supported languages: javascript (js), python (py), java, c, cpp, php, ruby, go, rust, typescript (ts), html, css, json",
			error: "❌ An error occurred while analyzing code: %1"
		}
	},

	onStart: async function ({ api, event, args, message, getLang }) {
		// Language and code extraction
		const supportedLanguages = [
			"javascript", "js", "python", "py", "java", "c", "cpp", "php",
			"ruby", "go", "rust", "typescript", "ts", "html", "css", "json"
		];
		
		if (args.length < 2) {
			return message.reply(getLang("missingInput").replace("{pn}", "code-inspect"));
		}

		let language = args[0].toLowerCase();
		let code = args.slice(1).join(" ");
        
		// Handle code block format
		if (code.includes("```")) {
			const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)```/;
			const match = code.match(codeBlockRegex);
			if (match && match[1]) {
				code = match[1].trim();
			}
		}
		
		// Map short language codes to full names
		if (language === "js") language = "javascript";
		if (language === "py") language = "python";
		if (language === "ts") language = "typescript";
		
		if (!supportedLanguages.includes(language)) {
			return message.reply(`${getLang("supportedLanguages")}`);
		}
		
		// Send "analyzing" message
		message.reply(getLang("analyzing"));
		
		try {
			// We'll use a simple algorithm to analyze the code
			const analysis = await analyzeCode(language, code);
			
			return message.reply(`📊 Code Analysis (${language}):\n\n${analysis}`);
		}
		catch (error) {
			console.error(error);
			return message.reply(getLang("error", error.message));
		}
	}
};

/**
 * Analyze code based on language
 * @param {string} language - Programming language
 * @param {string} code - Code to analyze
 * @returns {string} - Analysis result
 */
async function analyzeCode(language, code) {
	// Simple line count statistics
	const lines = code.split("\n");
	const lineCount = lines.length;
	const nonEmptyLines = lines.filter(line => line.trim() !== "").length;
	
	let analysis = `📏 Lines of code: ${lineCount} (${nonEmptyLines} non-empty)\n\n`;
	
	// Language specific analysis
	switch (language) {
		case "javascript":
		case "typescript":
			analysis += analyzeJavaScript(code);
			break;
		case "python":
			analysis += analyzePython(code);
			break;
		case "html":
			analysis += analyzeHTML(code);
			break;
		case "css":
			analysis += analyzeCSS(code);
			break;
		default:
			// Generic analysis for other languages
			analysis += analyzeGeneric(code);
	}
	
	// Add complexity estimation (simple heuristic based on line count and nesting)
	const nestingLevel = estimateNestingLevel(code);
	const complexity = estimateComplexity(lineCount, nestingLevel);
	analysis += `\n🧠 Complexity: ${complexity}`;
	
	// Add security tips if applicable
	const securityTips = getSecurityTips(language, code);
	if (securityTips) {
		analysis += `\n\n🔒 Security tips:\n${securityTips}`;
	}
	
	// Add performance tips if applicable
	const performanceTips = getPerformanceTips(language, code);
	if (performanceTips) {
		analysis += `\n\n⚡ Performance tips:\n${performanceTips}`;
	}
	
	return analysis;
}

/**
 * Analyze JavaScript/TypeScript code
 */
function analyzeJavaScript(code) {
	let analysis = "";
	
	// Count functions
	const functionMatches = code.match(/function\s+\w+\s*\(|const\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|let\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|var\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g) || [];
	const functionCount = functionMatches.length;
	
	// Count variables
	const varMatches = code.match(/(?:let|const|var)\s+\w+/g) || [];
	const variableCount = varMatches.length;
	
	// Look for common patterns
	const usesPromises = code.includes("Promise") || code.includes("async") || code.includes("then(");
	const usesDOM = code.includes("document.") || code.includes("window.");
	const usesLoops = code.includes("for (") || code.includes("while (") || code.includes(".forEach") || code.includes(".map");
	
	analysis += `📦 Functions: ${functionCount}\n`;
	analysis += `🔠 Variables: ${variableCount}\n`;
	analysis += `🔄 Uses loops: ${usesLoops ? "Yes" : "No"}\n`;
	analysis += `⏳ Uses Promises/async: ${usesPromises ? "Yes" : "No"}\n`;
	if (usesDOM) analysis += `🌐 Uses DOM manipulation\n`;
	
	return analysis;
}

/**
 * Analyze Python code
 */
function analyzePython(code) {
	let analysis = "";
	
	// Count functions
	const functionMatches = code.match(/def\s+\w+\s*\(/g) || [];
	const functionCount = functionMatches.length;
	
	// Count classes
	const classMatches = code.match(/class\s+\w+/g) || [];
	const classCount = classMatches.length;
	
	// Look for common patterns
	const usesImports = code.includes("import ") || code.includes("from ");
	const usesList = code.includes("[") && code.includes("]");
	const usesDict = code.includes("{") && code.includes("}");
	const usesLoops = code.includes("for ") || code.includes("while ");
	
	analysis += `📦 Functions: ${functionCount}\n`;
	analysis += `🏛️ Classes: ${classCount}\n`;
	analysis += `📥 Uses imports: ${usesImports ? "Yes" : "No"}\n`;
	analysis += `📋 Uses lists: ${usesList ? "Yes" : "No"}\n`;
	analysis += `🔑 Uses dictionaries: ${usesDict ? "Yes" : "No"}\n`;
	analysis += `🔄 Uses loops: ${usesLoops ? "Yes" : "No"}\n`;
	
	return analysis;
}

/**
 * Analyze HTML code
 */
function analyzeHTML(code) {
	let analysis = "";
	
	// Count tags
	const tagMatches = code.match(/<\/?[a-z][\s\S]*?>/gi) || [];
	const tagCount = tagMatches.length;
	
	// Count specific tags
	const divCount = (code.match(/<div/gi) || []).length;
	const imgCount = (code.match(/<img/gi) || []).length;
	const linkCount = (code.match(/<a/gi) || []).length;
	const scriptCount = (code.match(/<script/gi) || []).length;
	
	analysis += `🏷️ Total tags: ${tagCount}\n`;
	analysis += `📦 <div> tags: ${divCount}\n`;
	analysis += `🖼️ <img> tags: ${imgCount}\n`;
	analysis += `🔗 <a> tags: ${linkCount}\n`;
	analysis += `📜 <script> tags: ${scriptCount}\n`;
	
	return analysis;
}

/**
 * Analyze CSS code
 */
function analyzeCSS(code) {
	let analysis = "";
	
	// Count selectors
	const selectorMatches = code.match(/[^\{\}]+(?=\{)/g) || [];
	const selectorCount = selectorMatches.length;
	
	// Check for media queries
	const hasMediaQueries = code.includes("@media");
	
	// Check for animations
	const hasAnimations = code.includes("@keyframes") || code.includes("animation:");
	
	// Check for flexbox/grid
	const usesFlexbox = code.includes("display: flex") || code.includes("display:flex");
	const usesGrid = code.includes("display: grid") || code.includes("display:grid");
	
	analysis += `🎯 Selectors: ${selectorCount}\n`;
	analysis += `📱 Uses media queries: ${hasMediaQueries ? "Yes" : "No"}\n`;
	analysis += `✨ Uses animations: ${hasAnimations ? "Yes" : "No"}\n`;
	analysis += `📏 Uses flexbox: ${usesFlexbox ? "Yes" : "No"}\n`;
	analysis += `🔲 Uses grid: ${usesGrid ? "Yes" : "No"}\n`;
	
	return analysis;
}

/**
 * Generic code analysis for unsupported languages
 */
function analyzeGeneric(code) {
	let analysis = "";
	
	// Count potential functions (lines ending with ) {)
	const functionMatches = code.match(/\)\s*\{/g) || [];
	const functionCount = functionMatches.length;
	
	// Look for common patterns
	const usesLoops = code.includes("for (") || code.includes("while (");
	const usesConditionals = code.includes("if (") || code.includes("switch (");
	
	analysis += `📦 Functions/methods: ~${functionCount}\n`;
	analysis += `🔄 Contains loops: ${usesLoops ? "Yes" : "No"}\n`;
	analysis += `🔀 Contains conditionals: ${usesConditionals ? "Yes" : "No"}\n`;
	
	return analysis;
}

/**
 * Estimate nesting level of code
 */
function estimateNestingLevel(code) {
	const lines = code.split("\n");
	let maxIndentation = 0;
	
	for (const line of lines) {
		const trimmedStart = line.length - line.trimStart().length;
		const indentationLevel = Math.floor(trimmedStart / 2); // Assuming 2 spaces per level
		maxIndentation = Math.max(maxIndentation, indentationLevel);
	}
	
	return maxIndentation;
}

/**
 * Estimate code complexity based on lines and nesting
 */
function estimateComplexity(lineCount, nestingLevel) {
	if (lineCount < 10 && nestingLevel < 2) return "Simple";
	if (lineCount < 50 && nestingLevel < 4) return "Moderate";
	if (lineCount < 100 && nestingLevel < 6) return "Intermediate";
	return "Complex";
}

/**
 * Provide security tips based on code content
 */
function getSecurityTips(language, code) {
	const tips = [];
	
	switch (language) {
		case "javascript":
		case "typescript":
			if (code.includes("eval(")) {
				tips.push("• Using 'eval()' can introduce security vulnerabilities");
			}
			if (code.includes("innerHTML")) {
				tips.push("• Using 'innerHTML' without proper sanitization can lead to XSS vulnerabilities");
			}
			break;
		case "python":
			if (code.includes("exec(") || code.includes("eval(")) {
				tips.push("• Using 'exec()' or 'eval()' can be dangerous");
			}
			if (code.includes("subprocess") || code.includes("os.system")) {
				tips.push("• Executing system commands requires careful input validation");
			}
			break;
		case "php":
			if (code.includes("$_GET") || code.includes("$_POST")) {
				tips.push("• Make sure to sanitize user input from $_GET or $_POST");
			}
			break;
	}
	
	return tips.join("\n");
}

/**
 * Provide performance tips based on code content
 */
function getPerformanceTips(language, code) {
	const tips = [];
	
	switch (language) {
		case "javascript":
		case "typescript":
			if ((code.match(/for\s*\(/g) || []).length > 2) {
				tips.push("• Consider optimizing nested loops for better performance");
			}
			if (code.includes(".forEach") && code.includes("array.")) {
				tips.push("• Consider using 'map/reduce/filter' instead of multiple array iterations");
			}
			break;
		case "python":
			if (code.includes("for") && code.includes("range(") && code.includes("append(")) {
				tips.push("• Consider using list comprehensions instead of building lists with for-loops");
			}
			break;
	}
	
	return tips.join("\n");
} 