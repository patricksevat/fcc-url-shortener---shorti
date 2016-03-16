var express = require('express');
var mongo = require('mongodb').MongoClient;
var app = express();
var db;

app.get('/', function(req, res){
  console.log('sending index.html');
  res.sendFile(process.cwd()+'/public/index.html');
});

app.get('/favicon.ico', function(req, res) {
    res.writeHead(200, {'Content-Type': 'image/x-icon'} );
    res.end();
});

mongo.connect('mongodb://localhost:27017/shorti', function(err, database) {
  if(err) throw err;
  console.log("Connected correctly to mongo server.");
  db = database;
});

app.get('*', function(req, res){
  var path = req.path;
  console.log('path: ' + path);
  var pathNoSlash = path.slice(1);
  console.log('pathNoSlash: ' + pathNoSlash);
  var redirects = db.collection('redirectsNewNewNewNew');
  var count = redirects.find().toArray().then(function(){
    console.log('count = '+count.length);
  });
  findShortened();

    function findShortened(){
      console.log('find shortened called');
    
      redirects.find({
        short: pathNoSlash
      }).toArray(function(err, data){
          if(err) throw err;
          if (data.length > 0) {
            console.log(data);
            console.log('shortURL found, redirecting'  );
            console.log(data[0].redirectURL);
            res.redirect(data[0].redirectURL);
            res.end();
          }
          else {
            console.log('no shortURL match, calling findLongURL')  ;
            findLongURL();
          }
          
        });
    }
  
  function findLongURL(){
    redirects.find({
      $or: [{redirectURL: pathNoSlash}, {redirectURL: 'http://'+pathNoSlash}] 
    }).toArray(function(err, data) {
        if(err) throw err;
        if (data.length > 0){
          console.log('data found in findLongURL');
            if(err) throw err;
          console.log('doc found in findLongURL: '+data[0]);
          console.log('redirectURL found, responding');
          res.send('{"originalURL: "'+pathNoSlash+'", "shortenedURL": "https://shorti-patricksevat-1.c9users.io/'+data[0].short+'"}');  
        }
        else {
          console.log('no short entry found, calling insertNew');
          insertNew();
        }
    });
  }
  
  function insertNew() {
    var URLelements = pathNoSlash.split(".");
    console.log("URLelements ="+URLelements);
    
    if (URLelements.length > 1){
      URLelements[0] = URLelements[0].includes("http") ? URLelements[0] : "http://"+URLelements[0];
      console.log('URLelements[0] ='+URLelements[0]);
      var shortened; 
      //find last entry in collection && retrieve short
      redirects.find().sort({_id:-1}).limit(1).toArray(function(err, data){
              if(err) throw err;
              console.log('data in find last entry = '+data);
              
              if (data.length>0){
                console.log('last short in redirect: '+data[0].short);
                console.log('last short in redirect: '+JSON.stringify(data[0]));
                var short = data[0].short;
                //find last char of short
                var lastCharShort = short.charAt(short.length-1);
                //find charCode of last char of sort
                var lastCharShortCode = short.charCodeAt(short.length-1);
                //generate new short
                if (lastCharShortCode >= 48 && lastCharShortCode <=56  || lastCharShortCode >= 65 && lastCharShortCode <= 89 ) {
                  shortened = short.replace(lastCharShort,String.fromCharCode(lastCharShortCode+1));
                }
                else if (lastCharShortCode >= 57 && lastCharShortCode <=64) {
                  shortened = short.replace(lastCharShort,String.fromCharCode('65'));
                }
                else {
                  shortened = short+'0';
                }
              }
        else {
          shortened = '0';
        }
        console.log('shortened ='+shortened);
        redirects.insertOne({ short: shortened, redirectURL: URLelements.join(".")});
        console.log('entry added in db');
        res.send('{"originalURL: "'+URLelements.join(".")+'", "shortenedURL": "https://shorti-patricksevat-1.c9users.io/'+shortened+'"}');  
      });
      
      
      
      
      
    }
    else {
      res.end('invalid URL');
    }
  }

});



app.listen(process.env.PORT, process.env.IP);