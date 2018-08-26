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
        public static List<User> hubUsers = new List<User>();
        public static List<Message> Messages = new List<Message>();

        public override Task OnConnected()
        {
            Groups.Add(Context.ConnectionId, "Online");
            hubUsers.Add(new User() { ConnectionId = Context.ConnectionId, DisplayName = Context.ConnectionId });
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

        public override Task OnDisconnected(bool stopCalled)
        {
           Groups.Remove(Context.ConnectionId, "Online");
            var local = hubUsers.SingleOrDefault(x => x.ConnectionId == Context.ConnectionId);
            if(local != null) hubUsers.Remove(local);
            Clients.All.UpdateOnlinePeople(hubUsers);
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
}