var AWS = require("aws-sdk");
var s3 = new AWS.S3();
var fs = require("fs");

var config = JSON.parse( fs.readFileSync( "config.json" ));
console.log( 'config:', config );

var attempts = 0;
var max_attempts = config.publishMaxRetries;


function publish( bucket, key, fileData, cb ){
    
  s3.putObject({
    Bucket: bucket,
    Key: key,
    Body: fileData
  }, cb);
}

function read( dbFile, cb ){
  
  var fileData = fs.readFileSync( dbFile );
  var jsonData = null;

  try {
    
    jsonData = JSON.parse( fileData );
  }
  catch(err) {
    
    cb( err );
  }
  cb(jsonData != null ? null : 'Cannot read db file: ' + dbFile, jsonData);
}

function attempt( retry_reason ){
  
  if( retry_reason )
    console.log( 'Retry due to ', retry_reason )
  
  if(attempts >= max_attempts){
    console.log('Max attempts reached.', attempts );
    return;
  }
  
  attempts++;
  console.log( 'Attempt ', attempts )
  
  read( config.dbFile, function(err, jsonData){
    
    if(err) {
      
      setTimeout( function(){ attempt( err ) }, config.publishRetryDelay );
      return ;
    }      
    
    publish( config.backet, config.backetFolder, JSON.stringify(jsonData), function( err ){
      
      if(err) {
        
        setTimeout( function(){ attempt( err ) }, config.publishRetryDelay );
        return;
      }      
      
      console.log('Published successfully at ' + new Date());
    });
  });
}

attempt();
