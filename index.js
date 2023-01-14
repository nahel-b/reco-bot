const { Client, GatewayIntentBits,AttachmentBuilder, EmbedBuilder } = require('discord.js');

const discord = require('discord.js');
const client = new Client({
	intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ]
});
const discordaudio = require('discordaudio');
require('ffmpeg-static');
const { joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
require('@discordjs/opus')
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    const channel = client.channels.cache.get(channelRecoId);
    if(channel) {
        channel.send('Je suis de retour les bewbews')
        .catch(console.error);
    }
   setTimeout(Inactivite, 1800000);
});
const spotify = require('./spotify.js');
const request = require('request');
const fs = require('fs');


const channelRecoId = '1061057749783425167'
let reco_stage = 0
let reco_asso = {}
let reco_choix = []
let reco_offset = 0
let last_demande = ""
let prop_offset = 0
let reco_tracks_prop = []
let spotifyToken = ''
let liked_track = []
let current_user = ''

async function main() {
  spotifyToken = await spotify.refresh_token();
  console.log(spotifyToken)
}
main();
console.log(spotifyToken)

async function envoie_prop(demande, offset, channel) {
  let res = await spotify.demande_id(spotifyToken, demande, offset);
  if (res === -1) {
    spotifyToken = await spotify.refresh_token();      
    res = await spotify.demande_id(spotifyToken, demande);
  }
  if (res === -1) {
    console.log("probleme requete");
    return;
  }
  for (let i = 0; i < res.length; i++) {
    let image_url = res[i]['album']['images'][2]['url'];
    let titre= res[i]['name'];
    let artiste = res[i]['artists'][0]['name'];
    
    const exampleEmbed = new EmbedBuilder()
      .addFields({ name: titre, value: artiste, inline: false })
      .setImage(image_url)
    const m = await channel.send({ embeds: [exampleEmbed] });
    reco_asso[res[i]['name']]=res[i]['id']
    await m.react("✅");
    if (i === res.length -1) {
      await m.react("\u{1F504}");
      await m.react("▶️");
    }
    //const e = await request.get({url: image_url, encoding: null}).body 
    //const attachment = new discord.MessageAttachment(e, 'image.png');
    //const m = await channel.send('Here is your image', attachment); 
    
  }
}

async function changeTracks() {
  let res = await spotify.change_tracks(spotifyToken, reco_choix, prop_offset);
  if (res === -1) {
    spotifyToken = await spotify.refresh_token();
    res = await spotify.change_tracks(spotifyToken, prop_offset);
  }
  if (res === -1) {
    console.log("Problem with the request");
    return;
  }
  prop_offset = prop_offset + 20;
  reco_tracks_prop = res;
}


