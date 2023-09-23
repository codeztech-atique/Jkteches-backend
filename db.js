const mongoose = require('mongoose');
const config = require('config');
const chalk = require('chalk');

// Mongodb ServerUrl
const connectUrl = config.serverMongodb.url+''+process.env.MONGODB_USERNAME+':'+process.env.MONGODB_PASSWORD+'@'+process.env.MONGODB_URL+'/'+config.serverMongodb.databaseName+'?retryWrites=true&w=majority';

// (async () => {
//     try {
//       await mongoose.connect(connectUrl, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true
//       });
//       console.log(chalk.yellow('MongoDB connected...', connectUrl));
//     } catch (err) {
//         console.log(err);
//         console.log(chalk.red('Error in DB connection: ' + err));
//     }
// })();

mongoose.connect(connectUrl,{ useNewUrlParser:true, useUnifiedTopology: true },(err) => {
  if(!err){
      console.log(chalk.green('MongoDB connected...'));
  } else
  {
      console.log(chalk.red('Error in DB connection: ' + JSON.stringify(err, undefined, 2)));
  }
})

module.exports = mongoose;