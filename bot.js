const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const telegramToken = '1733621272:AAEwqYpCYYhZEYQkh4IrGLgM-vuAz9X_sMg';
const covalentApiKey = 'ckey_dd18b4e15a8e42ccbeee39754d3';

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

bot.onText(/^0x([\w\d]+)/, (msg, match) => {
    const address = match.input;
    const networkId = 56;
    
    const url = `https://api.covalenthq.com/v1/${networkId}/address/${address}/balances_v2/?key=${covalentApiKey}&nft=true`

    axios.get(url)
        .then(res => {
            const body = res.data;
            if (!body.error) {
                const tokens = body.data.items;
                const nfts = tokens.filter(token => token.type == 'nft');
                console.log(nfts);
            } else {
                bot.sendMessage(msg.chat.id, "Sorry, I can't get information for your address")
            }
        })
        .catch(err => {
            console.log('Error: ', err.message);
        });
})