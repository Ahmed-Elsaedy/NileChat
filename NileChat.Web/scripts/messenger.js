$(document).ready(function () {

    //$.connection.hub.url = 'http://localhost:26693/signalr';
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
    $('#joinGroup').on('click', function () {
        var groupName = $('#groupName').val();
        if (groupName == '') {
            alert("Please Insert Group Name");
        } else {
            chat.server.joinGroup(groupName).done(function () { $('#groupName').val(''); });
        }
    });

    $('#sendBtn').on('click', function () {
        var msg = $('#message-to-send').val();
        if (msg == '') {
            alert('Please Insert Your Message');
        } else {
            if (document.targetClientId != '') {
                chat.server.sendMessage(document.targetClientId, msg)
                           .done(function () { $('#message-to-send').val(''); });
            }
            else if (document.targetGroupName != '') {
                chat.server.sendGroupMessage(document.targetGroupName, msg)
                       .done(function () { $('#message-to-send').val(''); });
            }
        }
    });

    chat.client.updateOnlinePeople = function (users) {
        $('.list').empty();
        $(users).each(function (i, d) {
            var node = $('<li class="clearfix"><div class="about"><a href="#"><span id="name"></span> <span id="counter" class="badge badge-light"></span></a><div class="status"><i class="fa fa-circle online"></i> User</div></div></li>');
            node.find('#name').html(d.DisplayName);
            $('.list').append(node);

            var anchor = node.find('a');
            anchor.attr('connid', d.ConnectionId);
            anchor.on('click', function () {
                var connId = $(this).attr('connid');
                var userName = $(this).find('span[id="name"]').text();

                document.targetGroupName = '';

                chat.server.openMyThreadWith(connId)
                    .done(function () {
                        document.targetClientId = connId;
                        var target = $('ul.list').find('a[connid="' + connId + '"]')
                                     .find('span[id="counter"]');
                        target.html('');
                        $('.chat-with').text('Chat with ' + userName);
                    });
            });
        });
    };

    chat.client.threadOpened = function (messages) {
        var meTemplate = '<li><div class="message-data" style=""><span class="message-data-name"><i class="fa fa-circle online"></i> <span id="message-owner"></span></span><span id="message-date" class="message-data-time">10:12 AM, Today</span></div><div id="message-body" class="message my-message" style=""></div></li>';
        var otherTemplate = '<li class="clearfix"><div class="message-data align-right" style=""><span id="message-date" class="message-data-time"></span>&nbsp; &nbsp;<span id="message-owner" class="message-data-name">Olia</span>&nbsp; &nbsp;<i class="fa fa-circle me"></i></div><div id="message-body" class="message other-message float-right" style=""></div></li>';
        $('.chat-history ul').empty();
        $(messages).each(function (i, m) {

            var template = null;
            if (m.SenderId == $.connection.messengerHub.connection.id) {
                template = $(meTemplate);
            } else {
                template = $(otherTemplate);
            }
            template.find('#message-owner').text(m.SenderName);
            template.find('#message-date').text('Today');
            template.find('#message-body').text(m.Body);
            $('.chat-history ul').append(template);
        });

        $('#chatBox div').show();
    };

    chat.client.groupThreadOpened = function (messages) {
        var meTemplate = '<li><div class="message-data" style=""><span class="message-data-name"><i class="fa fa-circle online"></i> <span id="message-owner"></span></span><span id="message-date" class="message-data-time">10:12 AM, Today</span></div><div id="message-body" class="message my-message" style=""></div></li>';
        var otherTemplate = '<li class="clearfix"><div class="message-data align-right" style=""><span id="message-date" class="message-data-time"></span>&nbsp; &nbsp;<span id="message-owner" class="message-data-name">Olia</span>&nbsp; &nbsp;<i class="fa fa-circle me"></i></div><div id="message-body" class="message other-message float-right" style=""></div></li>';
        $('.chat-history ul').empty();


        var myId = $.connection.messengerHub.connection.id;
        $(messages).each(function (i, m) {
            var template = null;
            if (myId == m.SenderId) {
                template = $(meTemplate);
            } else {
                template = $(otherTemplate);
            }
            template.find('#message-owner').text(m.SenderName);
            template.find('#message-date').text('Today');
            template.find('#message-body').text(m.Message);
            $('.chat-history ul').append(template);
        });

        $('#chatBox div').show();
    };


    chat.client.newMessage = function (connId, userName) {
        if (connId == document.targetClientId) {
            chat.server.openMyThreadWith(connId)
                .done(function () {
                    $('.chat-with').text('Chat With User - ' + userName);
                });
        } else {
            var target = $('ul.list').find('a[connid="' + connId + '"]')
                                     .find('span[id="counter"]');
            var counter = 0;
            if (target.html() != "") {
                counter = parseInt(target.html());
            }
            target.html(++counter);
        }
    };

    chat.client.newGroupMessage = function (groupName) {
        if (groupName == document.targetGroupName) {
            chat.server.openGroupThread(groupName)
                .done(function () {
                    $('.chat-with').text('Chat With Group - ' + groupName);
                });
        } else {
            var target = $('ul.list-groups').find('a[gName="' + groupName + '"]')
                                     .find('span[id="counter"]');
            var counter = 0;
            if (target.html() != "") {
                counter = parseInt(target.html());
            }
            target.html(++counter);
        }
    };

    chat.client.updateOnlineGroups = function (groups) {
        $('.list-groups').empty();
        $(groups).each(function (i, d) {
            var node = $('<li class="clearfix"><div class="about"><a href="#"><span id="name"></span> <span id="counter" class="badge badge-light"></span></a><div class="status"><i class="fa fa-circle online"></i> Group</div></div></li>');
            node.find('#name').html(d.Name);
            $('.list-groups').append(node);

            var anchor = node.find('a');
            anchor.attr('gName', d.Name);
            anchor.on('click', function () {
                var gName = $(this).attr('gName');
                document.targetClientId = '';
                document.targetGroupName = gName;

                chat.server.openGroupThread(gName)
                    .done(function () {
                        var target = $('ul.list-groups').find('a[gName="' + gName + '"]')
                                     .find('span[id="counter"]');
                        target.html('');
                        $('.chat-with').text('Chat with ' + gName);
                    });
            });
        });

    };
});
