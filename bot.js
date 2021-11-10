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
``
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(telegramToken, { polling: true });

// Text that is sent on /start command
bot.onText(/^\/start$/, (msg, match) => {
    log.info(`Telegram chat #{msg.chat.id} started dialog`);

    const text =
        `*Hey${msg.chat.first_name ? ', ' + msg.chat.first_name : ''}* 
My name is *Mister NFT Bot*
Send me your *ERC20 or BEP20 address* and I will show you your *NFTs*
I support photos and gifs that are stored in NFT tokens created by most of contracts including *OpenSea, AirNFTs, JGN-NFT and others*
I use [Covalent API](https://www.covalenthq.com/) for fetching data from blockchains
`;

    bot.sendMessage(msg.chat.id, text, { parse_mode: 'markdown', disable_web_page_preview: true });
});

bot.onText(/^0x([\w\d]+)/, async (msg, match) => {
    const address = match.input;

    try {
        const mediaFetcher = new MediaFetcher(host, covalentApiKey);
        const message = await bot.sendMessage(msg.chat.id, '*Fetching your NFTs from blockchain..*', { parse_mode: 'markdown' });

        let mediaList = await mediaFetcher.getMediaList(address);

        if (mediaList['photo'].length || mediaList['animation'].length) {
            bot.editMessageText('<b>Your awesome NFTs</b>', {
                message_id: message.message_id,
                chat_id: msg.chat.id,
                parse_mode: 'html'
            });
        } else {
            bot.editMessageText('**Can not find any supported NFTs**', {
                message_id: message.message_id,
                chat_id: msg.chat.id,
                parse_mode: 'markdown'
            });
        }

        if (mediaList['photo'].length) {
            const maxItemsLimit = 9;
            let start = 0;
            do {
                try {
                    const end = start + maxItemsLimit;
                    const mediaListPart = mediaList['photo'].slice(start, end);

                    log.debug(`Sending ${mediaListPart.length} photos`);

                    await bot.sendMediaGroup(msg.chat.id, mediaListPart.map(media => {
                        let caption = `<b>${media.name}</b>`;
                        if (media.description) {
                            caption += `\n${media.description}`;
                        }
                        caption += `\nContract: ${media.contractName}`;
                        caption += `\nChain: ${media.chainId}`;

                        return {
                            type: 'photo',
                            media: media.image,
                            caption: caption,
                            parse_mode: 'html'
                        }
                    }));

                    start += maxItemsLimit;
                } catch (e) {
                    log.error(e);
                }
            } while (mediaList['photo'][start] !== undefined)
        }

        if (mediaList['animation'].length) {
            for (const media of mediaList['animation']) {
                try {
                    // TODO DUPLICATION OF CODE
                    let caption = `<b>${media.name}</b>`;
                    if (media.description) {
                        caption += `\n${media.description}`;
                    }
                    caption += `\nContract: ${media.contractName}`;
                    caption += `\nChain: ${media.chainId}`;
                    // Strange thing, gif can not be sent as animation, Telegram returns error.
                    await bot.sendDocument(msg.chat.id, media.image);
                } catch (e) {
                    log.error(e);
                }

            }
        }

    } catch (err) {
        log.error(err);
        bot.sendMessage(msg.chat.id, "Sorry, I can't get information for your address")
    }

})