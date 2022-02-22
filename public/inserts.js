var socket = io.connect();

const insertEmoji = emoji => {
    var emoji__img = document.createElement('img');
    emoji__img.setAttribute('src', '/emojis/' + emoji);
    emoji__img.setAttribute('height', '20');
    emoji__img.setAttribute('width', '20');
    emoji__img.setAttribute('draggable', 'false');
    console.log(emoji__img);
    document.getElementById('input__message').appendChild(emoji__img);
    $('#input__message').focus();
    var range, selection;
    if(document.createRange) { //Firefox, Chrome, Opera, Safari, IE 9+
        range = document.createRange();
        range.selectNodeContents(document.getElementById('input__message'));
        range.collapse(false);
        selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

const insertSticker = (sticker) => {
    var cookies = decodeURIComponent(document.cookie);
    var cookies__list = cookies.split(';');
    var cookie__username = cookies__list[0];
    var username = cookie__username.split('=');
    var username = username[1];
    socket.emit('send sticker', {user: username, sticker: sticker});
}

const changeColor = (color) => {
    document.getElementById('chat__wrap').style.backgroundColor = color;
}