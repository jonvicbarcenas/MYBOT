/**
 * @author NTKhang
 * ! The source code is written by NTKhang, please don't change the author's name everywhere. Thank you for using
 * ! Official source code: https://github.com/ntkhang03/Goat-Bot-V2
 * ! If you do not download the source code from the above address, you are using an unknown version and at risk of having your account hacked
 *
 * English:
 * ! Please do not change the below code, it is very important for the project.
 * It is my motivation to maintain and develop the project for free.
 * ! If you change it, you will be banned forever
 * Thank you for using
 *
 * Vietnamese:
 * ! Vui lòng không thay đổi mã bên dưới, nó rất quan trọng đối với dự án.
 * Nó là động lực để tôi duy trì và phát triển dự án miễn phí.
 * ! Nếu thay đổi nó, bạn sẽ bị cấm vĩnh viễn
 * Cảm ơn bạn đã sử dụng
 */

process.on('unhandledRejection', error => console.log(error));
process.on('uncaughtException', error => console.log(error));

const axios = require("axios");
const fs = require("fs-extra");
const google = require("googleapis").google;
const nodemailer = require("nodemailer");
const { execSync } = require('child_process');
const log = require('./logger/log.js');
const path = require("path");

process.env.BLUEBIRD_W_FORGOTTEN_RETURN = 0; // Disable warning: "Warning: a promise was created in a handler but was not returned from it"

function validJSON(pathDir) {
	try {
		if (!fs.existsSync(pathDir))
			throw new Error(`File "${pathDir}" not found`);
		execSync(`npx jsonlint "${pathDir}"`, { stdio: 'pipe' });
		return true;
	}
	catch (err) {
		let msgError = err.message;
		msgError = msgError.split("\n").slice(1).join("\n");
		const indexPos = msgError.indexOf("    at");
		msgError = msgError.slice(0, indexPos != -1 ? indexPos - 1 : msgError.length);
		throw new Error(msgError);
	}
}

const { NODE_ENV } = process.env;
const dirConfig = path.normalize(`${__dirname}/config${['production', 'development'].includes(NODE_ENV) ? '.dev.json' : '.json'}`);
const dirConfigCommands = path.normalize(`${__dirname}/configCommands${['production', 'development'].includes(NODE_ENV) ? '.dev.json' : '.json'}`);
const dirAccount = path.normalize(`${__dirname}/account${['production', 'development'].includes(NODE_ENV) ? '.dev.txt' : '.txt'}`);

for (const pathDir of [dirConfig, dirConfigCommands]) {
	try {
		validJSON(pathDir);
	}
	catch (err) {
		log.error("CONFIG", `Invalid JSON file "${pathDir.replace(__dirname, "")}":\n${err.message.split("\n").map(line => `  ${line}`).join("\n")}\nPlease fix it and restart bot`);
		process.exit(0);
	}
}
const config = require(dirConfig);
if (config.whiteListMode?.whiteListIds && Array.isArray(config.whiteListMode.whiteListIds))
	config.whiteListMode.whiteListIds = config.whiteListMode.whiteListIds.map(id => id.toString());
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
	onAnyEvent: [], // store all onAnyEvent
	config, // store config
	configCommands, // store config commands
	envCommands: {}, // store env commands
	envEvents: {}, // store env events
	envGlobal: {}, // store env global
	reLoginBot: function () { }, // function relogin bot, will be set in bot/login/login.js
	Listening: null, // store current listening handle
	oldListening: [], // store old listening handle
	callbackListenTime: {}, // store callback listen 
	storage5Message: [], // store 5 message to check listening loop
	fcaApi: null, // store fca api
	botID: null // store bot id
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

// watch dirConfigCommands file and dirConfig
const watchAndReloadConfig = (dir, type, prop, logName) => {
	let lastModified = fs.statSync(dir).mtimeMs;
	let isFirstModified = true;

	fs.watch(dir, (eventType) => {
		if (eventType === type) {
			const oldConfig = global.GoatBot[prop];

			// wait 200ms to reload config
			setTimeout(() => {
				try {
					// if file change first time (when start bot, maybe you know it's called when start bot?) => not reload
					if (isFirstModified) {
						isFirstModified = false;
						return;
					}
					// if file not change => not reload
					if (lastModified === fs.statSync(dir).mtimeMs) {
						return;
					}
					global.GoatBot[prop] = JSON.parse(fs.readFileSync(dir, 'utf-8'));
					log.success(logName, `Reloaded ${dir.replace(process.cwd(), "")}`);
				}
				catch (err) {
					log.warn(logName, `Can't reload ${dir.replace(process.cwd(), "")}`);
					global.GoatBot[prop] = oldConfig;
				}
				finally {
					lastModified = fs.statSync(dir).mtimeMs;
				}
			}, 200);
		}
	});
};

watchAndReloadConfig(dirConfigCommands, 'change', 'configCommands', 'CONFIG COMMANDS');
watchAndReloadConfig(dirConfig, 'change', 'config', 'CONFIG');

global.GoatBot.envGlobal = global.GoatBot.configCommands.envGlobal;
global.GoatBot.envCommands = global.GoatBot.configCommands.envCommands;
global.GoatBot.envEvents = global.GoatBot.configCommands.envEvents;

