var socket= io.connect();

var audioMsg = new Audio('/audio/msg.mp3');

// Delete contact
function deleteContact(user,contact) {
    socket.emit('delete contact',user,contact);
}
socket.on('delete success', function(data) {
    deleteSuccess(data);
});
// Block contact
function blockContact(user,contact) {
    socket.emit('block contact', user, contact);
}
socket.on('block success', function(data) {
    blockSuccess(data);
});

// Unblock contact
function Unblock(from, to) {
    socket.emit('unblock contact', from, to);
}

// Save Status On BDD
function SaveStatus(status, userId) {
    socket.emit('save status', status,userId);
}


// Notification windows
function SendNotification(from,msg,group) {
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
    }
    else if (Notification.permission === "granted") {
        var title,options,link;
        if (group){
            title = group.name + " - " + from.usernamePseudo;
            options = {
                body: msg,
                icon: "/img/logo_blue.png"}
            link=window.location.protocol+"//"+window.location.host+"/messages/"+group.id;
        }else{
            title = from.usernamePseudo;
            options = {
                body: msg,
                icon: "/" + from.cryptedPseudo +"/img/"+from.picture}
            link=window.location.protocol+"//"+window.location.host+"/messages/"+from.username;
        }
        var n = new Notification(title,options);
        n.onclick = function(event) {
            event.preventDefault();
            window.location.replace(link);
            n.close();
        }
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission(function (permission) {
            if (permission === "granted") {
                var notification = new Notification("Hi teeehere!");
            }
        });
    }
}


// Verify if user exists with username and/or email
function VerificationUserExists(email, username){
    socket.emit('verification user exists', email, username);
}
// User exists
socket.on('user exist', function() {
    userExist(); 
});
// User don't exists
socket.on('user not exist', function() {
    userNotExist(); 
});


// Send new status to server
function ChangeStatus(value){
    socket.emit('change status', value);
}
// Display new status
socket.on('changed status', function(data){
    StatusChanged(data);
    if (typeof StatusChangedBis === "function") { 
        StatusChangedBis(data);
    }
});



// Send message to server
function SendMsg(message,from,to,channel,type,notif){
    socket.emit('send message', message,from,to,channel, type,notif);
}
// Display message from server
socket.on('new message', function(data){  
    // Set the username if exists
    var usernamePseudo;
    if (data.from.id == data.to.to_fk) {
        if((data.to.pseudo_from == null) || (data.to.pseudo_from == '') || (data.to.pseudo_from == undefined)){
            usernamePseudo = data.from.username;
        }else{
            usernamePseudo = data.to.pseudo_from;
        }
    } else {
        if((data.to.pseudo_to == null) || (data.to.pseudo_to == '') || (data.to.pseudo_to == undefined)){
            usernamePseudo = data.from.username;
        }else{
            usernamePseudo = data.to.pseudo_to;
        }
    }
    data.from.usernamePseudo=usernamePseudo;

    // Set group info
    if (!(data.channel == data.to.username)){
        data.groupFrom={
            id:data.to.groupId,
            name:data.to.name
        }
    }

    if (typeof NewMsg === "function") { 
        NewMsg(data);    
    }else if (data.type!='info'){
        var notifMsg;
        if(data.type == 'texte' || data.type =='info' || data.type == 'url')
            notifMsg = raw(data.msg);
        else if(data.type == 'image' || data.type == 'file') {
            notifMsg = 'Send you a file !';
        }
        audioMsg.play();
        if (data.channel == data.to.username){
            AddUnreadMessage(data.to,data.from.userId);
            SendNotification(data.from, notifMsg,data.groupFrom);
        }else{
            if (data.to.public==1) AddUnreadMessageGroup(user,"c"+data.channel);
            else AddUnreadMessageGroup(user,"g"+data.channel);
            SendNotification(data.from, notifMsg,data.groupFrom);
        }
    }

});
function AddUnreadMessage(user,fromId){
    AddContactNotif(fromId);
    socket.emit('add unread message',user)
}
function AddUnreadMessageGroup(user,groupId){
    AddContactNotif(groupId);
    socket.emit('add unread message group',user,groupId)
}

function UploadFile(filename,b64,user,contacts,channel,type){
    socket.emit('upload file',filename,b64,user,contacts,channel,type);
}


