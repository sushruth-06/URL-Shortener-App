const express = require('express')
const router = express.Router()
const url = require('../models/url')
const user = require('../models/user')
const tier = require('../models/tier')
const zookeeper = require('node-zookeeper-client');
var base62 = require("base62");
// Connect to ZooKeeper
const zkClient = zookeeper.createClient('localhost:2181');
zkClient.connect();

// Create a persistent znode for the counter
const counterPath = '/urlShortenerCounter';
zkClient.create(counterPath, zookeeper.CreateMode.PERSISTENT, (err) => {
  if (err && err.code !== zookeeper.Exception.NODE_EXISTS) {
    console.error('Failed to create counter znode:', err);
  }
});



// Getting all
router.get('/', async (req, res) => {
  // res.send('Hello World!')
  
  try {
    const allURLs = await url.find()
    res.json(allURLs)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Getting One
router.get('/history/:id', async(req, res) => {
  try {
    const userUrls = await url.find({ user: req.params.id })
    res.json(userUrls)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
  
})

// Creating one
router.post('/', async (req, res) => {
  let newShortUrl
  //Check if user exists in DB
  let newUserID = req.body.user
  try {
    const dbUser = await user.find({ userID: newUserID })
    if(dbUser.length <= 0){
      const newUserObject = new user({
        userID:newUserID
      })
      await newUserObject.save()
      console.log("User does not exist in DB, creating new")
    }

  } catch (err) {
    res.status(500).json({ message: err.message })
  }
  if(req.body.shortUrl==undefined){
  console.log("Generating new short url")
  try {
    // Get the current value of the counter from ZooKeeper
    zkClient.getData(counterPath, async (err, data) => {
      if (err) {
        console.error('Failed to get counter value:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      const currentCounterValue = data ? parseInt(data.toString('utf-8')) : 0;

      // Increment the counter
      const newCounterValue = currentCounterValue + 1;
      newShortUrl = base62.encode(newCounterValue + Math.floor(Math.random() * 90 + 10));
      console.log(newShortUrl);
      const payloadData = new url({
        longUrl: req.body.longUrl,
        shortUrl: newShortUrl,
        user: req.body.user
      })
      const tierInfo = await tier.find()
      const dbUser = await user.find({ userID: newUserID })
      const dbUserTier = dbUser[0].tier

      // Check if user has reached limit
      if(dbUser[0].requests >= tierInfo[0][dbUserTier]){
        console.log("Reached limit")
        res.status(400).json({ error: "You have exhausted your tier request limit, please upgrade your plan"})
      }
      
      try {
        const newURL = await payloadData.save()
        res.status(201).json(newURL)
      } catch (err) {
        res.status(400).json({ message: err.message })
      }

      //Update number of requests made by user
      await user.updateOne(
        {userID: newUserID},
        {$set: { "requests" : dbUser[0].requests+1}});
      

      // Update the counter in ZooKeeper
      zkClient.setData(counterPath, Buffer.from(newCounterValue.toString()), (err) => {
        if (err) {
          console.error('Failed to update counter value:', err);
          return res.status(500).json({ error: 'Internal Server Error' });
        }
        
        // res.json({ shortUrl: newShortUrl });
      });
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
else{
  console.log("User defined short url")
  try{
  const payloadData = new url({
    longUrl: req.body.longUrl,
    shortUrl: req.body.shortUrl,
    user: req.body.user
  })
  const tierInfo = await tier.find()
  const dbUser = await user.find({ userID: newUserID })
  const dbUserTier = dbUser[0].tier

  // Check if user has reached limit
  if(dbUser[0].requests >= tierInfo[0][dbUserTier]){
    console.log("Reached limit")
    res.status(400).json({ error: "You have exhausted your tier request limit, please upgrade your plan"})
  }
  
  const existingURL = await url.findOne({ shortUrl: req.body.shortUrl });

  if (existingURL) {
    // Short URL already exists, handle accordingly (e.g., return an error)
    res.status(400).json({ message: 'Short URL already exists' });
  } else {
    // Short URL does not exist, save the payloadData
    const newURL = await payloadData.save();
    res.status(201).json(newURL);
  }

  //Update number of requests made by user
  await user.updateOne(
    {userID: newUserID},
    {$set: { "requests" : dbUser[0].requests+1}});
}
catch (err) {
  res.status(400).json({ message: err.message });
}
}
})


// Endpoint to redirect short url to the original URL
router.get('/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;

  // Find the corresponding original URL in the database, 
  // since all short URLs are unique there is zero collision.
  const originalUrl = await url.findOne({ shortUrl: shortUrl });
  console.log(originalUrl)
  if (originalUrl) {
    // Redirect to the original URL
    return res.redirect(301,originalUrl.longUrl);
  }
  else{
    res.status(404).json({ error: 'URL not found' });
  }
});



module.exports = router