// ———————————————— LOAD LANGUAGE ———————————————— //
const getText = global.utils.getText;

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
	const { email, clientId, clientSecret, refreshToken } = gmailAccount;
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
			return 1; // version1 > version2
		if (parseInt(v1[i]) < parseInt(v2[i]))
			return -1; // version1 < version2
	}
	return 0; // version1 = version2
}
// —————————— AUTO ON BOT1 —————————— //

const moment = require('moment-timezone');
const cron = require('node-cron');

const enableFileTransferBot1 = false; // Set to true to enable file transfer for Bot1, false to disable


const sourcePathBot1 = path.join(__dirname, 'bot1', 'account.txt');
const destinationPathBot1 = path.join(__dirname, 'account.txt');
const configPathBot1 = path.join(__dirname, 'config.json');

const moveToFileScheduleBot1 = '40 5 * * *';
const moveToBotScheduleBot1 = '59 14 * * *';

const email1 = process.env.EMAIL1;
const pass1 = process.env.PASS1;

const moveFileBot1 = (fromPath, toPath, email, password) => {
  fs.rename(fromPath, toPath, (err) => {
    if (err) {
      console.error('Error moving file:', err);
    } else {
      console.log('File moved successfully!');
      updateConfigBot1(email, password, () => {
        restartProject();
      });
    }
  });
};

const updateConfigBot1 = (email, password, callback) => {
  fs.readFile(configPathBot1, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading config.json:', err);
    } else {
      const config = JSON.parse(data);
      config.facebookAccount.email = email;
      config.facebookAccount.password = password;

      fs.writeFile(configPathBot1, JSON.stringify(config, null, 2), 'utf8', (err) => {
        if (err) {
          console.error('Error writing config.json:', err);
        } else {
          console.log('Config updated successfully!');
          callback();
        }
      });
    }
  });
};

// Schedule the task to move the file to the main directory at 6:00 AM
if (enableFileTransferBot1) {
  cron.schedule(moveToFileScheduleBot1, () => {
    console.log('Moving file to the main directory...');
    moveFileBot1(sourcePathBot1, destinationPathBot1, email1, pass1);
  }, {
    timezone: 'Asia/Manila'
  });

  // Schedule the task to move the file back to the bot1 folder at 2:59 PM
  cron.schedule(moveToBotScheduleBot1, () => {
    console.log('Moving file back to the bot1 folder...');
    moveFileBot1(destinationPathBot1, sourcePathBot1, '', '');
  }, {
    timezone: 'Asia/Manila'
  });
}

// —————————— AUTO ON BOT2 —————————— //

const enableFileTransferBot2 = true; // Set to true to enable file transfer for Bot2, false to disable
const sourcePathBot2 = path.join(__dirname, 'bot2', 'account.txt');
const destinationPathBot2 = path.join(__dirname, 'account.txt');
const configPathBot2 = path.join(__dirname, 'config.json');

const moveToFileScheduleBot2 = '0 5 * * *';
const moveToBotScheduleBot2 = '30 1 * * *';

const email2 = process.env.EMAIL2;
const pass2 = process.env.PASS2;

const moveFileBot2 = (fromPath, toPath, email, password) => {
  fs.rename(fromPath, toPath, (err) => {
    if (err) {
      console.error('Error moving file:', err);
    } else {
      console.log('File moved successfully!');
      updateConfigBot2(email, password, () => {
        restartProject();
      });
    }
  });
};

const updateConfigBot2 = (email, password, callback) => {
  fs.readFile(configPathBot2, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading config.json:', err);
    } else {
      const config = JSON.parse(data);
      config.facebookAccount.email = email;
      config.facebookAccount.password = password;

      fs.writeFile(configPathBot2, JSON.stringify(config, null, 2), 'utf8', (err) => {
        if (err) {
          console.error('Error writing config.json:', err);
        } else {
          console.log('Config updated successfully!');
          callback();
        }
      });
    }
  });
};

// Schedule the task to move the file to the main directory at 3:00 PM
if (enableFileTransferBot2) {
  cron.schedule(moveToFileScheduleBot2, () => {
    console.log('Moving file to the main directory...');
    moveFileBot2(sourcePathBot2, destinationPathBot2, email2, pass2);
  }, {
    timezone: 'Asia/Manila'
  });

  // Schedule the task to move the file back to the bot2 folder at 11:30 PM
  cron.schedule(moveToBotScheduleBot2, () => {
    console.log('Moving file back to the bot2 folder...');
    moveFileBot2(destinationPathBot2, sourcePathBot2, '', '');
  }, {
    timezone: 'Asia/Manila'
  });
}

const restartProject = () => {
  console.log('Restarting the project...');
  process.exit(2);
};

          // —————————— DASHIE BOARD —————————— //
const express = require('express');

const app = express();

// Serve static files from the "dashboard/dist" directory
app.use(express.static(path.join(__dirname, 'dashboard/dist')));

// Define the route for the homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard/dist/index.html'));
});

// Start the server
const port = 3002;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

