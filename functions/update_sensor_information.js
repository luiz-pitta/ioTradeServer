'use strict';

const db = require('../models/Connection');

exports.updateSensorInformation = (title, price, category, category_new) => 
	
	new Promise((resolve,reject) => {

		const cypher = "MATCH (s:Sensor {title: {title}})-[r:IS_IN]->(g:Group {title: {category}}) MERGE (g2:Group {title: {category_new}}) "
					+"MERGE (s)-[:IS_IN {price: {price}, qty:r.qty, sum:r.sum}]->(g2) DELETE r ";

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
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else
		    	resolve({ status: 201, message: 'OK!' });
		    
		});

	});


exports.updateSensorRating = (sensor, connect, analytics) => 
	
	new Promise((resolve,reject) => {

		const cypher = "MATCH (s:Sensor {title: {title_sensor}})-[r:IS_IN]->(g:Group {title: {category_sensor}}) "
					+"MATCH (c:Conection {title: {title_conection}})-[sr:IS_IN]->(g:Group {title: {category_conection}}) "
					+"SET r.qty = r.qty + 1, "
					+"sr.qty = sr.qty + 1, "
					+"r.sum = r.sum + {grade_sensor}, "
					+"sr.sum = sr.sum + {grade_conection} ";

		const cypher_analitycs = "MATCH (s:Sensor {title: {title}})-[r:IS_IN]->(g:Group {title: {category}}) "
					+"SET r.qty = r.qty + 1, "
					+"r.sum = r.sum + {grade} ";

		if(analytics == null){

			db.cypher({
			    query: cypher,
			    params: {
			        title_sensor: sensor.title,
			        category_sensor: sensor.category,
			        grade_sensor: sensor.rank,
			        title_conection: connect.title,
			        category_conection: connect.category,
			        grade_conection: connect.rank
			    },
			    lean: true
			}, (err, results) =>{
				if (err) 
			    	reject({ status: 500, message: 'Internal Server Error !' });
			    else
			    	resolve({ status: 201, message: 'OK!' });
			    
			});
		}else{
			db.cypher({
			    query: cypher,
			    params: {
			        title: title,
			        category: category,
			        grade: grade
			    },
			    lean: true
			}, (err, results) =>{
				if (err) 
			    	reject({ status: 500, message: 'Internal Server Error !' });
			    else
			    	resolve({ status: 201, message: 'OK!' });
			    
			});
		}

	});