module.exports = (app,io,fs,mkdirp,User,Contact,Group,Channel) => {

var users = [];
var connections = [];

// For videoHi 
var channels = {};
var sockets = {};

/** 
 * Connection
 * 
 */
io.sockets.on('connection',function(socket){
	// Get the user session
	var sess = socket.request.session;
	var user=sess.user;
	connections.push(socket);

	// For video
    socket.channels = {};
    sockets[socket.id] = socket;

	/** 
	 * Initializing
	 * 
	 */
	if (user){
		// Verify users already connected
		indexOf = users.map(function(x) {return x.id; }).indexOf(user.id);
		var userSearch = users[indexOf];
		if (userSearch){
			userSearch.socketid.push(socket.id);
		}else{
		  	var client ={
				id:user.id,
				username:user.username,
				socketid:[socket.id],
			};
			users.push(client);

		}
		getlaststatus(user.id);
    }
    function getlaststatus(id) {
    	// Get Status user
		User.getLastStatus(id, function(result) {
			if(result.lastStatus == "Offline") {
				User.changeStatus("Online",id);
				updateOthersStatus("Online",id);
			} else {
				User.changeStatus(result.lastStatus,id);
				updateOthersStatus(result.lastStatus,id);
			}
			User.putLastStatus(id);
		});
    }



	/** 
	 * Disconnect
	 * 
	 */
	socket.on('disconnect',function(data){
		if (user){
			setTimeout(disconnect,3000);
		}
		connections.splice(connections.indexOf(socket),1);
	});
	function disconnect(){
		indexOf = users.map(function(x) {return x.id; }).indexOf(user.id);
		var userSearch = users[indexOf];
		if (userSearch){
			userSearch.socketid.splice(userSearch.socketid.indexOf(socket.id),1);

		}

		if (userSearch.socketid.length<=0){
			putstatus(user.id);
		}
		// For video
    	for (var channel in socket.channels) {
            part(channel);
        }
        delete sockets[socket.id];
	}
	function putstatus(userId){
		User.putLastStatus(userId);	
		User.changeStatus("Offline",userId);
		updateOthersStatus("Offline",userId);
 	};




	/** 
	 * Video/Audio Call
	 * 
	 */
	socket.on('call request',function(from,tos,id,video){
		tos.forEach(function(to) {
			indexOf = users.map(function(x) {return x.id; }).indexOf(to.id);
			var userSearchTo = users[indexOf];
			if (userSearchTo){
		  		for (var i = 0; i < userSearchTo.socketid.length; i++) {
		    		io.to(userSearchTo.socketid[i]).emit('display calling',from,id,video,app.locals.encrypt(from.username));		  		
		    	}
			}
		});
	});
	socket.on('cancel call request',function(from,tos){
		tos.forEach(function(to) {
			indexOf = users.map(function(x) {return x.id; }).indexOf(to.id);
			var userSearchTo = users[indexOf];
			if (userSearchTo){
		  		for (var i = 0; i < userSearchTo.socketid.length; i++) {
		    		io.to(userSearchTo.socketid[i]).emit('canceled call',from);		  		
		    	}
			}
		});
	});
	socket.on('refuse call request',function(contact,user){
		indexOf = users.map(function(x) {return x.id; }).indexOf(contact.id);
		var userSearch = users[indexOf];
		if (userSearch){
	  		for (var i = 0; i < userSearch.socketid.length; i++) {
	    		io.to(userSearch.socketid[i]).emit('refused call',user.id);
	    	}
		}
	});
	socket.on('accept call request',function(contact,user,channel,video){
		indexOf = users.map(function(x) {return x.id; }).indexOf(contact.id);
		var userSearch = users[indexOf];
		if (userSearch){
	  		for (var i = 0; i < userSearch.socketid.length; i++) {
	    		io.to(userSearch.socketid[i]).emit('accepted call',channel,user.id,video);
	    	}
		}
	});
    socket.on('join', function (config) {
        //console.log("["+ socket.id + "] join ", config);
        var channel = config.channel;
        var userdata = config.userdata;

        if (channel in socket.channels) {
            ///console.log("["+ socket.id + "] ERROR: already joined ", channel);
            return;
        }

        if (!(channel in channels)) {
            channels[channel] = {};
        }

        for (id in channels[channel]) {
            channels[channel][id].emit('addPeer', {'peer_id': socket.id, 'should_create_offer': false});
            socket.emit('addPeer', {'peer_id': id, 'should_create_offer': true});
        }

        channels[channel][socket.id] = socket;
        socket.channels[channel] = channel;
    });
    function part(channel) {
        //console.log("["+ socket.id + "] part ");

        if (!(channel in socket.channels)) {
            //console.log("["+ socket.id + "] ERROR: not in ", channel);
            return;
        }

        delete socket.channels[channel];
        delete channels[channel][socket.id];

        for (id in channels[channel]) {
            channels[channel][id].emit('removePeer', {'peer_id': socket.id});
            socket.emit('removePeer', {'peer_id': id});
        }
    }
    socket.on('part', part);

    socket.on('relayICECandidate', function(config) {
        var peer_id = config.peer_id;
        var ice_candidate = config.ice_candidate;
        //console.log("["+ socket.id + "] relaying ICE candidate to [" + peer_id + "] ", ice_candidate);

        if (peer_id in sockets) {
            sockets[peer_id].emit('iceCandidate', {'peer_id': socket.id, 'ice_candidate': ice_candidate});
        }
    });

    socket.on('relaySessionDescription', function(config) {
        var peer_id = config.peer_id;
        var session_description = config.session_description;
        //console.log("["+ socket.id + "] relaying session description to [" + peer_id + "] ", session_description);

        if (peer_id in sockets) {
            sockets[peer_id].emit('sessionDescription', {'peer_id': socket.id, 'session_description': session_description});
        }
    });



	/**
	 * Upload File
	 *
	 */
	socket.on('upload file', function(filename,base64,from,to,channel,type){
    	var dir="./data/"+app.locals.encrypt(from.username)+"/uploads/";

		// Some modification on the base64 are required
		var edit_base64=base64;
		edit_base64=edit_base64.replace(/^data:image\/jpeg;base64,/, "");
		edit_base64=edit_base64.replace(/^data:image\/jpg;base64,/, "");
		edit_base64=edit_base64.replace(/^data:image\/png;base64,/, "");

		// Set up the directory
		mkdirp(dir, function (err) {
			if (err) console.error(err)
			// Write the file
			fs.writeFile(dir+filename, edit_base64,'base64', function(err) {
				if(err) return console.log(err);
			});
		});

		// Send message
		message = dir+filename;
		Message(message,from,to,channel,type)
	});


	/** 
   	* Message
   	* 
   	*/
	socket.on('send message', function(message,from,to,channel,type){
		Message(message,from,to,channel,type);
 	});
 	function Message(message,from,to,channel,type){
  		// Prepair the current date
		var d = new Date();
		var date =(("00" + (d.getMonth() + 1)).slice(-2) + "/" + ("00" + d.getDate()).slice(-2) + "/" + d.getFullYear() + " " + ("00" + d.getHours()).slice(-2) + ":" + ("00" + d.getMinutes()).slice(-2) + ":" + ("00" + d.getSeconds()).slice(-2));
	
	    // Send to clients
		SendMessage(message,from,to,channel,date,type);
		// Save message on server to our data
  		SaveMessageServer(message,from,to,channel,date,type);
 	}
  	function SendMessage(message,from,tos,channel,date,type) {
		tos.forEach(function(to) {
			indexOf = users.map(function(x) {return x.id; }).indexOf(to.id);
			var userSearchTo = users[indexOf];
			if (userSearchTo){
				to.userId=to.id;
				from.userId=from.id;
				from.cryptedPseudo=app.locals.encrypt(from.username);
		  		for (var i = 0; i < userSearchTo.socketid.length; i++) {
		    		io.to(userSearchTo.socketid[i]).emit('new message', {msg: message, from:from, to:to, channel:channel, date:date, type:type});
		  		}
			}
		});
	}
 	function SaveMessageServer(message,from,tos,channel,date,type){
		tos.forEach(function(to) {

			var dir="./data/"+app.locals.encrypt(to.username)+"/"+channel;
			if (channel == to.username){
	  			dir="./data/"+app.locals.encrypt(to.username)+"/"+from.username;
			}

	  		var file="/conv.xml";
	  		var xml_message='<message>\n<id>'+from.id+'</id>\n<name>'+from.username+'</name>\n<txt>'+message+'</txt>\n<type>'+type+'</type>\n<date>'+date+'</date>\n</message>\n';
			mkdirp(dir, function (err) {
			    if (err) console.error(err)
				if (fs.existsSync(dir+file)) {
		    		fs.appendFile(dir+file, xml_message, function (err) {
					    if(err) {
					        return console.log(err);
					    }
					});
				}else{
				    fs.writeFile(dir+file, xml_message, function(err) {
					    if(err) {
					        return console.log(err);
					    }
					}); 
			    }
			});
		});
 	}

	socket.on('add unread message',function(user){
		if (user){
			Contact.getNotif(user.contactId, function(result) {
				if (result){
					if (user.from_fk==user.id){
						var nbr=Number(result.notif_from)+1;
						Contact.setNotifFrom(nbr,user.contactId);
					}else if (user.to_fk==user.id){
						var nbr=Number(result.notif_to)+1;
						Contact.setNotifTo(nbr,user.contactId);
					}				
				}
			});
		}
	});
	socket.on('add unread message group',function(user,groupId){
		if (user){
			Group.getNotif(user.id,groupId, function(result) {
				if (result){
					var nbr=Number(result.notif)+1;
					Group.setNotif(nbr,user.id,groupId);
				}
			});
		}
	});

	/** 
	 * Change status
	 * 
	 */
	socket.on('change status',function(newstatus){
		sess.user.status = newstatus;
		changestatus(newstatus,user.id);
	});
	function changestatus(newstatus,userid){
		User.changeStatus(newstatus,userid);
		User.putLastStatus(userid);
		updateOthersStatus(newstatus,userid);
	}
	function updateOthersStatus(newstatus,userid){
		users.forEach(function(user) {
			io.to(user.socketid).emit('changed status',{newstatus:newstatus,userid:userid});
		});
	}


	/** 
	 * Update requests
	 * 
	 */
	socket.on('request accept',function(contactId){
		Contact.acceptRequest(contactId);

		Contact.getContactwithId(contactId, function(result) {
			if (result){
				next(result);
			}else{
				// erreur utilisateur non trouvé
			}
		});
		var next = function(contact) {
			// Display our new contact
			socket.emit('request accepted',contact, app.locals.encrypt(contact.username));

			// Send to the dude who send request
			indexOf = users.map(function(x) {return x.id; }).indexOf(contact.id);
			var userSearch = users[indexOf];
			if (userSearch){
		  		for (var i = 0; i < userSearch.socketid.length; i++) {
				    io.to(userSearch.socketid[i]).emit('request accepted',user, app.locals.encrypt(user.username));		  		
				}
			}

		}
	});
	socket.on('request refuse',function(contactId){
		Contact.refuseRequest(contactId);
		socket.emit('request refused',contactId);
	});


	/** 
	 * Registration Verification
	 * 
	 */
 	socket.on('verification user exists', function(email,username){
		verificationUser(email,username);
 	});

 	function verificationUser(email, username){
		User.UserExists( email, username, function(result) {
			if (result)
				socket.emit('user exist');
			else 
				socket.emit('user not exist');
		});
	}





	/** 
	 * New Group
	 * 
	 */
 	socket.on('new group', function(from,name,tos){

		Group.create(from, name, function(result) {
			if (result){
				addContact(result);
			}else{
				//err
			}
		});

		var addContact = function(groupId) {
 			Group.addContact(groupId,from);
	 		for (var i = 0; i < tos.length; i++) {
	 			Group.addContact(groupId,tos[i]);
	 		}
	 		for (var i = 0; i < tos.length; i++) {
				indexOf = users.map(function(x) {return x.id; }).indexOf(Number(tos[i]));
				var userSearch = users[indexOf];
				if (userSearch){
			  		for (var j = 0; j < userSearch.socketid.length; j++) {

			    		io.to(userSearch.socketid[j]).emit('add group', {id:groupId,name:name});
			  		}
				}
			}
	 		socket.emit('redirect','/messages/'+groupId);
 		}
 	});


	/** 
	 * New channel
	 * 
	 */
 	socket.on('new channel', function(from,name){

		Channel.getChannelNameExists(name, function(result) {
			if (result){
				socket.emit('error new channel name not free');
			}else{
				verifyChannelUser();
			}
		});

 		var verifyChannelUser = function() {
			Channel.getChannelUserExists(from.id, function(result) {
				if (result){
					socket.emit('error new channel user limit');
				}else{
					addChannel();
				}
			});
 		}
 		var addChannel = function() {
			Channel.create(from, name, function(result) {
				if (result){
					addContact(result);
				}else{
					//err
				}
			});
		}
		var addContact = function(groupId) {
 			Group.addContact(groupId,from);
	 		for (var i = 0; i < users.length; i++) {
		  		for (var j = 0; j < users[i].socketid.length; j++) {
		    		io.to(users[i].socketid[j]).emit('add channel', {id:groupId,name:name});
		  		}
			}
	 		socket.emit('redirect','/messages/'+groupId);
 		}
 	});


	/** 
	 * Add Contact
	 * 
	 */
 	socket.on('add contact', function(user,contact){
	 	Contact.verificationInvitation(user.id,contact.id, function(result) {
			if (result) {
				socket.emit('invitation pending or already accepted');
			} else {
				Contact.addContact(user.id,contact.id, function(result) {
					sendRequest(result)
				});

				var sendRequest = function(contactId) {
					user.contactId=contactId;
					indexOf = users.map(function(x) {return x.id; }).indexOf(contact.id);
					var userSearch = users[indexOf];
					if (userSearch){
			  			var cryptedUsername = app.locals.encrypt(user.username);
				  		for (var i = 0; i < userSearch.socketid.length; i++) {
				    		io.to(userSearch.socketid[i]).emit('invitation success', {user:user,to:contact.id,cryptedUsername:cryptedUsername});
				  		}
					}
				}
			}
		});
 	});


	/** 
	 * Delete Contact
	 * 
	 */
 	socket.on('delete contact', function(user,contact){
		Contact.deleteContact(user.id,contact.id);
		indexOf = users.map(function(x) {return x.id; }).indexOf(contact.id);
		var userSearch = users[indexOf];
		if (userSearch){
			for (var i = 0; i < userSearch.socketid.length; i++) {
				io.to(userSearch.socketid[i]).emit('delete success', {user:user,to:contact.id});
			}
		}
 	});



 	/** 
	 * Block Contact
	 * 
	 */
 	socket.on('block contact', function(user,contact){
 		Contact.verificationBlocked(user.id,contact.id, function(result) {
			if (result){
				Contact.blockContact(user.id,contact.id);
				indexOf = users.map(function(x) {return x.id; }).indexOf(contact.id);
				var userSearch = users[indexOf];
				if (userSearch){
			  		for (var i = 0; i < userSearch.socketid.length; i++) {
			    		io.to(userSearch.socketid[i]).emit('block success', {user:user,contact:contact});
			  		}
				}
			}else {
				verifInversBlock(user,contact);
			}
		});
 	});
 	function verifInversBlock(user,contact) {
 		Contact.verificationBlocked(contact.id,user.id, function(result) {
			if (result){
				Contact.blockContact2(user.id,contact.id);
				indexOf = users.map(function(y) {return y.id; }).indexOf(contact.id);
				var userSearch = users[indexOf];
				if (userSearch){
			  		for (var i = 0; i < userSearch.socketid.length; i++) {
			    		io.to(userSearch.socketid[i]).emit('block success', {user:user,contact:contact});
			  		}
				}
			}
		});
 	}


 	/** 
	 * Delete contact group
	 * 
	 */
 	socket.on('delete contact group', function(groupId,userId,tos){
		Group.deleteContact(groupId,userId);
		tos.forEach(function(to) {
			indexOf = users.map(function(x) {return x.id; }).indexOf(to.id);
			var userSearch = users[indexOf];
			if (userSearch){
		  		for (var i = 0; i < userSearch.socketid.length; i++) {
		    		io.to(userSearch.socketid[i]).emit('deleted contact group',{groupId:groupId,userId:userId});
		  		}
			}
		});
	});
 	socket.on('delete group', function(groupId,tos){
		Group.deleteAllContact(groupId);
		Group.delete(groupId);
		tos.forEach(function(to) {
			indexOf = users.map(function(x) {return x.id; }).indexOf(to.id);
			var userSearch = users[indexOf];
			if (userSearch){
		  		for (var i = 0; i < userSearch.socketid.length; i++) {
		    		io.to(userSearch.socketid[i]).emit('deleted group',{groupId:groupId});
		  		}
			}
		});
	});




 	/** 
	 * Add user group
	 * 
	 */
 	socket.on('add user group', function(group,newusers,tos){
 		var contacts=[];

 		for (var i = 0; i < newusers.length; i++) {
 			(function(i) {
	 			Group.addContact(group.id,newusers[i]);
	 			User.getUserwithId(newusers[i], function(result) {
	 				delete result.password;
	 				result.groupId=group.id;
	 				result.cryptedUsername=app.locals.encrypt(result.username);
	 				contacts.push(result);
	 				if (i==(newusers.length-1)){
						socket.emit('user in group',contacts,tos,group)
						sendNewUser(contacts);
					}	
	 			});
 			})(i);
 		}
		function sendNewUser(contacts) {
			tos.forEach(function(to) {
				indexOf = users.map(function(x) {return x.id; }).indexOf(to.id);
				var userSearch = users[indexOf];
				if (userSearch){
			  		for (var i = 0; i < userSearch.socketid.length; i++) {
			    		io.to(userSearch.socketid[i]).emit('added user group',{group:group,users:contacts});
			  		}
				}
			});
			contacts.forEach(function(contact) {
				indexOf = users.map(function(x) {return x.id; }).indexOf(contact.id);
				var userSearch = users[indexOf];
				if (userSearch){
			  		for (var i = 0; i < userSearch.socketid.length; i++) {
			    		io.to(userSearch.socketid[i]).emit('add group',group);
			  		}
				}
			});
		}
	});
 	socket.on('delete channel', function(groupId){
		Group.deleteAllContact(groupId);
		Group.delete(groupId);
 		for (var i = 0; i < users.length; i++) {
	  		for (var j = 0; j < users[i].socketid.length; j++) {
	    		io.to(users[i].socketid[j]).emit('deleted group',{groupId:groupId});
	  		}
		}
	});


 	/** 
	 * Add user channel
	 * 
	 */
 	socket.on('add user channel', function(groupId,user){
		Group.getGroupwithId(groupId, function(result) {
			if (result) {
				tb=[]
				user.groupId=groupId;
				user.cryptedUsername=app.locals.encrypt(user.username);
				tb.push(user)
				getContacts(result);
			}else{
			}
		});
		var getContacts = function(group) {
			Contact.getContactswithGroup(groupId, function(result) {
				if (result) {
					indexOf = result.map(function(x) {return x.id; }).indexOf(user.id);
					var userSearch = result[indexOf];
					if (userSearch){					
						
					}else{
						Group.addContact(groupId,user.id);
						socket.emit('user in channel',user,result,groupId)
						sendNewUserChannel(group,result);
					}
				}
			});
		}
		var sendNewUserChannel = function(group,contacts) {
			contacts.forEach(function(contact) {
				indexOf = users.map(function(x) {return x.id; }).indexOf(contact.id);
				var userSearch = users[indexOf];
				if (userSearch){
			  		for (var i = 0; i < userSearch.socketid.length; i++) {
			    		io.to(userSearch.socketid[i]).emit('added user group',{group:group,users:tb});
			  		}
				}
			});
		}
	});


 	socket.on('delete contact channel', function(groupId,userId,tos){
		Group.deleteContact(groupId,userId);
		tos.forEach(function(to) {
			indexOf = users.map(function(x) {return x.id; }).indexOf(to.id);
			var userSearch = users[indexOf];
			if (userSearch){
		  		for (var i = 0; i < userSearch.socketid.length; i++) {
		    		io.to(userSearch.socketid[i]).emit('deleted contact channel',{groupId:groupId,userId:userId});
		  		}
			}
		});
	});

 	/** 
	 * UnBlock Contact
	 * 
	 */
 	socket.on('unblock contact', function(from,to){
		Contact.unblockContact(from,to);
 	});



 	/** 
	 * Save Status
	 * 
	 */
 	socket.on('save status', function(status,userId){
		User.saveStatus(status,userId);
 	});




 	/** 
	 * Save Pseudonyme
	 * 
	 */
 	socket.on('save pseudo', function(from,to,pseudo){
 		fromId = from.id;
 		toId = to[0].id;
		Contact.verificationBlocked(fromId,toId, function(result) {
			if (result) {
				Contact.savePseudoFrom(fromId,toId,pseudo);
				socket.emit('changed pseudo');
			}
			else
				verifInversPseudo(fromId,toId,pseudo);
		});
 	});
 	function verifInversPseudo(from,to,pseudo) {
 		Contact.verificationBlocked(to,from, function(result) {
			if (result) {
				Contact.savePseudoTo(to,from,pseudo);
				socket.emit('changed pseudo');
			}
		});
	}



});

}