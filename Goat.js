/** 
 * @author NTKhang
 * ! The source code is written by NTKhang, please don't change the author's name everywhere. Thank you for using 
 */

process.on('unhandledRejection', error => console.log(error));
process.on('uncaughtException', error => console.log(error));

const axios = require("axios");
const fs = require("fs-extra");
const google = require("googleapis").google;
const nodemailer = require("nodemailer");
const cron = require('node-cron');
const moment = require('moment-timezone');


process.env.BLUEBIRD_W_FORGOTTEN_RETURN = 0; // Disable warning: "Warning: a promise was created in a handler but was not returned from it"

const { NODE_ENV } = process.env;
const dirConfig = `${__dirname}/config${['production', 'development'].includes(NODE_ENV) ? '.dev.json' : '.json'}`;
const dirConfigCommands = `${__dirname}/configCommands${['production', 'development'].includes(NODE_ENV) ? '.dev.json' : '.json'}`;
const dirAccount = `${__dirname}/account${['production', 'development'].includes(NODE_ENV) ? '.dev.txt' : '.txt'}`;
const config = require(dirConfig);
const configCommands = require(dirConfigCommands);

global.GoatBot = {
	startTime: Date.now() - process.uptime() * 1000, // time start bot (ms)
	commands: new Map(), // store all commands
	eventCommands: new Map(), // store all event commands
	commandFilesPath: [], // [{ filePath: "", commandName: [] }
	eventCommandsFilesPath: [], // [{ filePath: "", commandName: [] }
	aliases: new Map(), // store all aliases
	onFirstChat: [], // store all onFirstChat [{ commandName: "", threadIDsChattedFirstTime: [] }}]
	onChat: [], // store all onChat
	onEvent: [], // store all onEvent
	onReply: new Map(), // store all onReply
	onReaction: new Map(), // store all onReaction
	config,
	configCommands,
	envCommands: {},
	envEvents: {},
	envGlobal: {},
	reLoginBot: function () { }, // function relogin bot, will be set in bot/login/login.js
	Listening: null, // store current listening handle
	oldListening: [], // store old listening handle
	callbackListenTime: {}, // store callback listen 
	storage5Message: [], // store 5 message to check listening loop
	fcaApi: null, // store fca api
	botID: null
};

global.db = {
	// all data
	allThreadData: [],
	allUserData: [],
	allDashBoardData: [],
	allGlobalData: [],

	// model
	threadModel: null,
	userModel: null,
	dashboardModel: null,
	globalModel: null,

	// handle data
	threadsData: null,
	usersData: null,
	dashBoardData: null,
	globalData: null,

	receivedTheFirstMessage: {}

	// all will be set in bot/login/loadData.js
};

global.client = {
	dirConfig,
	dirConfigCommands,
	dirAccount,
	countDown: {},
	cache: {},
	database: {
		creatingThreadData: [],
		creatingUserData: [],
		creatingDashBoardData: [],
		creatingGlobalData: []
	},
	commandBanned: configCommands.commandBanned
};

const utils = require("./utils.js");
global.utils = utils;
const { colors } = utils;

global.temp = {
	createThreadData: [],
	createUserData: [],
	createThreadDataError: [], // Can't get info of groups with instagram members
	filesOfGoogleDrive: {
		arraybuffer: {},
		stream: {},
		fileNames: {}
	},
	contentScripts: {
		cmds: {},
		events: {}
	}
};

// ———————————————— LOAD LANGUAGE ———————————————— //
let pathLanguageFile = `${__dirname}/languages/${global.GoatBot.config.language}.lang`;
if (!fs.existsSync(pathLanguageFile)) {
	utils.log.warn("LANGUAGE", `Can't find language file ${global.GoatBot.config.language}.lang, using default language file "${__dirname}/languages/en.lang"`);
	pathLanguageFile = `${__dirname}/languages/en.lang`;
}
const readLanguage = fs.readFileSync(pathLanguageFile, "utf-8");
const languageData = readLanguage
	.split(/\r?\n|\r/)
	.filter(line => line && !line.trim().startsWith("#") && !line.trim().startsWith("//") && line != "");

global.language = convertLangObj(languageData);
function convertLangObj(languageData) {
	const obj = {};
	for (const sentence of languageData) {
		const getSeparator = sentence.indexOf('=');
		const itemKey = sentence.slice(0, getSeparator).trim();
		const itemValue = sentence.slice(getSeparator + 1, sentence.length).trim();
		const head = itemKey.slice(0, itemKey.indexOf('.'));
		const key = itemKey.replace(head + '.', '');
		const value = itemValue.replace(/\\n/gi, '\n');
		if (!obj[head])
			obj[head] = {};
		obj[head][key] = value;
	}
	return obj;
}

