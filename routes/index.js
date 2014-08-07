
/*
 * GET home page.
 */


var app = require('../app');
var conn = app.conn
var exec = app.exec;
var request = app.http_req;
var cheerio = app.cheerio;



// app.post('/testsubmit', function(req, res){

// 	var jar = request.jar();

// 	var payload = {
// 		uri: 'https://banweb.wm.edu/pls/PROD/twbkwbis.P_ValLogin',
// 		method: 'GET',
// 		jar: jar
// 	}

// 	request(payload, function(error, response, body) {
// 		if(!error)
// 		{
// 			login(jar, req, res);
// 		}
// 		else
// 		{
// 			console.log('error code: ' + error.code);
// 			res.send(error.message);
// 		}
// 	});
// });

app.post('/testsubmit', function(req, res){
	console.log('posting bannersubmit');

	var args = req.body.username + ' ' + req.body.password + ' ' + req.body.crn_num
	exec('python /root/python/bannersubmit.py ' + args, function(error, stdout, stdin){
		if(error)
		{
			console.log('error code: ' + error.code);
			res.send(error.message);
		}
		else
		{
			console.log(stdout);
			console.log('sign up success');
			res.send('sign up success, check your schedule! (assuming you entered a valid crn/one that works in your schedule....)');
		}
	});
});

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

		var dbl = mongoClient.db('mydb');
		
		var mongo_query = {"ATTRIBUTE": {$regex: department}};

		if(attribute != '0')
			mongo_query['COURSE_ID'] = {$regex : attribute};

		dbl.collection('courses').find(mongo_query).toArray(function(err, results){
			if(err || !results)
			{
				console.log('error: toArray in course_search');
				mongoClient.close();
				return;
			}

			res.send(JSON.stringify(results));
			mongoClient.close();
			console.log("after write");
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



function login(jar, req, res)
{
	var payload = {
		uri: 'https://banweb.wm.edu/pls/PROD/twbkwbis.P_ValLogin',
		method: 'POST',
		form: {
			SID: req.body.username,
			PIN: req.body.password
		},
		jar: jar
	}
		
	request(payload, function(error, response, body) {
		var session_id = getSession(jar);

		if(!error && session_id)
		{
			prepRegister(jar, req, res);
		}
		else
		{
			if(!session_id)
			{
				console.log('invalid username/password');
				res.send('Invalid Username or Password');
			}
			else
			{
				console.log('error code: ' + error.code);
				res.send(error.message);
			}
		}
	});
}


function prepRegister(jar, req, res)
{
	payload = {
		uri: 'https://banweb.wm.edu/pls/PROD/bwskfreg.P_AltPin',
		method: 'POST',
		form: {
			term_in: '201510'
		},
		headers: {
			'Referer': 'https://banweb.wm.edu/pls/PROD/bwskfreg.P_AltPin'
		},
		jar: jar
	}

	request(payload, function(error, response, body){
		if(!error)
		{
			register(jar, req, res);
		}
		else
		{
			console.log('error code: ' + error.code);
			res.send('error while registering');
		}
	});
}

function register(jar, req, res)
{
	var session_id = getSession(jar);

	var arg = "curl 'https://banweb.wm.edu/pls/PROD/bwskfreg.P_AltPin1'" +  
	" -H 'Cookie: TESTID=set; SESSID='" + session_id + 
	" -H 'Origin: https://banweb.wm.edu'" +  
	" -H 'Accept-Encoding: gzip,deflate,sdch'" + 
	" -H 'Accept-Language: en-US,en;q=0.8'" + 
	" -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.116 Safari/537.36'" +  
	" -H 'Content-Type: application/x-www-form-urlencoded'" +  
	" -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'" + 
	" -H 'Cache-Control: max-age=0'" + 
	" -H 'Referer: https://banweb.wm.edu/pls/PROD/bwskfcls.P_GetCrse'" +  
	" -H 'Connection: keep-alive'" +  
	" --data 'crn=dummy&rsts=dummy&TERM_IN=201510&sel_crn=dummy&assoc_term_in=dummy&ADD_BTN=dummy&sel_crn="+req.body.crn_num+"+201510&assoc_term_in=201510&ADD_BTN=Register'" +  
	" --compressed -s"

	exec(arg, function(error, stdout, stdin) {
		if(!error)
		{
			var mycheerio = cheerio.load(stdout);

			var query = "table[summary='This layout table is used to present Registration Errors.']";
			// mycheerio(query).children('tr').each(function(i, element){
			// 	if(i == 1)
			// 	{
			// 		res.send(mycheerio(this).children('.dddefault').first().text());
			// 	}
			// });
			//console.log(request);
			//console.log(stdout);
			var registration_error = mycheerio(query).children('tr').last().children('.dddefault').first().text();

			console.log(request.uri);
			if(!registration_error)
			{
				res.send('success! check your schedule');
			}
			else
			{
				res.send(registration_error);
			}
		}
		else
		{
			console.log('error code: ' + error.code);
			res.send(error.message);
		}
	});
}

function getSession(jar)
{
	var jar_string = jar['_jar']['store']['idx']['banweb.wm.edu']['/pls/PROD']['SESSID'].toString();
	var session_id = jar_string.split('=')[1].split(';')[0];

	return session_id;
}


