if (process.nextTick.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: 'dq6x3jnde',
    api_key: '145734575688486',
    api_secret: 'pj0ZDprWpTGwPxf2dzxKgWwF1LQ',
})

const bcrypt = require("bcrypt");
const express = require("express");
const formData = require('express-form-data');
const app = express();
const jwt = require('jsonwebtoken');
const cors = require('cors');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const axios = require('axios');

const methodOverride = require('method-override');

require('./utils/db');
const User = require('./model/user');

let users = [];

const initializePassport = require('./passport-config');

initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
);

app.use(formData.parse());
app.use(express.urlencoded({extended: false}))
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.static('asset'));
app.use(cors());
app.use(methodOverride('_method'));

const header = {
    headers: {'Client-ID': process.env.CLIENT_ID, 'Authorization': 'Bearer '+process.env.IGDB_TOKEN},
}

const port = process.env.PORT || 5000;

app.get('/TopConsoleGames', async function(req, res) {
    let data;
    try {
        data = await axios.post('https://api.igdb.com/v4/games', 'fields id, name, rating, cover.url; sort rating desc; where platforms = (48, 5) & rating != null & rating_count > 200; limit 20;', header);
    } catch (e) {
        console.log(e);
    }

    // console.log(data.data);
    res.send(data.data)
})

app.get('/TopAllTime', async function(req, res) {
    let data;
    try {
        data = await axios.post('https://api.igdb.com/v4/games', 'fields id, name, total_rating, cover.url; sort total_rating desc; where rating != null & rating_count > 1200; limit 20;', header);
    } catch (e) {
        console.log(e);
    }

    // console.log(data.data);
    res.send(data.data)
})

app.get('/newest', async function(req, res) {
    let data;
    try {
        data = await axios.post('https://api.igdb.com/v4/games', `fields release_dates.human, name, cover.url, total_rating; where release_dates.date > 1630432800 & release_dates.date < ${(Date.now()/1000).toFixed(0)} & hypes > 40 & category = 0; sort release_dates.date asc; limit 20;`, header);
        data.data.sort((a, b) => (a.total_rating < b.total_rating) ? 1 : -1)
    } catch (e) {
        console.log(e);
    }

    // console.log(data.data);
    res.send(data.data)
})

app.get('/upcoming', async function(req, res) {
    let data;
    try {
        data = await axios.post('https://api.igdb.com/v4/games', `fields release_dates.human, name, cover.url, total_rating; where release_dates.date > ${(Date.now()/1000).toFixed(0)} & release_dates.date < 1743321530 & hypes > 30 & category = 0; sort release_dates.date asc; limit 20;`, header);
        data.data.sort((a, b) => (a.hype > b.hype) ? 1 : -1)
    } catch (e) {
        console.log(e);
    }

    // console.log(data.data);
    res.send(data.data)
})

app.post('/setGameStatus', async function(req, res) {
    // console.log(req.body);

    const user = await User.User.findOne({ email: req.body.email });
    // console.log(user);

    let id, rate = "";
    if (user.games.completed.map(function(e) { return e.id; }).indexOf( req.body.id ) >= 0) {
        id = user.games.completed.map(function(e) { return e.id; }).indexOf(req.body.id)
        rate = user.games.completed[id].rate;
        user.games.completed.splice(id, 1);
    }
    if (user.games.playing.map(function(e) { return e.id; }).indexOf( req.body.id ) >= 0) {
        id = user.games.playing.map(function(e) { return e.id; }).indexOf(req.body.id)
        rate = user.games.playing[id].rate;
        user.games.playing.splice(id, 1);
    }
    if (user.games.plan.map(function(e) { return e.id; }).indexOf( req.body.id ) >= 0) {
        id = user.games.plan.map(function(e) { return e.id; }).indexOf(req.body.id)
        rate = user.games.plan[id].rate;
        user.games.plan.splice(id, 1);
    }

    if (req.body.value === "Completed") {
        user.games.completed.push({ id: req.body.id, rate });
    }
    if (req.body.value === "Playing") {
        user.games.playing.push({ id: req.body.id, rate });
    }
    if (req.body.value === "Plan to Play") {
        user.games.plan.push({ id: req.body.id, rate });
    }

    user.save();
})