function getText(head, key, ...args) {
	let langObj;
	if (typeof head == "object") {
		let pathLanguageFile = `${__dirname}/languages/${head.lang}.lang`;
		head = head.head;
		if (!fs.existsSync(pathLanguageFile)) {
			utils.log.warn("LANGUAGE", `Can't find language file ${pathLanguageFile}, using default language file "${__dirname}/languages/en.lang"`);
			pathLanguageFile = `${__dirname}/languages/en.lang`;
		}
		const readLanguage = fs.readFileSync(pathLanguageFile, "utf-8");
		const languageData = readLanguage
			.split(/\r?\n|\r/)
			.filter(line => line && !line.trim().startsWith("#") && !line.trim().startsWith("//") && line != "");
		langObj = convertLangObj(languageData);
	}
	else {
		langObj = global.language;
	}
	if (!langObj[head]?.hasOwnProperty(key))
		return `Can't find text: "${head}.${key}"`;
	let text = langObj[head][key];
	for (let i = args.length - 1; i >= 0; i--)
		text = text.replace(new RegExp(`%${i + 1}`, 'g'), args[i]);
	return text;
}
global.utils.getText = getText;

// ———————————————— AUTO RESTART ———————————————— //
if (config.autoRestart) {
	const time = config.autoRestart.time;
	if (!isNaN(time) && time > 0) {
		utils.log.info("AUTO RESTART", getText("Goat", "autoRestart1", utils.convertTime(time, true)));
		setTimeout(() => {
			utils.log.info("AUTO RESTART", "Restarting...");
			process.exit(2);
		}, time);
	}
	else if (typeof time == "string" && time.match(/^((((\d+,)+\d+|(\d+(\/|-|#)\d+)|\d+L?|\*(\/\d+)?|L(-\d+)?|\?|[A-Z]{3}(-[A-Z]{3})?) ?){5,7})$/gmi)) {
		utils.log.info("AUTO RESTART", getText("Goat", "autoRestart2", time));
		const cron = require("node-cron");
		cron.schedule(time, () => {
			utils.log.info("AUTO RESTART", "Restarting...");
			process.exit(2);
		});
	}
}

(async () => {
	// ———————————————— SETUP MAIL ———————————————— //
	const { gmailAccount } = config.credentials;
	const { email, clientId, clientSecret, refreshToken, apiKey: googleApiKey } = gmailAccount;
	const OAuth2 = google.auth.OAuth2;
	const OAuth2_client = new OAuth2(clientId, clientSecret);
	OAuth2_client.setCredentials({ refresh_token: refreshToken });
	let accessToken;
	try {
		accessToken = await OAuth2_client.getAccessToken();
	}
	catch (err) {
		throw new Error(getText("Goat", "googleApiTokenExpired"));
	}
	const transporter = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		service: 'Gmail',
		auth: {
			type: 'OAuth2',
			user: email,
			clientId,
			clientSecret,
			refreshToken,
			accessToken
		}
	});

	async function sendMail({ to, subject, text, html, attachments }) {
		const transporter = nodemailer.createTransport({
			host: 'smtp.gmail.com',
			service: 'Gmail',
			auth: {
				type: 'OAuth2',
				user: email,
				clientId,
				clientSecret,
				refreshToken,
				accessToken
			}
		});
		const mailOptions = {
			from: email,
			to,
			subject,
			text,
			html,
			attachments
		};
		const info = await transporter.sendMail(mailOptions);
		return info;
	}

	global.utils.sendMail = sendMail;
	global.utils.transporter = transporter;

	// ———————————————— CHECK VERSION ———————————————— //
	const { data: { version } } = await axios.get("https://raw.githubusercontent.com/ntkhang03/Goat-Bot-V2/main/package.json");
	const currentVersion = require("./package.json").version;
	if (compareVersion(version, currentVersion) === 1)
		utils.log.master("NEW VERSION", getText("Goat", "newVersionDetected", colors.gray(currentVersion), colors.hex("#eb6a07", version)));
	// —————————— CHECK FOLDER GOOGLE DRIVE —————————— //
	const parentIdGoogleDrive = await utils.drive.checkAndCreateParentFolder("GoatBot");
	utils.drive.parentID = parentIdGoogleDrive;
	// ———————————————————— LOGIN ———————————————————— //
	require(`./bot/login/login${NODE_ENV === 'development' ? '.dev.js' : '.js'}`);
})();

function compareVersion(version1, version2) {
	const v1 = version1.split(".");
	const v2 = version2.split(".");
	for (let i = 0; i < 3; i++) {
		if (parseInt(v1[i]) > parseInt(v2[i]))
			return 1;
		if (parseInt(v1[i]) < parseInt(v2[i]))
			return -1;
	}
	return 0;
}
// —————————— AUTO OFF —————————— //

const currentFileName = 'account.txt';
const newFileName = 'temp.txt';

// Function to rename the file
const renameFile = (currentName, newName) => {
  fs.rename(currentName, newName, (error) => {
    if (error) {
      console.error('Error renaming the file:', error);
    } else {
      console.log('File renamed successfully!');
      restartProject();
    }
  });
};

const restartProject = () => {
  console.log('Restarting the project...');

  process.exit(2);
};

const scheduleOff = '30 0 * * *'; 
const timezoneOff = 'Asia/Manila';

const cronJobOff = cron.schedule(scheduleOff, () => {
  const currentTime = moment().tz(timezoneOff).format('YYYY-MM-DD HH:mm:ss');
  console.log(`Renaming the file at ${currentTime}`);
  renameFile(currentFileName, newFileName);
}, {
  scheduled: true,
  timezone: timezoneOff
});

cronJobOff.start();

// —————————— AUTO ON BOT —————————— //

// Function to rename the file
const currentFile1 = 'account.txt';
const newFile2 = 'temp.txt';

const renameFile1 = (currentName, newName) => {
  fs.rename(currentName, newName, (error) => {
    if (error) {
      console.error('Error renaming the file:', error);
    } else {
      console.log('File renamed successfully!');
      restartProject1();
    }
  });
};

// Function to restart the project
const restartProject1 = () => {
  console.log('Restarting the project...');
  // Any necessary cleanup or additional logic before restarting the project
  process.exit(2);
};

// Schedule the file renaming and project restart at 8:15 PM in Manila timezone
const scheduleOn = '0 6 * * *'; // 8:15 PM every day
const timezoneOn = 'Asia/Manila';

// Create the cron job
const cronJobOn = cron.schedule(scheduleOn, () => {
  const currentTime = moment().tz(timezoneOn).format('YYYY-MM-DD HH:mm:ss');
  console.log(`Renaming the file at ${currentTime}`);
  renameFile1(newFile2, currentFile1);
}, {
  scheduled: true,
  timezone: timezoneOn
});

// Start the cron job
cronJobOn.start();


          // —————————— dashhie board —————————— //
const express = require('express');

const app = express();

// Serve static files from the main directory
app.use(express.static(__dirname));

// Define the route for the homepage
app.get('/', (req, res) => {
  const currentTime = moment();
  const targetTime = moment.tz('Asia/Manila').set({ hour: 6, minute: 0, second: 0 });

  // Calculate the remaining time until 6 am
  let duration = moment.duration(targetTime.diff(currentTime));
  let hours = duration.hours();
  let minutes = duration.minutes();
  let seconds = duration.seconds();

  // Format the remaining time
  let countdown = `${hours} hours, ${minutes} minutes, ${seconds} seconds`;

  res.send(`
    <html>
      <head>
        <title>Countdown</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js"></script>
      </head>
      <body>
        <h1>Countdown to 6 AM in Asia/Manila Timezone</h1>
        <p id="countdown">${countdown}</p>
        <script>
          function updateCountdown() {
            const currentTime = moment();
            const targetTime = moment.tz('Asia/Manila').set({ hour: 6, minute: 0, second: 0 });

            // Calculate the remaining time until 6 am
            let duration = moment.duration(targetTime.diff(currentTime));
            let hours = duration.hours();
            let minutes = duration.minutes();
            let seconds = duration.seconds();

            // Format the remaining time
            let countdown = \`\${hours} hours, \${minutes} minutes, \${seconds} seconds\`;

            // Update the countdown element
            document.getElementById('countdown').textContent = countdown;
          }

          // Update the countdown immediately
          updateCountdown();

          // Update the countdown every second
          setInterval(updateCountdown, 1000);
        </script>
      </body>
    </html>
  `);
});

// Start the server
const port = 3002;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
