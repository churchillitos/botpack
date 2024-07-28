const cheerio = require('cheerio');
const axios = require('axios');
const regExCheckURL = /https:\/\/www\.facebook\.com\/[a-zA-Z0-9\.]+/;

async function findUid(link) {
  try {
    const response = await axios.post(
      'https://seomagnifier.com/fbid',
      new URLSearchParams({
        'facebook': '1',
        'sitelink': link
      }),
      {
        headers: {
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Cookie': 'PHPSESSID=0d8feddd151431cf35ccb0522b056dc6'
        }
      }
    );
    const id = response.data;
    if (isNaN(id)) {
      const html = await axios.get(link);
      const $ = cheerio.load(html.data);
      const el = $('meta[property="al:android:url"]').attr('content');
      if (!el) {
        throw new Error('UID not found');
      }
      const number = el.split('/').pop();
      return number;
    }
    return id;
  } catch (error) {
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

module.exports.config = {
  name: "uid",
  role: 0,
  credits: "Cliff",
  description: "Get the user's Facebook UID.",
  hasPrefix: false,
  usages: "{p}uid {p}uid @mention {p}uid fblink",
  cooldown: 5,
  aliases: [],
};

module.exports.run = async function({ api, event, args }) {
  if (Object.keys(event.mentions).length === 0) {
    if (event.messageReply) {
      const senderID = event.messageReply.senderID;
      return api.shareContact(senderID, event.messageReply.senderID, event.threadID);
    } else {
      return api.shareContact(event.senderID, event.senderID, event.threadID);
    }
  } else {
    for (const mentionID in event.mentions) {
      const { mentions } = event;
      for (const id in mentions) {
        api.shareContact(`${mentions[id].replace("@", "")}: ${mentionID}`, mentionID, event.threadID);
      }
    }
if (args[0].match(regExCheckURL)) {
      let msg = '';
      for (const link of args) {
        try {
          const uid = await findUid(link);
          await api.sendMessage(`${link}: ${uid}`, uid, event.threadID);
        } catch (error) {
          await api.sendMessage(`Error fetching UID for ${link}`, event.threadID);
        }
      }
    }
  }
};
