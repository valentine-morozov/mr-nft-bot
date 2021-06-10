const log = require("loglevel");

class CommonNFT {
    isSupported(token) {
        return token.nft_data && token.nft_data.length && token.nft_data[0].external_data && token.nft_data[0].external_data.image;
    }

    async getPhotos(token) {
        const photos = [];
        for (const nft of token.nft_data) {
            if (nft.external_data) {
                photos.push({
                    image: nft.external_data.image,
                    name: nft.external_data.name,
                    description: nft.external_data.description,
                    contractName: token.contract_name
                });
            }
        }

        return photos;
    }
}

module.exports = { CommonNFT }