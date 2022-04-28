module.exports = (app,upload,fs,mkdirp,User,Contact,Group,Channel) => {

// GET : /profile
app.get('/profile', function(req,res){
	sess=req.session;
	if(sess.user){

		var user = sess.user;

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

		// Get Contacts
		Contact.getContacts(user.id, function(result) {
			getgroups(result);
		});

		// Get groups
		var getgroups = function(contacts) {
			Group.getGroups(user.id, function(result) {
				getchannels(contacts,result);
			});
		}

		// Get Channels
		var getchannels = function(contacts,groups) {
			Channel.getChannels(user.id, function(result) {
				getrequests(contacts,groups,result);
			});	
		}	

		// Get Requests
		var getrequests = function(contacts,groups,channels) {
			Contact.getRequests(user.id, function(result) {
				sendview(contacts,groups,channels,result);
			});	
		}	

		var sendview = function(contacts,groups,channels,requests) {
			res.render('layout',{content:"profile/edit",groups:groups,requests:requests,contacts:contacts,channels:channels,user:user});
		}
	}else res.redirect('/login');
});

// POST : /profile
app.post('/profile',upload.single('file'),function(req,res){
	sess=req.session;
	if(sess.user) {

		// Get the current user
		var user = sess.user;

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

		// Change profile picture
		if (req.file!=null){
			//console.log(req.file);
			// Get the file extension
			var ext = req.file.originalname.split(/[. ]+/).pop();
			// Define the dir for the profile picture
	  		var dir = "./data/"+app.locals.encrypt(user.username)+"/img/";
	  		// Prepair new name
	  		var filename = "profile."+ext;

	  		// Copy the file
			mkdirp(dir, function (err) {
			    if (err) console.error(err)
			  	var file = fs.createReadStream(req.file.path);
		    	var ws = fs.createWriteStream(dir+filename);
				file.pipe(ws);
				ws.once('close', function() {
				    try {
			        	fs.unlinkSync(req.file.path);
				    }
				    catch (err) { /*...*/ }
				});
			});
			user.picture=filename;
		}

		// Set the new parameter to it
		user.firstname=req.body.firstname;
		user.lastname=req.body.lastname;
		user.bio=req.body.bio;

		oldp = req.body.oldpassword;
		newp = req.body.newpassword;
		confp = req.body.confpassword;

		if((oldp == user.password)&&(newp == confp)&&(newp != user.password)) {
			user.password = newp;
		}

		// Edit database
		User.edit(user);

		res.redirect('/profile');
	}else res.redirect('/login');
});


// GET : /profile/5
app.get('/profile/:id', function(req,res){
	sess=req.session;
	if (sess.user) {

		// Get current user
		var user = sess.user;

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

		// Username of the selected user
		var username = req.params.id;

		// Get selected user check if is in contact first
		Contact.getContactwithUsername(user.id,username, function(result) {
			if (result){
				getcontacts(result);
			}else{
				getuser();
			}
		});

		// Get contact
		var getuser = function() {
			User.getUserwithUsername(username, function(result) {
				if (result){
					delete result.password;
					getcontacts(result);
				}else{
					res.redirect('/login');
				}
			});
		}

		// Get Contacts
		var getcontacts = function(contact) {
			Contact.getContacts(user.id, function(result) {
				getgroups(result,contact);
			});
		}

		// Get Contacts
		var getcontacts = function(contact) {
			Contact.getContacts(user.id, function(result) {
				getgroups(result,contact);
			});
		}

		// Get groups
		var getgroups = function(contacts,contact) {
			Group.getGroups(user.id, function(result) {
				getchannels(contacts,result,contact);
			});
		}

		// Get Channels
		var getchannels = function(contacts,groups,contact) {
			Channel.getChannels(user.id, function(result) {
				getrequests(contacts,groups,result,contact);
			});
		}

		// Get Requests
		var getrequests = function(contacts,groups,channels,contact) {
			Contact.getRequests(user.id, function(result) {
				sendview(contacts,groups,channels,result,contact);
			});	
		}	

		var sendview = function(contacts,groups,channels,requests,contact) {
			res.render('layout',{content:"profile/details",groups:groups,requests:requests,contacts:contacts,channels:channels,contact:contact,user:user});
		}
	}else res.redirect('/login');
});


}