//packages
var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var port = process.env.PORT || 8080;
var app = express();
var User = require('./models/user');

//config

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function(req, res, next){
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods','GET, POST');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, \
		Authorization');
	next();
});

//logging

app.use(morgan('dev'));

//Routes

app.get('/', function(req, res){
	res.send('Home site for bikes4free');
});

//API
var apiRouter = express.Router();

apiRouter.use(function(req, res, next){
	console.log('Website hit');
	//middleware stuff
	next();
});

/**
 * User creation
 * Get all users
 */
apiRouter.route('/users')
	//CREATION
	.post(function(req, res){
		var user = new User();
		user.name = req.body.name;
		user.username = req.body.username;
		user.password = req.body.password;
		user.save(function(err){
			if (err){
				if (err.code == 11000)
					return res.json({ success: false, message: 'That username is taken.'});
				else
					return res.send(err);
			}
			res.json({ message: 'User created'});
			});
		})
	//GET USERS
	.get(function(req, res){
		User.find(function(err, users){
			if(err) res.send(err);

			res.json(users);
		});
	});
/**
 * Users by id
 */
apiRouter.route('/users/:user_id')
	.get(function(req, res){
		User.findById(req.params.user_id, function(err, user){
			if(err) res.send(err);

			res.json(user);
		});
	})
	.put(function(req, res){
		User.findById(req.params.user_id, function(err, user){
			if (err) res.send(err);

			if(req.body.name) user.name = req.body.name;
			if(req.body.username) user.username = req.body.username;
			if(req.body.password) user.password = req.body.password;

			user.save(function(err){
				if(err) res.send(err);

				res.json({ message: 'Updated'});
			});
		});
	})
	.delete(function(req, res){
		User.remove({ _id: req.params.user_id }, function (err, user){
			if(err) return res.send(err);

			res.json({ message: 'Deleted'});
		});
	});

apiRouter.get('/', function(req, res){
	res.json({ message: 'welcome to bikes4free'});
});

app.use('/api', apiRouter);

app.listen(port);
console.log('Magic happens on port '+ port);

//Db
mongoose.connect('mongodb://localhost:27017/bikes4free');