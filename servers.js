var express = require('express');
var app = express();
var fs = require('fs');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var bodyParser = require('body-parser');
var StringDecoder = require('string_decoder').StringDecoder;
var port = 3000;
var ip = app.adress;
var request = require('request');

app.listen(port, function () {
  console.log('Listening on port ' + port);
});

app.get('/uploads/fullsize/:file', function (req, res){
  file = req.params.file;
  var img = fs.readFileSync(__dirname + "/uploads/fullsize/" + file);
  res.writeHead(200, {'Content-Type': 'image/jpg' });
  res.end(img, 'binary');

});

app.post('/contacts', rawBody, function (req, res){
  if (req.rawBody && req.bodyLength > 0) {
    var result = [];
    var decoder = new StringDecoder('utf8');
    var username = decoder.write(req.rawBody);
    console.log(username);
    var message = '';

    var mysql      = require('mysql');
    var connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : 'jacke1',
        database : 'snapcat'
        });

          connection.connect();

          connection.query("SELECT contact FROM contacts WHERE username='" + username + "'", function(err, rows, fields) {
            if (err) throw err;
            else {
              rows.forEach(function(value){
              console.log(value.contact);
              message = message + value.contact + ',';
              console.log(message);
              });
              res.send(message);
            }
          });
  }
});

app.post('/senders', rawBody, function (req, res){
  if (req.rawBody && req.bodyLength > 0) {
    var decoder = new StringDecoder('utf8');
    var reciever = decoder.write(req.rawBody);
    console.log(reciever);
    var message = '';

    var mysql      = require('mysql');
    var connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : 'jacke1',
        database : 'snapcat'
        });

          connection.connect();

          connection.query("SELECT sender,link FROM photos WHERE reciever='" + reciever + "'", function(err, rows, fields) {
            if (err) throw err;
            else {
              rows.forEach(function(value){
              message = message + value.sender + ':' + value.link + ',';
              });
              res.send(message);
            }
          });
  }
});

function rawBody(req, res, next) {
    var chunks = [];

    req.on('data', function(chunk) {
        chunks.push(chunk);
    });

    req.on('end', function() {
        var buffer = Buffer.concat(chunks);

        req.bodyLength = buffer.length;
        req.rawBody = buffer;
        next();
    });

    req.on('error', function (err) {
        console.log(err);
        res.status(500);
    });
}

app.post('/upload-image', rawBody, function (req, res) {

    if (req.rawBody && req.bodyLength > 0) {
        var decoder = new StringDecoder('utf8');
        var str = decoder.write(req.rawBody);
        var arr = str.split("start");
        var message = arr[1].split(",");
        var sender = message[0];
        var receiver = message[1];
        var token = '';
        console.log(sender);
        console.log(receiver);

        var crypto = require('crypto');
        var link = crypto.createHash('md5').update(str).digest('hex');
        console.log(link);

        var mysql      = require('mysql');
        var connection = mysql.createConnection({
          host     : 'localhost',
          user     : 'root',
          password : 'jacke1',
          database : 'snapcat'
        });

        connection.connect();

        connection.query("INSERT INTO photos(link,sender,reciever) VALUES ('" + link + "', '" + sender + "', '" + receiver + "');", function(err, rows, fields) {
          if(!err) {
            var imageFile = ".png";
            var newPath = __dirname + "/uploads/fullsize/" + receiver + "/" + link + imageFile;

            res.send("Uploaded");
            fs.writeFile(newPath, req.rawBody, function (err) {

            });
          }
          else {
            res.send("wrong");
          }
        });


        connection.query("SELECT token FROM users WHERE name='" + receiver + "'", function(err, rows, fields) {
            if (err) throw err;
            else {
              rows.forEach(function(value){
                token = value.token;
                sendMessageToUser(token,{ message: sender});
              });
            }
          });


        connection.end();

    }

});

app.post('/login', rawBody, function (req, res) {

    if (req.rawBody && req.bodyLength > 0) {
        var decoder = new StringDecoder('utf8');
        var str = decoder.write(req.rawBody);
        var arr = str.split(",");
        var username = arr[0];
        var password = arr[1];
        var token = arr[2];

         console.log(req.rawBody);
         console.log(username);
         console.log(password);

        var mysql      = require('mysql');
        var connection = mysql.createConnection({
          host     : 'localhost',
          user     : 'root',
          password : 'jacke1',
          database : 'snapcat'
        });

        connection.connect();

        connection.query("SELECT password FROM users WHERE name='" + username + "'", function(err, rows, fields) {
          if (err) throw err;
          console.log('The password is: ', rows[0].password);
          console.log(rows[0].password.length);
          res.send(rows[0].password.toString());
        });


        connection.query("UPDATE users SET token='" + token +"' WHERE name='" + username + "'", function(err, rows, fields) {
          if (err) throw err;
        });


        connection.end();
    }

});

