module.exports = (app,User,Contact,Group,Channel) => {

// GET : /blocked
app.get('/blocked', function(req,res){
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
			getcontactblocked(result);
		});

		// Get Blocked Contacts
		var getcontactblocked = function(contacts) {
			Contact.getBlockedContacts(user.id, function(result) {
				getgroups(contacts,result);
			});
		}

		// Get groups
		var getgroups = function(contacts,blocked) {
			Group.getGroups(user.id, function(result) {
				getchannels(contacts,result,blocked);
			});
		}

		// Get groups
		var getchannels = function(contacts,groups,blocked) {
			Channel.getChannels(user.id, function(result) {
				getrequests(contacts,groups,result,blocked);
			});
		}

		// Get Requests
		var getrequests = function(contacts,groups,channels,blocked) {
			Contact.getRequests(user.id, function(result) {
				sendview(contacts,groups,channels,result,blocked);
			});	
		}	

		var sendview = function(contacts,groups,channels,requests,blocked) {
			res.render('layout',{content:"profile/blocked",groups:groups,requests:requests,contacts:contacts,channels:channels,blocked:blocked,user:user});
		}
	}else res.redirect('/login');
});

}