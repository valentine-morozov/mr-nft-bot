const axios = require('axios');
const log = require('loglevel');
const { CommonNFT } = require('./common-nft');

class AirNFTs extends CommonNFT
{
    isSupported(token) {
        return token.contract_name === 'AirNFTs';
    }

    async getPhotos(token) {
        const photos = [];

        for (const nft of token.nft_data) {
            // Here we do not have image url in metadata
            // Instead we have a link to json that contains it
            const tokenDataResp = await axios.get(nft.token_url);

            if (!tokenDataResp.error) {
                const tokenData = tokenDataResp.data;

                photos.push({
                    image: tokenData.nft.image,
                    name: tokenData.nft.name,
                    description: tokenData.nft.description,
                    contractName: token.contract_name
                });
            } else {
                log.error(tokenDataResp.error);
            }
        }

        return photos;
    }
}

module.exports = { AirNFTs }