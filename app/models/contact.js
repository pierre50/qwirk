class Contact {

    constructor (email,username,firstname,lastname,birthday,picture,status,bio,pseudofrom,pseudoto) {
        this.email = email;
    	this.username = username;
        this.firstname = firstname;
        this.lastname = lastname;
        this.birthday = birthday;
        this.picture = picture;
    	this.status = status;
        this.bio = bio;
        this.from_fk = from_fk;
        this.to_fk = to_fk;
        this.pseudo_from = pseudo_from;
        this.pseudo_to = pseudo_to;
        this.accepted = accepted;
        this.blocked = blocked;
    }

    static verificationInvitation(from, to, callback){
		var query = db.query("SELECT * FROM contacts WHERE (from_fk = ? AND to_fk = ?) OR (from_fk = ? AND to_fk = ?) AND blocked = 0",[from,to, to, from], function(error,rows,fields){
	      	if(!!error){
	        	console.log('Error : ' + query.sql);
	      	}else if (rows[0]){
	      		// Invitation en attente, ou déjà accepté
	      		callback(true);
			}else{
				// Invitation en cours
				callback(false);
			}
		}); 
	}

	static addContact(from, to, callback) {
		var query = db.query('INSERT INTO contacts (from_fk, to_fk, accepted) VALUES (?,?,?)',[from, to, 0], function(error, result){
			if(!!error){
				console.log('Error : ' + query.sql);
			}else{
				callback(result.insertId);
			}
		});
	}

	static getContactwithId(contactId,callback){
		var query = db.query("SELECT * FROM users INNER JOIN contacts WHERE users.id = contacts.from_fk AND contacts.contactId = ?",[contactId], function(error,rows,fields){
			if(!!error){
				console.log('Error : ' + query.sql);
			}else if (rows[0]){
				var contact=rows[0];
				delete contact.password;
            	callback(contact);
			} else {
				callback(null);
			}
		});    
	}

    static getContactwithUsername(userid,username,callback){
		var query = db.query("SELECT * FROM users INNER JOIN contacts WHERE (((users.id = contacts.from_fk)  AND ( contacts.to_fk = ?)) OR ((users.id = contacts.to_fk) AND ( contacts.from_fk = ?))) AND users.username = ?",[userid,userid,username], function(error,rows,fields){
	      	if(!!error){
	        	console.log('Error : ' + query.sql);
	      	}else if (rows[0]){
				var contact=rows[0];
				delete contact.password;
            	callback(contact);
			} else {
				callback(null);
			}
		});    
	}

	static getContacts(userid,callback){
		var contacts = [];
		var query = db.query("SELECT * FROM users INNER JOIN contacts WHERE (((users.id = contacts.from_fk AND contacts.to_fk = ?) OR (users.id = contacts.to_fk AND contacts.from_fk = ?)) AND contacts.accepted=1)",[userid,userid], function(error,rows,fields){
			if(!!error){
				console.log('Error : ' + query.sql);
			}else{
				for (var i=0;i<rows.length;i++){
					var contact=rows[i];
					delete contact.password;
					contacts.push(contact);
				}
            	callback(contacts);
			}
		});    
	} 
	
	static getBlockedContacts(userid,callback){
		var contacts = [];
		var query = db.query("SELECT * FROM users INNER JOIN contacts WHERE ((users.id = contacts.to_fk AND contacts.from_fk = ?) AND contacts.blocked=1)",[userid], function(error,rows,fields){
			if(!!error){
				callback(contacts);
			}else{
				for (var i=0;i<rows.length;i++){
					var contact=rows[i];
					delete contact.password;
					contacts.push(contact);
				}
            	callback(contacts);
			}
		}); 
	}

	static getRequests(userid,callback){
		var requests = [];
			var query = db.query("SELECT * FROM users INNER JOIN contacts WHERE users.id = contacts.from_fk AND contacts.to_fk = ? AND contacts.accepted=0 AND contacts.blocked=0",[userid], function(error,rows,fields){
			if(!!error){
				console.log('Error : ' + query.sql);
			}else{
				for (var i=0;i<rows.length;i++){
					var contact=rows[i];
					delete contact.password;					
					requests.push(contact);
				}
            	callback(requests);
			}
		});    
	}

	static verificationBlocked(from, to, callback){
    	var query = db.query("SELECT * FROM contacts WHERE (from_fk = ? AND to_fk = ?) AND blocked = 0",[from,to], function(error,rows,fields){
		    if(!!error){
		        console.log('Error : ' + query.sql);
		    }else if (rows[0]){
		      	// Invitation en attente, ou déjà accepté
		      	callback(true);
			}else{
				// Invitation en cours
				callback(false);
			}
		});   
	}

	static blockContact(from,to) {
		var query = db.query("UPDATE contacts SET blocked = 1, accepted = 0 WHERE (from_fk = ? AND to_fk = ?)",[from,to], function(error,rows,fields){
			if(!!error){
				console.log('Error : ' + query.sql);
			}
		});
	}

	static blockContact2(from,to) {
		var query = db.query("UPDATE contacts SET blocked = 1, accepted = 0, from_fk = ?, to_fk = ? WHERE (from_fk = ? AND to_fk = ?)",[from,to,to,from], function(error,rows,fields){
			if(!!error){
				console.log('Error : ' + query.sql);
			}
		});
	}

	static unblockContact(from,to) {
		var query = db.query("DELETE FROM contacts WHERE (from_fk = ? AND to_fk = ?) OR (from_fk = ? AND to_fk = ?) AND contacts.blocked=1",[from,to,to,from], function(error,rows,fields){
			if(!!error){
				console.log('Error : ' + query.sql);
			}
		});
	}

	static deleteContact(from,to) {
		var query = db.query("DELETE FROM contacts WHERE (from_fk = ? AND to_fk = ?) OR (from_fk = ? AND to_fk = ?)",[from,to,to,from], function(error,rows,fields){
			if(!!error){
				console.log('Error : ' + query.sql);
			}
		});
	}
	// j'utilise pas celle là, car j'ai eu un soucis, si ça pose problème refait à ta sauce comme d'hab <3
	static delete(userid){
		var query = db.query("DELETE FROM contacts WHERE from_fk=? OR to_fk=?",[userid,userid], function(error,rows,fields){
			if(!!error){
				console.log('Error : ' + query.sql);
			}
		});
	}

	static acceptRequest(contactid){
		var query = db.query("UPDATE contacts SET accepted = 1 WHERE contactId=?",[contactid], function(error,rows,fields){
			if(!!error){
				console.log('Error : ' + query.sql);
			}
		});
	}

	static refuseRequest(contactid){
		var query = db.query("DELETE FROM contacts WHERE contactId=?",[contactid], function(error,rows,fields){
			if(!!error){
				console.log('Error : ' + query.sql);
			}
		});
	}


	static sendInvit(contactId,callback){
		var query = db.query("SELECT * FROM users INNER JOIN contacts WHERE users.id = contacts.from_fk AND contacts.contactId = ?",[contactId], function(error,rows,fields){
			if(!!error){
				console.log('Error : ' + query.sql);
			}else if (rows[0]){
				var contact=rows[0];
				delete contact.password;
            	callback(contact);
			} else {
				callback(null);
			}
		});    
	}


	static getContactswithGroup(groupid,callback){
		var contacts = [];
		var query = db.query("SELECT * FROM users u INNER JOIN usersgroups ug ON u.id = ug.userId INNER JOIN groups g ON g.id =ug.groupId WHERE g.id = ?",[groupid], function(error,rows,fields){
			if(!!error){
				console.log('Error : ' + query.sql);
			}else{
				for (var i=0;i<rows.length;i++){
					var contact=rows[i];
					contact.id=contact.userId;
					delete contact.password;
					contacts.push(contact);
				}
            	callback(contacts);
			}
		});    
	}

	static savePseudoFrom(from,to,pseudo){
		var query = db.query("UPDATE contacts SET pseudo_from = ? WHERE from_fk = ? AND to_fk = ?",[pseudo,from,to], function(error,rows,fields){
			if(!!error){
				console.log('Error : ' + query.sql);
			}
		});  
	}

	static savePseudoTo(to,from,pseudo){
		var query = db.query("UPDATE contacts SET pseudo_to = ? WHERE from_fk = ? AND to_fk = ?",[pseudo,to,from], function(error,rows,fields){
			if(!!error){
				console.log('Error : ' + query.sql);
			}
		});  
	}



	static setNotifFrom(nbr,contactId){
		var query = db.query("UPDATE contacts SET notif_from = ? WHERE contactId = ?",[nbr,contactId], function(error,rows,fields){
			if(!!error){
				console.log('Error : ' + query.sql);
			}
		});  
	}
	static setNotifTo(nbr,contactId){
		var query = db.query("UPDATE contacts SET notif_to = ? WHERE contactId = ?",[nbr,contactId], function(error,rows,fields){
			if(!!error){
				console.log('Error : ' + query.sql);
			}
		});  
	}



	static getNotif(contactId,callback){
		var query = db.query("SELECT notif_from,notif_to FROM contacts WHERE contactId = ?",[contactId], function(error,rows,fields){
			if(!!error){
				console.log('Error : ' + query.sql);
			}else if (rows[0]){
				callback(rows[0]);
			}else{
				callback(null)
			}
		});  
	}



}
var db = include('app/context/db.js');
module.exports = Contact;