module.exports = (app) => {

// GET : /logout
app.get('/logout', function(req,res){
	sess=req.session;
	if(sess.user) {
		sess.destroy();
		res.redirect('/login');
	}else{
		res.redirect('/login');
	}
});

}