app.post('/setGameRating', async function(req, res) {
    // console.log(req.body);

    const user = await User.User.findOne({ email: req.body.email });
    // console.log(user);

    if (user.games.completed.map(function(e) { return e.id; }).indexOf( req.body.id ) >= 0) {
        id = user.games.completed.map(function(e) { return e.id; }).indexOf(req.body.id)
        user.games.completed.splice(id, 1);
        user.games.completed.push({ id: req.body.id, rate: req.body.value });
    }
    if (user.games.playing.map(function(e) { return e.id; }).indexOf( req.body.id ) >= 0) {
        id = user.games.playing.map(function(e) { return e.id; }).indexOf(req.body.id)
        user.games.playing.splice(id, 1);
        user.games.playing.push({ id: req.body.id, rate: req.body.value });
    }
    if (user.games.plan.map(function(e) { return e.id; }).indexOf( req.body.id ) >= 0) {
        id = user.games.plan.map(function(e) { return e.id; }).indexOf(req.body.id)
        user.games.plan.splice(id, 1);
        user.games.plan.push({ id: req.body.id, rate: req.body.value });
    }

    user.save();
})

app.get('/game/:id', async function(req, res) {
    let data;
    try {
        data = await axios.post('https://api.igdb.com/v4/games', `fields *, artworks.url, cover.url, release_dates.human, videos.video_id, involved_companies.company.name, genres.name, platforms.name, screenshots.url; where id = ${req.params.id};`, header);
    } catch (e) {
        console.log(e);
    }

    // console.log(data.data[0])
    if (data.data[0].release_dates !== undefined) {
        data.data[0].release_dates = data.data[0].release_dates[0];
    }
    
    if (data.data[0].artworks !== undefined) {
        data.data[0].artworks.map(g => {
            g.url = g.url.substring(0, 38) + "720p" + g.url.substring(43, g.url.length);
        })
    }

    if (data.data[0].videos !== undefined) {
        const url = "https://www.youtube.com/watch?v=" + data.data[0].videos[0].video_id;
        data.data[0].videos = url;
    }

    if (data.data[0].screenshots !== undefined) {
        data.data[0].screenshots.map(g => {
            g.url = g.url.substring(0, 38) + "720p" + g.url.substring(43, g.url.length);
        })
    }

    if (data.data[0].involved_companies !== undefined) {
        let company = data.data[0].involved_companies.map(g => {return g.company.name});
        company = company.join(', ');
        data.data[0].involved_companies = company;
    }

    if (data.data[0].genres !== undefined) {
        let genre = data.data[0].genres.map(g => {return g.name});
        genre = genre.join(', ');
        data.data[0].genres = genre;
    }

    if (data.data[0].platforms !== undefined) {
        let platform = data.data[0].platforms.map(g => {return g.name});
        platform = platform.join(', ');
        data.data[0].platforms = platform;
    }

    let hasil
    if (data.data[0].cover !== undefined) {
        hasil = data.data[0].cover.url.substring(0, 38) + "720p" + data.data[0].cover.url.substring(43, data.data[0].cover.url.length);
        data.data[0].cover = hasil;
    }
    // console.log(hasil);
    
    // console.log(data.data[0]);

    res.send(data.data[0]);
})

app.get('/search/game/:name', async function(req, res) {
    // console.log(req.params.name);
    
    let data;
    try {
        data = await axios.post('https://api.igdb.com/v4/games', `search "${req.params.name}"; fields *, cover.url; where category = 0 | category = 8 | category = 9 | category = 10 | version_parent = null; limit 500;`, header);
    } catch (e) {
        console.log(e);
    }

    if (data.data.length !== 0) {
        // console.log(result.data);
        // console.log(data.data);
        data.data.sort((a, b) => (a.total_rating > b.total_rating) ? 1 : -1)
        data.data.reverse();
        res.send(data.data);
    } else {
        res.send(undefined);
    }
    
})

app.get('/search/user/:username', async function(req, res) {
    const data = await User.User.find();

    const arr = [];

    const username = req.params.username;
    data.map(d => {
        if (d.username.toLowerCase().includes(username.toLowerCase())) 
            arr.push(d);
    })

    // console.log(arr);
    res.send(arr);
})

app.post('/loadUser', async(req, res) => {
    users = await User.User.find();
})

