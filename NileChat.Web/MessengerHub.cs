using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using Microsoft.AspNet.SignalR;

namespace NileChat.Server
{
    public class MessengerHub : Hub
    {
        static List<User> hubUsers = new List<User>();
        static List<Message> Messages = new List<Message>();
        static List<GroupUser> GroupUsers = new List<GroupUser>();
        static List<GroupMessage> GroupMessages = new List<GroupMessage>();

        public override Task OnConnected()
        {
            Groups.Add(Context.ConnectionId, "Online");
            hubUsers.Add(new User() { ConnectionId = Context.ConnectionId });
            return base.OnConnected();
        }

        public void Register(string name)
        {
            var local = hubUsers.Single(x => x.ConnectionId == Context.ConnectionId);
            local.DisplayName = name;
            Clients.All.UpdateOnlinePeople(hubUsers);
        }

        public void OpenMyThreadWith(string connId)
        {
            var msgs = Messages.Where(x =>
                (x.SenderId == Context.ConnectionId && x.ReceiverId == connId) ||
                (x.SenderId == connId && x.ReceiverId == Context.ConnectionId))
                               .OrderBy(x => x.Date).ToList();
            Clients.Caller.threadOpened(msgs);
        }

        public void SendMessage(string connId, string message)
        {
            var msg = new Message()
            {
                SenderId = Context.ConnectionId,
                ReceiverId = connId,
                Body = message,
                Date = DateTime.Now
            };

            var sender = hubUsers.SingleOrDefault(x => x.ConnectionId == Context.ConnectionId);
            msg.SenderName = sender == null ? "Unkown" : sender.DisplayName;

            var receiver = hubUsers.SingleOrDefault(x => x.ConnectionId == connId);
            msg.ReceiverName = receiver == null ? "Unkown" : receiver.DisplayName;

            Messages.Add(msg);

            var msgs = Messages.Where(x =>
                        x.SenderId == Context.ConnectionId ||
                        x.ReceiverId == Context.ConnectionId ||
                        x.SenderId == connId ||
                        x.ReceiverId == connId)
                    .OrderBy(x => x.Date).ToList();

            Clients.Caller.threadOpened(msgs);
            Clients.Client(connId).newMessage(Context.ConnectionId, msg.SenderName);
        }

        public void JoinGroup(string groupName)
        {
            Groups.Add(Context.ConnectionId, groupName);
            GroupUser targetGroup = GroupUsers.SingleOrDefault(x =>
                        x.Group == groupName &&
                        x.User.ConnectionId == Context.ConnectionId);
            if (targetGroup == null)
            {
                targetGroup = new GroupUser();
                targetGroup.Group = groupName;
                targetGroup.User = hubUsers.Single(x => x.ConnectionId == Context.ConnectionId);
                GroupUsers.Add(targetGroup);
            }

            Clients.Caller.updateOnlineGroups(GroupUsers
                .Where(x => x.User.ConnectionId == Context.ConnectionId)
                .Select(x => new { Name = x.Group }));
        }

        public void SendGroupMessage(string groupName, string message)
        {
            var msg = new GroupMessage()
            {
                SenderId = Context.ConnectionId,
                Message = message,
                Date = DateTime.Now,
                Group = groupName
            };

            var sender = hubUsers.SingleOrDefault(x => x.ConnectionId == Context.ConnectionId);
            msg.SenderName = sender == null ? "Unkown" : sender.DisplayName;
            GroupMessages.Add(msg);

            var msgs = GroupMessages.Where(x => x.Group == groupName).OrderBy(x => x.Date);
            Clients.Caller.groupThreadOpened(msgs);
            var otherClients = GroupUsers.Where(x => x.Group == groupName).Select(x => x.User.ConnectionId).ToList();
            otherClients.Remove(Context.ConnectionId);
            Clients.Clients(otherClients).newGroupMessage(groupName);
        }


        public void OpenGroupThread(string groupName)
        {
            var msgs = GroupMessages.Where(x => x.Group == groupName).OrderBy(x => x.Date).ToList();
            Clients.Caller.groupThreadOpened(msgs);
        }

        public override Task OnDisconnected(bool stopCalled)
        {
            Groups.Remove(Context.ConnectionId, "Online");
            var local = hubUsers.SingleOrDefault(x => x.ConnectionId == Context.ConnectionId);
            if (local != null) hubUsers.Remove(local);
            Clients.All.updateOnlinePeople(hubUsers);

            GroupUsers.Where(x => x.User.ConnectionId == Context.ConnectionId).ToList()
                      .ForEach(x =>
                      {
                          Groups.Remove(x.User.ConnectionId, x.Group);
                          GroupUsers.Remove(x);
                      });

            return base.OnDisconnected(stopCalled);
        }
    }

    public class User
    {
        public string DisplayName { get; set; }
        public string ConnectionId { get; set; }

    }

    public class Message
    {
        public string SenderId { get; set; }
        public string SenderName { get; set; }
        public string ReceiverId { get; set; }
        public string ReceiverName { get; set; }
        public DateTime Date { get; set; }
        public string Body { get; set; }
    }

    public class GroupMessage
    {
        public string SenderId { get; set; }
        public string SenderName { get; set; }
        public string Message { get; set; }
        public string Group { get; set; }
        public DateTime Date { get; set; }
    }


    public class GroupUser
    {
        public string Group { get; set; }
        public User User { get; set; }
    }
}