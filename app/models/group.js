class Group {


	static create(creator, name, callback) {
		var query = db.query('INSERT INTO groups (name,creator,public) VALUES (?,?,0)',[name, creator], function(error,result){
			if(!!error){
				console.log('Error : ' + query.sql);
			}else{
				callback(result.insertId);
			}
		});
	}

	static addContact(groupId, userId) {
		var query = db.query('INSERT INTO usersgroups (userId,groupId) VALUES (?,?)',[userId, groupId], function(error,rows,fields){
			if(!!error){
				console.log('Error : ' + query.sql);
			}
		});
	}

	static deleteContact(groupId, userId) {
		var query = db.query('DELETE FROM usersgroups WHERE userId=? AND groupId=?',[userId, groupId], function(error,rows,fields){
			if(!!error){
				console.log('Error : ' + query.sql);
			}
		});
	}


	static deleteAllContact(groupId) {
		var query = db.query('DELETE FROM usersgroups WHERE groupId=?',[groupId], function(error,rows,fields){
			if(!!error){
				console.log('Error : ' + query.sql);
			}
		});
	}

	static delete(groupId) {
		var query = db.query('DELETE FROM groups WHERE id=?',[groupId], function(error,rows,fields){
			if(!!error){
				console.log('Error : ' + query.sql);
			}
		});
	}

	static getGroups(userid,callback){
		var groups = [];
		var query = db.query("SELECT * FROM groups g INNER JOIN usersgroups ug ON ug.groupId = g.id WHERE ug.userId = ? AND g.public = 0",[userid], function(error,rows,fields){
			if(!!error){
				console.log('Error : ' + query.sql);
			}else{
				for (var i=0;i<rows.length;i++){
					groups.push(rows[i]);
				}
            	callback(groups);
			}
		});    
	}

	static getGroupwithId(groupid,callback){
		var query = db.query("SELECT * FROM groups WHERE id = ?",[groupid], function(error,rows,fields){
			if(!!error){
				console.log('Error : ' + query.sql);
			}else if (rows[0]){
            	callback(rows[0]);
			}else{
				callback(null);
			}
		});    
	}


	static getNotif(userId,groupId,callback){
		var query = db.query("SELECT notif FROM usersgroups WHERE userId = ? AND groupId = ?",[userId,groupId], function(error,rows,fields){
			if(!!error){
				console.log('Error : ' + query.sql);
			}else if (rows[0]){
            	callback(rows[0]);
			}else{
				callback(null);
			}
		});    
	}
	static setNotif(nbr,userId,groupId){
		var query = db.query("UPDATE usersgroups SET notif = ? WHERE userId = ? AND groupId = ?",[nbr,userId,groupId], function(error,rows,fields){
			if(!!error){
				console.log('Error : ' + query.sql);
			}
		});    
	}

}
var db = include('app/context/db.js');
module.exports = Group;