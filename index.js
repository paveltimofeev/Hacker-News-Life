var request = require('request');
var jsdom = require("jsdom");
var fs = require("fs");

var config = JSON.parse( fs.readFileSync( "config.json" ));
console.log( 'config:', config );

var pattern_m = / minute(s)* ago/
var pattern_h = / hour(s)* ago/

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
    url: config.url,
    scripts: config.scripts,
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
          m: getMinutesFromMidnight()
        });
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

      request.put( config.info + '1', {form:{ latest:data.m, timezone: ' EST' }}, function(err, httpResponse, body){ 
        console.log( err || data );
      });
      
    });
  });
}

setInterval( function(){ parse( save ) }, config.interval );
parse( save );
