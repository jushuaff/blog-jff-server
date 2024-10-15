//[SECTION] Dependencies and Modules
const express 	= require("express");
const mongoose  = require("mongoose");
const cors 		= require("cors")

//[SECTION] Routes here
const userRoutes 	= require("./routes/user");
const postRoutes = require("./routes/post");

require('dotenv').config();

//[SECTION] Server Setup
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));

//To fetch assets
app.use('/public', express.static('public'));

const corsOptions = {
    origin: ['http://localhost:3000','https://jff-blog-client.vercel.app', 'https://jff-blog-client-rabgjm8n4-joe-davids-projects.vercel.app'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

mongoose.connect(process.env.MONGO_STRING);
mongoose.connection.once('open', () => console.log('Now connected to MongoDB Atlas.'))

app.use("/users", userRoutes);
app.use("/posts", postRoutes);

if(require.main === module){
	app.listen(process.env.PORT || 3000, () => {
		console.log(`API is now online on port ${process.env.PORT || 3000 }`)
	});
}

module.exports = {app, mongoose};