const dotenv = require('dotenv').config();
const { Client } = require('@notionhq/client');

// Init client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const database_id = process.env.NOTION_DATABASE_ID;
const today = new Date().toISOString().slice(0, 10);

module.exports = async function getPomo() {
  const { results } = await notion.databases.query({
    database_id: `${database_id}`,
    filter: {
      "and": [
        {
          "property": "InitStart",
          "date": {
            "is_not_empty": true,
            "before": today
          }
        },
        {
          "property": "Studied",
          "checkbox": {
            "equals": true
          }
        }
      ]
    },
    sorts: [{
      "property": "InitStart",
      "direction": "ascending"
    }]
  });
  // Log the results here
  console.log("Results from Notion API:", results);

  const rawPomos = results.map(page => {
    return {
      "date": page.properties.InitStart.date.start,
      "pomos": 1 // Assuming each "Studied" item contributes 1 pomo
    };
  });

  // Aggregate the pomos by date
  const aggregatedPomos = rawPomos.reduce((accumulator, currentItem) => {
    const { date, pomos } = currentItem;
    accumulator[date] = (accumulator[date] || 0) + pomos;
    return accumulator;
  }, {});

  // Convert the aggregated data back into an array of objects
  const resultArray = Object.keys(aggregatedPomos).map(date => ({
    date,
    pomos: aggregatedPomos[date]
  }));

  return resultArray;
};
