module.exports = (app,transporter,User) => {

	// GET : /restore
	app.get('/restore', function(req, res) {
		sess=req.session;

		// get the alert
		var alert = sess.alert;
		sess.alert = null;

		if(sess.user) {
			res.redirect('/');
		}else{
			res.render('layout',{content:"login/restore",alert:alert});
			sess.alert=null;
		}
	});

	// POST : /restore
	app.post('/restore', function(req, res) {
		var sess=req.session;

		// Generate new password
		var randomPassword = Math.random().toString(36).slice(-8);


		// Check if user exists
		User.UserExists(req.body.sendemail,req.body.sendemail, function(result) {
			if (result==true){
				getuser(result);
			}else{
				sess.alert = new app.alert("Warning !","No user found with this email.","warning")
				res.redirect('/restore');
			}
		});

		// Get user
		var getuser = function() {
			User.getUserCompact(req.body.sendemail, function(result) {
				if (result!=null){
					sendmail(result);
				}else{
					res.redirect('/restore');
				}
			});
		}

		var sendmail = function(user) {

			// Prepair the content of email
		 	var url = req.protocol + '://' + req.get('host') + '/login';
			var intro = "Hello "+user.username+",<br><br>";
			var base = "You have requested to reset the password for username: 	<b>"+user.username+"</b><br><br>";
			var txt = "Please change your password after login.<br>New Password: <b>"+randomPassword+"</b><br><br>";
			var link = "Login Link:<br> <a href="+url+">"+url+"</a><br><br>";
			var end = "See you back on Qwirk!";

			// Email config
			var mailOptions = {
			    from: "Qwirk",
			    to: user.email,
			    subject: "Your new password",
			    text: '',
			    html: intro+base+txt+link+end
			};


			// Send the email
			transporter.sendMail(mailOptions, function(error, info){
			     if(error){
					sess.alert = new app.alert("Danger !","Error while sending new password.","danger")
					res.redirect('/restore');
			     }else editpassword();
			});

			transporter.close();

			var editpassword = function() {

				// Edit the user
				user.password=randomPassword;
				User.edit(user);

				sess.alert = new app.alert("Success !","Your new password has been sent.","success")
				res.redirect('/restore');
			}
		}
	});

}