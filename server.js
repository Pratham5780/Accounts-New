const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const app = express();
require('dotenv').config();

mongoose.connect(process.env.Mongodb, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.set('views', __dirname + '/views');

app.use(express.urlencoded({ extended: true }));

const Transaction = mongoose.model('Transaction', {
  date: Date,
  custom: String,
  name: String,
  reason: String,
  amount: Number,
  type: String, // 'credit' or 'debit'
});

const hardcodedCredentials = {
  email: process.env.Email,
  password: process.env.Password,
};

app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
  })
);

app.get('/', async (req, res) => {
  // Check if the user is logged in
  if (req.session.loggedIn) {
    // Fetch all transactions and calculate the balance
    const transactions = await Transaction.find({});
    const balance = calculateBalance(transactions);

    res.render('index', { transactions, balance });
  } else {
    res.redirect('/login');
  }
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (email === hardcodedCredentials.email && password === hardcodedCredentials.password) {
    req.session.loggedIn = true;
    res.redirect('/');
  } else {
    res.send('Email and/or password incorrect');
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/transaction', async (req, res) => {
  const { custom, name, reason, amount, type } = req.body;
  const date = new Date();

  // Save the new transaction to the database
  const transaction = new Transaction({ date, custom, name, reason, amount, type });
  await transaction.save();

  res.redirect('/');
});

const calculateBalance = (transactions) => {
  let balance = 0;
  transactions.forEach((transaction) => {
    if (transaction.type === 'credit') {
      balance += transaction.amount;
    } else {
      balance -= transaction.amount;
    }
  });
  return balance;
};

app.post('/transaction/delete/:id', async (req, res) => {
  const transactionId = req.params.id;

  try {
    // Find the transaction by its _id and remove it from the database
    const deletedTransaction = await Transaction.findByIdAndRemove(transactionId);

    if (!deletedTransaction) {
      return res.status(404).send('Transaction not found');
    }

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting transaction');
  }
});

app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});
