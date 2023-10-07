var sqlite3 = require('sqlite3').verbose()
var md5 = require('md5')

const DBSOURCE = "db.sqlite"

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        // Cannot open database
        console.error(err.message);
        throw err
    } else {
        console.log('Connected to the SQLite database.')

        db.serialize(() => {

            //Tabella Account
            db.run(`CREATE TABLE "Account" (
            "ID"	INTEGER,
            "Email"	TEXT NOT NULL UNIQUE,
            "Password"	TEXT NOT NULL,
            "Livello"	INTEGER NOT NULL,
            "DataCreazione"	TEXT NOT NULL,
            PRIMARY KEY("ID" AUTOINCREMENT)
        )`,
                (err) => {
                    if (err) {
                        // Table already created
                    } else {
                        // Table just created, creating some rows
                        var insert = 'INSERT INTO Account (Email, Password, Livello, DataCreazione) VALUES (?,?,?,?)'
                        db.run(insert, ["scrittore@example.com", md5("scrittore123"), 1, "01-01-2000"])
                        db.run(insert, ["lettore@example.com", md5("lettore123"), 2, "02-01-2000"])
                    }
                });

            //Tabella Categorie
            db.run(`CREATE TABLE "Categorie" (
            "ID"	INTEGER,
            "Nome"	TEXT NOT NULL,
            PRIMARY KEY("ID" AUTOINCREMENT)
        )`,
                (err) => {
                    if (err) {
                        // Table already created
                    } else {
                        // Table just created, creating some rows
                        var insert = 'INSERT INTO Categorie (Nome) VALUES (?)'
                        db.run(insert, ["Programmazione WEB"])
                        db.run(insert, ["Programmazione ad Oggetti"])
                        db.run(insert, ["Programmazione Funzionale"])
                    }
                });

            //Tabella Carta di Credito
            db.run(`CREATE TABLE "CartaCredito" (
            "ID"	INTEGER,
            "Nome"	TEXT NOT NULL,
            "Tipo"	INTEGER NOT NULL,
            "Numero"	INTEGER NOT NULL,
            "CCV"	INTEGER NOT NULL,
            "Data"	TEXT NOT NULL,
            "Account_ID"	INTEGER NOT NULL,
            FOREIGN KEY("Account_ID") REFERENCES "Account"("ID")    ON DELETE CASCADE,
            PRIMARY KEY("ID" AUTOINCREMENT)
        )`,
                (err) => {
                    if (err) {
                        // Table already created
                    } else {
                        // Table just created, creating some rows
                    }
                });

            //Tabella Articoli
            db.run(`CREATE TABLE "Articoli" (
            "ID"	INTEGER,
            "Titolo"	TEXT NOT NULL,
            "Descrizione"	TEXT NOT NULL,
            "Immagine"	BLOB NOT NULL,
            "Utenti_ID"	INTEGER NOT NULL,
            "Categorie_ID"	INTEGER NOT NULL,
            FOREIGN KEY("Categorie_ID") REFERENCES "Categorie"("ID")  ,
            FOREIGN KEY("Utenti_ID") REFERENCES "Utenti"("ID")   ,
            PRIMARY KEY("ID" AUTOINCREMENT)
        )`,
                (err) => {
                    if (err) {
                        // Table already created
                    } else {

                    }
                });


            //Tabella Tipo
            db.run(`CREATE TABLE "Tipo" (
                "ID"	INTEGER,
                "Nome"	TEXT NOT NULL,
                PRIMARY KEY("ID" AUTOINCREMENT)
            )`,
                    (err) => {
                        if (err) {
                            // Table already created
                        } else {
                            // Table just created, creating some rows
                            var insert = 'INSERT INTO Tipo (Nome) VALUES (?)'
                            db.run(insert, ["Gratuito"])
                            db.run(insert, ["Pagamento"])
                        }
                    });

            //Tabella Episodi
            db.run(`CREATE TABLE "Episodi" (
            "ID"	INTEGER,
            "Titolo"	TEXT NOT NULL,
            "Descrizione"	TEXT NOT NULL,
            "Data"	TEXT NOT NULL,
            "Testo"	TEXT NOT NULL,
            "Sponsor"	TEXT,
            "Tipo_ID"	INTEGER NOT NULL,
            "Articoli_ID"	INTEGER NOT NULL,
            "Prezzo"    INTEGER,
            "Utenti_ID" INTEGER NOT NULL,
            FOREIGN KEY("Articoli_ID") REFERENCES "Articoli"("ID")   ,
            FOREIGN KEY("Tipo_ID") REFERENCES "Tipo"("ID")   ,
            FOREIGN KEY("Utenti_ID") REFERENCES "Utenti"("ID")   ,
            PRIMARY KEY("ID" AUTOINCREMENT)
        )`,
                (err) => {
                    if (err) {
                        // Table already created
                    } else {
                        // Table just created, creating some rows
                    }
                });

            //Tabella Pagamenti
            db.run(`CREATE TABLE "Pagamenti" (
            "ID"	INTEGER,
            "CodiceTransazione"	INTEGER NOT NULL,
            "Data"	TEXT NOT NULL,
            "Importo"	INTEGER NOT NULL,
            "CartaCredito_ID"	INTEGER NOT NULL,
            "Episodi_ID"	INTEGER NOT NULL,
            FOREIGN KEY("Episodi_ID") REFERENCES "Episodi"("ID")    ON DELETE CASCADE,
            FOREIGN KEY("CartaCredito_ID") REFERENCES "CartaCredito"("ID")    ON DELETE CASCADE,
            PRIMARY KEY("ID" AUTOINCREMENT)
        )`,
                (err) => {
                    if (err) {
                        // Table already created
                    } else {
                        // Table just created, creating some rows
                    }
                });
                

            //Tabella Seguiti
            db.run(`CREATE TABLE "Seguiti" (
            "ID"	INTEGER,
            "Articoli_ID"	INTEGER NOT NULL,
            "Account_ID"	INTEGER NOT NULL,
            FOREIGN KEY("Account_ID") REFERENCES "Account"("ID")    ON DELETE CASCADE,
            FOREIGN KEY("Articoli_ID") REFERENCES "Articoli"("ID")    ON DELETE CASCADE,
            PRIMARY KEY("ID" AUTOINCREMENT)
        )`,
                (err) => {
                    if (err) {
                        // Table already created
                    } else {
                        // Table just created, creating some rows 
                    }
                });

            //Tabella Preferiti
            db.run(`CREATE TABLE "Preferiti" (
            "ID"	INTEGER,
            "Account_ID"	INTEGER NOT NULL,
            "Episodi_ID"	INTEGER NOT NULL,
            FOREIGN KEY("Episodi_ID") REFERENCES "Episodi"("ID")    ON DELETE CASCADE,
            FOREIGN KEY("Account_ID") REFERENCES "Account"("ID")    ON DELETE CASCADE,
            PRIMARY KEY("ID" AUTOINCREMENT)
        )`,
                (err) => {
                    if (err) {
                        // Table already created
                    } else {
                        // Table just created, creating some rows
                    }
                });

            //Tabella Provincia
            db.run(`CREATE TABLE  "Provincia" (
            "ID"	INTEGER,
            "Sigla"	TEXT NOT NULL,
            "Provincia"	TEXT NOT NULL,
            PRIMARY KEY("ID" AUTOINCREMENT)
        )`,
                (err) => {
                    if (err) {
                        // Table already created
                    } else {
                        // Table just created, creating some rows
                        var insert = 'INSERT INTO Provincia (Sigla, Provincia) VALUES (?,?)'
                        db.run(insert, ["PV", "Pavia"])
                        db.run(insert, ["AL", "Alessandria"])
                    }
                });

            //Tabella Città
            db.run(`CREATE TABLE  "Città" (
            "ID"	INTEGER,
            "Comune"	TEXT NOT NULL,
            "Provincia_ID"	INTEGER NOT NULL,
            FOREIGN KEY("Provincia_ID") REFERENCES "Provincia"("Sigla")    ON DELETE CASCADE,
            PRIMARY KEY("ID" AUTOINCREMENT)
        )`,
                (err) => {
                    if (err) {
                        // Table already created
                    } else {
                        // Table just created, creating some rows
                        var insert = 'INSERT INTO Città (Comune,Provincia_ID) VALUES (?,?)'
                        db.run(insert, ["Voghera", 1])
                        db.run(insert, ["Tortona", 2])
                    }
                });


            //Tabella CAP
            db.run(`CREATE TABLE  "CAP" (
            "ID"	INTEGER,
            "CAP"	INTEGER NOT NULL,
            "Città_ID"	INTEGER NOT NULL,
            FOREIGN KEY("Città_ID") REFERENCES "Città"("ID")    ON DELETE CASCADE,
            PRIMARY KEY("ID" AUTOINCREMENT)
        )`,
                (err) => {
                    if (!err) {
                        // Table just created, creating some rows
                        var insert = 'INSERT INTO CAP (CAP,Città_ID) VALUES (?,?)'
                        db.run(insert, ["27058", 1])
                        db.run(insert, ["15057", 2])
                    }
                });

            //Tabella Utenti
            db.run(`CREATE TABLE  "Utenti" (
            "ID"	INTEGER,
            "Nome"	TEXT NOT NULL,
            "Cognome"	TEXT NOT NULL,
            "Indirizzo"	TEXT NOT NULL,
            "NumeroTel"	INTEGER NOT NULL UNIQUE,
            "Account_ID"	INTEGER NOT NULL,
            "Città_ID"	INTEGER NOT NULL,
            "Provincia_ID"	INTEGER NOT NULL,
            "CAP_ID"	INTEGER NOT NULL,
            PRIMARY KEY("ID" AUTOINCREMENT),
            FOREIGN KEY("Provincia_ID") REFERENCES "Provincia"("ID")    ON DELETE CASCADE,
            FOREIGN KEY("Città_ID") REFERENCES "Città"("ID")    ON DELETE CASCADE,
            FOREIGN KEY("CAP_ID") REFERENCES "CAP"("ID")    ON DELETE CASCADE,
            FOREIGN KEY("Account_ID") REFERENCES "Account"("ID")    ON DELETE CASCADE
        )`,
                (err) => {
                    if (err) {
                        // Table already created
                    } else {
                        // Table just created, creating some rows
                        var insert = 'INSERT INTO Utenti (Nome,Cognome,Indirizzo,NumeroTel,Account_ID,Città_ID,Provincia_ID,CAP_ID) VALUES (?,?,?,?,?,?,?,?)'
                        db.run(insert, ["Mario", "Rossi", "Via Del Pino 45", 3456789345, 1, 1, 1, 1])
                        db.run(insert, ["Mattia", "Barretta", "Via Pozzuoli 45", 3465789345, 2, 2, 2, 2])
                    }
                });
            //Tabella Commenti
            db.run(`CREATE TABLE  "Commenti" (
                    "ID"	INTEGER,
                    "Testo"     TEXT NOT NULL,
                    "Data"  TEXT NOT NULL,
                    "Episodi_ID"	INTEGER NOT NULL,
                    "Account_ID"	INTEGER NOT NULL,
                    PRIMARY KEY("ID" AUTOINCREMENT),
                    FOREIGN KEY("Account_ID") REFERENCES "Account"("ID")    ON DELETE CASCADE,
                    FOREIGN KEY("Episodi_ID") REFERENCES "Episodi"("ID")    ON DELETE CASCADE
                )`,
                (err) => {
                    if (err) {
                        // Table already created
                    } else {
                        // Table just created, creating some rows
                    }
                });
        });
    }
});

module.exports = db