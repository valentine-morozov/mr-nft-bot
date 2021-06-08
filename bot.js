const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const process = require('process');
const log = require('loglevel');

const logLevel = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'debug';
log.setLevel(logLevel);

const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const covalentApiKey = process.env.COVALENT_SECRET;
const host = 'https://api.covalenthq.com';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(telegramToken, {polling: true});

// Text that is sent on /start command
bot.onText(/^\/start$/, (msg, match) => {
    const text = 
`*Hey${msg.chat.first_name? ', ' + msg.chat.first_name : ''}* 
I am *Mister NFT Bot*
Send me your *BEP20 address* and I will show you your *NFTs*
`;

    bot.sendMessage(msg.chat.id, text, {parse_mode: 'markdown'});
});

bot.onText(/^0x([\w\d]+)/, async (msg, match) => {
    const address = match.input;
    // 56 - Binance Smart Chain
    const chainId = 56;
    
    const getBalancesURL = `${host}/v1/${chainId}/address/${address}/balances_v2/?key=${covalentApiKey}&nft=true`;

    try {
        const res = await axios.get(getBalancesURL);

        const body = res.data;
            if (!body.error) {
                const tokens = body.data.items;
                const tokensNFTs = tokens.filter(token => token.type == 'nft');
                if (tokensNFTs.length) {
                    // Send title for our list of images
                    bot.sendMessage(msg.chat.id, '*Your NFTs:*', {parse_mode: 'markdown'});

                    for (token of tokensNFTs) {
                        // NFT is created on JGN-NFT
                        if (token.contract_name == 'JGNNFT') {
                            for (nft of token.nft_data) {
                                let caption = `*${nft.external_data.name}*`;
                                if (nft.external_data.description) {
                                    caption += `\n${nft.external_data.description}`
                                }
                                // Send photo with caption
                                bot.sendPhoto(msg.chat.id, nft.external_data.image, {
                                    caption: caption,
                                    parse_mode: 'markdown'
                                });
                            }
                        }
                        if (token.contract_name == 'AirNFTs') {
                            for (nft of token.nft_data) {
                                // Here we do not have image url in metadata
                                // Instead we have a link to json that contains it
                                const tokenDataResp = await axios.get(nft.token_url);

                                if (!tokenDataResp.error) {
                                    const tokenData = tokenDataResp.data;
                                    let caption = `*${tokenData.nft.name}*`;
                                    if (tokenData.nft.description) {
                                        caption += `\n${tokenData.nft.description}`
                                    }

                                    if (!tokenData.nft.image) {
                                        log.debug(tokenData.nft);
                                    }
                                    log.debug('Image url ' + tokenData.nft.image);
                                
                                    bot.sendPhoto(msg.chat.id, tokenData.nft.image, {
                                        caption: caption,
                                        parse_mode: 'markdown'
                                    });
                                } else {
                                    log.error(tokenDataResp.error);
                                }
                                
                            }
                            
                        }
                    }
                } else {
                    bot.sendMessage("You don't have any supported NFTs :(");
                }
            } else {
                bot.sendMessage(msg.chat.id, "Sorry, I can't get information for your address")
            }
    } catch (err) {
        log.error(err);
        bot.sendMessage(msg.chat.id, "Sorry, I can't get information for your address")
    }
})