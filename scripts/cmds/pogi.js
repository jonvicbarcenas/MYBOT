module.exports = {
    config: {
        name: "pogi",
        version: "1.0",
        author: "XyryllPanget",
        countDown: 5,
        role: 0,
        shortDescription: "sarcasm",
        longDescription: "sarcasm",
        category: "reply",
    },
onStart: async function(){}, 
onChat: async function({
    event,
    message,
    getLang
}) {
    if (event.body && event.body.toLowerCase() == "pogi") return message.reply("Oo ampogi mo gago naiinis na ako sa kapogian mo gagstik kaba? inutil ka pala e");
}
};