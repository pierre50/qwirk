module.exports = (app,fs,User,Contact,Group) => {

// GET : /delete
app.get('/delete', function(req,res){
	sess=req.session;
	if(sess.user){

		var user = sess.user;

		Contact.delete(user.id);
		User.delete(user.id);

		var path = "./data/"+app.locals.encrypt(user.username);
		deleteFolderRecursive(path);

		res.redirect('/logout');
	}else res.redirect('/login');
});


var deleteFolderRecursive = function(path) {
	if( fs.existsSync(path) ) {
	  fs.readdirSync(path).forEach(function(file) {
	    var curPath = path + "/" + file;
	      if(fs.statSync(curPath).isDirectory()) { // recurse
	          deleteFolderRecursive(curPath);
	      } else { // delete file
	          fs.unlinkSync(curPath);
	      }
	  });
	  fs.rmdirSync(path);
	}
};

}