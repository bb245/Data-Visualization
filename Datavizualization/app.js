"use strict"
var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , redis_client = require('redis').createClient()
  , inet = require("./inet")
  , activeClients = 0;
app.listen(3939);


function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
}

io.sockets.on('connection', function (socket) {
activeClients +=1;
setInterval(function(){io.sockets.emit('activeClient', {client:activeClients})},1000);
socket.on("KickStart",function(data){

  console.log("Kick started. Getting country...");

  console.log(data);

if (data == 'getUserDetails'){
  var ip = socket.handshake.address.address;
  var ip_aton_val = inet.aton(ip);
  var ip_ntoa_val = inet.ntoa(ip_aton_val);
  redis_client.ZRANGEBYSCORE("ip_end_num_key_zset", ip_aton_val, '+inf','limit', 0, 1, function(err,replyz){

   if (replyz.length === 1){
        redis_client.HMGET( replyz, "country"+replyz, function(err,res){
         var country = res;


         if (res.length === 1) {

            redis_client.HEXISTS ("country_data",country, function(err,reply){


            if (reply == 1){

                redis_client.HINCRBY("country_data", country , 1, function(err,resp1) {
                      console.log ("incremented existing country_count by one");
                     if(err) {console.log("Error encountered in HINCRBY country_data "+ err.message);}
                 });

             }else {

                  redis_client.HSET("country_data", country, 1, function(err,reply){
                   console.log("added as new country");
                 if(err) {console.log("Error encountered in HSET country_data "+ err.message);}
                 });
               }

        });

         } else {
            if (err) {console.log("Error encountered in HMGET " + err.message)};
         }

        });
    } else {
        if (err) {console.log("Error encountered in ZRANGEBYSCORE ip_end_num_key_zset " + err.message)};

    }
  })

  socket.emit ('retSuccess',ip);
  }

});

socket.on ("browser_name", function(data){
        redis_client.HEXISTS ("browser_name", data, function(err,reply){
         if (reply == 1){
             redis_client.HINCRBY("browser_name", data, 1, function(err,reply) {
                  if(err) {console.log("Error encountered in HINCRBY browser_name "+ err.message);}
             });
        }else {
          redis_client.HSET("browser_name", data, 1, function(err,reply){
             if(err) {console.log("Error encountered in HSET browser_name "+ err.message);}
           });
        }

        });
});

socket.on ("get_browser_data", function(data){
        redis_client.HGETALL (data,function(err,reply){
          if(err) {console.log("Error encountered in HGETALL browser_name "+ err.message);}
//format for vizualization       
        var l =[];
        for(var type in reply){
          l.push([ type, Number(reply[type])]);

        }
        socket.emit("redis_getOper_response", l);
        });

});


socket.on ("get_country_data", function(data){
        redis_client.HGETALL (data,function(err,reply){
          if(err) {console.log("Error encountered in HGETALL browser_name "+ err.message);}
//format for vizualization
        var cntry =[['Country', 'Hits']];
        for(var type in reply){

          cntry.push([ type, Number(reply[type])]);

        }
        socket.emit("redis_getcntry_response", cntry);
        });

});

 socket.on('disconnect', function(){
  activeClients -=1;
  setInterval( function(){io.sockets.emit('activeClient', {client:activeClients})},1000);
  console.log("Server disconnected");
  });


});

