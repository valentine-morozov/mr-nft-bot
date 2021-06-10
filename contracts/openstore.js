const axios = require('axios');
const log = require('loglevel');
const { CommonNFT } = require('./common-nft');

class OpenStore extends CommonNFT
{
    isSupported(token) {
        return token.contract_name === 'OpenSea Shared Storefront';
    }

    async getPhotos(token) {
        const photos = [];

        for (const nft of token.nft_data) {
            if (!nft.external_data) {
                continue;
            }
            // TODO Add delay to avoid 429
            // Opensea puts small image to "image" property so we need to fetch big image from API
            const tokenDataResp = await axios.get(nft.external_data.external_url);

            if (!tokenDataResp.error) {
                const tokenData = tokenDataResp.data;

                photos.push({
                    image: tokenData.image_url,
                    name: nft.external_data.name,
                    description: nft.external_data.description,
                    contractName: token.contract_name
                });
            } else {
                log.error(tokenDataResp.error);
            }
        }

        return photos;
    }
}

module.exports = { OpenStore }