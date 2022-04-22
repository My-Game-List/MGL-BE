const mongoose = require('mongoose');
const uri = 'mongodb+srv://Vincentius:doomhammer@mydatabase.gglvt.mongodb.net/MyGameList'
mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true});