const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const stripe = require('stripe')('sk_test_4UNeAg7ULlqyKdIUjHj0hx8G002Zx3RDDz'); // Add your Secret Key Here

const app = express();

// This will make our form data much more useful
app.use(bodyParser.urlencoded({ extended: true }));

// This will set express to render our views folder, then to render the files as normal html
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

app.use(express.static(path.join(__dirname, './views')));

// Future Code Goes Here
app.get('/', (req, res) => {
  res.render('index');
  //res.send('An alligator approaches!');
});
app.post("/charge", (req, res) => {
    try {
      stripe.accounts
        .create({
          name: req.body.name,
          email: req.body.email,
          source: req.body.stripeToken,
          type:'custom',
          country:'US'
        })
        .then(account =>
          stripe.charges.create({
            amount: req.body.amount * 100,
            currency: "usd",
            account: account.id
          })
        )
        .then(() => res.render("completed.ejs"))
        .catch(err => console.log(err));
    } catch (err) {
      res.send(err);
    }
  });


const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server is running...'));