app.post('/create', rawBody, function (req, res) {

    if (req.rawBody && req.bodyLength > 0) {
        var decoder = new StringDecoder('utf8');
        var str = decoder.write(req.rawBody);
        var arr = str.split(",");
        var username = arr[0];
        var password = arr[1];
        var email = arr[2];

         console.log(req.rawBody);
         console.log(username);
         console.log(password);
         console.log(email);

        var mysql      = require('mysql');
        var connection = mysql.createConnection({
          host     : 'localhost',
          user     : 'root',
          password : 'jacke1',
          database : 'snapcat'
        });

        connection.connect();

        connection.query("INSERT INTO users(name,email,password) VALUES ('" + username + "', '" + email + "', '" + password + "');", function(err, rows, fields) {
          if (err) {
            res.send("Username already exists");
          }
          else {
          res.send("User created");
          var newPath = __dirname + "/uploads/fullsize/" + username;
          var dir = './tmp';
          fs.mkdirSync(newPath);
          }
        });

        connection.end();
    }

});

app.post('/getimages', rawBody, function (req, res) {

    if (req.rawBody && req.bodyLength > 0) {
        var decoder = new StringDecoder('utf8');
        var str = decoder.write(req.rawBody);
        var arr = str.split(",");
        var reciever = arr[0];
        var sender = arr[1];
        var link = arr[2];
        var filetype = '.png';
        var filepath = __dirname + '/uploads/fullsize/' + reciever + '/' + link + filetype;

        res.sendFile(filepath);

        var mysql      = require('mysql');
        var connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : 'jacke1',
        database : 'snapcat'
        });

        connection.connect();

        connection.query("DELETE FROM photos WHERE sender='" + sender + "' AND reciever='" + reciever + "' AND link='" + link + "'", function(err, rows, fields) {
          if (err) throw err;
          });
    }
});

app.post('/delimage', rawBody, function (req, res) {

    if (req.rawBody && req.bodyLength > 0) {
        var decoder = new StringDecoder('utf8');
        var str = decoder.write(req.rawBody);
        var arr = str.split(",");
        var reciever = arr[0];
        var sender = arr[1];
        var link = arr[2];
        var filetype = '.png';
        var filepath = __dirname + '/uploads/fullsize/' + reciever + '/' + link + filetype;
        console.log(filepath);

        fs.unlink(filepath);
        res.send('done');
    }
});

function sendMessageToUser(deviceId, message) {
  request({
    url: 'https://fcm.googleapis.com/fcm/send',
    method: 'POST',
    headers: {
      'Content-Type' :' application/json',
      'Authorization': 'key=AIzaSyDWPIL29LFs-d-sJ2kUnTx-L2PTiIxZTp8'
    },
    body: JSON.stringify(
      { "data": message
        ,
        "to" : deviceId
      }
    )
  }, function(error, response, body) {
    if (error) {
      console.error(error, response, body);
    }
    else if (response.statusCode >= 400) {
      console.error('HTTP Error: '+response.statusCode+' - '+response.statusMessage+'\n'+body);
    }
    else {
      console.log('Done!');
      console.log(deviceId);
    }
  });
}

app.post('/deltoken', rawBody, function (req, res) {

    if (req.rawBody && req.bodyLength > 0) {
        var decoder = new StringDecoder('utf8');
        var username = decoder.write(req.rawBody);
        var token = '';

        var mysql      = require('mysql');
        var connection = mysql.createConnection({
          host     : 'localhost',
          user     : 'root',
          password : 'jacke1',
          database : 'snapcat'
        });

        connection.connect();
        connection.query("UPDATE users SET token='" + token +"' WHERE name='" + username + "'", function(err, rows, fields) {
          if (err) throw err;
        });
        connection.end();

        res.send('done');
    }
});

app.post('/open', rawBody, function (req, res) {

    if (req.rawBody && req.bodyLength > 0) {
        var decoder = new StringDecoder('utf8');
        var str = decoder.write(req.rawBody);
        var arr = str.split(",");
        var sender = '!' + arr[0];
        var receiver = arr[1];
        var token = '';
        console.log(sender);
        console.log(receiver);

        var mysql      = require('mysql');
        var connection = mysql.createConnection({
          host     : 'localhost',
          user     : 'root',
          password : 'jacke1',
          database : 'snapcat'
        });

        connection.connect();

        connection.query("SELECT token FROM users WHERE name='" + receiver + "'", function(err, rows, fields) {
            if (err) throw err;
            else {
              rows.forEach(function(value){
                token = value.token;
                sendMessageToUser(token,{ message: sender});
              });
            }
          });
        connection.end();
        res.send('done');
    }

});