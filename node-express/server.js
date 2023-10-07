// Create express app
require('dotenv').config()
var express = require("express")
var session = require('express-session')
var db = require("./database.js")
var md5 = require("md5")
const http = require('http');
const url = require('url');
const router = express.Router()
const path = require('path')
const var_dump = require('var_dump')

const { callbackify } = require('util')

const userLogged = () => {
    return (req, res, next) => {
        if (!req.session.user) {
            res.redirect('/');
        } else {
            next()
        }
    }
}

const writerArea = () => {
    return (req, res, next) => {
        if (!req.session.user || req.session.user.level != 1) {
            res.redirect('/');
        } else {
            next()
        }

    }
}

const EpisodePaid = () => {
    return (req, res, next) => {
        if (!req.session.user) {
            return res.redirect('/');
        }
        var episode = req.params.id;
        var sql = "select Tipo_ID FROM Episodi WHERE ID = ?";
        var params = [episode]
        db.get(sql, params, (err, row) => {
            if (row.Tipo_ID == 1) {
                next()
            } else {
                let sql = `select COUNT(*) as count, Episodi.ID, Episodi.Tipo_ID FROM Episodi inner join Utenti ON Episodi.Utenti_ID = Utenti.ID WHERE Account_ID = ? AND Episodi.ID = ?`;
                let params = [req.session.user.id, episode]
                db.get(sql, params, (err, rows) => {
                    if (err) {
                        res.status(400).json({ "error": err.message });
                    }
                    if (rows.count == 0 && rows.tipo == 2) {
                        let sql = "select COUNT(* from Pagamenti INNER JOIN CartaCredito ON Cartacredito.ID = Pagamenti.CartaCredito_ID WHERE Pagamenti.Episodi_ID = ? AND CartaCredito.Account_ID = ?"
                        let params = [episode, req.session.user.id]
                        db.get(sql, params, (err, count) => {
                            if (count == 0) {
                                return res.redirect('/checkout/' + episode)
                            }
                            if (err) {
                                res.status(400).json({ "error": err.message });
                            }
                            next();
                        });
                    } else if (rows.count == 0 && typeof rows.tipo == "undefined") {
                        let sql = "select COUNT(*) as count from Pagamenti INNER JOIN CartaCredito ON Cartacredito.ID = Pagamenti.CartaCredito_ID WHERE Pagamenti.Episodi_ID = ? AND CartaCredito.Account_ID = ?"
                        let params = [episode, req.session.user.id]
                        db.get(sql, params, (err, pagamenti) => {
                            if (pagamenti.count == 0) {
                                return res.redirect('/checkout/' + episode)
                            }
                            if (err) {
                                res.status(400).json({ "error": err.message });
                            }
                            next();
                        });
                    } else {
                        next();
                    }
                });
            }
        });

    }
};

var app = express()
app.use(express.json());
app.use(express.static(__dirname));
app.set('view engine', 'ejs');

// Server port
var HTTP_PORT = process.env.HTTP_PORT
// Start server
app.use(express.static(path.join(__dirname + "/../")));

app.listen(HTTP_PORT, () => {
    console.log("Server running on port %PORT%".replace("%PORT%", process.env.HTTP_PORT))
});
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}))


function time() {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth();
    var yy = today.getFullYear();
    return dd + "-" + mm + "-" + yy;
}

