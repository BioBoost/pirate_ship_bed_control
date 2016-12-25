var player = require('play-sound')(opts = {});
var fs = require('fs');
var glob = require("glob");

// Use express module for RESTful API
var express = require('express');
var app = express();
var bodyParser = require("body-parser");

// Set port
app.set('port', process.env.PORT || 3000);

// Configure express to use body-parser as middle-ware.
app.use(bodyParser.json());   // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }));   // for parsing application/x-www-form-urlencoded

// Log all requests
app.use(function(req, res, next){
  console.log('[' + Date.now() + '] Request received');
  console.log('    url: ' + req.originalUrl);
  console.log('    params: ' + JSON.stringify(req.params));
  console.log('    body: ' + JSON.stringify(req.body));
  next();
});


var music_list = function(callback) {   // function(item[])
  var path = "./music"
  var match = "*.mp3";

  glob(match, {cwd: path}, function (err, files) {
      if (err) {
        console.log("Failed to get list of music");
        callback([]);
      } else {
        callback(files);
      }
  });
}

// @GET /
// returns { "message": "Hello and welcome to the Pirate Ship Bed Control RESTful API" }
app.get('/', function (req, res){
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ message: "Hello and welcome to the Pirate Ship Bed Control RESTful API" }));
});


var audio = null;
var currentFile = "";

// @GET /music
// returns { "music": ["hello.mp3", "test.mp3", ...], "now_playing": "<filename>|nothing" }
app.get('/music', function (req, res){
  res.setHeader('Content-Type', 'application/json');

  console.log("Audio: " + audio);
  console.log("CurrentFile: " + currentFile);

  music_list(function(items) {
    console.log(items);
    var nowPlaying = "nothing";
    if (audio != null) {
      nowPlaying = currentFile;
    }
    res.send(JSON.stringify({ music: items, now_playing: nowPlaying }));
  });

});


// @POST /music
// expects { "filename": "<filename>" }
// returns { "status": "success|failed" }
app.post('/music', function (req, res) {
  var filename = req.body.filename;
  console.log('Playing music file ' + filename);

  res.setHeader('Content-Type', 'application/json');

  if (audio != null) {
    audio.kill();
    audio = null;
    currentFile = "";
  }

  currentFile = filename;
  audio = player.play('./music/' + filename, function(err){
    if (err) console.log("Failed to play file");
    console.log("Done playing " + filename);
    currentFile = "";
    audio = null;
  });

  res.send(JSON.stringify({ status: "success" }));
});


// Custom 404 (needs to be last in line of routes)
app.use(function(req, res, next){
  res.type('text/plain');
  res.status(404);
  res.send('404 - Not Found');
});

// Custom 500
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.type('text/plain');
  res.status(500);
  res.send('500 - Internal server error');
});

// Server process
app.listen(app.get('port'), function(){
  console.log('Express app started on http://localhost:' + app.get('port'));
  console.log('Press CTRL-c to kill');
});
