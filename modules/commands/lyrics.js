const axios = require("axios");

module.exports.config = {
    name: "lyrics",
    version: "1.0.0",
    credits: "churchill",
    description: "simple lyrics cmd",
    hasPrefix: false,
    cooldown: 5,
    aliases: ["lyr"]
};

module.exports.run = async function ({ api, event, args }) {
    try {
        let query = args.join(" ");
        if (!query) {
            return api.sendMessage(" Missing song title for the lyrics command", event.threadID, event.messageID);
        }

        api.sendMessage("Fetching lyrics, please wait...", event.threadID, async (err, info) => {
            if (err) {
                console.error(err);
                return api.sendMessage("An error occurred while processing your request.", event.threadID);
            }

            try {
                const response = await axios.get(`https://markdevs-last-api-2epw.onrender.com/search/lyrics?q=${encodeURIComponent(query)}`);
                const { lyrics, title, artist, image } = response.data.result;

                if (!lyrics || !title || !artist || !image) {
                    return api.sendMessage("Lyrics not found for the given query.", event.threadID);
                }

                const message = {
                    body: `🎵 **Title:** ${title}\n👤 **Artist:** ${artist}\n\n📜 **Lyrics:**\n${lyrics}`,
                    attachment: (await axios({ url: image, responseType: 'stream' })).data
                };

                api.sendMessage(message, event.threadID);
            } catch (error) {
                console.error(error);
                api.sendMessage("An error occurred while fetching the lyrics.", event.threadID);
            }
        });
    } catch (error) {
        console.error("Error in lyrics command:", error);
        api.sendMessage("An error occurred while processing your request.", event.threadID);
    }
};
