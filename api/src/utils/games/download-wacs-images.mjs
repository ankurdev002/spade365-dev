// this script fetches https://pi.njoybingo.com/v2/publisher/games/fancybet and saves game.image?.url to disk with name game.code
// cd to api folder and run `node src/utils/games/download-wacs-images.mjs`

import fs from 'fs';
import path from 'path';
import axios from 'axios';

const games = await axios.get('https://pi.njoybingo.com/v2/publisher/games/fancybet').then(({ data }) => data);

const __dirname = path.resolve();

const download = async (url, provider, filename) => {
    try {
        // if image exists then return
        if (fs.existsSync(path.join(__dirname, `../../../../frontend/public/img/wacs/${provider}/${filename}.jpg`))) return;

        // download the image and save to disk
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        }).then(function (response) {
            const pathToSave = `${__dirname}/../../../../frontend/public/img/wacs/${provider}`;
            if (!fs.existsSync(pathToSave)) fs.mkdirSync(pathToSave);// if path doesnt exist, create it
            response.data.pipe(fs.createWriteStream(path.join(__dirname, `../../../../frontend/public/img/wacs/${provider}/${filename}.jpg`)));
        });
    } catch (error) {
        console.log(error);
    }
}

const downloadAll = async () => {
    try {
        const providers = games.providers;
        for (const provider of providers) {
            if (provider.games?.length > 0) {
                for (const game of provider.games) {
                    if (!game.name || !game.code || game.code.includes('DISABLED') || game.code.includes('DISBALED')) continue;
                    console.log(game.code);
                    if (game.image?.url) {
                        await download(game.image.url, provider.name, game.code);
                    }
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}

downloadAll();