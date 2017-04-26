'use strict';

const db = require('../models/Connection');

exports.updateSensorInformation = (title, price, category, category_new) => 
	
	new Promise((resolve,reject) => {

		const cypher = "MATCH (s:Sensor {title: {title}})-[r:IS_IN]->(g:Group {title: {category}}) "
					+"SET r.price = {price}, "
					+"g.title = {category_new} ";

		db.cypher({
		    query: cypher,
		    params: {
		        title: title,
		        price: price,
		        category: category,
		        category_new: category_new
		    },
		    lean: true
		}, (err, results) =>{
			console.log(err);
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else
		    	resolve({ status: 201, message: 'OK!' });
		    
		});

	});