// Calling alert
function CallRequest(from,to,id,video){
    socket.emit('call request',from,to,id,video);
}
function RefuseCallRequest(contact,user){
    socket.emit('refuse call request',contact,user);
}
function CancelCallRequest(from,to){
    socket.emit('cancel call request',from,to)
}
function AcceptCallRequest(contact,user,channel,video){
    socket.emit('accept call request',contact,user,channel,video)
}
// Open calling alert 
socket.on('display calling', function(contact,id,video,cryptedUser){
    isCalling(contact,id,video,cryptedUser);
});
// The slave refuse the call
socket.on('refused call', function(){
    refusedCall();
});
// The slave refuse the call
socket.on('accepted call', function(channel,contactid,video){
    acceptedCall(channel,contactid,video);
});
// The master cancel his call
socket.on('canceled call', function(from){
    canceledCall(from);
});

// Send the camera video image to the contact
function SendCam(stream,targetId){
    socket.emit('send cam',stream,targetId);
}
// Receive image of camera video 
socket.on('get cam', function(stream){
    if (typeof getVideo === "function") { 
        getVideo(stream);
    }
});


function AcceptRequest(contactId){
    socket.emit('request accept', contactId);
}
function RefuseRequest(contactId){
    socket.emit('request refuse', contactId);
}
socket.on('request accepted', function(contact, crypted) {
    deleteRequest(contact.contactId);
    addContact(contact, crypted);
});
socket.on('request refused', function(contactId) {
    deleteRequest(contactId);
});



// Create a new group
function NewGroup(from,name,contacts){
    socket.emit('new group',from, name, contacts);
}
// Add group to list
socket.on('add group', function(group) {
    addGroup(group);
});
// When user add other user to group
socket.on('user in group', function(users,contacts,group) {
    if (typeof SendMsg === "function") { 
        var who="";
        for (var i = 0; i < users.length; i++) {
            contacts.push(users[i]);
            who+=users[i].username + ",";
        }
        if (who!="")        
            SendMsg(who + " join the group",user,contacts,group.id,'info');
    }
});
// Delete contact
function deleteContactGroup(groupId,userId,contacts) {
    socket.emit('delete contact group', groupId,userId,contacts);
}
socket.on('deleted contact group', function(data) {
    if (typeof kickContact === "function") { 
        data.public=0;
        kickContact(data);
    }else{
        if (user.id==data.userId){
            removeGroup(data);
        }
    }
});
function deleteGroup(groupId,contacts){
    socket.emit('delete group', groupId,contacts);
}
socket.on('deleted group', function(data) {
    if (typeof groupDeleted === "function") { 
        groupDeleted(data);
    }else{
        removeGroup(data);
    }
});
function addUserGroup(group,newusers,contacts){
    socket.emit('add user group', group, newusers, contacts);
}
socket.on('added user group', function(data) {
    if (typeof addUsersGroup === "function") { 
        addUsersGroup(data)
    }
});


// Create a new channel
function NewChannel(from,name){
    socket.emit('new channel',from, name);
}
function deleteChannel(groupId){
    socket.emit('delete channel', groupId);
}
// Delete contact
function deleteContactChannel(groupId,userId,contacts) {
    socket.emit('delete contact channel', groupId,userId,contacts);
}
socket.on('deleted contact channel', function(data) {
    if (typeof kickContact === "function") { 
        data.public=1;
        kickContact(data);
    }else{
        if (user.id==data.userId){
            exitChannel(data);
        }
    }
});
function addUserChannel(groupId,user){
    socket.emit('add user channel', groupId,user);
}
// Add channel to list
socket.on('add channel', function(group) {
    addChannel(group);
});
// Send user to channel
socket.on('user in channel', function(user,contacts,groupId) {
    if (typeof SendMsg === "function") { 
        contacts.push(user);
        SendMsg(user.username + " join the channel",user,contacts,Number(groupId),'info');
    }
    window.location.replace(window.location.protocol+"//"+window.location.host+"/messages/"+groupId);
});
// channel name already exists
socket.on('error new channel name not free', function() {
    errorChannelName();
});
// user already got a channel
socket.on('error new channel user limit', function() {
    errorChannelUser();
});


// In case we need redirect the client
socket.on('redirect', function(destination) {
    window.location.href = destination;
});


/*
*
* Change username
*
*/
// Save Pseudonyme
function SavePseudo(from,to,pseudo) {
    socket.emit('save pseudo', from, to, pseudo);
}
// Display new pseudonyme
socket.on('changed pseudo', function(){
    ChangePseudo();
});




/*
*
* Add Contact
*
*/
function SendRequest(user, contact){
    socket.emit('add contact', user, contact);
}
// Invitation Success
socket.on('invitation success', function(data) {
    addRequest(data);
});
// Invitation pending
socket.on('invitation pending or already accepted', function() {
    invitationPending();
});