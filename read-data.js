var request = require('request');
var fs = require('fs');
var build_id = "";
var creds = Buffer.from(process.env.BROWSERSTACK_USERNAME+":"+process.env.BROWSERSTACK_ACCESS_KEY).toString('base64');
var session_id = "";

processBuildData();

async function processBuildData(){
  var build_options = {
    'method': 'GET',
    'url': 'https://api-cloud.browserstack.com/app-automate/espresso/v2/builds/'+build_id,
    'headers': {
      'Authorization': 'Basic '+creds,
    },
    json:true
  };
  await request(build_options, function (error, response, body) {
    if (error) throw new Error(error);
    for(var i=0; i<body.devices.length; i++){
      for(var j=0; j<body.devices[i].sessions.length;j++){
        session_id = body.devices[i].sessions[j].id;
        //console.log(session_id);
        sessionData(session_id);
      }
    }
  });
}

async function sessionData(session_id){
  var session_options = {
    'method': 'GET',
    'url': 'https://api-cloud.browserstack.com/app-automate/espresso/v2/builds/'+build_id+'/sessions/'+session_id+'/report',
    'headers': {
      'Authorization': 'Basic '+creds,
    }
  };
  await request(session_options, function (error, response) {
    if (error) throw new Error(error);
    //console.log(response.body);
    fs.writeFile('junit-reports/'+session_id+".xml", response.body, function (err) {
      if (err) throw err;
      console.log('Saved!');
      uploadJunitReportsTO(session_id);
    });
  });
}

async function uploadJunitReportsTO(session_id){
  var options = {
    'method': 'POST',
    'url': 'https://upload-observability.browserstack.com/upload',
    'headers': {
      'Authorization': 'Basic '+creds,
    },
    formData: {
      'data': {
        'value': fs.createReadStream('junit-reports/'+session_id+'.xml'),
        'options': {
          'filename': session_id+'.xml',
          'contentType': null
        }
      },
      'projectName': 'Espresso Project',
      'buildName': 'TO tests',
      'buildIdentifier': build_id,
      'frameworkVersion': 'espresso, 1.0'
    }
  };
  await request(options, function (error, response) {
    if (error) throw new Error(error);
    console.log(response.body);
  });
}



