const axios = require('axios');

module.exports = {
  config: {
    name: 'catinfo',
    aliases: ["catse", "catsearch", "catdesc", "catdescription"],
    version: '4.6',
    author: 'JV Barcenas',
    role: 0,
    category: 'utility',
    shortDescription: {
      en: 'Retrieves information about a specified cat breed.'
    },
    longDescription: {
      en: 'Retrieves information about a specified cat breed from the CatAPI.'
    },
    guide: {
      en: '{pn} [cat-breed]'
    }
  },
  onStart: async function ({ api, event, args }) {
    try {
      // Check if the user provided a cat breed
      if (!args[0]) {
        api.sendMessage('Please enter a cat breed to search for information.', event.threadID);
        return;
      }

      const breed = args[0];
      const apiUrl = `https://catse-api.dreamcorps.repl.co/cats/${breed}`;

      const response = await axios.get(apiUrl);

      if (response.status !== 200 || !response.data || response.data.length === 0) {
        throw new Error('Invalid or missing response from CatAPI');
      }

      const catInfo = response.data[0];
      const {
        length,
        origin,
        image_link,
        family_friendly,
        shedding,
        general_health,
        playfulness,
        children_friendly,
        grooming,
        intelligence,
        other_pets_friendly,
        min_weight,
        max_weight,
        min_life_expectancy,
        max_life_expectancy,
        name
      } = catInfo;

      const imageResponse = await axios.get(image_link, {
        responseType: 'stream'
      });

      if (imageResponse.status !== 200) {
        throw new Error('Failed to fetch image');
      }

      const messageID = await api.sendMessage({
        body: `
          Name: ${name}
          Length: ${length}
          Origin: ${origin}
          Family Friendly: ${family_friendly}
          Shedding: ${shedding}
          General Health: ${general_health}
          Playfulness: ${playfulness}
          Children Friendly: ${children_friendly}
          Grooming: ${grooming}
          Intelligence: ${intelligence}
          Other Pets Friendly: ${other_pets_friendly}
          Min Weight: ${min_weight}
          Max Weight: ${max_weight}
          Min Life Expectancy: ${min_life_expectancy}
          Max Life Expectancy: ${max_life_expectancy}
        `,
        attachment: imageResponse.data
      }, event.threadID);

      if (!messageID) {
        throw new Error('Failed to send message');
      }

      console.log(`Sent cat information with message ID ${messageID}`);
    } catch (error) {
      console.error(`Failed to send cat information: ${error.message}`);
      api.sendMessage('Sorry, something went wrong while trying to retrieve cat information. Please try again later. Please also verify if the spelling of the cat breed is correct', event.threadID);
    }
  }
};
