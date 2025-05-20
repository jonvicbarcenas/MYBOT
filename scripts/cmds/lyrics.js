const axios = require("axios");

module.exports = {
 config: {
 name: "ly",
 aliases: ["lyrics", "lyric"],
 version: "1.2",
 author: "rulex-al/loufi (fixed by JVSanecrab)",
 countDown: 5,
 role: 0,
 shortDescription: {
 en: "Get lyrics for a song",
 },
 longDescription: {
 en: "This command allows you to get the lyrics for a song. Usage: !lyrics <song name>",
 },
 category: "media",
 guide: {
 en: "{prefix}lyrics <song name> or {prefix}lyrics <artist> - <song>",
 },
 },

 onStart: async function ({ api, event, args, message }) {
 const songName = args.join(" ");
 if (!songName) {
   return message.reply("Please provide a song name!");
 }

 let artist, title;
 if (songName.includes(" - ")) {
   [artist, title] = songName.split(" - ").map(item => item.trim());
 } else {
   title = songName;
 }

 message.reply(`🔎 Searching for lyrics of "${songName}"...`);

 try {
   let lyrics;
   let songInfo = {};
   
   // Try Genius-like API first (no API key required)
   try {
     const response = await axios.get(`https://genius-song-lyrics1.p.rapidapi.com/search?q=${encodeURIComponent(songName)}&per_page=1&page=1`, {
       headers: {
         'X-RapidAPI-Host': 'genius-song-lyrics1.p.rapidapi.com',
         'X-RapidAPI-Key': '6ccad37171msh867fe22a9eb8a82p1e0596jsneda5889e292a'
       }
     });
     
     if (response.data && response.data.hits && response.data.hits.length > 0) {
       const songId = response.data.hits[0].result.id;
       songInfo = {
         title: response.data.hits[0].result.title,
         artist: response.data.hits[0].result.primary_artist.name,
         image: response.data.hits[0].result.song_art_image_thumbnail_url
       };
       
       const lyricsResponse = await axios.get(`https://genius-song-lyrics1.p.rapidapi.com/song/lyrics/?id=${songId}`, {
         headers: {
           'X-RapidAPI-Host': 'genius-song-lyrics1.p.rapidapi.com',
           'X-RapidAPI-Key': '6ccad37171msh867fe22a9eb8a82p1e0596jsneda5889e292a'
         }
       });
       
       if (lyricsResponse.data && lyricsResponse.data.lyrics && lyricsResponse.data.lyrics.lyrics.body) {
         lyrics = lyricsResponse.data.lyrics.lyrics.body.html.replace(/<[^>]*>/g, '');
       }
     }
   } catch (firstApiError) {
     console.log("First API failed, trying second API");
   }

   // If first API fails, try modern lyrics API
   if (!lyrics) {
     try {
       const response = await axios.get(`https://api.textyl.co/api/lyrics?q=${encodeURIComponent(songName)}`);
       if (response.data && response.data.lyrics) {
         lyrics = response.data.lyrics;
         songInfo = {
           title: response.data.title,
           artist: response.data.artist
         };
       }
     } catch (secondApiError) {
       console.log("Second API failed, trying third API");
     }
   }

   // If second API fails, try another API
   if (!lyrics) {
     try {
       const apiUrl = artist && title
         ? `https://lrclib.net/api/search?q=${encodeURIComponent(`${artist} ${title}`)}`
         : `https://lrclib.net/api/search?q=${encodeURIComponent(songName)}`;
         
       const response = await axios.get(apiUrl);
       
       if (response.data && response.data.length > 0) {
         const songData = response.data[0];
         const lyricsResponse = await axios.get(`https://lrclib.net/api/get/${songData.id}`);
         
         if (lyricsResponse.data && lyricsResponse.data.plainLyrics) {
           lyrics = lyricsResponse.data.plainLyrics;
           songInfo = {
             title: songData.name,
             artist: songData.artist
           };
         }
       }
     } catch (thirdApiError) {
       console.log("Third API failed");
     }
   }

   if (!lyrics) {
     return message.reply("Sorry, lyrics not found for this song! Try specifying both artist and song name (e.g., 'Artist - Song')");
   }

   // Format the song info header
   let songHeader = "";
   if (songInfo.title && songInfo.artist) {
     songHeader = `🎵 ${songInfo.title} by ${songInfo.artist}\n\n`;
   } else {
     songHeader = `🎵 Lyrics for "${songName}":\n\n`;
   }

   // Split lyrics into chunks if too long (Messenger has a character limit)
   const maxLength = 5000;
   if ((songHeader + lyrics).length <= maxLength) {
     message.reply(songHeader + lyrics);
   } else {
     const chunks = [];
     let start = 0;
     
     while (start < lyrics.length) {
       // Find a good breaking point (newline) near the max length
       let end = start + maxLength;
       if (end < lyrics.length) {
         // Look for the last newline before the limit
         const lastNewline = lyrics.lastIndexOf('\n', end);
         if (lastNewline > start) {
           end = lastNewline;
         }
       } else {
         end = lyrics.length;
       }
       
       chunks.push(lyrics.substring(start, end));
       start = end + 1;
     }
     
     // Send the first chunk with song info
     message.reply(`${songHeader}${chunks[0]}`);
     
     // Send remaining chunks with a delay
     for (let i = 1; i < chunks.length; i++) {
       setTimeout(() => {
         message.reply(`🎵 Part ${i+1}/${chunks.length}:\n\n${chunks[i]}`);
       }, i * 2500);
     }
   }
 } catch (error) {
   console.error(error);
   message.reply("Sorry, there was an error getting the lyrics. Please try again later.");
 }
 },
};
