var request = require('request');
var jsdom = require("jsdom");
var url = 'https://news.ycombinator.com/newest';
var storage = 'http://localhost:3004/points/';
var latest = 'http://localhost:3004/latest/1';
var interval = 1000 * 60 * 1;

var pattern_m = / minute(s)* ago/
var pattern_h = / hour(s)* ago/

function publish( bucket, key, fileData, cb ){

  s3.upload( 
      {Bucket:bucket, Key:key, Body:fileData},
      {partSize: 1 * 1024 * 1024, queueSize:1},
      cb );
}

function extrapolateOverHours( window ){
    
    var $ = window.$;
    var ages = $(".age");
    var h_index = ages.length;
    
    $.each( ages, function(i, age){
      
      var text = $(age).text();
      if( text &&  text.match( pattern_h ) ) {
        h_index--;
      }
    });
    
    var avg_step = 60 / h_index;
    var extrapolated_value = parseInt(60 + (30 - h_index) * avg_step);
    return extrapolated_value;
}

function getMinutesFromMidnight(){
  
  var date = new Date();
  return parseInt(date.getHours() * 60 + date.getMinutes())
}

function parse( cb ){
  
  jsdom.env({
    url: url,
    scripts: ["http://code.jquery.com/jquery.js"],
    done: function (err, window) {
      
      if( err )
        return cb(err);

      if( !window )
        return cb('window is undef');
      
      var $ = window.$;
      var content = $(".age :last").text();
      var m;

      if( content.match( pattern_m ) ) 
        m = parseInt(content.replace(pattern_m, ''))
      else if( content.match( pattern_h ) ) 
        m = 60;
      else
        m = 0;
        
      cb(err, { 
          point: m, 
          minutes_from_midnight: getMinutesFromMidnight()
        });
    }
  });
}

function save( err, data ){
  
  if( err )
    return console.error( err );

  request.post( storage, {form:data}, function(err, httpResponse, body){ 
    
    if( err )
      return console.log( err );

    request.put( latest, {form:{ minutes_from_midnight:data.minutes_from_midnight, timezone: ' GMT' }}, function(err, httpResponse, body){ 
      console.log( err || data.point );
    });
    
  });
}

setInterval( function(){ parse( save ) }, interval );
parse( save ) 