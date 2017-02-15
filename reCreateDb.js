var request = require('request');
var fs = require("fs");
var config = JSON.parse( fs.readFileSync( "config.json" ));

console.log( 'config:', config );

var schema = {  
  "info": [],
  "points": []  
}

function reCreateDb(){

  fs.writeFileSync( config.dbFile, JSON.stringify( schema ));
  console.log('populate default points');
  for( var id = 0; id < 24*60; id++){
    request.post( config.storage, {form:{point:60}}, function(err){ if(err)console.log( err ) } );
  }
  
  console.log('populate info');
  request.post( config.info, {form:{}}, function(err, h, b){ if(err)console.log( err) } );
}

reCreateDb();
