$(document).ready(function () {
    var chat = $.connection.messengerHub;

    chat.client.updateOnlinePeople = function (users) {
        $('.list').empty();
        $(users).each(function (i, d) {
            var node = $('<li class="clearfix"><div class="about"><a href="#"><div class="name"></div></a><div class="status"><i class="fa fa-circle online"></i> online</div></div></li>');
            node.find('.name').html(d.DisplayName);
            $('.list').append(node);
            
            var anchor = node.find('a');
            anchor.attr('connId', d.ConnectionId);
            anchor.on('click', function () {
                chat.server.openMyThreadWith($(this).attr('connId')).done(alert('dfdf'));
            });
        })
    };

    chat.client.threadOpened = function (messages) {

    };

    $.connection.hub.start()
        .done(function () { chat.server.register(prompt('Name?')); })
        .fail(function (error, er) { console.log(error); console.log(er); });
});
