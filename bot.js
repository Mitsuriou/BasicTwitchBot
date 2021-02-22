// TODO: Fix these ESLINT issues:
/* eslint-disable promise/no-nesting */
/* eslint-disable promise/catch-or-return */
/* eslint-disable promise/always-return */

// Modules import
const tmi = require('tmi.js');
const https = require('https');

// Local files import
const IDENTIFIERS = require('./private_keys.js');

// Define configuration options
const options = {
  connection: {
    reconnect: true,
  },
  identity: {
    username: IDENTIFIERS.BOT_USERNAME,
    password: IDENTIFIERS.BOT_PASSWORD,
  },
  channels: ['agrouugrouu'],
};

// Create a client
const client = new tmi.client(options);

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

// Start follow messages routine
startFollowRoutine();

/**
 * Called every time a message comes in
 * @param {*} target
 * @param {*} context
 * @param {String} msg
 * @param {Boolean} self
 */
function onMessageHandler(target, context, msg, self) {
  if (self) {
    return;
  } // Ignore messages from the bot

  // Remove whitespace from chat message
  const commandName = msg.trim();

  if (target === '#agrouugrouu') {
    // If the command is known, let's execute it
    if (commandName === '!follow' || commandName === '!suivre') {
      client.say(target, getFollowMessage());
    } else if (commandName === '!grou') {
      client.say(target, 'AGROUUUGROUUU !');
    } else if (commandName === '!dons' || commandName === '!don' || commandName === '!donner' || commandName === '!soutenir') {
      client.say(target, 'Si vous voulez soutenir mon stream, vous pouvez me faire un petit don ici VoHiYo  : https://streamlabs.com/agrouugrouu');
    } else if (commandName === '!twitter') {
      client.say(target, 'Pour toujours plus de chocolats, suivez moi sur mon twitter CoolCat  : https://twitter.com/MaevaMedecin');
    } else if (commandName === '!discord') {
      client.say(target, 'Rejoignez moi sur mon discord : https://discord.gg/y3eCHJQ');
    } else if (commandName === '!lol' || commandName === '!elo' || commandName === '!rank' || commandName === '!opgg' || commandName === '!league') {
      let summonerId = null;
      let summonerLevel = null;

      lolGetSummonerId().then((data) => {
        summonerId = data.id;
        summonerLevel = data.summonerLevel;

        let championMasteryLevel = null;
        lolGetTotalLevelMastery(summonerId).then((data) => {
          championMasteryLevel = data;

          let championMasteryRanks = null;
          lolGetChampionMasteryRanks(summonerId).then((data) => {
            championMasteryRanks = data;

            let numberOfChampionsToFetch = 3;
            let biggestMasteries = [];

            for (let i = 0; i < numberOfChampionsToFetch; i++) {
              biggestMasteries.push([championMasteryRanks[i]['championId'], championMasteryRanks[i]['championPoints']]);
            }

            lolGetChampionNameByChampionId(biggestMasteries).then((biggestMasteriesChampionsNames) => {
              let biggestMasteriesString = '';

              for (let i = 0; i < biggestMasteriesChampionsNames.length; i++) {
                biggestMasteriesString += biggestMasteriesChampionsNames[i];
                biggestMasteriesString += ' (';
                biggestMasteriesString += biggestMasteries[i][1];
                biggestMasteriesString += ') ';
              }

              lolGetRankedInformations(summonerId).then((data) => {
                if (data.length > 0) {
                  let highestRankedDivision = data[0].tier + ' ' + data[0].rank + ' ' + data[0].leaguePoints + ' LP ';
                  client.say(
                    target,
                    'Agrouugrouu [ Niv. ' +
                      summonerLevel +
                      ', ' +
                      highestRankedDivision +
                      '] - Total maît. champ. : ' +
                      championMasteryLevel +
                      ' - Les plus maît. : ' +
                      biggestMasteriesString +
                      '- OPGG : https://euw.op.gg/summoner/userName=Agrouugrouu'
                  );
                } else {
                  client.say(
                    target,
                    'Agrouugrouu [ Niv. ' +
                      summonerLevel +
                      ', Non classée] - Total maît. champ. : ' +
                      championMasteryLevel +
                      ' - Les plus maît. : ' +
                      biggestMasteriesString +
                      '- OPGG : https://euw.op.gg/summoner/userName=Agrouugrouu'
                  );
                }
              });
            });
          });
        });
      });
    } else if (commandName === '!help') {
      client.say(
        target,
        "Bienvenue dans l'aide. Voici la liste des commandes disponibles : !follow, !suivre | !grou | !don, !dons, !donner, !soutenir | !twitter | !discord | !lol, !elo, !rank, !opgg, !league. Les commandes listées à la suite et non séparées par des barres obliques sont des alias ;)"
      );
    } else if (commandName.startsWith('!') && commandName.length > 1) {
      client.say(target, "Un ! a été détecté mais la commande demandée n'existe pas. Tapez !help pour afficher l'aide.");
    }
  }
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler(addr, port) {
  const date = new Date();
  const hour = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  console.log(`-- Connected to ${addr}:${port} --`);
  console.log('-- It is curently ' + hour + 'h ' + minutes + 'm ' + seconds + 's --');
}

/**
 * Called when !start command is executed
 * It posts a follow message every 5 minutes
 */
function startFollowRoutine() {
  setInterval(() => {
    client.say('agrouugrouu', getFollowMessage());
  }, getMillisFromMinutes(30));
}

/**
 * Returns the "follow" message
 * @returns {String}
 */
function getFollowMessage() {
  return "N'hésitez pas à follow ma chaîne VoHiYo <3";
}

/**
 * Returns the converted time from minutes to milliseconds
 * @param {Number} minutes The time in minutes to be converted
 * @returns {Number}
 */
function getMillisFromMinutes(minutes) {
  return minutes * 60 * 1000;
}

/**
 *
 */
function lolGetSummonerId() {
  return new Promise((resolve) => {
    https
      .get('https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/Agrouugrouu?api_key=' + IDENTIFIERS.RIOT_GAMES_API_KEY, (resp) => {
        let data = '';

        resp.on('data', (chunk) => {
          data = JSON.parse(chunk);
        });

        resp.on('end', () => {
          resolve(data);
        });
      })
      .on('error', (err) => {
        console.log('Error: ' + err.message);
      });
  });
}

/**
 *
 * @param {*} pSummonerId
 */
function lolGetTotalLevelMastery(pSummonerId) {
  return new Promise((resolve) => {
    https
      .get(
        'https://euw1.api.riotgames.com/lol/champion-mastery/v4/scores/by-summoner/' + pSummonerId + '?api_key=' + IDENTIFIERS.RIOT_GAMES_API_KEY,
        (resp) => {
          let data = '';

          resp.on('data', (chunk) => {
            data = chunk;
          });

          resp.on('end', () => {
            resolve(data);
          });
        }
      )
      .on('error', (err) => {
        console.log('Error: ' + err.message);
      });
  });
}

/**
 *
 * @param {*} pSummonerId
 */
function lolGetChampionMasteryRanks(pSummonerId) {
  return new Promise((resolve) => {
    https
      .get(
        'https://euw1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/' + pSummonerId + '?api_key=' + IDENTIFIERS.RIOT_GAMES_API_KEY,
        (resp) => {
          let data = '';

          resp.on('data', (chunk) => {
            data += chunk;
          });

          resp.on('end', () => {
            resolve(JSON.parse(data));
          });
        }
      )
      .on('error', (err) => {
        console.log('Error: ' + err.message);
      });
  });
}

/**
 *
 * @param {Array} pChampionIds
 */
function lolGetChampionNameByChampionId(pChampionIds) {
  return new Promise((resolve) => {
    https
      .get('https://ddragon.leagueoflegends.com/cdn/9.3.1/data/fr_FR/champion.json', (resp) => {
        let data = '';

        resp.on('data', (chunk) => {
          data += chunk;
        });

        resp.on('end', () => {
          const jsonData = JSON.parse(data);
          // TODO : change this for a cleaner code :
          let championsNames = ['', '', ''];

          Object.keys(jsonData.data).forEach((champion) => {
            for (let i = 0; i < pChampionIds.length; i++) {
              if (parseInt(jsonData.data[champion].key) == pChampionIds[i][0]) {
                championsNames[i] = jsonData.data[champion].name;
              }
            }
          });

          resolve(championsNames);
        });
      })
      .on('error', (err) => {
        console.log('Error: ' + err.message);
      });
  });
}

/**
 *
 * @param {*} pSummonerId
 */
function lolGetRankedInformations(pSummonerId) {
  return new Promise((resolve) => {
    https
      .get('https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/' + pSummonerId + '?api_key=' + IDENTIFIERS.RIOT_GAMES_API_KEY, (resp) => {
        let data = '';

        resp.on('data', (chunk) => {
          data += chunk;
        });

        resp.on('end', () => {
          resolve(JSON.parse(data));
        });
      })
      .on('error', (err) => {
        console.log('Error: ' + err.message);
      });
  });
}
