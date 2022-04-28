class Channel {


	static create(creator, name, callback) {
		var query = db.query('INSERT INTO groups (name,creator,public) VALUES (?,?,1)',[name, creator], function(error,result){
			if(!!error){
				console.log('Error : ' + query.sql);
			}else{
				callback(result.insertId);
			}
		});
	}


	static getChannels(userid,callback){
		var channels = [];
		var channels2 = [];
		var query = db.query("SELECT * FROM groups g INNER JOIN usersgroups ug ON ug.groupId = g.id WHERE ug.userId = ? AND g.public = 1",[userid], function(error,rows,fields){
			if(!!error){
				console.log('Error : ' + query.sql);
			}else{

				for (var i=0;i<rows.length;i++){
					var channel=rows[i];
					channel.userIn=true;
					channels.push(channel);
				}
            	getOthers(channels);
			}
		});  
		var getOthers = function(channels) {
			var query = db.query("SELECT * FROM groups WHERE public = 1",[userid], function(error,rows,fields){
				if(!!error){
					console.log('Error : ' + query.sql);
				}else{
					for (var i=0;i<rows.length;i++){
						var channel=rows[i];
						channel.userIn=false;
						channels2.push(channel);
					}

					for (var i=0;i<channels2.length;i++){
						var indexOf = channels.map(function(x) {return x.id; }).indexOf(channels2[i].id);
						var userSearch = channels[indexOf];
						if (userSearch){

						}else{
							channels.push(channels2[i])
						}
					}
	            	callback(channels);
				}
			});   

		} 
  
	}


	static getChannelNameExists(name,callback){
		var query = db.query("SELECT * FROM groups WHERE name = ? AND public = 1",[name], function(error,rows,fields){
			if(!!error){
				console.log('Error : ' + query.sql);
			}else if (rows[0]){
				callback(true)
			}else{
				callback(false);
			}
		});    
	}

	static getChannelUserExists(id,callback){
		var query = db.query("SELECT * FROM groups WHERE creator = ?",[id], function(error,rows,fields){
			if(!!error){
				console.log('Error : ' + query.sql);
			}else if (rows[0]){
				callback(true)
			}else{
				callback(false);
			}
		});    
	}

}
var db = include('app/context/db.js');
module.exports = Channel;