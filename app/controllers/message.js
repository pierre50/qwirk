module.exports = (app,fs,mkdirp,xmlreader,User,Contact,Group,Channel) => {


// GET : /videocall/5
app.get('/videocall/:id', function(req,res){
	sess=req.session;
	if(sess.user) {
		var id = req.params.id;
		var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		if (pattern.test(id) === true) {
			res.render('message/call',{video:true, channel:id});		
		}else res.redirect('/login');
	}else res.redirect('/login');
});

// GET : /audiocall/5
app.get('/audiocall/:id', function(req,res){
	sess=req.session;
	if(sess.user) {
		var id = req.params.id;
		var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		if (pattern.test(id) === true) {
			res.render('message/call',{video:false, channel:id});		
		}else res.redirect('/login');
	}else res.redirect('/login');
});


// GET : /message
app.get('/message/delete/:id', function(req,res){
	sess=req.session;
	if(sess.user){

		// Define variable
		var user = sess.user;
		var id = req.params.id;

		filename = "./data/" + app.locals.encrypt(user.username) + "/" + id + "/conv.xml";
		fs.unlink(filename);

		res.redirect('/messages/' + id);
	}else res.redirect('/login');

});

// GET : /message
app.get('/messages/:id', function(req,res){
	sess=req.session;
	if(sess.user){

		// Define variable
		var user = sess.user;
		var messages = [];
		var contact;
		var id = req.params.id;

		// Get Status
		User.getAllStatus(user.id, function(result) {
			if(result.status != "Offline")
				user.status = result.status;
			else {
				if (result.lastStatus == "Offline")
					user.status = "Online";
				else
					user.status = result.lastStatus;
			}
			if(result.customStatus != "")
				user.customStatus = result.customStatus;
		});

		// Detect if it's a group or not
		if (isInt(id)){
			// Get group
			Group.getGroupwithId(id, function(result) {
				if (result){
					getcontact(result);
					Group.setNotif("0",user.id,result.id);
				}else{
					res.redirect('/');
				}
			});
			// Get contact in ngroup
			var getcontact = function(group) {
				Contact.getContactswithGroup(group.id, function(result) {
					if (result){
						indexOf = result.map(function(x) {return x.id; }).indexOf(user.id);
						var userSearch = result[indexOf];
						if (userSearch){
						}else if (group.public==1){
							//Group.addContact(group.id,user.id);
						}else{
							res.redirect('/');
						}
						getcontacts(result,group);
					}else{
						res.redirect('/');
					}
				});
			}
		}else{		
			// Get selected user
			Contact.getContactwithUsername(user.id,id, function(result) {
				if (result){
					var test=[]
					test.push(result);
					test.push(user);

					if (result.from_fk==result.id){
						Contact.setNotifTo("0",result.contactId);
					}else if (result.to_fk==result.id){
						Contact.setNotifFrom("0",result.contactId);
					}

					getcontacts(test,null);

				}else{
					res.redirect('/');
				}
			});
		}

		// Get contacts
		var getcontacts = function(contact,group) {
			Contact.getContacts(user.id, function(result) {
				getgroups(result,contact,group);
			});
		}

		// Get groups
		var getgroups = function(contacts,contact,group) {
			Group.getGroups(user.id, function(result) {
				getchannels(contacts,result,contact,group);
			});
		}

		// Get channels
		var getchannels = function(contacts,groups,contact,group) {
			Channel.getChannels(user.id, function(result) {
				getrequests(contacts,groups,result,contact,group);
			});
		}


		// Get Requests
		var getrequests = function(contacts,groups,channels,contact,group) {
			Contact.getRequests(user.id, function(result) {
				getconversation(contacts,groups,channels,result,contact,group);
			});	
		}	

		var getconversation = function(contacts,groups,channels,requests,contact,group) {
	  		var dir;
			if (group){
				dir="./data/"+app.locals.encrypt(user.username)+"/"+group.id;
	  		}else{
	  			dir="./data/"+app.locals.encrypt(user.username)+"/"+contact[0].username;
	  		}
	  		
			var file="/conv.xml";
			// If file exists
			if (fs.existsSync(dir+file)) {

				var xml_file= '<?xml version="1.0" encoding="UTF-8"?>';
				xml_file += "<contact>\n"
				xml_file += fs.readFileSync(dir+file,'utf8');
				xml_file += "</contact>"

				// Read XML
				xmlreader.read(xml_file, function (err, res){
				    if(err) return console.log(err);
					var messages=[];
					var userfrom;
					// Foreach message
				    res.contact.message.each(function (j, message){
				    	// Change special character from text
		    			var message_unsecure=raw(message.txt.text());
		    			if (message.type.text() == 'image') {
		    				message_unsecure = '<a href="'+message_unsecure.substr(6)+'" download><img alt="img" src="'+message_unsecure.substr(6)+'" style="border-radius: 15px 30px" width="100" height="100"></a>';
		    			} else if (message.type.text() == 'file') {
		    				var pos = message_unsecure.search("/uploads/");
		    				message_unsecure = '<a href="'+message_unsecure.substr(6)+'" download><img alt="img" src="/img/file.png" width=15" height="15">'+message_unsecure.substr(pos+9)+'</a>';
		    			} else if (message.type.text() == 'url') {
		    				message_unsecure = getURL(message_unsecure);
		    			}

		    			// Create the message
				    	message={
				    		id:message.id.text(),
				    		username:message.name.text(),
				    		date:message.date.text(),
				    		content:message_unsecure,
				    		type:message.type.text(),
				    	}
				    	// Add to the messages list
			    		messages.push(message);
			    	});
	    			sendview(contacts,groups,channels,requests,contact,group,messages);
				});
			}else{
	    		sendview(contacts,groups,channels,requests,contact,group,null);
			}
		}

		var sendview = function(contacts,groups,channels,requests,contact,group,messages) {
			res.render('layout',{content:"message/index",requests:requests,groups:groups,contacts:contacts,channels:channels,group:group,contact:contact,messages:messages,user:user});
		}
	}else res.redirect('/login');

});


function isInt(value) {
  return !isNaN(value) && 
         parseInt(Number(value)) == value && 
         !isNaN(parseInt(value, 10));
}

String.prototype.replaceAll = function(str1, str2, ignore) 
{
    return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
}

function raw(text){
	text=text.replaceAll("&amp;","&");
    text=text.replaceAll("&lt;","<");
    text=text.replaceAll("&gt;",">");
    return text;
}

function getURL(str) {
	var regex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})/g;
	var url = new RegExp(regex, 'i');
	var tab = str.split(regex);
	for (var i = 0 ; i < tab.length ; i++){
		if (url.test(tab[i]) == true) {
			if(isHTTP(tab[i]) == true)
				tab[i] = '<a target="_blank" href="http://'+tab[i]+'">'+tab[i]+'</a>';
			else
				tab[i] = '<a target="_blank" href="'+tab[i]+'">'+tab[i]+'</a>';
		}
	}
	return tab.join("");
}

function isHTTP(str) {
	var regex = new RegExp("^(http|https|ftp)://", "i");
	if (regex.test(str))
		return false;
	else
		return true;
}


}