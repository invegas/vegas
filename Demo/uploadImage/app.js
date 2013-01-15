var express = require('express');
var formidable = require('formidable');
var fs = require('fs');

var app = express();

app.configure(function () {
	app.use(express.static(__dirname + "/media"));
	app.use(express.bodyParser({
            uploadDir: "media/upload/",
            keepExtensions: true,
            limit: 10000000,
            defer: true  
    }));
})

app.get('/', function (req, res) {
	res.send("hello world");
});

app.post('/upload', function (req, res) {
    req.form.on('progress', function(bytesReceived, bytesExpected) {
        var progress = bytesReceived / bytesExpected;
        progress = progress.toFixed(2);

        console.log(progress * 100 + "% uploaded");
    });

    req.form.on('end', function(bytesReceived, bytesExpected) {
        var imagePath = req.files.image.path.split('\\');
        imagePath.splice(0, 1);

        var url = [];
        url.push(req.host + ":8000");
        url = url.concat(imagePath);
        url = url.join('/');


        var name = req.files.image.name;
        var rnd_number = Math.floor(Math.random()*101);
        var new_name = rnd_number + name;
        fs.renameSync(req.files.image.path, 'media/upload/' + new_name);

        res.redirect("http://" + req.host  + ":8000/upload/" + new_name);
    });

    

    return;
})

app.listen(8000);