app.post('/getGamesById', async function(req, res) {
    // console.log(req.body);

    const userData = await User.User.findOne({ 'id': req.body.id });

    if (userData === null) {
        res.send('no user');
    } else {
        let result = {};
    
        let array = userData.games.completed.map(e => {return e.id;})
        if (userData.games.completed.length !== 0) {
            let data = await axios.post('https://api.igdb.com/v4/games', `fields name, cover.url; where id = (${array});`, header);
    
            data.data.map(d => {
                userData.games.completed.map(e => {
                    e.id == d.id ? d.rate = e.rate : ""
                }
            )}
            )
            // console.log(data.data);
            result.completed = data.data;
        } else {
            result.completed = "";
        }
    
        array = userData.games.playing.map(e => {return e.id;})
        if (userData.games.playing.length !== 0) {
            data = await axios.post('https://api.igdb.com/v4/games', `fields name, cover.url; where id = (${array});`, header);
            // console.log(data.data);
    
            data.data.map(d => {
                userData.games.playing.map(e => {
                    e.id == d.id ? d.rate = e.rate : ""
                }
            )}
            )
            result.playing = data.data;
        } else {
            result.playing = "";
        }
    
        array = userData.games.plan.map(e => {return e.id;})
        if (userData.games.plan.length !== 0) {
            data = await axios.post('https://api.igdb.com/v4/games', `fields name, cover.url; where id = (${array});`, header);
            // console.log(data.data);
            data.data.map(d => {
                userData.games.plan.map(e => {
                    e.id == d.id ? d.rate = e.rate : ""
                }
            )}
            )
            result.plan = data.data;
        } else {
            result.plan = "";
        }
    
        // console.log(result);
        res.send(result);
    }

})

app.post('/getUserByEmail', async (req, res) => {
    // console.log(req.body.email)
    const user = await User.User.findOne({ email: req.body.email })
    // console.log(user)
    res.send(user)
})

app.post('/getUserById', async function(req, res) {
    // console.log(req.body)
    const user = await User.User.findOne({ id: req.body.id })
    res.send(user)
})

app.get('/getuser',  async function(req, res, next) {
    const authHeader = req.headers['auth'];
    const token = authHeader && authHeader.split(' ')[1]

    if (token == null) res.send("unauth");

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        // console.log(user);
        if (err) res.sendStatus(403);
        res.send(user);
        next();
    })
})

app.post('/updateUser', async function(req, res) {
    let file = undefined, filename, uploadedRespone;
    // console.log(req.body);
    if (req.files.file) {
        file = req.files.file;
        filename = Date.now().toString() + file.originalFilename;

        uploadedRespone = await cloudinary.uploader.upload(file.path, {use_filename: true, unique_filename: false, invalidate: true, flags: 'lossy', quality: 40}, function(error, result) { /*console.log(result)*/ }).catch((rej) => { console.log(rej) });
    }
    // console.log(req.body.email);
    
    await User.User.updateOne( { email: req.body.email },
        {
            "$set" : {
                "imgURL" : uploadedRespone.url,
            }
        }
    )

    res.send();
})

app.post('/deleteFriend', async function(req, res) {
    const user1 = await User.User.findOne({ id: req.body.follower });
    let id = user1.followings.map(function(e) { return e; }).indexOf(req.body.following)
    user1.followings.splice(id, 1);
    user1.save();

    const user2 = await User.User.findOne({ id: req.body.following });
    id = user2.followers.map(function(e) { return e; }).indexOf(req.body.follower)
    user2.followers.splice(id, 1);
    user2.save();

    res.send();
})

app.post('/addFriend', async function(req, res) {
    // console.log(req.body);
    const user1 = await User.User.findOne({ id: req.body.follower });
    user1.followings.push(req.body.following);
    user1.save();

    const user2 = await User.User.findOne({ id: req.body.following });
    user2.followers.push(req.body.follower);
    user2.save();

    res.send();
})

app.post('/logout', function(req, res) {
    req.logOut();
})

app.post('/login', (passport.authenticate('local', {})), function(req, res) {
    // console.log(req.user);
    const user = { email: req.user.email, password: req.user.password };
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
    res.json(accessToken);
})

app.post('/signup', async function(req, res) {
    // console.log(req.body);
    const data = await User.User.findOne({ email: req.body.email });

    // console.log(data)

    if (data !== null) {
        res.sendStatus(403);
    } else {
        User.User.insertMany({
            id: Date.now().toString(),
            username: req.body.username,
            email: req.body.email,
            password: await bcrypt.hash(req.body.password, 10),
            games: {
                completed: [],
                playing: [],
                plan: [],
            },
            imgURL: "",
            followers: [],
            followings: [],
        })
        res.send();
    }
})

app.listen(port, () => console.log(`Server Listening on port ${port}`));