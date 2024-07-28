const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
    name: "spotify",
    version: "1.0.0",
    credits: "chill",
    description: "Search music",
    hasPrefix: false,
    cooldown: 5,
    aliases: ["spot"]
};

module.exports.run = async function ({ api, event, args }) {
    try {
        let searchQuery = args.join(" ");
        if (!searchQuery) {
            return api.sendMessage("[ ❗ ] - Missing search query for the Spotify command", event.threadID, event.messageID);
        }

        api.sendMessage("Searching for the track, please wait...", event.threadID, async (err, info) => {
            if (err) {
                console.error("Error sending initial message:", err);
                return;
            }

            try {
                // Fetch the track information
                const response = await axios.get(`https://hiroshi-rest-api.replit.app/search/spotify?search=${encodeURIComponent(searchQuery)}`);
                const trackData = response.data[0];
                const downloadUrl = trackData.download;

                // Download the track
                const downloadResponse = await axios.get(downloadUrl, { responseType: 'stream' });
                const audioPath = path.resolve(__dirname, 'audio.mp3');
                const writer = fs.createWriteStream(audioPath);

                downloadResponse.data.pipe(writer);

                writer.on('finish', () => {
                    // Send the downloaded track as an audio attachment
                    api.sendMessage({
                        body: `Here is your track: ${trackData.name}`,
                        attachment: fs.createReadStream(audioPath)
                    }, event.threadID, () => {
                        // Clean up the downloaded file after sending
                        fs.unlinkSync(audioPath);
                    });
                });

                writer.on('error', (error) => {
                    console.error("Error writing audio file:", error);
                    api.sendMessage("An error occurred while downloading the track.", event.threadID);
                });

            } catch (error) {
                console.error(error);
                api.sendMessage("An error occurred while processing your request.", event.threadID);
            }
        });
    } catch (error) {
        console.error("Error in Spotify command:", error);
        api.sendMessage("An error occurred while processing your request.", event.threadID);
    }
};
