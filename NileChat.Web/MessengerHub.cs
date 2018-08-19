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
            var msgs = Messages.Where(x => x.SenderId == Context.ConnectionId || x.ReceiverId == Context.ConnectionId)
                               .OrderBy(x => x.Date).ToList();
            Clients.Caller.threadOpened(msgs);
        }

        public override Task OnDisconnected(bool stopCalled)
        {
            Groups.Remove(Context.ConnectionId, "Online");
            var local = hubUsers.Single(x => x.ConnectionId == Context.ConnectionId);
            hubUsers.Remove(local);
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
        public string ReceiverId { get; set; }
        public DateTime Date { get; set; }
        public string Body { get; set; }
    }
}