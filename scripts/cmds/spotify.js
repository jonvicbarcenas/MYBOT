
const {createCanvas, registerFont, loadImage, Image} = require("canvas")
var sizeOf = require('buffer-image-size');

const fs = require("fs")
const axios = require("axios")
var rgbcolor = require('rgb-color');


module.exports = {
	config: {
		name: "spotify",
		version: "1.1",
		author: "NIB",
		countDown: 5,
		role: 0,
		shortDescription: {
			vi: "",
			en: ""
		},
		longDescription: {
			vi: "",
			en: ""
		},
		category: "utility",
		guide : {
      en: "{pn} <id> | <name> | <color(optional)>"
},
		
	},

onStart: async function ({ event, message, getLang, usersData, api, args}) {
if ((event.type == "message_reply") && (event.messageReply.attachments.length > 0) && (event.messageReply.attachments[0].type == "photo")) {

  if(args.length == 0) return message.reply("add something to write baka")

let arr = args.join(" ").split("|")
  if(arr.length<2) return message.send("Wrong Syntax")
  
  try{
   // let txt = args.join(" ")
         let ig = (await axios.get(encodeURI(
            event.messageReply.attachments[0].url), { responseType: "arraybuffer" })
    ).data;
    let logoo = (await axios.get(encodeURI(
         "https://i.ibb.co/khkcTBw/20221213-161950.png"), { responseType: "arraybuffer" })
    ).data;
   

var dmns = sizeOf(ig);
    await registerFont(`Ador.ttf`, {
            family: "Abcd"
        });
  let c = await createCanvas(dmns.width, dmns.height)
  let ctx = c.getContext("2d")
  ctx.imageSmoothingEnabled = false;
 ctx.patternQuality = 'best';
ctx.antialias = 'default';
ctx.filter = 'default';

let pg = await loadImage(ig)
//let logo = await loadImage(logoo)
ctx.drawImage(pg, 0, 0)
let bal = rgbcolor(arr[2])
    let rgb;
    if(bal.isValid()){
      var obj = bal.channels();
    rgb = {fst: 'rgba(' + obj.r + ', ' + obj.g + ', ' + obj.b + ', 1)', snd: 'rgba(' + obj.r + ', ' + obj.g + ', ' + obj.b + ', 0.6)', trd: 'rgba(' + obj.r + ', ' + obj.g + ', ' + obj.b + ', 0.2)', frt: 'rgba(' + obj.r + ', ' + obj.g + ', ' + obj.b + ', 0)'}
   
    } else{
    
   rgb =await getAverageRGB(ig)
    }
    
var grd = ctx.createLinearGradient(0, c.height, 0, c.height/2.6);
 //   console.log(rgb)
grd.addColorStop(0.2, rgb.fst);
grd.addColorStop(0.6, rgb.snd);
    grd.addColorStop(0.9, rgb.trd);
grd.addColorStop(1, rgb.frt);

    let tclr = getTextColor(rgb.fst)
ctx.fillStyle = grd;
ctx.fillRect(0, 0, c.width, c.height);
let imgg = await loadImage("spotify.png");
  
let cnv = await createCanvas(imgg.width, imgg.height)
  let ctxx = cnv.getContext("2d")
    ctxx.drawImage(imgg, 0, 0)
    var myImg =ctxx.getImageData(0, 0, cnv.width, cnv.height);

    if(tclr == "white"){
    
for (var t=0;t< myImg.data.length;t+=4) {        
  if(myImg.data[t+1] == 0) {myImg.data[t+2] = 255
  myImg.data[t+1] = 255
    myImg.data[t] = 255}
 // let haha ={ hal:myImg.data[t], bal: myImg.data[t+1], sal:myImg.data[t+2], dal:myImg.data[t+3]}
  //console.log("bal")
}
    ctxx.putImageData(myImg,0,0)
    }
  ctxx.fillStyle = tclr
  
  ctxx.textBaseline = "top"
  ctxx.font = "550px Abcd"
  ctxx.fillText(arr[0], 0, 1200)
  ctxx.font = "400px Abcd"
  ctxx.fillText(arr[1], 0, 1900)
 ctx.drawImage(cnv, c.width/6.53, c.height-(((c.width/1.18)-(c.width/6.53))*0.76)-10, ((c.width/1.18)-(c.width/6.53)), ((c.width/1.18)-(c.width/6.53))*0.76)
  


//let bg = await loadImage("bg.png")

  
    
     const imgBuffer = c.toBuffer('image/png') 
  


  await fs.writeFileSync(__dirname + "/tmp/spotify.png", imgBuffer)
 // fs.writeFileSync('asd.png', imgBuffer)
message.reply({attachment:fs.createReadStream(__dirname + "/tmp/spotify.png")})
   
  }catch(e){console.log(e)}
} else{
  message.reply("only reply to photos")
}
}
};



   async function getAverageRGB(imgEl) {

      var blockSize = 5, // only visit every 5 pixels
        defaultRGB = {
          r: 255,
          g: 0,
          b: 0
        } // for non-supporting envs
     let drgb = {fst:'rgba(' + defaultRGB.r + ',' + defaultRGB.g + ',' + defaultRGB.b + ', 1)',snd:'rgba(' + defaultRGB.r + ',' + defaultRGB.g + ',' + defaultRGB.b + ', 0.6)',trd:'rgba(' + defaultRGB.r + ',' + defaultRGB.g + ',' + defaultRGB.b + ', 0.2)',frt:'rgba(' + defaultRGB.r + ',' + defaultRGB.g + ',' + defaultRGB.b + ', 0)'}
        var dmns = sizeOf(imgEl);
    
  let canvas = await createCanvas(dmns.width, dmns.height)
        var context = canvas.getContext && canvas.getContext('2d'),
        data, width, height,
        i = -4,
        length,
        rgb = {
          r: 0,
          g: 0,
          b: 0
        },
        count = 0;

      if (!context) {
        console.log("bal")
        return drgb;
      }

      height = canvas.height //= imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
      width = canvas.width //imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;
let pg = await loadImage(imgEl)
      context.drawImage(pg, 0, 0);

      try {
        data = context.getImageData(0, 0, width, height);
      } catch (e) {
        /* security error, img on diff domain */
      //  alert('x');
        console.log(e)
        return drgb;
      }

      length = data.data.length;

      while ((i += blockSize * 4) < length) {
        ++count;
        rgb.r += data.data[i];
        rgb.g += data.data[i + 1];
        rgb.b += data.data[i + 2];
      }

      // ~~ used to floor values
      rgb.r = ~~(rgb.r / count);
      rgb.g = ~~(rgb.g / count);
      rgb.b = ~~(rgb.b / count);
let rrgb = {fst:'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ', 1)',snd:'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ', 0.6)',trd:'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ', 0.2)',frt:'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ', 0)'}
     
      return rrgb;

    }


  function getTextColor(rgb){
  rgb = rgb.match(/\d+/g);
  if((rgb[0]*0.299)+(rgb[1]*0.587)+(rgb[2]*0.114)>186) {
    return 'black';
  } else {
    return 'white';
  }
}