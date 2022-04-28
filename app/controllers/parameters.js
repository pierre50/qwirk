module.exports = (app,User,Contact,Group,Channel) => {

// GET : /parameters
app.get('/parameters', function(req,res){
	sess=req.session;
	if(sess.user) {
		var user = sess.user;

		// Get Status
		User.getAllStatus(user.id, function(result) {
			if(result.lastStatus == "Offline")
				user.status = "Online";
			else
				user.status = result.lastStatus;
			if(result.customStatus != "")
				user.customStatus = result.customStatus;
		});

		// Get contacts
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
			res.render('layout',{content:"profile/parameters",user:user,groups:groups,contacts:contacts,channels:channels,requests:requests});
		}
	}else res.redirect('/login');

});

// POST : /parameters
app.post('/parameters', function(req,res){
	sess=req.session;
	if(sess.user) {
		var user = sess.user;
		user.theme=req.body.theme;
		User.edit(user);

		res.redirect('/parameters');
	}else res.redirect('/login');

});

}