const axios = require('axios');
const log = require('loglevel');
const { CommonNFT } = require('./common-nft');


class OpenStore extends CommonNFT {
    isSupported(token) {
        return token.contract_name === 'OpenSea Shared Storefront';
    }

    async getMediaList(token) {
        const photos = [];

        for (const nft of token.nft_data) {
            if (!nft.external_data) {
                continue;
            }

            try {
                // Opensea puts small image to "image" property so we need to fetch big image from API
                const tokenDataResp = await axios.get(nft.external_data.external_url);
                // Wait some time to avoid rate limit error (429)
                await new Promise(resolve => setTimeout(resolve, 100));

                if (!tokenDataResp.error) {
                    const tokenData = tokenDataResp.data;

                    photos.push({
                        image: tokenData.image_url,
                        mimeType: await this.getMediaType(tokenData.image_url),
                        name: nft.external_data.name,
                        description: nft.external_data.description,
                        contractName: token.contract_name
                    });

                } else {
                    log.error(tokenDataResp.error);
                }
            } catch (e) {
                log.error(e);
            }


        }

        return photos;
    }
}

module.exports = { OpenStore }