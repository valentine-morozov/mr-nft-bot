const { AirNFTs } = require('./contracts/airnfts');
const { OpenStore } = require('./contracts/openstore');
const { CommonNFT } = require('./contracts/common-nft');
const axios = require('axios');
const { SUPPORTED_CHAINS, CHAINS_TITLES } = require('./chains');

class MediaFetcher {
    constructor(host, covalentApiKey, log) {
        this.contracts = [new AirNFTs(log), new OpenStore(log), new CommonNFT(log)];
        this.host = host;
        this.covalentApiKey = covalentApiKey;
    }

    async getMediaList(address) {
        const mediaList = {
            'photo': [], 
            'animation': []
        };

        for (const chainId of SUPPORTED_CHAINS) {
            const getBalancesURL = `${this.host}/v1/${chainId}/address/${address}/balances_v2/?key=${this.covalentApiKey}&nft=true`;
            const res = await axios.get(getBalancesURL);

            const body = res.data;
            if (!body.error) {
                const tokens = body.data.items;
                const tokensNFTs = tokens.filter(token => token.type == 'nft');
                // log.debug(tokensNFTs);
                if (tokensNFTs.length) {
                    for (const token of tokensNFTs) {
                        // log.debug(token);
                        for (const contract of this.contracts) {
                            if (contract.isSupported(token)) {
                                console.log(token, contract);
                                const contractMediaList = await contract.getMediaList(token);
                                contractMediaList.forEach(photo => {
                                    photo.chainId = CHAINS_TITLES[chainId];
                                    if (this.isPhoto(photo.mimeType)) {
                                        mediaList['photo'].push(photo);
                                    } else if (this.isAnimation(photo.mimeType)) {
                                        mediaList['animation'].push(photo);
                                    }
                                });

                                break;
                            }
                        }
                    }
                }
            }
        }

        return mediaList;
    }

    isPhoto(mimeType) {
        const photoMimeTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/svg'];
        return photoMimeTypes.indexOf(mimeType) !== -1;
    }

    isAnimation(mimeType) {
        const photoMimeTypes = ['image/gif'];
        return photoMimeTypes.indexOf(mimeType) !== -1;
    }
}

module.exports = { MediaFetcher }
