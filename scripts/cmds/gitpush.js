const { exec } = require('child_process');

module.exports = {
    config: {
        name: "gitpush",
        version: "1.5",
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
            const commitmes = args.join(' ');
            if (!message) {
                message.reply('Commit message is required.');
                return;
            }
            await message.reply('Pushing the latest code to the git repository...');

            gitPush(commitmes, message);
        }catch(e){
            console.log(e);
        }
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
