const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Define the module configuration
module.exports.config = {
    name: "pinterest",
    version: "1.0.0",
    role: 0,
    credits: "chill",
    description: "Fetch and send images from Pinterest",
    hasPrefix: false,
    aliases: ["pinterest"],
    usage: "pinterest <search term> - <count>",
    cooldown: 5
};

module.exports.run = async function({ api, event, args }) {
    try {
        // Join arguments into a single string and split by " - "
        const input = args.join(" ");
        const [searchTerm, count] = input.split(" - ");

        // Check if the search term is provided
        if (!searchTerm) {
            api.sendMessage("Usage: pinterest <search term> - <count>", event.threadID);
            return;
        }

        // Default count to 10 if not provided
        const imageCount = count ? parseInt(count) : 10;

        // Construct the API URL with properly encoded parameters
        const url = `https://hiroshi-rest-api.replit.app/search/pinterest?search=${encodeURIComponent(searchTerm)}`;

        // Notify the user that the images are being fetched
        api.sendMessage("Fetching images, please wait...", event.threadID);

        // Fetch the images from the API
        const response = await axios.get(url);
        const imageUrls = response.data.data.slice(0, imageCount);

        // Check if the API returned images
        if (imageUrls && imageUrls.length > 0) {
            const attachments = [];

            for (let i = 0; i < imageUrls.length; i++) {
                const imageUrl = imageUrls[i];
                const imagePath = path.join(__dirname, `pinterest_image_${i}.jpg`);

                // Fetch and save each image
                const imageResponse = await axios({
                    url: imageUrl,
                    method: 'GET',
                    responseType: 'stream'
                });

                const writer = fs.createWriteStream(imagePath);
                imageResponse.data.pipe(writer);

                // Wait for the image to be saved
                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                // Add the image path to the attachments array
                attachments.push(fs.createReadStream(imagePath));
            }

            // Send all the images as attachments in a single message
            api.sendMessage({
                attachment: attachments
            }, event.threadID, () => {
                // Clean up the files after sending
                attachments.forEach((attachment, index) => {
                    const filePath = path.join(__dirname, `pinterest_image_${index}.jpg`);
                    fs.unlinkSync(filePath);
                });
            });

        } else {
            api.sendMessage("No images found.", event.threadID);
        }
    } catch (error) {
        console.error('Error:', error);
        api.sendMessage("An error occurred while processing the request.", event.threadID);
    }
};
