
/*
 * GET home page.
 */


var app = require('../app');
var conn = app.conn
var exec = app.exec;

var FIND_ALL = '0';

app.get('/courseinfo', function(req, res){
	console.log('getting course info');

	conn.open(function(err, mongoClient){
		if(err || !mongoClient)
		{
			console.log('error getting course description');
			mongoClient.close();
			return ;
		}
		
		var attribute = req.query.attribute.split(' ');
		var dbl = mongoClient.db('mydb');

		console.log('attribute: ' + attribute);

		var query = {'ATTRIBUTE': attribute[0] + ' ' + attribute[1]};
		dbl.collection('descriptions').find(query).toArray(function(err, results){
			
			if( err || !results)
				console.log('no results!');
			else
			{
				console.log('passing results back');

				res.send(JSON.stringify(results))
			}

			mongoClient.close()
		});

	});
});

app.get('/course_search', function(req, res){
	console.log('searching for courses');

	conn.open(function(err, mongoClient){
		if(err || !mongoClient)
		{
			console.log('error while searching');
			mongoClient.close();
			return ;
		}

		var department = req.query.department;
		var attribute = req.query.attribute;

		var dbl = mongoClient.db('betterbanner');
		
		var mongo_query = {"COURSE_ID": {$regex: department}};
		if(attribute != FIND_ALL)
			mongo_query['COURSE_ATTR'] = {$regex : attribute};

		dbl.collection('courses').find(mongo_query).toArray(function(err, results){
			if(err || !results)
			{
				console.log('error: toArray in course_search');
				mongoClient.close();
				return;
			}

			res.send(JSON.stringify(results));
			mongoClient.close();
		});

	});
});

app.get('/search', function(req, res){
	console.log('got search page');
	res.render('home');
});

app.get('/test', function(req, res){
	console.log('got test');
	res.render('secondindex');
});

app.get('/testsubmit', function(req, res){
	console.log('got testsubmit');
	res.render('bannersubmit');
});

app.get('/', function(req, res){
	console.log('got homepage')
	res.render('index');
});
