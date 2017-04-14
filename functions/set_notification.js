'use strict';

const db = require('../models/Connection');

exports.setNotificationSettings = (email,notifications) => 
	
	new Promise((resolve,reject) => {

		var cypher = "MATCH (n:Profile {email: {email}}) "
				+ "SET n.notifications = {notifications} "
				+ "RETURN n";



		db.cypher({
		    query: cypher,
		    params: {
			  	email: email,
			  	notifications: notifications
		    },
		    lean: true
		}, (err, results) =>{
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else{
				var user  = results[0];
			    var result = user['n'];

				resolve({ status: 200, return: result }); 
		    }
		});

	});