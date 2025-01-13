const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const dbPath = path.join(__dirname, 'users.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        `, (err) => {
            if (err) {
                console.error('Error creating table:', err.message);
            }
        });
    }
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

app.post('/signup', (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        return res.status(400).send('Username and password are required.');
    }

    // Hash the password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Insert user into the database
    db.run(
        `INSERT INTO users (username, password) VALUES (?, ?)`,
        [username, hashedPassword],
        (err) => {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).send('Error: Username already exists.');
                } else {
                    return res.status(500).send('Error registering user.');
                }
            }
            res.send('User registered! <a href="/login.html">Go to login</a>');
        }
    );
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        return res.status(400).send('Username and password are required.');
    }

    // Check user in the database
    db.get(
        `SELECT * FROM users WHERE username = ?`,
        [username],
        (err, user) => {
            if (err) {
                return res.status(500).send('Error retrieving user.');
            }
            if (!user) {
                return res.status(404).send('User not found. <a href="/signup.html">Sign up</a>');
            }

            // Compare hashed passwords
            const isMatch = bcrypt.compareSync(password, user.password);
            if (isMatch) {
                res.send('Login successful! Welcome ' + username);
            } else {
                res.status(401).send(`
                   <div style="top: 50%; left:50%; position: relative; transform: translate(-50%,-50%); width: 200px;border: 2px solid black; padding: 20px; border-radius: 10px;">
                    <p style="text-align: center;font-size: larger; font-weight: bolder;">Invalid credentials</p>
                    <a style="border: 2px solid black; padding: 8px; border-radius: 10px; cursor: pointer; left:29%; position: relative; transform: translate(-20%); font-weight: bolder; color: black;" href="/login.html">Try again</a>
                </div>
                `);
            }
        }
    );
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