const playTrack = async (prop, voice_channel,m) => {  
  if (voice_channel==null)
  {
    const channel = client.channels.cache.get(channelRecoId);
    if(channel) channel.send('Connecte-toi à un vocal débile');
    return
  }
  
  const { EmbedBuilder } = require('discord.js');
  const embed = new EmbedBuilder()
	 .setColor(0x0099FF)
	 .setTitle(prop['name'])
	 .setURL(prop['external_urls']['spotify'])
	 .setAuthor({ name: "A l'écoute...", iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
	 .setDescription(prop['artists'][0]['name'])
	 .setImage(prop['album']['images'][0]['url'])
	 //.setTimestamp()
	 //.setFooter({ text: 'Some footer text here', iconURL: 'https://i.imgur.com/AfFp7pu.png' });
  let m2 = null;
  if(m==null)
  {
    const c = client.channels.cache.get(channelRecoId);
    m2 = await c.send({ embeds: [embed] });
    await m2.react("⏭")
    await m2.react("❤️")
    await m2.react('✅')
  }
  else {
    m.edit({ embeds: [embed] });

  }
  if(prop['preview_url']!=null)
  {
  const { createReadStream } = require('fs');
  const { join } = require('path');
  const { createAudioResource, StreamType, createAudioPlayer, joinVoiceChannel } = require('@discordjs/voice');
  const player = createAudioPlayer()
  joinVoiceChannel({
    channelId: voice_channel.id,
    guildId: voice_channel.guild.id,
    adapterCreator: voice_channel.guild.voiceAdapterCreator
}).subscribe(player)
  const resource = createAudioResource(prop['preview_url'], {quality: 'highest', inlineVolume: true })
  player.play(resource)
  }
  else 
  {
    reco_tracks_prop.shift();
    if (reco_tracks_prop.length === 0) {
    await changeTracks();
    }
    if(m2!=null){
      await playTrack(reco_tracks_prop[0], voice_channel,m2);
    }
    else
    {
      await playTrack(reco_tracks_prop[0], voice_channel,m);
    }
    console.log('son passé')
  }
  
};

function Inactivite() {
    const channel = client.channels.cache.get(channelRecoId);
    channel.messages.fetch({ limit: 1 }).then(messages => {
        const mostRecentMessage = messages.first();
        const timeSinceLastMessage = Date.now() - mostRecentMessage.createdTimestamp;

              if (timeSinceLastMessage > 60000*15) {
            channel.send('Reinitialistion');
        }
    });
    setTimeout(Inactivite, 1800000);
}

 client.on("messageCreate", async (message) => {
   
  if (message.author.bot) return false; 
  if (message.content.endsWith("quoi")) {
        message.reply("feur");
    }
  if (message.content === 'reco' && message.channel.id === channelRecoId ) {
      await message.channel.bulkDelete(100)
      reco_stage = 1;
      reco_offset = 0;
      reco_asso = {}
      reco_choix = [];
      liked_track = []
      await message.channel.send("✅Donne moi des Titres de musique ou des artistes !🕺🕺");
  } else if (message.content.startsWith("stop") && reco_stage === 1) {
      message.channel.bulkDelete(100) 
      reco_stage = 0;
      reco_offset = 0;
      reco_asso = {}
      reco_choix = [];
  } else if (reco_stage === 1) {
      reco_offset = 0
      last_demande = message.content
      current_user = message.author.id
      await envoie_prop(message.content,0,message.channel);
      //console.log('hu' + reco_asso);
  }
  
    //play_audio('https://p.scdn.co/mp3-preview/3178061070eb09af499e125c866ec9f1bdb5b943?cid=0c78a05e835340c6999c6e41421325a9',message.member.voice.channel)




    
  
           
});

client.on('messageReactionAdd',async (reaction, user) => {
  if (user.bot) return;
  if (reaction.emoji.name === "✅" && reco_stage === 1 && reaction.message.author.bot) {
      reco_choix.push(reco_asso[reaction.message.embeds[0].fields[0].name]);
  } 
  else if (reaction.emoji.name === "\u{1F504}" && reco_stage === 1 && reaction.message.author.bot) {
      reco_offset += 3;
      await envoie_prop(last_demande, reco_offset, reaction.message.channel);
  } 
  else if (reaction.emoji.name === "▶️" && reco_stage === 1 && reaction.message.author.bot && Object.keys(reco_asso).length > 0) {
      if(reco_choix.length===0)
      {
        reaction.message.channel.send('❌ Choisit au moins une musique débilos ! ❌')
        reaction.users.remove(user)
      }
      else if(reaction.message.guild.members.cache.get(user.id).voice.channel == null)
      {
        reaction.message.channel.send('❌ Connecte toi à un vocal débilos ! ❌')
        reaction.users.remove(user)
      }
      else{
        prop_offset = 0;
        reco_stage = 2;
        reaction.message.channel.bulkDelete(100) 
        await changeTracks();
        playTrack(reco_tracks_prop[0],reaction.message.guild.members.cache.get(user.id).voice.channel,null);
      }
  } else if (reaction.emoji.name === "⏭" && reco_stage === 2 && reaction.message.author.bot) {
    //await reaction.message.channel.bulkDelete(1);
      reaction.users.remove(user)
      reaction.message.reactions.cache.forEach(r => {
        if(r.emoji.name === "❤️"){
            r.users.cache.forEach(u => {
                if (!u.bot) {
                    r.users.remove(u.id);
                }});}})
      reco_tracks_prop.shift();
      if (reco_tracks_prop.length === 0) {
        await changeTracks();
      }
      await playTrack(reco_tracks_prop[0], reaction.message.guild.members.cache.get(user.id).voice.channel,reaction.message);
}
  else if(reaction.emoji.name === "❤️" && reco_stage === 2 && reaction.message.author.bot)
  {
    
    liked_track.push(reco_tracks_prop[0])
  }
  else if (reaction.emoji.name === "✅" && reco_stage === 2 && reaction.message.author.bot)
  {
    const { getVoiceConnection } = require('@discordjs/voice');

    const connection = getVoiceConnection(reaction.message.channel.guild.id);
    connection.destroy();
    //const user = client.users.cache.get(current_user);
    //user.send('Voila les titres recommandés :');
     //for (let i = 0; i < liked_track.length; i++) 
     //{
     // user.send(liked_track[i]['name'] + ' - ' + liked_track[i]['artists'][0]['name']);
    // }
    const { EmbedBuilder } = require('discord.js');
    const embed = new EmbedBuilder()
	   .setColor(0x0099FF)
	   .setTitle('🎶🎤Recommandations :🎵🎧')
    
   
    liked_track.forEach(async item => {
      // let deezer_link = 'i'
      //const options = { url: `https://api.deezer.com/search?q=track:"${encodeURIComponent(item['name'])}"artist:"${encodeURIComponent(item['artists'][0]['name'])}"`,json: true};
  //  await request(options, async function (error, response, body) {
  //    if (error) { console.log(error);
  //} else {
  //    const trackId = body.data[0].id;
  //    deezer_link = `https://www.deezer.com/track/${trackId}`
  //    console.log('rtrt' + deezer_link)
//}})

      //---la
     // const options = { url: `https://api.deezer.com/search?q=track:"${encodeURIComponent(item['name'])}"artist:"${encodeURIComponent(item['artists'][0]['name'])}"`,json: true};
  //    const requestPromise = new Promise((resolve, reject) => {
    //request(options, function (error, response, body) {
      //  if (error) {
      //      console.log(error);
      //      reject(error);
      //  } else {
       //     const trackId = body.data[0].id;
       //     deezer_link = `https://www.deezer.com/track/${trackId}`;
       //     console.log('rtrt' + deezer_link);
        //    resolve();
    //    }
  //  });
//});

   //   await requestPromise;

   //   let spotify_link = item['external_urls']['spotify']
      // -- [deezer](${deezer_link})`
    //  console.log('jiji - ' + deezer_link)
          embed.addFields({name:item['name'] , value:item['artists'][0]['name']})


    //  embed.addFields({name:item['name'] + ' - ' + item['artists'][0]['name'], value:`[deezer](${deezer_link})`})
    });
    const user = client.users.cache.get(current_user);
	   user.send({ embeds: [embed] })
    await reaction.message.channel.bulkDelete(100)
    reco_stage = 1;
    reco_offset = 0;
    reco_asso = {}
    reco_choix = [];
    liked_track = []
    await reaction.message.channel.send("✅Donne moi des Titres de musique ou des artistes !🕺🕺");
  }
});


client.login(process.env.BotToken);
