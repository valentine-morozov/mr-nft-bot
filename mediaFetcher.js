const { AirNFTs } = require('./contracts/airnfts');
const { OpenStore } = require('./contracts/openstore');
const { CommonNFT } = require('./contracts/common-nft');
const axios = require('axios');
const log = require('loglevel');
const { SUPPORTED_CHAINS, CHAINS_TITLES } = require('./chains');

class MediaFetcher {
    constructor(host, covalentApiKey) {
        this.contracts = [new AirNFTs, new OpenStore, new CommonNFT];
        this.host = host;
        this.covalentApiKey = covalentApiKey;
    }

    async getPhotos(address) {
        const photos = [];

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
                                const contractPhotos = await contract.getPhotos(token);
                                contractPhotos.forEach(photo => photo.chainId = CHAINS_TITLES[chainId]);
                                photos.push(...contractPhotos);
                                break;
                            }
                        }
                    }
                }
            }
        }

        return photos;
    }
}

module.exports = { MediaFetcher }
