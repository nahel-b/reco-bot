const request = require('request');
const base64 = require('base64-js');
const os = require('os');

const SpotifyClientId = process.env.SpotifyClientId;
const SpotifyClientSecret = process.env.SpotifyClientSecret;


const { Buffer } = require('buffer');

async function refresh_token() {
  return new Promise((resolve, reject) => {
    const url = 'https://accounts.spotify.com/api/token';
    const headers = {};
    const data = {};

    const message = `${SpotifyClientId}:${SpotifyClientSecret}`;
    const messageBytes = Buffer.from(message);
    const base64Bytes = messageBytes.toString('base64');

    headers.Authorization = `Basic ${base64Bytes}`;
    data.grant_type = 'client_credentials';

    request.post({ url, headers, form: data }, (error, response, body) => {
      if (response.statusCode === 200) {
        const jsonBody = JSON.parse(body);
        resolve(jsonBody.access_token);
      } else {
        reject(error);
      }
    });
  });
};

async function demande_id (access_token, query, offset) {
    return new Promise((resolve, reject) => {
        const params = { q: query, type: 'track', market: 'FR', limit: 3, offset };
        const headers = {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
        };

        request.get({ url: 'https://api.spotify.com/v1/search', qs: params, headers }, (error, response, body) => {
            if (response.statusCode === 200) {
                const searchData = JSON.parse(body);
                resolve(searchData.tracks.items);
            } else {
                reject(-1);
            }
        });
    });
};

async function change_tracks(access_token, tracks_reco, offset) {
  return new Promise((resolve, reject) => {
    const params = { seed_tracks: tracks_reco.join(','), limit: 20, market: 'FR', offset };
    const headers = {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    };

    request.get({ url: 'https://api.spotify.com/v1/recommendations', qs: params, headers }, (error, response, body) => {
      if (response.statusCode === 200) {
        const jsonBody = JSON.parse(body);
        resolve(jsonBody.tracks);
      } else {
        console.log(`Error in search: ${response.statusCode}`);
        reject(-1);
      }
    });
  });
};


module.exports = { refresh_token, demande_id,change_tracks};

//async function main() {
  //try {
   // const token = await getSpotifyToken();
    //console.log(token)
   // const r = await demande_id(token,"flume",0)
   //// console.log(r)
   // console.log(await change_tracks(token,["5è§"],0));
  //} catch (error) {
  //  console.log(error);
//  }
//}

//main();

