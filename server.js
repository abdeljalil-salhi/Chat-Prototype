var express = require('express'),
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server),
    port = process.env.PORT || 3000,
    fs = require('fs'),
    path = require('path'),
    users = {},
    stickers = [],
    stickers__saved = [],
    emojis = [],
    emojis__saved = [];

server.listen(port);

const saveStickers = (array) => {
    stickers__saved.push(array);
    stickers__saved2 = stickers__saved.toString();
    stickers__saved2 = stickers__saved2.split(',');
    stickers__saved3 = [... new Set(stickers__saved2)];
    fs.writeFile('stickers__list.txt', stickers__saved3.toString(), function (err) {
        if (err) throw err;
    });
}

const saveEmojis = (array) => {
    emojis__saved.push(array);
    emojis__saved2 = emojis__saved.toString();
    emojis__saved2 = emojis__saved2.split(',');
    emojis__saved3 = [... new Set(emojis__saved2)];
    fs.writeFile('emojis__list.txt', emojis__saved3.toString(), function (err) {
        if (err) throw err;
    });
}

const directoryPath = path.join(__dirname, '/public/stickers/');
fs.readdir(directoryPath, function (err, folders) {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 
    folders.forEach(function (folder) {
        var filesPath = path.join(__dirname, '/public/stickers/' + folder);
        fs.readdir(filesPath, function (err, files) {
            if (err) {
                return console.log('Unable to scan directory: ' + err);
            }
            files.forEach(function (file) {
                stickers.push(folder + '/' + file);
            });
            saveStickers(stickers);
        });
    });
});

const directoryPath2 = path.join(__dirname, '/public/emojis/');
fs.readdir(directoryPath2, function (err, folders2) {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 
    folders2.forEach(function (folder) {
        var filesPath2 = path.join(__dirname, '/public/emojis/' + folder);
        fs.readdir(filesPath2, function (err, files) {
            if (err) {
                return console.log('Unable to scan directory: ' + err);
            }
            files.forEach(function (file) {
                emojis.push(folder + '/' + file);
            });
            saveEmojis(emojis);
        });
    });
});


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});
app.use(express.static('public'));

io.sockets.on('connection', (socket) => {
    fs.readFile(__dirname + '/stickers__list.txt', 'utf8', function(err, data) {
        if (err) throw err;
        io.sockets.emit('stickers list', data);
    });

    fs.readFile(__dirname + '/emojis__list.txt', 'utf8', function(err, data) {
        if (err) throw err;
        io.sockets.emit('emojis list', data);
    });

    const updateUsernames = () => {
        io.sockets.emit('usernames', Object.keys(users)); 
    }

    socket.on('new user', (data, callback) => {
        if (data in users) {
            callback(false);
        } else {
            callback(true);
            socket.username = data;
            users[socket.username] = socket;
            updateUsernames();
            var timestamp = new Date();
            var gettime = timestamp.getHours() + ':' + timestamp.getMinutes();
            users[socket.username].emit('you joined', gettime);
            socket.broadcast.emit('joined log', {user: socket.username, time: gettime});
        }
    });

    socket.on('typing', data => {
        if (data.typing == true) {
            socket.broadcast.emit('display', {user: socket.username, typing: data.typing});
        } else {
            socket.broadcast.emit('display', {user: socket.username, typing: data.typing});
        }
    });

    socket.on('send message', (data, callback) => {
        var timestamp = new Date();
        var gettime = timestamp.getHours() + ':' + timestamp.getMinutes();
        var message = data.trim(); //remove spaces
        if (message.substr(0, 3).toLowerCase() === '/w ') {
            message = message.substr(3);
            var index = message.indexOf(' ');
            if (index !== -1) {
                var name = message.substr(0, index);
                message = message.substr(index + 1);
                if (name in users) {
                    if (name !== socket.username) {
                        users[socket.username].emit('your whisper', {user: name, message: message, time: gettime});
                        users[name].emit('new whisper', {user: socket.username, message: message, time: gettime});
                    } else {
                        callback('[' + gettime + '] Error! You can\'t whisper to yourself.');
                    }
                } else {
                    callback('[' + gettime + '] Error! Please enter a valid user.');
                }
            } else {
                callback('[' + gettime + '] Error! Please enter a message to whisper.');
            }
        } else if (message.substr(0, 11).toLowerCase() === '/disconnect') {
            users[socket.username].emit('disconnection');
        } else if (message.substr(0,6).toLowerCase() === '/shrug'){
			message = '¯\\_(ツ)_/¯';
			io.sockets.emit('new message', {user: socket.username, message: message, time: gettime});
		} else if (message.substr(0,2).toLowerCase() === '/w'){
			users[socket.username].emit('whisper help', gettime);
		} else if (message.substr(0, 5).toLowerCase() === '/help') {
            users[socket.username].emit('help log', gettime);
        } else {
            io.sockets.emit('new message', {user: socket.username, message: data, time: gettime});
        }
    });

    socket.on('base64 image', message => {
        var timestamp = new Date();
        var gettime = timestamp.getHours() + ':' + timestamp.getMinutes();
        io.sockets.emit('new image', {user: socket.username, file: message.file, fileName: message.fileName, time: gettime});
    });

    socket.on('base64 file', message => {
        var timestamp = new Date();
        var gettime = timestamp.getHours() + ':' + timestamp.getMinutes();
        io.sockets.emit('new file', {user: socket.username, file: message.file, fileName: message.fileName, time: gettime});
    });

    socket.on('send audio', audio => {
        var timestamp = new Date();
        var gettime = timestamp.getHours() + ':' + timestamp.getMinutes();
        io.sockets.emit('new audio', {user: socket.username, blob: audio.blob, time: gettime});
    });

    socket.on('send sticker', data => {
        var timestamp = new Date();
        var gettime = timestamp.getHours() + ':' + timestamp.getMinutes();
        io.sockets.emit('new sticker', {user: data.user, sticker: data.sticker, time: gettime});
    });

    socket.on('disconnect', () => {
        if (!socket.username) return;
        delete users[socket.username];
        updateUsernames();
        var timestamp = new Date();
        var gettime = timestamp.getHours() + ':' + timestamp.getMinutes();
		//var gettime = timestamp.getHours() + ':' + timestamp.getMinutes() + ':' + timestamp.getSeconds();
        socket.broadcast.emit('left log', {user: socket.username, time: gettime});
    });
});