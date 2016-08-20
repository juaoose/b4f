//packages
var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var port = process.env.PORT || 8080;
var app = express();
var User = require('./models/user');
var secret = 'dampenHarm4355chiorbIt';

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

/**
 * Token provider
 */
apiRouter.post('/authenticate', function(req, res){
	User.findOne({
		username: req.body.username
	}).select('name username password').exec(function(err, user){
		if(err) throw err;

		if(!user){
			res.json({
				success: false,
				message: 'Auth failed: user not found'
			});
		} else if (user){
			var validPassword = user.comparePassword(req.body.password);
			if(!validPassword){
				res.json({
					success: false,
					message: 'Auth failed: incorrect password'
				});
			}else {
				//JOT or JWT structure
				var token = jwt.sign({
					name: user.name,
					username: user.username
				}, secret, {
					expiresIn: 60*24 //1dia
				});

				res.json({
					success: true, 
					message: 'token generated',
					token: token
				});
			}
		}
	});
});

//Middleware
apiRouter.use(function(req, res, next){
	//recibir token via:
	// query string param, form body param o http header
	var token = req.body.token || req.query.token || req.headers['x-access-token'];

	if(token){
		jwt.verify(token, secret, function(err, decoded){
			if (err){
				return res.status(403).send({
					success: false,
					message: 'Token verification failed'
				});
			} else {
				req.decoded = decoded;
				next();
			}
		});
	} else {
		return res.status(403).send({
			success: false,
			message: 'Please provide a token'
		});
	}

});

/**
 * Send logged user
 * @return {[type]}                                 [description]
 */
apiRouter.get('/me', function(req, res){
	res.send(req.decoded);
});

/**
 * User creation
 * Get all users
 */
apiRouter.route('/users')
	//CREATION
	.post(function(req, res){
		var user = new User()
;		user.name = req.body.name;
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