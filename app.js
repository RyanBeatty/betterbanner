
/**
 * Module dependencies.
 */

var exec = require('child_process').exec;
var cheerio = require('cheerio');
var request = require('request'); 
var express = require('express');
var http = require('http');
var path = require('path'); 
var MongoClient = require('mongodb').MongoClient, 
	Server = require('mongodb').Server;

var connection = new MongoClient(new Server('162.243.66.98', '27017'));



var app = express();

module.exports = app;
module.exports.conn = connection;
module.exports.exec = exec;
module.exports.http_req = request;
module.exports.cheerio = cheerio;


// all environments
app.set('port', process.env.PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


require('./routes');

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
