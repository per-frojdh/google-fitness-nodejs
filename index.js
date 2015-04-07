var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var oauth2Client = new OAuth2(
	"", // CLIENT_ID
	"", // CLIENT_SECRET
	""); // Callback URL
var fitness = google.fitness('v1');

var dataSource = "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps";

var express = require('express');
var app = express();
var async = require('async');
var moment = require('moment');
var _ = require('lodash');

app.get('/', function(req, res) {
	if (checkCredentials(oauth2Client)) {
		// We have credentials.
		console.log('Credentials are present!');
		getStepsFromGoogle(res);
	} else {
		console.log('No credentials present');
		// No credentials

		// Need to generate an authentication URL in order to get a an endpoint.
		var url = oauth2Client.generateAuthUrl({
	    	access_type: 'offline', // Offline, otherwise we won't get a token
	    	scope: "https://www.googleapis.com/auth/fitness.activity.read" // Fitness SCcope
	  	});

		// Redirect browser to URL, which in turn will redirect to the callback URL once OAuth2 has been performed.
	  	res.redirect(url);
	}
})

app.get('/oauth2callback', function(req, res) {
	// The appropriate code gets returned by OAuth2
	var code = req.query.code;

	oauth2Client.getToken(code, function(err, token) {
		oauth2Client.setCredentials(token);
		console.log('Token set, redirecting to /');
		res.redirect('/');
	});
})

function getStepsFromGoogle(res) {
	// Get timestamps for range intervals. Turn seconds into nanoseconds, cause that's what Google is expecting.
	var time_now = parseInt(moment().unix() * 1000000000);
	var time_then = parseInt(moment().set({ "hour": 0, "minute": 0, "second": 0}).unix() * 1000000000);

	// use the google-nodejs API for Fitness, include these params. 
	fitness.users.dataSources.datasets.get({ userId: "me", auth: oauth2Client, dataSourceId: dataSource, datasetId: time_then + "-" + time_now}, function(err, _fitness) {
		if (err) {
			console.log("An error occured", err);
			return;
		}

		console.log("Fitness data received!");
		// Create the object we'll return to the user, creating some additional fields to fill in.
		var newDates = {
			totalSteps: 0,
			startTime: 0,
			endTime: 0,
			data: []
		}

		// We're gonna count the total amount of steps taken this day.
		var totalSteps = 0;

		// Begin the async, I usually find it's a good idea to make use of async whenever we're making requests
		// due to the nature of Javascript. It also gives me a bit more control.
		async.each(_fitness.point, function(item, callback) {

			// Some variables to make it more readable, could be included and chained with moment.
			var start = moment.unix(item.startTimeNanos / 1000000000);
			var end = moment.unix(item.endTimeNanos / 1000000000);
			
			// Push each activity segment from google into our data array.
			newDates.data.push({
				"name": item.dataTypeName,
				"value": item.value[0].intVal,
				"start": moment(start).format('YYYY-MM-DD HH:mm:ss'),
				"end": moment(end).format('YYYY-MM-DD HH:mm:ss')
			})

			// Add the steps.
			totalSteps += item.value[0].intVal; 

			// Start with next item.
			callback();
		}, function(err) {
			if (!err) {

				// Give our object some of the data collected.
				newDates.totalSteps = totalSteps;
				newDates.startTime = newDates.data[0].start;
				newDates.endTime = newDates.data[newDates.data.length - 1].end;
				console.log("Fitness data successfully parsed, returning JSON");		

				// Respond with the JSON.
				res.json(newDates)
			} else {
				console.log("Error");
			}
		})

		
		
	})
}

function checkCredentials(client) {
	// Check if credentials object is empty.
	if (!_.isEmpty(client.credentials)) {
		return true;
	} else {
		return false;
	}
}

var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('This app is listening at http://%s:%s', host, port)

});