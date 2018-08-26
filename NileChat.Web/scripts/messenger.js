$(document).ready(function () {
    var chat = $.connection.messengerHub;

    document.targetClientId = null;
    document.targetGroupName = null;
    document.targetMode = null;
    document.username = null;

    $('#newGroupItem, #chatContainer, #usernameItem').hide();
    $('#registerBtn').on('click', function () {
        var userName = $('#username').val();
        if (userName == "") {
            alert("Please Insert Your Name");
        } else {
            $.connection.hub.start()
                .done(function () {
                    chat.server.register(userName);
                    document.username = userName;

                    $('#newGroupItem, #chatContainer, #usernameItem').show();
                    $('#newUserItem').hide();
                    $('#chatBox div').hide();
                    $('#clientName').text('Welcome, ' + userName + '!');
                })
                .fail(function (error, er) { console.log(error); console.log(er); });
        }
    });

    $('#sendBtn').on('click', function () {
        var msg = $('#message-to-send').val();
        if (msg == '') {
            alert('Please Insert Your Message');
        } else {
            chat.server.sendMessage(document.targetClientId, msg);
        }
    });

    chat.client.updateOnlinePeople = function (users) {
        $('.list').empty();
        $(users).each(function (i, d) {
            var node = $('<li class="clearfix"><div class="about"><a href="#"><span id="name"></span> <span id="counter" class="badge badge-light"></span></a><div class="status"><i class="fa fa-circle online"></i> online</div></div></li>');
            node.find('#name').html(d.DisplayName);
            $('.list').append(node);

            var anchor = node.find('a');
            anchor.attr('connid', d.ConnectionId);
            anchor.on('click', function () {
                var connId = $(this).attr('connid');
                var userName = $(this).find('div').text();
                chat.server.openMyThreadWith(connId)
                    .done(function () {
                        document.targetClientId = connId;
                        $('.chat-with').text('Chat with ' + userName);
                    });
            });
        });
    };

    chat.client.threadOpened = function (messages) {

        var meTemplate = '<li><div class="message-data" style=""><span class="message-data-name"><i class="fa fa-circle online"></i> <span id="message-owner"></span></span><span id="message-date" class="message-data-time">10:12 AM, Today</span></div><div id="message-body" class="message my-message" style=""></div></li>';
        var otherTemplate = '<li class="clearfix"><div class="message-data align-right" style=""><span id="message-date" class="message-data-time"></span>&nbsp; &nbsp;<span id="message-owner" class="message-data-name">Olia</span><i class="fa fa-circle me"></i></div><div id="message-body" class="message other-message float-right" style=""></div></li>';
        $('.chat-history ul').empty();
        $(messages).each(function (i, m) {

            var template = null;
            if (m.SenderId == $.connection.messengerHub.connection.id) {
                template = $(meTemplate);
            } else {
                template = $(otherTemplate);
            }
            template.find('#message-owner').text(m.SenderName);
            template.find('#message-date').text('today');
            template.find('#message-body').text(m.Body);
            $('.chat-history ul').append(template);

            console.log(m);
        });


        $('#chatBox div').show();
    };

    chat.client.newMessage = function (connId, userName) {
        if (connId == document.targetClientId) {
            chat.server.openMyThreadWith(connId)
                .done(function () {
                    $('.chat-with').text('Chat with ' + userName);
                });
        } else {
            var sel = 'a[connid="' + connId + '"]';
            console.log(sel);
            var d = $('ul .list').find(sel);
            $(d).find('#id').html('1');
            console.log(d);
        }
    };
});
