const log = require("loglevel");
const axios = require('axios');

class CommonNFT {
    isSupported(token) {
        return token.nft_data && token.nft_data.length && token.nft_data[0].external_data && token.nft_data[0].external_data.image;
    }

    async getMediaList(token) {
        const photos = [];
        for (const nft of token.nft_data) {
            try {
                if (nft.external_data) {
                    photos.push({
                        image: nft.external_data.image,
                        mimeType: await this.getMediaType(nft.external_data.image),
                        name: nft.external_data.name,
                        description: nft.external_data.description,
                        contractName: token.contract_name
                    });
                }
            } catch (e) {
                log.error(e);
            }            
        }

        return photos;
    }

    async getMediaType(url) {
        if (url.match(/.jpg$/)) {
            return 'image/jpg';
        } else if (url.match(/.jpeg$/)) {
            return 'image/jpeg';
        } else if (url.match(/.png$/)) {
            return 'image/png';
        } else if (url.match(/.gif$/)) {
            return 'image/gif';
        }
        log.debug('Fetch media content-type for ' + url);
        const imageResp = await axios({method: 'head', url: url});
        log.debug('Content type is ' + imageResp.headers['content-type']);
        return imageResp.headers['content-type'];
    }
}

module.exports = { CommonNFT }