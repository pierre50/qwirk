module.exports = (app,User) => {

//var counter = 0;

// GET : /login
app.get('/login', function(req,res){
	var sess=req.session;

	// get the alert
	var alert = sess.alert;
	sess.alert = null;

	if(sess.user) {
		res.redirect('/');
	}else{
		res.render('layout',{content:"login/index",alert:alert});
		sess.alert=null;
	}
});

// POST : /login
app.post('/login', function(req,res){
	var sess=req.session;
	
	if ((req.body.email!=null)&&(req.body.password!=null)){

		var email=req.body.email;
		var password=req.body.password;

		User.login(email,password, function(result) {
			if (result!=null){
				setsession(result);
			}else{
				//counter = counter + 1;
				sess.alert = new app.alert("Warning !","Username, email or password invalid.","warning")
				res.redirect('/login');
			}
		});

		var setsession = function(user) {
			sess.user=user;

			// Get Status user
			User.getLastStatus(user.id, function(result) {
				if(result.lastStatus == "Offline")
					user.status = "Online";
				else
					user.status = result.lastStatus;
				User.putLastStatus(user.id);
			});
			
	  		res.redirect('/');
	  	}
	  }else res.redirect('/login');
});

}