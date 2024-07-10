const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const userModel = require('./models/user');
const postModel = require('./models/post');

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) =>
    res.render('index')
);

app.get('/login', (req, res) =>
    res.render('login')
);

app.get('/profile', isLoggedIn , (req, res) =>{
    console.log(req.user);
    res.send("Welcome to your profile");
});

app.get('/logout', (req, res) =>{
    res.clearCookie('token');
    res.redirect('/');
});

app.post('/register', async (req, res) =>{
    const { username, name, age, email, password } = req.body;
    let user = await userModel.findOne({ email });
    if(user){
        return res.status(500).send('User already exists');
    }

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            if(err) throw err;
            user = await userModel.create({
                username,
                name,
                age,
                email,
                password: hash
            });
            let token = jwt.sign({email: email, userid: user._id}, 'secretkey');
            res.cookie('token', token);
            res.send('User registered'); 
        });
    });
});

app.post('/login', async (req, res) =>{
    const { email, password } = req.body;
    let user = await userModel.findOne({ email });
    if(!user){
        return res.status(500).send('Something went wrong');
    }

    bcrypt.compare(password,user.password, function(err, result){
        if(result){ 
            let token = jwt.sign({email: email, userid: user._id}, 'secretkey');
            res.cookie('token', token);
            res.status(200).send("You Can Login");
        }
        else res.redirect("/login")
    })
});

function isLoggedIn(req,res,next){
    if(!req.cookies.token){
        res.send("You must be logged in")
    }
    else{
        let data = jwt.verify(req.cookies.token,"secretkey");
        req.user=data;
        next();
    }
}

app.listen(3000, () =>
    console.log('Server is running on http://localhost:3000')
);