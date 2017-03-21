 DROP TABLE IF EXISTS Users,Photos CASCADE;

CREATE TABLE Users (
    name VARCHAR(16) NOT NULL CHECK(name<>''),
    email TEXT NOT NULL CHECK(email<>''),
    password VARCHAR(200) NOT NULL CHECK(password<>''),
    token VARCHAR(200),
    PRIMARY KEY (name)
    );

CREATE TABLE Photos (
    link VARCHAR(32) NOT NULL CHECK(link<>''),
    sender VARCHAR(32) REFERENCES Users(name),
    reciever VARCHAR(32) REFERENCES Users(name),
    PRIMARY KEY (link, sender, reciever)
    );

CREATE TABLE Contacts (
    username VARCHAR(32) REFERENCES Users(name),
    contact VARCHAR(32) REFERENCES Users(name),
    PRIMARY KEY (username, contact)
    );