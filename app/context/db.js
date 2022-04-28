var mysql = require('mysql');

var db = mysql.createConnection({
    host     : 'mysql3.gear.host',
    user     : 'qwirk',
    password : 'Jv0O-C70yR4?',
    database : 'qwirk'
});

module.exports = db;