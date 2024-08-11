const { exec } = require('child_process');

module.exports = {
    config: {
        name: "git",
        version: "2.0",
        author: "JV Barcenas",
        countDown: 5,
        role: 2,
        description: {
            vi: "",
            en: "Push the latest code to the git repository"
        },
        category: "utility",
        guide: {
            vi: "",
            en: "{prefix}gitpush [push/pull] [commit message]\nExample:\n{prefix}gitpush push 'Update the code'\n{prefix}gitpush pull"
        }
    },

    langs: {
        vi: {},
        en: {}
    },

    onStart: async function ({ api, args, message, event, global }) {
        try {
            if (args.length === 0) {
                await message.reply('Please provide an option: push or pull.');
                return;
            }

            const gitOpt = args[0].toLowerCase();

            if (gitOpt !== 'push' && gitOpt !== 'pull') {
                await message.reply('Please choose an option: push or pull.');
                return;
            }

            if (gitOpt === 'push') {
                if (args.length < 2) {
                    const thisMess = "Please reply with the commit message.";
                    message.reply({
                        body: thisMess
                    }, (err, info) => {
                        if (!err) {
                            global.GoatBot.onReply.set(info.messageID, {
                                commandName: "git",
                                messageID: info.messageID,
                                author: event.senderID,
                            });
                        } else {
                            console.error('Error in message.reply callback:', err);
                        }
                    });
                    return;
                } else {
                    const commitMessage = args.slice(1).join(' ');
                    gitPush(commitMessage, message);
                }
            }

            if (gitOpt === 'pull') {
                await message.reply('Pulling the latest code from the git repository...');
                gitPull(message);
            }

        } catch (e) {
            console.log(e);
        }
    },

    onReply: async function ({ args, event, message, Reply }) {
        const { author } = Reply;

        if (event.senderID !== author) {
            return;
        }

        const commitMessage = args.join(' ');
        gitPush(commitMessage, message);
    }
};

function gitPush(commitMessage, message) {
    exec(`git add . && git commit -m "${commitMessage}" && git push origin main`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            message.reply(`Error: ${error.message}`);
            return;
        }

        if (stderr) {
            console.error(`stderr: ${stderr}`);
            message.reply(`stderr: ${stderr}`);
            return;
        }

        console.log(`stdout: ${stdout}`);
        message.reply('Successfully pushed the latest code to the git repository.');
    });
}

function gitPull(message) {
    exec('git pull origin main', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            message.reply(`Error: ${error.message}`);
            return;
        }

        if (stderr) {
            console.error(`stderr: ${stderr}`);
            message.reply(`stderr: ${stderr}`);
            return;
        }

        console.log(`stdout: ${stdout}`);
        message.reply('Successfully pulled the latest code from the git repository.');
    });
}
