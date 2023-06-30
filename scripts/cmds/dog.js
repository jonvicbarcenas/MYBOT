const axios = require('axios');

const dogFacts = [
  "Dogs have an exceptional sense of smell and can detect certain diseases like cancer and diabetes.",
  "The world's smallest dog breed is the Chihuahua, while the tallest is the Irish Wolfhound.",
  "Dogs communicate using a combination of vocalizations, body language, and facial expressions.",
  "A dog's nose print is unique, similar to a human's fingerprint.",
  "The average lifespan of a dog varies depending on the breed, but it typically ranges from 10 to 13 years.",
  "Dogs have a highly developed sense of hearing and can hear sounds at frequencies four times higher than what humans can detect.",
  "The fastest dog breed is the Greyhound, which can reach speeds of up to 45 miles per hour (72 kilometers per hour).",
  "Dogs sweat through their paws and regulate body temperature primarily by panting.",
  "The oldest known dog lived to be 29 years and 5 months old.",
  "Dogs have three eyelids: an upper lid, a lower lid, and a third lid called the haw, which helps protect their eyes.",
  "The world record for the loudest bark by a dog is 113.1 decibels, which is louder than a chainsaw.",
  "Dogs have a specialized sense called 'vomeronasal organ' or 'Jacobson's organ,' which allows them to detect pheromones and analyze scents.",
  "Dogs have about 1,700 taste buds, while humans have around 9,000.",
  "Labrador Retrievers have been the most popular dog breed in the United States for several years.",
  "Dogs are highly social animals and form strong bonds with their human families and other animals.",
  "The term 'dog days' refers to the hottest days of summer, traditionally associated with the period when Sirius, the 'Dog Star,' rises at the same time as the sun.",
  "Dogs have been trained to perform various tasks, including search and rescue, therapy work, herding, and assistance for people with disabilities.",
  "Dogs have more than a dozen muscles that control their ears, allowing them to move and rotate them to better locate the source of a sound.",
  "Dalmatians are born completely white and develop their spots as they grow.",
  "The Newfoundland breed has webbed feet, which makes them excellent swimmers.",
  "Dogs have a sense of time and can distinguish between different durations, especially when it's close to their regular feeding or walking times.",
  "The dog's tail serves as an extension of their spine and helps them with balance and communication.",
  "Some dog breeds, like the Siberian Husky and the Alaskan Malamute, have a thick double coat that keeps them well-insulated in cold weather.",
  "The breed known as the 'Akita' originated in Japan and is considered a national treasure.",
  "The scent receptors in a dog's nose are estimated to be about 10,000 times more powerful than those of humans.",
  "Dogs have a natural instinct for digging, which can be traced back to their ancestors who dug dens for shelter and hunting.",
  "The Afghan Hound is one of the oldest dog breeds in existence, dating back thousands of years.",
  "Dogs can detect changes in the Earth's magnetic field and may use it as a navigational aid.",
  "Dogs have a unique gland called the 'scent gland' or 'supracaudal gland' located on the base of their tail, which releases a distinct odor that is individual to each dog.",
  "The Basenji dog breed is known as the 'barkless dog' because it produces unusual yodel-like sounds instead of barking.",
  "Dogs have been bred for various purposes, such as herding, hunting, guarding, and companionship, resulting in the wide range of breeds we have today."
];

module.exports = {
  config: {
    name: 'dog',
    aliases: ['dogfact'],
    version: '1.1',
    author: 'JV Barcenas',
    role: 0,
    category: 'utility',
    shortDescription: {
      en: 'Sends a random dog image with a fact.'
    },
    longDescription: {
      en: 'Sends a random dog image along with an interesting dog fact.'
    },
    guide: {
      en: '{pn}'
    }
  },
  onStart: async function ({ api, event }) {
    try {
      const imageResponse = await axios.get('https://dog.ceo/api/breeds/image/random');

      if (imageResponse.status !== 200 || !imageResponse.data || !imageResponse.data.message) {
        throw new Error('Invalid or missing response from dogAPI');
      }

      const imageURL = imageResponse.data.message;
      const randomFactIndex = Math.floor(Math.random() * dogFacts.length);
      const factText = dogFacts[randomFactIndex];

      const stream = await getStreamFromURL(imageURL);

      if (!stream) {
        throw new Error('Failed to fetch image from URL');
      }

      const messageID = await api.sendMessage({
        body: factText,
        attachment: stream
      }, event.threadID);

      if (!messageID) {
        throw new Error('Failed to send message with attachment');
      }

      console.log(`Sent dog image with message ID ${messageID}`);
    } catch (error) {
      console.error(`Failed to send dog image: ${error.message}`);
      api.sendMessage('Sorry, something went wrong while trying to send a dog image. Please try again later.', event.threadID);
    }
  }
};

async function getStreamFromURL(url) {
  try {
    const response = await axios.get(url, { responseType: 'stream' });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch image from URL: ${error.message}`);
    return null;
  }
}