function generate_string(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

// Insert here other API endpoints

// API POST METHOD
app.post('/auth', async function (req, res, next) {
    var email = req.body.email;
    var password = req.body.password;
    var sql = "select Account.ID, Password, Nome, Cognome, Livello from Account inner join Utenti on Account.ID = Utenti.Account_ID where email = ?";
    var params = [email]
    try {
        db.get(sql, params, (err, row) => {
            if (typeof row == 'undefined') {
                res.status(401).json({ "error": "Credenziali Errate." });
                return;
            }
            if (md5(password) == row.Password) {
                req.session.user = {
                    id: row.ID,
                    name: row.Nome + " " + row.Cognome,
                    level: row.Livello
                };
                res.json({
                    "authorize": true
                })
            } else {
                res.status(401).json({ "error": "Credenziali Errate" });
            }
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
        return;
    }
});

app.post('/register', async function (req, res, next) {
    var name = req.body.name;
    var surname = req.body.surname;
    var address = req.body.address;
    var telephone = req.body.telephone;
    var city = req.body.city;
    var province = req.body.province;
    var cap = req.body.cap;
    var email = req.body.email;
    var password = md5(req.body.password);
    var level = req.body.level;

    try {
        db.run(`INSERT INTO account(Email, Password, Livello, DataCreazione) VALUES(?,?,?,?)`,
            [email, password, level, time()], function (err) {
                if (err) {
                    if (err.message == "SQLITE_CONSTRAINT: UNIQUE constraint failed: Account.Email") {
                        return res.status(401).json({ "error": "L'email inserità è già registrata" })
                    }
                }

                var account = this.lastID;

                db.run(`INSERT INTO utenti(Nome, Cognome, Indirizzo, NumeroTel, Account_ID, Città_ID, Provincia_ID, CAP_ID) VALUES(?,?,?,?,?,?,?,?)`,
                    [name, surname, address, telephone, account, city, province, cap], function (err) {
                        if (err) {
                            return console.log(err.message);
                        }

                        return res.status(200).json({ "status": true });
                    });
            });
    } catch (err) {
        res.status(400).json({ "error": err.message });
        return;
    }
});

app.post('/follow_article', async function (req, res, next) {
    var id_article = req.body.id;
    var id_account = req.session.user.id;
    try {
        var sql = "select count(*) as count from Seguiti where Account_ID = ? and Articoli_ID = ?";
        var params = [id_account, id_article]
        db.get(sql, params, (err, row) => {
            if (row.count == 0) {
                db.run(`INSERT INTO Seguiti(Articoli_ID, Account_ID) VALUES(?,?)`, [id_article, id_account], function (err) {
                    if (err) {
                        return console.log(err.message);
                    }
                    return res.status(200).json({ "status": true });
                });
            } else {
                return res.status(500).json({ "error": "L'articolo è già stato seguito." });
            }
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
        return;
    }
});


app.post('/favorite_episode', async function (req, res, next) {
    var id_episode = req.body.id;
    var id_account = req.session.user.id;
    try {
        var sql = "select count(*) as count from Preferiti where Account_ID = ? and Episodi_ID = ?";
        var params = [id_account, id_episode]
        db.get(sql, params, (err, row) => {
            if (row.count == 0) {
                db.run(`INSERT INTO Preferiti(Episodi_ID, Account_ID) VALUES(?,?)`, [id_episode, id_account], function (err) {
                    if (err) {
                        return console.log(err.message);
                    }
                    return res.status(200).json({ "status": true });
                });
            } else {
                return res.status(500).json({ "error": "Episodio già nella lista Preferiti" });
            }
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
        return;
    }
});

app.post('/checkout', async function (req, res, next) {
    let product_id = req.body.product_id;
    let credit_type = req.body.credit_type;
    let credit_name = req.body.credit_name;
    let credit_number = req.body.credit_number;
    let credit_expiration = req.body.credit_expiration;
    let credit_ccv = req.body.credit_ccv;
    let transaction_code = generate_string(20);
    try {
        var sql = "select * from CartaCredito where Numero = ?";
        var params = [credit_number]
        db.get(sql, params, (err, row) => {
            if (typeof row == 'undefined') {
                db.run(`INSERT INTO CartaCredito(Nome, Tipo, Numero, CCV, Data, Account_ID) VALUES(?,?,?,?,?,?)`,
                    [credit_name, credit_type, credit_number, credit_ccv, credit_expiration, req.session.user.id], function (err) {
                        if (err) {
                            return res.status(500).json({ "error": "Si è verificato un errore. Riprova più tardi." });
                        }
                        creditcard_id = this.lastID;
                    });
            } else {
                creditcard_id = row.ID;
            }

            var sql = "select * from Episodi where ID = ?";
            var params = [product_id]
            db.get(sql, params, (err, row) => {
                db.run(`INSERT INTO Pagamenti(CodiceTransazione, Data, Importo, CartaCredito_ID, Episodi_ID) VALUES(?,?,?,?,?)`,
                    [transaction_code, time(), row.Prezzo, creditcard_id, row.ID], function (err) {
                        if (err) {
                            return res.status(500).json({ "error": "Si è verificato un errore. Riprova più tardi." });
                        }
                        res.status(200).json({ "status": true });
                    });
            });
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
        return;
    }
});

app.post('/comment', userLogged(), async function (req, res, next) {
    var comment = req.body.comment;
    var id_episode = req.body.episode_id;
    var id_account = req.session.user.id;
    try {
        db.run(`INSERT INTO Commenti(Testo, Data, Episodi_ID, Account_ID) VALUES(?,?,?,?)`, [comment, time(), id_episode, id_account], function (err) {
            if (err) {
                return console.log(err.message);
            }
            return res.status(200).json({ "status": true });
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
        return;
    }
});

app.post('/article/store', writerArea(), async function (req, res, next) {
    var title = req.body.title;
    var description = req.body.description;
    var image = req.body.image;
    var id_account = req.session.user.id;
    var id_category = req.body.category;

    try {
        var sql = "SELECT * FROM Utenti WHERE Account_ID = ?";
        var params = [id_account];
        db.get(sql, params, (err, rows) => {
            if (err) {
                res.status(500).json({ "error": err.message });
                return;
            }
            id_user = rows.ID;

            db.run(`INSERT INTO Articoli(Titolo, Descrizione, Immagine, Utenti_ID, Categorie_ID) VALUES(?,?,?,?,?)`, [title, description, image, id_user, id_category], function (err) {
                if (err) {
                    return console.log(err.message);
                }
                return res.status(200).json({ "status": true });
            });
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
        return;
    }
});

app.post('/episode/store', writerArea(), async function (req, res, next) {
    var title = req.body.title;
    var description = req.body.description;
    var date = req.body.data;
    var text = req.body.text;
    var sponsor = req.body.sponsor;
    var type = req.body.type;
    var article = req.body.article;
    var price = req.body.price;
    var id_account = req.session.user.id;


    try {
        var sql = "SELECT * FROM Utenti WHERE Account_ID = ?";
        var params = [id_account];
        db.get(sql, params, (err, rows) => {
            if (err) {
                res.status(500).json({ "error": err.message });
                return;
            }
            id_user = rows.ID;

            db.run(`INSERT INTO Episodi(Titolo, Descrizione, Data, Testo, Sponsor, Tipo_ID, Articoli_ID, Prezzo, Utenti_ID) VALUES(?,?,?,?,?,?,?,?,?)`, [title, description, date, text, sponsor, type, article, price, id_user], function (err) {
                if (err) {
                    return console.log(err.message);
                }
                return res.status(200).json({ "status": true });
            });
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
        return;
    }
});

app.put('/article/:id', writerArea(), async function (req, res, next) {
    var title = req.body.title;
    var description = req.body.description;
    var image = req.body.image;
    var id_category = req.body.category;
    var id_article = req.params.id;

    try {
        let sql = `UPDATE Articoli
            SET Titolo = ?, Descrizione = ?, Immagine = ?, Categorie_ID = ?
            WHERE ID = ?`;
        let data = [title, description, image, id_category, id_article];
        db.run(sql, data, function (err) {
            if (err) {
                return console.log(err.message);
            }
            return res.status(200).json({ "status": true });
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
        return;
    }
});

app.put('/episode/:id', writerArea(), async function (req, res, next) {
    var title = req.body.title;
    var description = req.body.description;
    var date = req.body.data;
    var text = req.body.text;
    var sponsor = req.body.sponsor;
    var type = req.body.type;
    var article = req.body.article;
    var price = (type == 2) ? req.body.price : 0;
    var id_episode = req.params.id;
    try {
        let sql = `UPDATE Episodi SET Titolo = ?, Descrizione = ?, Data = ?, Testo = ?, Sponsor = ?, Tipo_ID = ?, Articoli_ID = ?, Prezzo = ? WHERE ID = ?`;
        let data = [title, description, date, text, sponsor, type, article, price, id_episode];
        db.run(sql, data, function (err) {
            if (err) {
                return console.log(err.message);
            }
            return res.status(200).json({ "status": true });
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
        return;
    }
});


app.delete('/article/:id', writerArea(), async function (req, res, next) {
    var id_article = req.params.id;

    try {
        let sql = "select COUNT(*) as count from Episodi inner join Utenti on Episodi.Utenti_ID = Utenti.ID where Utenti.Account_ID = ? and Episodi.Articoli_ID = ?"
        let params = [req.session.user.id, id_article]
        db.get(sql, params, (err, episodes) => {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }
            if (episodes.count > 0) {
                res.status(500).json({ "error": "Non è possibile eliminare l'articolo. Devi prima eliminare gli episodi al suo interno." });
                return;
            }
            let sql = `DELETE FROM Articoli WHERE ID = ?`;
            let data = [id_article];
            db.run(sql, data, function (err) {
                if (err) {
                    return console.log(err.message);
                }
                return res.status(200).json({ "status": true });
            });
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
        return;
    }
});

app.delete('/comments/:id', async function (req, res, next) {
    var id_commento = req.params.id;
    var user = req.session.user.id;

    try {
        let check = 'Select * from Commenti WHERE Account_ID = ? and ID = ?'
        let sql = `DELETE FROM Commenti WHERE ID = ?`;
        let params = [user, id_commento];
        db.get(check, params, function (err, row) {
            if (err) {
                return console.log(err.message);
            }
            if (typeof row == 'undefined') {
                res.status(400).json({ "error": err.message });
                return;
            }

            let data = [id_commento];
            db.run(sql, data, function (err) {
                if (err) {
                    return console.log(err.message);
                }
                return res.status(200).json({ "status": true });
            })

        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
        return;
    }
});

app.delete('/episode/:id', writerArea(), async function (req, res, next) {
    var id_episode = req.params.id;

    try {
        let sql = `DELETE FROM Episodi WHERE ID = ?`;
        let data = [id_episode];
        db.run(sql, data, function (err) {
            if (err) {
                return console.log(err.message);
            }
            return res.status(200).json({ "status": true });
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
        return;
    }
});

app.delete('/followed/:id', async function (req, res, next) {
    var id_seguiti = req.params.id;
    var user = req.session.user.id;

    try {
        let check = 'Select * from Seguiti WHERE Account_ID = ? and Seguiti.Articoli_ID = ?'
        let sql = `DELETE FROM Seguiti WHERE Seguiti.Articoli_ID = ?`;
        let params = [user, id_seguiti];
        db.get(check, params, function (err) {
            if (err) {
                return console.log(err.message);
            }
            let data = [id_seguiti];
            db.run(sql, data, function (err) {
                if (err) {
                    return console.log(err.message);
                }
                return res.status(200).json({ "status": true });
            })

        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
        return;
    }
});

app.delete('/favorite/:id', async function (req, res, next) {
    var id_preferito = req.params.id;
    var user = req.session.user.id;

    try {
        let check = 'Select * from Preferiti WHERE Account_ID = ? and Preferiti.Episodi_ID = ?'
        let sql = `DELETE FROM Preferiti WHERE Preferiti.Episodi_ID = ?`;
        let params = [user, id_preferito];
        db.get(check, params, function (err) {
            if (err) {
                return console.log(err.message);
            }

            let data = [id_preferito];
            db.run(sql, data, function (err) {
                if (err) {
                    return console.log(err.message);
                }
                return res.status(200).json({ "status": true });
            })

        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
        return;
    }
});

// RENDERING PAGE
app.get('/', (req, res) => {
    var sql = "select Articoli.ID,Articoli.Titolo,Articoli.Descrizione,Articoli.Immagine,Utenti.Nome,Utenti.Cognome from Articoli INNER JOIN Utenti on Utenti.ID=Articoli.Utenti_ID"
    var params = []
    db.all(sql, params, (err, articles) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }

        let sql = "select * from Categorie where ID IN (Select Categorie_ID from Articoli)"
        let params = []
        db.all(sql, params, (err, categories) => {
            if (typeof rows == "undefined") {
                rows = null;
            }
            if (err) {
                res.status(500).json({ "error": err.message });
                return;
            }
            res.render('index', { 'articoli': articles, 'categorie': categories, session: req.session });
        });
    });
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    let caps = [];
    let cities = [];
    let provinces = [];
    db.serialize(() => {
        let sql = "select * from CAP"
        let params = []

        db.each(sql, params, (err, rows) => {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }
            caps.push(rows); //pushing rows into array
        }, function () { // calling function when all rows have been pulled
            let sql = "select * from Città"
            let params = []
            db.each(sql, params, (err, rows) => {
                if (err) {
                    res.status(400).json({ "error": err.message });
                    return;
                }
                cities.push(rows); //pushing rows into array
            }, function () {
                let sql = "select * from Provincia"
                let params = []
                db.each(sql, params, (err, rows) => {
                    if (err) {
                        res.status(400).json({ "error": err.message });
                        return;
                    }
                    provinces.push(rows); //pushing rows into array
                }, function () {
                    res.render('register', { 'caps': caps, 'provinces': provinces, 'cities': cities });
                });
            });
        });
    });
});

app.get('/profile', userLogged(), (req, res) => {
    const title = "profile";
    let sql = `select nome, cognome, indirizzo, numeroTel, provincia.provincia as provincia, città.comune as citta, cap.cap as cap
    from Utenti inner join Provincia on Utenti.Provincia_ID = Provincia.ID
    inner join Città on Utenti.Città_ID = Città.ID
    inner join CAP on Utenti.CAP_ID = cap.ID
    where Account_ID = ?`;
    let params = [req.session.user.id]
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.render('profile', { 'user': rows, session: req.session, title: title });
    });
});

app.get('/followed', userLogged(), (req, res) => {
    const title = "followed";
    let sql = "select * from Seguiti inner join Articoli on Seguiti.Articoli_ID = Articoli.ID where Seguiti.Account_ID = ?"
    let params = [req.session.user.id]
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.render('followed', { 'articoli': rows, session: req.session, title: title });
    });
});

app.get('/favorite', userLogged(), (req, res) => {
    const title = "favorite";
    let sql = "select * from Preferiti inner join Episodi on Preferiti.Episodi_ID = Episodi.ID where Preferiti.Account_ID = ?"
    let params = [req.session.user.id]
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.render('favorite', { 'episodes': rows, session: req.session, title: title });
    });
});

app.get('/payments', userLogged(), (req, res) => {
    const title = "payments";
    let sql = "select * from CartaCredito where Account_ID = ?"
    let params = [req.session.user.id]
    db.all(sql, params, (err, rows) => {
        if (typeof rows == 'undefined') {
            res.render('payments', { 'payments': null, session: req.session, title: title });
            return;
        }
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        var id_creditcard = rows.ID;
        let sql = "select * from Pagamenti inner join CartaCredito on CartaCredito.ID=Pagamenti.CartaCredito_ID inner join Utenti on Utenti.ID=CartaCredito.Account_ID inner join Episodi on Episodi.ID=Pagamenti.Episodi_ID where Utenti.ID = ?"
        let params = [req.session.user.id]
        db.all(sql, params, (err, rows) => {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }
            res.render('payments', { 'payments': rows, session: req.session, title: title });
        });
    });
});

app.get('/my_articles', writerArea(), (req, res) => {
    const title = "my_articles";
    let sql = "select Articoli.ID, Articoli.Titolo, Articoli.Descrizione, Articoli.Immagine from Articoli inner join Utenti on Articoli.Utenti_ID = Utenti.ID where Utenti.Account_ID = ?"
    let params = [req.session.user.id]
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.render('my_articles', { 'articoli': rows, session: req.session, title: title });
    });
});

app.get('/my_episodes', writerArea(), (req, res) => {
    const title = "my_episodes";
    let sql = "select Episodi.ID, Episodi.Titolo, Episodi.Descrizione, Articoli.Titolo as TitoloArticolo from Episodi inner join Utenti on Episodi.Utenti_ID = Utenti.ID inner join Articoli on Articoli.ID=Episodi.Articoli_ID where Utenti.Account_ID = ?"
    let params = [req.session.user.id]
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.render('my_episodes', { 'episodi': rows, session: req.session, title: title });
    });
});

app.get('/article/create', (req, res) => {
    let sql = "select * from Categorie"
    let params = []
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.render('new_article', { 'categorie': rows, session: req.session });
    });
});

app.get('/article/edit/:id', (req, res) => {
    var article = req.params.id;
    let sql = "select * from Articoli where ID = ?"
    let params = [article]
    db.get(sql, params, (err, articolo) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        let sql = "select * from Categorie"
        let params = []
        db.all(sql, params, (err, categorie) => {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }
            res.render('edit_article', { 'article': articolo, 'category': categorie, session: req.session });
        });
    });
});

app.get('/episode/edit/:id', (req, res) => {
    var episode = req.params.id;
    let sql = "select * from Episodi where ID = ?"
    let params = [episode]
    db.get(sql, params, (err, episodi) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        let sql = "select * from Tipo"
        let params = []
        db.all(sql, params, (err, tipi) => {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }
            let sql = "select * from Articoli where Articoli.Utenti_ID = ?"
            let params = [req.session.user.id]
            db.all(sql, params, (err, article) => {
                if (err) {
                    res.status(400).json({ "error": err.message });
                    return;
                }
                let sql = "select * from Utenti inner join Articoli on Utenti.ID=Articoli.Utenti_ID where Utenti.Account_ID = ?"
                let params = [req.session.user.id]
                db.all(sql, params, (err, user) => {
                    if (err) {
                        res.status(400).json({ "error": err.message });
                        return;
                    }
                    res.render('edit_episode', { 'episode': episodi, 'articoli': article, 'tipo': tipi, 'utenti': user, session: req.session });
                });
            });
        });
    });
});


app.get('/episode/create', (req, res) => {
    var sql = "select * from Articoli where Articoli.Utenti_ID = ?"
    var params = [req.session.user.id]
    db.all(sql, params, (err, articles) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        var episode = req.params.id;
        let sql = "select * from Episodi"
        let params = [episode]
        db.get(sql, params, (err, episodi) => {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }

            let sql = "select * from Tipo"
            let params = []
            db.all(sql, params, (err, tipis) => {
                if (err) {
                    res.status(400).json({ "error": err.message });
                    return;
                }
                res.render('new_episode', { 'articoli': articles, 'tipo': tipis, 'episode': episodi, session: req.session });
            });
        });
    });
});

app.get('/checkout/:id', userLogged(), (req, res) => {
    var episode = req.params.id;
    let sql = "select * from Episodi where id = ?";
    let params = [episode]
    db.all(sql, params, (err, rows) => {
        if (typeof rows == 'undefined') {
            res.redirect('/');
            return;
        }
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.render('checkout', { 'episode': rows, session: req.session });
    });
});

app.get('/order_success/:id', userLogged(), (req, res) => {
    var episode = req.params.id;
    let sql = "select * from Episodi where id = ?";
    let params = [episode]
    db.all(sql, params, (err, rows) => {
        if (typeof rows == 'undefined') {
            res.redirect('/');
            return;
        }
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.render('order_success', { 'episode': rows, session: req.session });
    });
});

app.get('/category/:id', (req, res) => {
    var category = req.params.id;
    let sql = "select * from Articoli INNER JOIN Categorie on Articoli.Categorie_ID = Categorie.ID where Articoli.Categorie_ID = ?"
    let params = [category]
    db.all(sql, params, (err, articles) => {
        if (typeof rows == "undefined") {
            rows = null;
        }
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        let sql = "select * from Categorie where ID IN (Select Categorie_ID from Articoli)"
        let params = []
        db.all(sql, params, (err, categories) => {
            if (typeof rows == "undefined") {
                rows = null;
            }
            if (err) {
                res.status(500).json({ "error": err.message });
                return;
            }
            res.render('category', { 'articoli': articles, 'categorie': categories, session: req.session });
        });
    });
});

app.get('/article/:id', (req, res) => {
    var article = req.params.id;
    let sql = "select * from Episodi where Articoli_ID = ? order by substr(Data,7,4), substr(Data,4,2) , substr(Data,1,2)"
    let params = [article]
    db.all(sql, params, (err, episodi) => {
        if (typeof episodi == "undefined") {
            episodi = null;
        }
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        let sql = "select * from Categorie where ID IN (Select Categorie_ID from Articoli)"
        let params = []
        db.all(sql, params, (err, categories) => {
            if (err) {
                res.status(500).json({ "error": err.message });
                return;
            }
            let sql = "select * from Tipo inner join Episodi on Tipo.ID=Episodi.Tipo_ID inner join Articoli on Articoli.ID=Episodi.Articoli_ID where Episodi.Articoli_ID = ?"
            let params = [article]
            db.all(sql, params, (err, tipos) => {
                if (err) {
                    res.status(500).json({ "error": err.message });
                    return;
                }
                res.render('articles_episodes', { 'episodi': episodi, 'categorie': categories, 'tipo': tipos, session: req.session });
            });
        });
    });
});

app.get('/episode/:id', EpisodePaid(), (req, res) => {
    var episode_id = req.params.id;

    let sql = "select * from Episodi where ID = ?"
    let params = [episode_id]
    db.get(sql, params, (err, episode) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }

        let sql = "select Commenti.ID, Commenti.Testo, Commenti.Data, Commenti.Account_ID, Utenti.Nome, Utenti.Cognome from Commenti inner join Utenti on Commenti.Account_ID=Utenti.Account_ID inner join Episodi on Commenti.Episodi_ID=Episodi.ID where Episodi.ID = ? "
        let params = [episode_id]
        db.all(sql, params, (err, comments) => {
            if (err) {
                res.status(500).json({ "error": err.message });
                return;
            }
            return res.render('episode', { 'episodio': episode, commenti: comments, session: req.session });
        });
    });
});

app.get('/search', (req, res) => {
    const query = url.parse(req.url, true).query;
    let category = query.category;
    let search = query.search;
    if (typeof category == "undefined" || typeof search == "undefined") {
        res.redirect('/');
        return;
    }
    if (category >= 1) {
        var sql = "select Articoli.ID, Articoli.Titolo, Articoli.Descrizione, Articoli.Immagine, Utenti.Nome, Utenti.Cognome from Articoli inner join Utenti on Utenti.ID = Articoli.Utenti_ID where Categorie_ID = ? AND Titolo LIKE ? OR Descrizione LIKE ? "
        var params = [category, '%' + search + '%', '%' + search + '%']
        var sql2 = "select Episodi.ID, Episodi.Titolo, Episodi.Descrizione from Episodi inner join Articoli on Episodi.Articoli_ID = Articoli.ID where Categorie_ID = ? AND Episodi.Titolo LIKE ? OR Episodi.Descrizione LIKE ?"
    } else {
        var sql = "select Articoli.ID, Articoli.Titolo, Articoli.Descrizione, Articoli.Immagine, Utenti.Nome, Utenti.Cognome from Articoli inner join Utenti on Utenti.ID = Articoli.Utenti_ID where Titolo LIKE ? OR Descrizione LIKE ? "
        var params = ['%' + search + '%', '%' + search + '%']
        var sql2 = "select Episodi.ID, Episodi.Titolo, Episodi.Descrizione from Episodi inner join Articoli on Episodi.Articoli_ID = Articoli.ID where Episodi.Titolo LIKE ? OR Episodi.Descrizione LIKE ?"
    }

    db.all(sql, params, (err, articles) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        if (typeof articles == "undefined") {
            articles = null;
        }
        db.all(sql2, params, (err, episodes) => {
            if (err) {
                res.status(500).json({ "error": err.message });
                return;
            }
            if (typeof episodes == "undefined") {
                episodes = null;
            }
            let sql = "select * from Categorie"
            let params = []
            db.all(sql, params, (err, categories) => {
                if (err) {
                    res.status(500).json({ "error": err.message });
                    return;
                }
                res.render('search', { 'articoli': articles, 'episodi': episodes, 'categorie': categories, session: req.session });
            });
        });
    });
});


app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Default response for any other request
router.use(function (req, res) {
    res.status(404);
});