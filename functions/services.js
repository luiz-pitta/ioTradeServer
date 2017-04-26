'use strict';

const db = require('../models/Connection');

exports.getServices = (lat, lng) => 
	
	new Promise((resolve,reject) => {

		let services =[];

		console.log(lat + " " + lng);

		const cypher = "MATCH (p:Service) "
					+"RETURN p ";

		db.cypher({
		    query: cypher,
		    lean: true
		}, (err, results) =>{
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else{
		    	results.forEach(function (obj) {
		            let p = obj['p'];
		            services.push(p);
		        });

				resolve({ status: 201, services: services });
		    }
		    
		});

	});