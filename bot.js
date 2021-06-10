const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const process = require('process');
const log = require('loglevel');
const { MediaFetcher } = require('./mediaFetcher');

const logLevel = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'debug';
log.setLevel(logLevel);

const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const covalentApiKey = process.env.COVALENT_SECRET;
const host = 'https://api.covalenthq.com';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(telegramToken, { polling: true });

// Text that is sent on /start command
bot.onText(/^\/start$/, (msg, match) => {
    const text =
        `*Hey${msg.chat.first_name ? ', ' + msg.chat.first_name : ''}* 
My name is *Mister NFT Bot*
Send me your *BEP20 address* and I will show you your *NFTs*
I support NFT tokens created by most of contracts including OpenSea, AirNFTs, JGN-NFT and others
`;

    bot.sendMessage(msg.chat.id, text, { parse_mode: 'markdown' });
});

bot.onText(/^0x([\w\d]+)/, async (msg, match) => {
    const address = match.input;

    try {
        const mediaFetcher = new MediaFetcher(host, covalentApiKey);
        const message = await bot.sendMessage(msg.chat.id, '*Fetching your NFTs from blockchain..*', { parse_mode: 'markdown' });
        
        let photos = await mediaFetcher.getPhotos(address);

        if (photos.length) {
            bot.editMessageText('<b>Your awesome NFTs</b>', {
                message_id: message.message_id,
                chat_id: msg.chat.id,
                parse_mode: 'html'
            });
            const maxImagesLimit = 10;
            let start = 0;
            do {
                const end = start + maxImagesLimit - 1;
                const photosPart = photos.slice(start, end);
                bot.sendMediaGroup(msg.chat.id, photosPart.map(photo => {
                    let caption = `<b>${photo.name}</b>`;
                    if (photo.description) {
                        caption += `\n${photo.description}`
                    }
                    caption += `\nContract: ${photo.contractName}`
                    caption += `\nChain: ${photo.chainId}`
                    return {
                        type: 'photo',
                        media: photo.image,
                        caption: caption,
                        parse_mode: 'html'
                    }
                }));
                start += maxImagesLimit;
            } while (photos[start] !== undefined)

            
        } else {
            bot.editMessageText('**Can not find any supported NFTs**', {
                message_id: message.message_id,
                chat_id: msg.chat.id,
                parse_mode: 'markdown'
            });
        }
    } catch (err) {
        log.error(err);
        bot.sendMessage(msg.chat.id, "Sorry, I can't get information for your address")
    }
})