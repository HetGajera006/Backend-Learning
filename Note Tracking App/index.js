const express = require('express');
const path = require('path');
const app = express();
const fs = require('fs');

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

if (!fs.existsSync('./files')) {
    fs.mkdirSync('./files');
}

app.get('/', (req, res) => {
    fs.readdir('./files', (err, files) => {
        res.render("index", { files: files || [] });
    });
});

app.get('/file/:filename', (req, res) => {
    fs.readFile(`./files/${req.params.filename}`, "utf-8", (err, filedata) => {
        res.render("show", { filename: req.params.filename, filedata: filedata });
    });
});

app.post('/create', (req, res) => {
    const filename = `${req.body.title.split(' ').join('')}.txt`;
    fs.writeFile(`./files/${filename}`, req.body.details, (err) => {
        res.redirect("/");
    });
});

app.post('/delete/:filename', (req, res) => {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(__dirname, 'files', filename);

    fs.unlink(filePath, (err) => {
        if(err) console.error("failed to delete");
        res.redirect('/');
    });
});

app.get('/edit/:filename', (req, res) => {
    res.render('edit', { filename: req.params.filename });
});

app.post('/edit', (req, res) => {
    const newFileName = `${req.body.new.split(' ').join('')}.txt`;
    // single quotes(' ') => treated as a plain text.
    // and (` `) backticks use => so the variables actually get injected into the string.
    fs.rename(`./files/${req.body.Previous}`, `./files/${newFileName}`, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error renaming file");
        }
        res.redirect('/');
    });
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});