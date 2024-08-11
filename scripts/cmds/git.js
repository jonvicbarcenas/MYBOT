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
            en: "{prefix}gitpush 'commit message'\nExample:\n{prefix}gitpush 'Update the code'"
        }
    },

    langs: {
        vi: {
            
        },
        en: {
            
        }
    },

    onStart: async function ({ api, args, message, event, threadsData, usersData, dashBoardData, globalData, threadModel, userModel, dashBoardModel, globalModel, role, commandName, getLang }) {
        try{
            const gitOpt = args.join(' ').tolowercase();

            if (gitOpt !== 'push' || gitOpt !== 'pull') {
                await message.reply('Please choose an option: pull or push');
                return;
            }

            if (gitOpt === 'push'){
                const thisMess = "Please reply the commit message on this message of mine.";
                message.reply({
                    body: thisMess
                  }, (err, info) => {
                    global.GoatBot.onReply.set(info.messageID, {
                      commandName: "gitpush",
                      messageID: info.messageID,
                      author: event.senderID,
                    //   repliedMessage
                    });
                });
                
            }

            if (gitOpt === 'pull') {
                await message.reply('Pulling the latest code from the git repository...');
                gitPull(message);
            }


            // if (!message) {
            //     message.reply('Commit message is required.');
            //     return;
            // }


            gitPush(commitmes, message);
        }catch(e){
            console.log(e);
        }
    },
    onReply: async function ({ args, event, api, message, Reply }) {
        const { author, repliedMessage } = Reply;

        if (event.senderID !== author) {
            return;
        }
        
        const commitmes = args.join(' ');
        gitPush(commitmes, message);

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
            message.reply(`stderr: ${stderr}`);
            console.error(`stderr: ${stderr}`);
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
            message.reply(`stderr: ${stderr}`);
            console.error(`stderr: ${stderr}`);
            return;
        }

        console.log(`stdout: ${stdout}`);
        message.reply('Successfully pulled the latest code from the git repository.');
    });
}