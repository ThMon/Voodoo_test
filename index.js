const express = require('express');
const bodyParser = require('body-parser');
const db = require('./models');
const { Op } = require('sequelize');
const axios = require('axios');

const app = express();

app.use(bodyParser.json());
app.use(express.static(`${__dirname}/static`));

app.get('/api/games', (req, res) => db.Game.findAll()
  .then(games => res.send(games))
  .catch((err) => {
    console.log('There was an error querying games', JSON.stringify(err));
    return res.send(err);
  }));

app.post('/api/games', (req, res) => {
  const { publisherId, name, platform, storeId, bundleId, appVersion, isPublished } = req.body;
  return db.Game.create({ publisherId, name, platform, storeId, bundleId, appVersion, isPublished })
    .then(game => res.send(game))
    .catch((err) => {
      console.log('***There was an error creating a game', JSON.stringify(err));
      return res.status(400).send(err);
    });
});

app.delete('/api/games/:id', (req, res) => {
  // eslint-disable-next-line radix
  const id = parseInt(req.params.id);
  return db.Game.findByPk(id)
    .then(game => game.destroy({ force: true }))
    .then(() => res.send({ id }))
    .catch((err) => {
      console.log('***Error deleting game', JSON.stringify(err));
      res.status(400).send(err);
    });
});

app.put('/api/games/:id', (req, res) => {
  // eslint-disable-next-line radix
  const id = parseInt(req.params.id);
  return db.Game.findByPk(id)
    .then((game) => {
      const { publisherId, name, platform, storeId, bundleId, appVersion, isPublished } = req.body;
      return game.update({ publisherId, name, platform, storeId, bundleId, appVersion, isPublished })
        .then(() => res.send(game))
        .catch((err) => {
          console.log('***Error updating game', JSON.stringify(err));
          res.status(400).send(err);
        });
    });
});

app.post('/api/games/search', (req, res) => {
  const {name, platform} = req.body;

  const whereClause = {
    platform: platform?.trim() ? platform : { [Op.or]: ['ios', 'android'] },
  };

  if (name?.trim()) {
    whereClause.name = { [Op.like]: `%${name}%` };
  }

  db.Game.findAll({
    where: whereClause
  })
  .then(games => {
    res.send(games)
  })
  .catch((err) => {
    console.log('***There was an error querying games', JSON.stringify(err));
    return res.send(err);
  });
})

app.get('/api/games/populate', async (req, res)=>{
  //possibility to put the route in POST method to accept an array of sources in the body if automation is needed
  const sources = [
    'https://interview-marketing-eng-dev.s3.eu-west-1.amazonaws.com/ios.top100.json',
    'https://interview-marketing-eng-dev.s3.eu-west-1.amazonaws.com/android.top100.json'
  ];

  try {
    const fetchAndProcessGames = async (url) => {
      const response = await axios.get(url);
      const games = response.data.flat();
      return games.map(game => ({
        publisherId: game.publisher_id,
        name: game.name,
        platform: game.os,
        storeId: game.app_id,
        bundleId: game.bundle_id,
        appVersion: game.version,
        isPublished: true,
        rating: game.rating
      }));
    };

    const [iosGames, androidGames] = await Promise.all(sources.map(fetchAndProcessGames));
    const allGames = [...iosGames, ...androidGames];

    const uniqueGames = Array.from(
      new Map(allGames.map(game => [game.storeId, game])).values()
    );

    const top100Games = uniqueGames
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 100);

    if (!Array.isArray(top100Games) || top100Games.length === 0) {
      return res.status(400).send({ error: 'No valid games to populate.' });
    }
    const createdGames = await db.Game.bulkCreate(top100Games, { validate: true, ignoreDuplicates: true, });
    res.status(201).send(createdGames);

  } catch (err) {
    console.error('***Error populating games:', err);
    res.status(500).send({ error: 'An error occurred while populating the database.' });
  }
})

app.listen(3000, () => {
  console.log('Server is up on port 3000');
});

module.exports = app;
