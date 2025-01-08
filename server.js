const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const app = express();

// Gebruik de `MONGO_URL` van Railway
const mongoURL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/loginSignupDB";

// Maak verbinding met MongoDB
mongoose.connect(mongoURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("Connected to MongoDB");
}).catch((err) => {
  console.error("MongoDB connection error:", err);
});

// Schema en model voor gebruikers
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.send('User registered! <a href="/login.html">Go to login</a>');
  } catch (err) {
    res.status(400).send('Error: Username already exists.');
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) {
    return res.send('User not found. <a href="/signup.html">Sign up</a>');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (isMatch) {
    res.send('Login successful! Welcome ' + username);
  } else {
    res.send('Invalid credentials. <a href="/login.html">Try again</a>');
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
