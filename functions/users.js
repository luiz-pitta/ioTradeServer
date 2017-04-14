'use strict';

const db = require('../models/Connection');

exports.getUsers = (email) => 
	
	new Promise((resolve,reject) => {

		var cypher = "MATCH (you:Profile {email: {email}})-[k:KNOWS]-(n:Profile), (n2:Profile) "
					+"OPTIONAL MATCH (n)-[r:KNOWS]-(n2)-[:KNOWS]-(you) "
					+"OPTIONAL MATCH (you)-[s:HAS_AS_FAVORITE]->(n) "
					+"RETURN n, count(k), size(collect(distinct r)), size(collect(distinct s))  ORDER BY n.name";


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

		    var result  = [];
		    if (!results) {
		        reject({ status: 404, message: 'Usuário sem amigos :(' });
		    } else {
		        results.forEach(function (temp) {
		            var people = temp['n'];
		            var count = temp['size(collect(distinct r))'];
		            var count2 = temp['size(collect(distinct s))'];	 
		            var count3 = temp['count(k)'];	 	          
					people.count_common = count;
					people.count_knows = count2;
					people.contacts_qty = count3;
		            result.push(people);
		        });
		    }

			resolve({ status: 200, return: result }); 
		});

	});