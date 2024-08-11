module.exports = {
    config: {
        name: "gitpush",
        version: "1.1",
        author: "JV Barcenas",
        countDown: 5,
        role: 0,
        description: {
            vi: "",
            en: "Push the latest code to the git repository"
        },
        category: "utility",
        guide: {
            vi: "",
            en: ""
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
            await message.reply(commitmes);
        }catch(e){
            console.log(e);
        }
    }
};