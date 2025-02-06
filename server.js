const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 600000
    }
}));

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
                password TEXT NOT NULL,
                rechten INTEGER NOT NULL
            )
        `, (err) => {
            if (err) {
                console.error('Error creating table:', err.message);
            }
        });
    }
});

app.get('/', (req, res) => {
    res.redirect('/index.html');
});

app.post('/signup', (req, res) => {
    const { username, password, rechten = 0 } = req.body;

    if (!username || !password) {
        return res.status(400).send('Username and password are required.');
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(
        `INSERT INTO users (username, password, rechten) VALUES (?, ?, ?)`,
        [username, hashedPassword, rechten],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).send('Error: Username already exists.');
                } else {
                    return res.status(500).send('Error registering user.');
                }
            }
            res.send('User registered! <a href="/index.html">Go to login</a>');
        }
    );
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Username and password are required.');
    }

    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (err) {
            return res.status(500).send('Error retrieving user.');
        }
        if (!user) {
            return res.status(404).send('User not found.');
        }

        const isMatch = bcrypt.compareSync(password, user.password);
        if (isMatch) {
            req.session.user = { id: user.id, username: user.username, rechten: user.rechten };
            console.log('Session Data on login:', req.session);
            return res.redirect('/agenda.html');
        } else {
            return res.status(401).send('Invalid credentials.');
        }
    });
});

function ensureAuthenticated(req, res, next) {
    console.log('Session in middleware:', req.session);
    if (req.session && req.session.user) {
        return next();
    }

    res.redirect('/index.html');
}

app.get('/agenda.html', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'agenda.html'));
});

app.get('/check-auth', (req, res) => {
    if (req.session && req.session.user) {
        return res.status(200).send({ authenticated: true, user: req.session.user });
    }
    res.status(401).send({ authenticated: false });
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.clearCookie('connect.sid');
        res.redirect('/index.html');
    });
});


// Route voor het bijwerken van de rechten van een gebruiker
app.post('/update-rights', express.json(), (req, res) => {
    const { id, rechten } = req.body;

    // Controleer of we een geldige id en rechten hebben
    if (typeof rechten === 'undefined' || !id) {
        return res.status(400).json({ error: 'Invalid input.' });
    }

    // Bijwerken van de rechten van de gebruiker in de database
    db.run(
        `UPDATE users SET rechten = ? WHERE id = ?`,
        [rechten, id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Error updating user rights.' });
            }
            res.json({ success: true, message: 'User rights updated.' });
        }
    );
});


app.get('/users', (req, res) => {
    db.all('SELECT id, username, rechten FROM users', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching users.' });
        }
        res.json(rows); // Gebruikersgegevens in JSON-formaat
    });
});




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*const dbPath2 = path.join(__dirname, 'agenda.db');
console.log('Database path:', dbPath2);

const db2 = new sqlite3.Database(dbPath2, (err) => {
    if (err) {
        return console.error('Error opening database:', err.message);
    }
    console.log('Connected to database');
});
*/
db.run(`
    CREATE TABLE IF NOT EXISTS agenda (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tijdstip BIGINT NOT NULL,
        datum BIGINT NOT NULL,
        info TEXT NOT NULL
    )
`, (err) => {
    if (err) {
        console.error('Error creating table:', err.message);
    } else {
        console.log('Table "agenda" is ready');
    }
});

function addEntry(tijdstip, datum, info) {
    db.run(`INSERT INTO agenda (tijdstip, datum, info) VALUES (?, ?, ?)`,
    [tijdstip, datum, info], function (err) {
        if (err) {
            return console.error('Error inserting data:', err.message);
        }
        console.log(`Entry added with ID ${this.lastID}`);
    });
}

function getEntries() {
    db.all(`SELECT * FROM agenda ORDER BY datum DESC`, [], (err, rows) => {
        if (err) {
            return console.error('Error fetching data:', err.message);
        }
        console.log('Entries:', rows);
    });
}

const now = Date.now();
/*
addEntry(now, now, "Eerste test entry");
*/

setTimeout(() => getEntries(), 20000);

/*
setTimeout(() => db2.close(), 3000);
*/

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});