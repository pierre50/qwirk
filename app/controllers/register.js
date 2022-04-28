module.exports = (app,upload,fs,mkdirp,User) => {

	app.get('/register',function(req,res)
	{
		res.redirect('/login');
	});


	// POST : /register
	app.post('/register',upload.single('file'),function(req,res)
	{
		var sess=req.session;

		if(!sess.user) {

			if ((req.body.username!=null)&&(req.body.email!=null)&&(req.body.password!=null)) {

				var picture;
				// Change profile picture
				if (req.file!=null){
					// Get the file extension
					var ext = req.file.originalname.split(/[. ]+/).pop();
					// Define the dir for the profile picture
					var dir = "./data/"+app.locals.encrypt(req.body.username)+"/img/";
					// Prepair new name
					var file = "profile."+ext;

					// Copy the file
					mkdirp(dir, function (err) {
					    if (err) console.error(err)
						fs.createReadStream(req.file.path).pipe(fs.createWriteStream(dir+file));
						fs.unlinkSync(req.file.path);
					});
					picture=file;
				}

				var birthday =  req.body.year + "-" + req.body.month + "-" + req.body.day;

				var user = new User(req.body.email,req.body.username,req.body.fname,req.body.lname,birthday,req.body.password,picture,"Offline",req.body.bio)

				User.UserExists(req.body.email, req.body.username, function(result){
					if (result==true) { res.redirect('/login'); }
					else { setuser(); }
				});

				var setuser = function() {
		    		User.register(user);

					User.login(user.email,user.password, function(result) {
						if (result!=null){ setsession(result); }
						else{ res.redirect('/login'); }
					});
		  		}

				var setsession = function(user) {
					sess.user=user;
					sess.user.status="Online";
					res.redirect('/');
				}
			}else res.redirect('/login');
		}else res.redirect('/');
	});

}