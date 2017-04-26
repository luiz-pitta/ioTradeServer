'use strict';

const db = require('../models/Connection');

exports.updateUserBudget = (price) => 
	
	new Promise((resolve,reject) => {

		let user;

		const cypher = "MATCH (p:Profile) "
					+"SET p.budget = {price} ";

		db.cypher({
		    query: cypher,
		    params: {
		        price: price
		    },
		    lean: true
		}, (err, results) =>{
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else
		    	resolve({ status: 201, message: 'OK!' });
		    
		});

	});