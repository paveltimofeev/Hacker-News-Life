var request = require('request');
var jsdom = require("jsdom");
var fs = require("fs");

var config = JSON.parse( fs.readFileSync( "config.json" ));
console.log( 'config:', config );

var pattern_m = / minute(s)* ago/
var pattern_h = / hour(s)* ago/

function parsePostTime( body ){
  
  var obj = JSON.parse( body || {} );
  if( !obj )
    return 0;
  
  return obj.time || 0;
}

function getTimeSpan( fromTime ){
  return parseInt((new Date().getTime() / 1000 - fromTime ) /60); 
}

function getMinutesFromMidnight(){
  
  var date = new Date();
  return parseInt(date.getHours() * 60 + date.getMinutes())
}

function parse( cb ){
  
  jsdom.env({
    url: config.url,
    scripts: config.scripts,
    done: function (err, window) {
      
      if( err )
        return cb(err);

      if( !window )
        return cb('window is undef');
      
      var $ = window.$;
      
      var id = $("tr.athing:last").attr("id");
      var apicall = 'https://hacker-news.firebaseio.com/v0/item/'+id+'.json';
      console.log("apicall:", apicall);
      
      request.get(apicall, function(err, res ,b){

      var point = getTimeSpan( parsePostTime(res.body) )
      
        if( point >= 0 && point < 60*5 ) 
          cb(err, { point: point, m: getMinutesFromMidnight() });
        else 
          cb( new Error( "Point value is out of range: " + point ) );
      })
    }
  });
}

function save( err, data ){
  
  if( err )
    return console.error( err );

  request.get( config.storage + data.m, function(err, httpResponse, body){ 
    
    if( err )
      return console.log( err );
    
    var method = 'post';
    var id = '';
    
    if(httpResponse.statusCode == 200) {
      
      method = 'put';
      id = data.m;
    }
    
    console.log( method + ' ' + config.storage + id )
    request[ method ]( config.storage + id, {form:data}, function(err, httpResponse, body){ 
      
      if( err )
        return console.log( err );

      request.put( config.info + '1', {form:{ latest:data.m, timezone: ' GMT' }}, function(err, httpResponse, body){ 
        console.log( err || data );
      });
      
    });
  });
}

setInterval( function(){ parse( save ) }, config.interval );
parse( save );
