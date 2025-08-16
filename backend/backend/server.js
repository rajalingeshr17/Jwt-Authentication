  const express = require('express');
  const mongoose = require('mongoose');
  const bodyParser = require('body-parser');
  const cors = require('cors');

  const routes = require('./routes'); // Import aggregated routes

  const app = express();

  // Middleware
  app.use(bodyParser.json());
  app.use(cors());

  // Connect to MongoDB (adjust connection string as needed)
  mongoose.connect('mongodb://localhost:27017', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

  // Use the aggregated routes under /api
  app.use('/api', routes);

  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