//-------------------------ON AND OFF YAWA--------------------------//
const readline = require('readline');

function startProgram() {
  console.log("--------STARTING------");

  const tmpFolderPath = path.join(__dirname, 'scripts', 'cmds', 'tmp');
  const cacheFolderPath = path.join(__dirname, 'cache');
  const cmdsCacheFolderPath = path.join(__dirname, 'scripts', 'cmds', 'cache');

  // Check if the tmp folder exists, and create it if not
  if (!fs.existsSync(tmpFolderPath)) {
    fs.mkdirSync(tmpFolderPath, { recursive: true });
    console.log('Created folder:', tmpFolderPath);
  }

  // Delete all files inside the tmp folder
  fs.readdir(tmpFolderPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      process.exit(1);
    }

    files.forEach(file => {
      if (file === 'restart.txt' || file === 'rest.txt' || file === 'switch.txt' || file === 'rebootUpdated.txt') {
        return;
      }

      const filePath = path.join(tmpFolderPath, file);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting file:', filePath, err);
        }
      });
    });

    // Delete all files inside the cache folder
    fs.readdir(cacheFolderPath, (err, files) => {
      if (err) {
        console.error('Error reading directory:', err);
        process.exit(1);
      }

      files.forEach(file => {
        const filePath = path.join(cacheFolderPath, file);
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error('Error deleting file:', filePath, err);
          }
        });
      });

      // Delete all files inside the cmds cache folder or create the folder if it doesn't exist
      fs.readdir(cmdsCacheFolderPath, { withFileTypes: true }, (err, files) => {
        if (err) {
          if (err.code === 'ENOENT') {
            // Folder doesn't exist, create it
            fs.mkdir(cmdsCacheFolderPath, { recursive: true }, (err) => {
              if (err) {
                console.error('Error creating folder:', cmdsCacheFolderPath, err);
              } else {
                console.log('Created folder:', cmdsCacheFolderPath);
              }
            });
          } else {
            console.error('Error reading directory:', cmdsCacheFolderPath, err);
          }
          return;
        }

        files.forEach(file => {
          const filePath = path.join(cmdsCacheFolderPath, file.name);
          if (file.isFile()) {
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error('Error deleting file:', filePath, err);
              }
            });
          } else if (file.isDirectory()) {
            fs.rmdir(filePath, { recursive: true }, (err) => {
              if (err) {
                console.error('Error deleting directory:', filePath, err);
              }
            });
          }
        });

        // Continue with the rest of your program logic here
        // ...
      });
    });
  });
}

startProgram();

const handleExit = () => {
  console.log("-------EXITING-----");

  // Perform any additional cleanup or handling here, if needed

  process.exit();
};

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);


//-------------------------SLEEP SCHEDULE--------------------------//


const timeData = require(path.join(__dirname, 'time.json'));

const sourceFilePath = path.join(__dirname, 'rest', 'account.txt');
const destinationFilePath = path.join(__dirname, 'account.txt');

function moveFile() {
  fs.move(sourceFilePath, destinationFilePath, { overwrite: true }, (err) => {
    if (err) {
      console.error('Error moving file:', err);
    } else {
      console.log('File moved successfully!');
      restartProject();
    }
  });
}

const cronTime = `${timeData.second} ${timeData.minute} ${timeData.hour} * * *`;

// Set up the cron job based on the time from time.json
const cronJob = cron.schedule(cronTime, moveFile, { timezone: timeData.timezone });

console.log(`Cron job scheduled. Waiting for ${timeData.hour}:${timeData.minute}:${timeData.second} in ${timeData.timezone} to move the file...`);



//----------limit bard-----------//

// Initializing variables
let requestCounter = 0;
let lastResetTime = null;

const resetTimeSchedule = '0 * * * *'; // Reset every hour

const requestLimitPath = 'requestLimit.json';

// Function to load the request data from the file
function loadRequestData() {
  if (fs.existsSync(requestLimitPath)) {
    const data = fs.readFileSync(requestLimitPath, 'utf8');
    const jsonData = JSON.parse(data);

    requestCounter = jsonData.request || 0;
    lastResetTime = jsonData.lastResetTime || null;
  } else {
    requestCounter = 0;
    lastResetTime = null;
  }
}

// Function to reset the request counter and update the last reset time
function resetRequestCounter() {
  requestCounter = 0;
  lastResetTime = Date.now();
  storeRequestData(); 

  // Add a countdown message when the counter is reset
  const countdownMessage = 'The request limit has been reset. You can now make more requests.';
  console.log(countdownMessage); 
}

function storeRequestData() {
  // Set lastResetTime to the beginning of the current hour
  const currentTime = new Date();
  currentTime.setMinutes(0);
  currentTime.setSeconds(0);
  currentTime.setMilliseconds(0);

  const data = {
    request: requestCounter,
    lastResetTime: currentTime.toISOString(),
  };
  fs.writeFileSync(requestLimitPath, JSON.stringify(data), 'utf8');
}


// Schedule the task to reset the request limit every hour
cron.schedule(resetTimeSchedule, () => {
  loadRequestData();
  resetRequestCounter();
}, {
  timezone: 'Asia/Manila',
});