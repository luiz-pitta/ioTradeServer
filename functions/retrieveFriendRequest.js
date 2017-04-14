'use strict';

const db = require('../models/Connection');

exports.getFriendRequest = (email) => 
	
	new Promise((resolve,reject) => {

		let result  = [];
		let result_notification  = [];

		const cypher = "MATCH (n:Profile)-[s:ASKED_TO_ADD]->(you:Profile {email: {email}}) "
					+"OPTIONAL MATCH (n)-[:KNOWS]-(n2:Profile)-[r:KNOWS]-(you) "
					+"RETURN n, size(collect(distinct r)), s.connection_date  ";

		const cypher_notification = "MATCH (n:Profile)<-[r:KNOWS {visualization_invitation_accepted: false}]-(you:Profile {email: {email}}) "
					+"RETURN n,r.connection_date ";


		db.cypher({
		    query: cypher,
		    params: {
		        email: email
		    },
		    lean: true
		}, (err, results) =>{
			if (err) {
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    }

		    
		    if (!results) {
		        reject({ status: 404, message: 'Usuário sem amigos :(' });
		    } else {
		        results.forEach(function (obj) {
		            let friend = obj['n'];
		            const count = obj['size(collect(distinct r))'];	      
		            const count2 = obj['s.connection_date'];	         
					friend.count_common = count;
					friend.date_time_account_creation = count2;
		            result.push(friend);
		        });
		    }

			db.cypher({
			    query: cypher_notification,
			    params: {
			        email: email
			    },
			    lean: true
			}, (err, results) =>{
				if (err) {
			    	reject({ status: 500, message: 'Internal Server Error !' });
			    }

			    if (!results) {
			        reject({ status: 404, message: 'Usuário sem amigos :(' });
			    } else {
			        results.forEach(function (obj) {
			            let friend = obj['n'];
			            const count = obj['r.connection_date'];	          
						friend.date_time_account_creation = count;
			            result_notification.push(friend);
			        });
			    }

				resolve({ status: 200, return: result, result_notification: result_notification }); 
			});
		});

	});