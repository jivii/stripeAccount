// Replace if using a different env file or config
//require("dotenv").config();
const bodyParser = require("body-parser");
const express = require("express");
const { resolve } = require("path");
const session = require("express-session");
const stripe = require('stripe')('sk_test_4UNeAg7ULlqyKdIUjHj0hx8G002Zx3RDDz');
const uuidv4 = require('uuid').v4;

const app = express();
const port = process.env.PORT || 4242;

app.use(express.static(__dirname + '/public'));
app.use(session({
  secret: uuidv4(),
  resave: false,
  saveUninitialized: true,
}))

// Use JSON parser for all non-webhook routes
app.use((req, res, next) => {
  if (req.originalUrl === "/webhook") {
    next();
  } else {
    bodyParser.json()(req, res, next);
  }
});

// set the home page route
app.get('/', function(req, res) {

	// ejs render automatically looks in the views folder
	res.render('index');
	//res.send('<h1>Hello world</h1>');
});


app.get("/get-oauth-link", async (req, res) => {
  const state = uuidv4();
  req.session.state = state
  const args = new URLSearchParams({state, client_id: 'ca_HOIoPXCIsIKyu9FCkbGH6LjdFOdJv2HP'})
  const url = `https://connect.stripe.com/express/oauth/authorize?${args.toString()}`;
  return res.send({url});
});

app.get("/authorize-oauth", async (req, res) => {
  const { code, state } = req.query;

  // Assert the state matches the state you provided in the OAuth link (optional).
  if(req.session.state !== state) {
    return res.status(403).json({ error: 'Incorrect state parameter: ' + state });
  }

  // Send the authorization code to Stripe's API.
  stripe.oauth.token({
    grant_type: 'authorization_code',
    code
  }).then(
    (response) => {
      var connected_account_id = response.stripe_user_id;
      saveAccountId(connected_account_id);

      // Render some HTML or redirect to a different page.
      return res.redirect(301, '/success.ejs')
    },
    (err) => {
      if (err.type === 'StripeInvalidGrantError') {
        return res.status(400).json({error: 'Invalid authorization code: ' + code});
      } else {
        return res.status(500).json({error: 'An unknown error occurred.'});
      }
    }
  );
});

const saveAccountId = (id) => {
  // Save the connected account ID from the response to your database.
  console.log('Connected account ID: ' + id);
}

app.listen(port, () => console.log(`Node server listening on port ${port}!`));
