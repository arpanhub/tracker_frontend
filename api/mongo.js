// Simple MongoDB API endpoint for the tracker app
// This can be deployed as a Vercel function or any serverless platform

const { MongoClient } = require('mongodb');

const handler = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { action, connectionString, database, collection, filter, data } = req.body;

  if (!connectionString || !database || !collection) {
    res.status(400).json({ error: 'Missing required parameters' });
    return;
  }

  let client;
  try {
    // Connect to MongoDB
    client = new MongoClient(connectionString);
    await client.connect();
    
    const db = client.db(database);
    const coll = db.collection(collection);

    let result;
    
    switch (action) {
      case 'upsert':
        if (!filter || !data) {
          throw new Error('Filter and data are required for upsert');
        }
        result = await coll.replaceOne(filter, data, { upsert: true });
        break;
        
      case 'findOne':
        if (!filter) {
          throw new Error('Filter is required for findOne');
        }
        result = await coll.findOne(filter);
        break;
        
      case 'deleteOne':
        if (!filter) {
          throw new Error('Filter is required for deleteOne');
        }
        result = await coll.deleteOne(filter);
        break;
        
      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    res.status(200).json({ 
      success: true, 
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('MongoDB operation error:', error);
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
};

module.exports = handler;

// For local development, you can also export as default
module.exports.default = handler;
