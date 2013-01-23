var express = require('express'),
	jade = require('jade'),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	mongo = require('./mongo'),
	helper = require('./helper');

var app = express();

//config
app.configure(function () {
	app.use(express.cookieParser());
	app.use(express.cookieSession({ 
		cookie: {
			httpOnly: true, 
			maxAge: null
		},
		secret: 'blog'
	}));
	app.use(express.compress());
	app.use(express.bodyParser());

	app.use(passport.initialize());
  	app.use(passport.session({}));

	app.use(express.static(__dirname + "/media"));
	app.set('views', __dirname + "/views");
	app.set('view engine', 'jade');	
})


app.listen(process.env.VCAP_APP_PORT || 8000);

// Passport session setup
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(name, done) {
  mongo.userExist(name, function (err, user) {
    done(err, user);
  });
});

// Use the LocalStrategy within Passport.
passport.use(new LocalStrategy(
  function(username, password, done) {
	mongo.login(username, password, function(err, user) {
		if (err) { return done(err); }
		if (!user) { return done(null, false); }
		return done(null, user);
	})
  }
));


//init mongodb
mongo.connectToDB(mongo.initBlog);






//router
//index
app.get('/', function (req, res) {
	res.redirect('/blog');
})
//index
app.get('/blog', function (req, res) {
	var renderBlogList = function (res, blogs) {
		res.render("blog/index", {
			'title': ' 博客首页',
			'blogs': blogs,
			'req': req,
			'method': {
				sliceContent: helper.sliceContent,
				outputDate: helper.outputDate,
				activeNav: helper.activeNav
			}
		})
	}

	mongo.showBlogList(res, renderBlogList);
});
//login
app.get("/login", function (req, res) {
	res.render('admin/login', {
		'req': req,
		'blogs': [],
		method: {
			activeNav: helper.activeNav
		}
	});
})
//logout
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});
//register
app.get("/register", function (req, res) {
	res.render('admin/register', {
		'req': req,
		'blogs': [],
		method: {
			activeNav: helper.activeNav
		}
	});
})
//project
app.get("/project", function (req, res) {
	res.render('project', {
		'req': req,
		'blogs': [],
		method: {
			activeNav: helper.activeNav
		}
	});
})
//about
app.get("/about", function (req, res) {
	res.render('about', {
		'req': req,
		'blogs': [],
		method: {
			activeNav: helper.activeNav
		}
	});
})
//category --> node/java/other
app.get('/blog/category/:key?', function (req, res) {
	var renderBlogListByCate = function (res, blogs) {
		res.render("blog/index", {
			'title': ' 博客分类',
			'blogs': blogs,
			'req': req,
			'method': {
				sliceContent: helper.sliceContent,
				outputDate: helper.outputDate,
				activeNav: helper.activeNav
			}
		})		
	}

	mongo.showBlogListByCate(req, res, renderBlogListByCate);
})
//read blog
app.get('/blog/:title', function (req, res) {
	var renderBlog = function (res, data) {
		res.render("blog/blog", {
			'blog': data.one,
			'blogs': data.all,
			'req': req,
			'router': req.params,
			'method': {
				outputDate: helper.outputDate,
				activeNav: helper.activeNav
			}
		});
	}
	mongo.findBlog(req.params.title, res, renderBlog);
})

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}

var checkAccess = function (req, res, next) {
	if (req.isAuthenticated()) { return next(); }
  	res.redirect('/login');
}


//admin
app.get('/admin', checkAccess, function (req, res) {
	var renderBlogList = function (res, blogs) {
		res.render("admin/blog/show", {
			'title': 'blog-list',
			'blogs': blogs,
			'method': {
				sliceContent: helper.sliceContent,
				outputDate: helper.outputDate
			}
		})
	}

	mongo.showBlogList(res, renderBlogList);
})
//add
app.get('/admin/blog/add', checkAccess, function (req, res) {
	res.render("admin/blog/add", {
		'title': '添加文章',
	});
})

//action
//---1.0 version---//
// app.post('/login', function (req, res) {
// 	var name = req.body.username,
// 	pw = req.body.password;

// 	mongo.login(name, pw, res);
// })

//---2.0 version---//
app.post('/login', passport.authenticate('local', { failureRedirect: '/login', failureFlash: false }), function(req, res) {
    res.redirect('/admin');
});

//---3.0 version---//
// app.post('/login', function (req, res) {
// 	res.redirect('/admin');
// })

app.post('/register', function (req, res) {
	var name = req.body.username,
	pw = req.body.password,
	cpw = req.body.confirmPassword;
	if (pw !== cpw) { 
		console.log("the password doesn't match!");
		return false;
	}

	mongo.register(name, pw, res);
})

app.post('/saveBlog', checkAccess, function (req, res) {
	var saveSuccess = function (res) {
		res.redirect('/admin');
	}
	var date;
	if (!req.body.enablePublishDate) {
		date = new Date();
	} else {
		var year = req.body.publishDate.split('-')[0],
		month = req.body.publishDate.split('-')[1],
		day = req.body.publishDate.split('-')[2];

		date = new Date(year, month - 1, day);
	}	
	req.body.date = date;

	mongo.saveBlog(res, req.body, saveSuccess);
})
app.post('/editBlog', checkAccess, function (req, res) {
	var editBlog = function (res) {
		res.send({
			status: 'ok'
		})
	}
	mongo.updateBlogById(req, res, editBlog);
})
//Delete
app.get('/admin/blog/delete/:id', checkAccess, function (req, res) {
	console.log("in delete");
	var delSuccess = function () {
		res.redirect('/admin');
	}
	mongo.delBlogById(req.params.id, res, delSuccess);
})

//Edit
app.get('/admin/blog/:title/:action?/:status?/:reason?', checkAccess, function (req, res) {
	var renderBlog = function (res, data) {
		res.render("blog/blog", {
			"title": "编辑",
			'blog': data.one,
			'blogs': data.all,
			'req': req,
			'router': req.params,
			'method': {
				outputDate: helper.outputDate,
				activeNav: helper.activeNav
			}
		});
	}
	mongo.findBlog(req.params.title, res, renderBlog);
})

// app.get('/admin/blog/:id/edit', checkAccess, function (req, res) {
// 	var editSuccess = function () {
// 		res.redirect('/admin');
// 	}
// 	mongo.delBlogById(req.params.id, res, editSuccess);
// })


//error
app.use(function(req, res){
  res.status(404);
  
  // respond with html page
  if (req.accepts('html')) {
	res.render('404', {
		'req': req,
		'blogs': [],
		method: {
			activeNav: helper.activeNav
		}
	});
    return;
  }

  // respond with json
  if (req.accepts('json')) {
    res.send({ error: 'Not found' });
    return;
  }  
});
