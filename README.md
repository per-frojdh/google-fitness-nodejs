# google-fitness-nodejs
Basic example showing how to pull some data from the Google Fitness API.

	npm install

Should get you started with some of the needed dependencies. Included dependencies are

* express (for a basic API setup)
* google-apis (for easy communication with their APIs)
* async (for some asynchronous goodness)
* lodash (just because)
* moment (simplify working with times)
* nodemon (just makes development nicer)

After that you'll need to head over to the [Google Developer Console](https://console.developers.google.com) to start a project, enable the Fitness API and get your OAuth2 secret and ID. These will need to be entered on these lines in index.js. Also don't forget the callback URL.
For local work, setting localhost:3000 works just fine.

	var oauth2Client = new OAuth2(
	"", // CLIENT_ID
	"", // CLIENT_SECRET
	""); // Callback URL

Worth noting is this should not be used as-is, the API should be sufficiently secured before attempting to use it. In case anyone gets any funny ideas.
