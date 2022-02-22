$($ => {
    navigator.mediaDevices.getUserMedia({
        audio: true
    }).then(stream => {
        handlerFunction(stream);
    });

    var socket = io.connect(),
        typing = false,
        timeout = undefined,
        $login__form = $('#login__form'),
        $login__error = $('#login__error'),
        $login__username = $('#login__username'),
        $message__form = $('#send__message'),
        $message__input = $('#input__message'),
        $upload__file = $('#upload__file'),
        $upload__file2 = $('#upload__file2'),
        $chat__box = $('#chat__box'),
        $users__div = $('#users'),
        $emojis = $('#emojis'),
        $colors = $('#colors'),
        output_format = 'jpg';

    // var emojis__list = ['&#128512;', '&#128513;', '&#128514;', '&#128515;', '&#128516;',
    //                     '&#128517;', '&#128518;', '&#128519;', '&#128520;', '&#128521;',
    //                     '&#128522;', '&#128523;', '&#128524;', '&#128525;', '&#128526;',
    //                     '&#128527;', '&#128528;', '&#128529;', '&#128530;', '&#128531;',
    //                     '&#128532;', '&#128533;', '&#128534;', '&#128535;', '&#128536;',
    //                     '&#128537;', '&#128538;', '&#128539;', '&#128540;', '&#128541;',
    //                     '&#128542;', '&#128543;', '&#128544;', '&#128545;', '&#128546;',
    //                     '&#128547;', '&#128548;', '&#128549;', '&#128550;', '&#128551;',
    //                     '&#128552;', '&#128553;', '&#128554;', '&#128555;', '&#128556;',
    //                     '&#128557;', '&#128558;', '&#128559;', '&#128560;', '&#128561;',
    //                     '&#128562;', '&#128563;', '&#128564;', '&#128565;', '&#128566;',
    //                     '&#128567;', '&#128568;', '&#128569;', '&#128570;', '&#128571;',
    //                     '&#128572;', '&#128573;', '&#128574;', '&#128575;', '&#128576;',
    //                     '&#128577;', '&#128578;', '&#128579;', '&#128580;', '&#128581;',
    //                     '&#128582;', '&#128583;', '&#128584;', '&#128585;', '&#128586;',
    //                     '&#128587;', '&#128588;', '&#128589;', '&#128590;', '&#128591;',
    //                     '&#129296;', '&#129297;', '&#129298;', '&#129299;', '&#129300;',
    //                     '&#129301;', '&#129302;', '&#129303;', '&#129304;', '&#129305;',
    //                     '&#129306;', '&#129307;', '&#129308;', '&#129309;', '&#129310;',
    //                     '&#129312;', '&#129313;', '&#129314;', '&#129315;', '&#129316;',
    //                     '&#129317;', '&#129318;', '&#129319;'
    //                 ];
    const emojisList = (data) => {
        for (i = 0; i < data.length; i++) {
            var $emoji__span = document.createElement('span');
            $emoji__span.setAttribute('onclick', 'insertEmoji("' + data[i] + '")');
            $emoji__span.innerHTML = '<img width=20 height=20 draggable="false" src="/emojis/' + data[i] + '"/>';
            var folder__data = data[i].split('/');
            console.log(folder__data);
            folder__data = 'emojis_' + folder__data[0];
            console.log(folder__data);
            document.getElementById(folder__data).append($emoji__span);
        }
    }

    const stickersList = (data) => { 
        for (i = 0; i < data.length; i++) {
            var $sticker__span = document.createElement('img');
            $sticker__span.setAttribute('onclick', 'insertSticker("' + data[i] + '")');
            $sticker__span.setAttribute('src', '/stickers/' + data[i]);
            $sticker__span.setAttribute('height', '75');
            $sticker__span.setAttribute('width', '75');
            $sticker__span.setAttribute('draggable', 'false');
            var folder__data = data[i].split('/');
            folder__data = 'stickers_' + folder__data[0];
            document.getElementById(folder__data).append($sticker__span);
        }
    }

    var colors__list = ['red', 'blue', 'yellow', 'white', 'pink', 'lightblue', 'orange', 'grey'];
    for (i = 0; i < colors__list.length; i++) {
        var $color__div = document.createElement('div');
        $color__div.setAttribute('onclick', 'changeColor(\'' + colors__list[i] + '\')');
        $color__div.classList.add('color__div');
        $color__div.style.backgroundColor = colors__list[i];
        $colors.append($color__div);
    }

    $(document).keydown( event => {
        if (event && !$message__input.is(":focus")) {
            $message__input.focus();
        }
    });
    
    $login__form.submit(e => {
        e.preventDefault();
        var $login__username__replaced = $login__username.val();
        $login__username__replaced = $login__username__replaced.replace(' ', '_');
        socket.emit('new user', $login__username__replaced, data => {
            if (data) {
                $('#login__wrap').hide();
                $('#content__wrap').show();
                document.cookie = 'username=' + $login__username__replaced + ';';
            } else {
                document.getElementById('beepError').play();
                $login__error.html('This username is already taken! Try another.');
            }
        });
        $login__username.val('');
    });

    socket.on('usernames', data => {
        var html = '';
        for (i = 0; i < data.length; i++) {
            html += '- ' + data[i] + '<br/>';
        }
        $users__div.html(html);
    });
    
    $message__input.keypress(e => {
        if (e.which != 13) {
            typing = true;
            socket.emit('typing', {user: socket.username, typing: true});
            clearTimeout(timeout);
            timeout = setTimeout(typingTimeout, 1000);
        } else {
            clearTimeout(timeout);
            typingTimeout();
        }
    });
    const typingTimeout = () => {
        typing = false;
        socket.emit('typing', {user: socket.username, typing: false});
    }

    $message__form.submit(e => {
        e.preventDefault();
        if ($message__input && document.getElementById('input__message').innerHTML) {
            var check = document.getElementById('input__message').innerHTML.trim();
            if (!check == ' ') {
                socket.emit('send message', document.getElementById('input__message').innerHTML, data => {
                    document.getElementById('beepError').play();
                    $chat__box.append('<li class="error">' + data + '</li>');
                });
                document.getElementById('input__message').innerHTML = '';
            }
        }
        event.preventDefault();
    });
    $message__input.keydown(event => {
        if (event.which == 13) {
            if ($message__input && document.getElementById('input__message').innerHTML) {
                var check = document.getElementById('input__message').innerHTML.trim();
                if (!check == ' ') {
                    socket.emit('send message', document.getElementById('input__message').innerHTML, data => {
                        document.getElementById('beepError').play();
                        $chat__box.append('<li class="error">' + data + '</li>');
                    });
                    document.getElementById('input__message').innerHTML = '';
                }
            }
            event.preventDefault();
        }
    });

    $upload__file.change(e => {
        var preview = document.getElementById('source_image');
        var previewCompress = document.getElementById('result_compress');
        var file = e.originalEvent.target.files[0];
        var reader = new FileReader();
        reader.addEventListener('load', function(e) {
            preview.src = e.target.result;
            preview.onload = function() {
                compressFile(this, previewCompress, file);
            }
        });
        reader.readAsDataURL(file);
        $upload__file.val('');
    });
    function compressFile(loadedData, preview, file) {
        var result_image = document.getElementById('result_compress_image');
        var quality = 30;
        var mime_type = 'image/jpeg';
        if (typeof output_format !== 'undefined' && output_format == 'png') {
            mime_type = 'image/png';
        }
        var cvs = document.createElement('canvas');
        cvs.width = loadedData.width;
        cvs.height = loadedData.height;
        var ctx = cvs.getContext('2d').drawImage(loadedData, 0, 0);
        var newImageData = cvs.toDataURL(mime_type, quality / 100);
        var result_image_obj = new Image();
        result_image_obj.src = newImageData;
        result_image.src = result_image_obj.src;
        result_image.onload = function() {}

        if (file.size > 1048576) {
            alert('Image too big, limit: 5Mb');
        } else {
            var message = {};
            message.username = socket.username;
            message.file = result_image.src;
            message.fileName = file.name;
            socket.emit('base64 image', message);
        }
    }

    $upload__file2.change(e => {
        var data = e.originalEvent.target.files[0];
        if (data.size > 734003) {
            alert('file too big, limit: 700Kb');
        } else {
            readThenSendFile2(data);
        }
        $upload__file2.val('');
    });
    const readThenSendFile2 = data => {
        var reader = new FileReader();
        reader.onload = evt => {
            var message = {};
            message.username = socket.username;
            message.file = evt.target.result;
            message.fileName = data.name;
            socket.emit('base64 file', message);
        }
        reader.readAsDataURL(data);
    }

    function handlerFunction(stream) {
        rec = new MediaRecorder(stream);
        rec.ondataavailable = e => {
            audioChunks.push(e.data);
            if (rec.state == 'inactive') {
                let blob = new Blob(audioChunks, {type: 'audio/mp3'});
                document.getElementById('recordedAudio').src = URL.createObjectURL(blob);
                document.getElementById('recordedAudio').controls = true;
                document.getElementById('recordedAudio').autoplay = false;
                var audio = {};
                audio.username = socket.username;
                audio.blob = URL.createObjectURL(blob);
                socket.emit('send audio', audio);
                sendData(blob);
            }
        }
    }
    function sendData(data) {}
    document.getElementById('record').onclick = e => {
        document.getElementById('record').disabled = true;
        document.getElementById('stopRecord').disabled=false;
        audioChunks = [];
        rec.start();
    }
    document.getElementById('stopRecord').onclick = e => {
        document.getElementById('record').disabled = false;
        document.getElementById('stopRecord').disabled=true;
        stop.disabled=true;
        rec.stop();
    }

    socket.on('stickers list', data => {
        stickers__saved = data.split(',');
        stickersList(stickers__saved);
    });

    socket.on('emojis list', data => {
        emojis__saved = data.split(',');
        emojisList(emojis__saved);
    });

    socket.on('you joined', data => {
        document.getElementById('beepLog').play();
        $chat__box.append('<li class="log">[' + data + '] <b>You</b> joined the chat!</li>');
        $chat__box.animate({scrollTop: document.body.scrollHeight},"fast");
    });
    socket.on('joined log', data => {
        document.getElementById('beepLog').play();
        $chat__box.append('<li class="log">[' + data.time + '] <b>' + data.user + '</b> joined the chat!</li>');
        $chat__box.animate({scrollTop: document.body.scrollHeight},"fast");
    });
    socket.on('left log', data => {
        document.getElementById('beepLog').play();
        $chat__box.append('<li class="log">[' + data.time + '] <b>' + data.user + '</b> left the chat!</li>');
        $chat__box.animate({scrollTop: document.body.scrollHeight},"fast");
    });
    
    socket.on('display', data => {
        if (data.typing == true) {
            $('.typing').text(data.user + ' is typing...');
        } else {
            $('.typing').text('.');
        }
    });

    socket.on('new message', data => {
        document.getElementById('beepMessage').play();
        $chat__box.append('<li class="message">[' + data.time + '] <b>' + data.user + ': </b>' + data.message + '</li>');
        $chat__box.animate({scrollTop: document.body.scrollHeight},"fast");
    });

    socket.on('help log', data => {
        document.getElementById('beepError').play();
        $chat__box.append('<li class="log">[' + data + ']&nbsp;&nbsp;Help:</li>');
        $chat__box.append('<li class="log">/help - THIS</li>');
        $chat__box.append('<li class="log">/w [USER] [MESSAGE] - Whisper to someone</li>');
        $chat__box.append('<li class="log">/shrug - Shrug Emoji</li>');
        $chat__box.append('<li class="log">/disconnect - Disconnect from chat</li>');
        $chat__box.animate({scrollTop: document.body.scrollHeight},"fast");
    });

    socket.on('your whisper', data => {
        document.getElementById('beepMessage').play();
        $chat__box.append('<li class="whisper">[' + data.time + '] to <b>' + data.user + ': </b>' + data.message + '</li>');
        $chat__box.animate({scrollTop: document.body.scrollHeight},"fast");
    });
    socket.on('new whisper', data => {
        document.getElementById('beepMessage').play();
        $chat__box.append('<li class="whisper">[' + data.time + '] from <b>' + data.user + ': </b>' + data.message + '</li>');
        $chat__box.animate({scrollTop: document.body.scrollHeight},"fast");
    });
    socket.on('whisper help', data => {
        document.getElementById('beepError').play();
        $chat__box.append('<li class="log">[' + data + '] Usage: /w [USER] [MESSAGE]</li>');
        $chat__box.animate({scrollTop: document.body.scrollHeight},"fast");
    })

    socket.on('new image', data => {
        document.getElementById('beepMessage').play();
        $chat__box.append('<li class="image">[' + data.time + '] <b>' + data.user + ' </b>sent <i>' + data.fileName + '</i>:<br/><div class="image__container" onmouseover="this.lastChild.style.display=\'inline-block\'" onmouseout="this.lastChild.style.display=\'none\'"><img height=200 src="' + data.file + '"/><a class="image__download" href="' + data.file + '" download="' + data.fileName + '"><button>Download</button></a></li>');
        $chat__box.animate({scrollTop: document.body.scrollHeight},"fast");
    });

    socket.on('new file', data => {
        document.getElementById('beepMessage').play();
        $chat__box.append('<li class="file">[' + data.time + '] <b>' + data.user + ' </b>sent a file:<br/><a href="' + data.file + '" download="' + data.fileName + '">' + data.fileName + '<span>&nbsp;=> Download</span></a></li>');
        $chat__box.animate({scrollTop: document.body.scrollHeight},"fast");
    });

    socket.on('new audio', data => {
        document.getElementById('beepMessage').play();
        $chat__box.append('<li class="audio">[' + data.time + '] <b>' + data.user + ' </b>sent a voice message:<br/><audio src="' + data.blob + '" controls></audio></li>');
        $chat__box.animate({scrollTop: document.body.scrollHeight},"fast");
    });

    socket.on('new sticker', data => {
        document.getElementById('beepMessage').play();
        $chat__box.append('<li class="sticker">[' + data.time + '] <b>' + data.user + ': </b><br/><img draggable="false" width=50 height=50 src="/stickers/' + data.sticker + '"/></li>');
        $chat__box.animate({scrollTop: document.body.scrollHeight},"fast");
    });

    socket.on('disconnection', () => {
        window.location.reload();
    });

    socket.on('disconnect', () => {
        window.location.reload();
    });
});