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

		const cypher_analitycs = "MATCH (s:Sensor {title: {title_sensor}})-[r:IS_IN]->(g:Group {title: {category_sensor}}) "
					+"MATCH (c:Conection {title: {title_conection}})-[sr:IS_IN]->(g:Group {title: {category_conection}}) "
					+"MATCH (a:Analytics {title: {title_analytics}})-[ar:IS_IN]->(g:Group {title: {category_analytics}}) "
					+"SET r.qty = r.qty + 1, "
					+"sr.qty = sr.qty + 1, "
					+"ar.qty = ar.qty + 1, "
					+"r.sum = r.sum + {grade_sensor}, "
					+"sr.sum = sr.sum + {grade_conection}, "
					+"ar.sum = ar.sum + {grade_analytics} ";

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
			        title_sensor: sensor.title,
			        category_sensor: sensor.category,
			        grade_sensor: sensor.rank,
			        title_conection: connect.title,
			        category_conection: connect.category,
			        grade_conection: connect.rank,
			        title_analytics: analytics.title,
			        category_analytics: analytics.category,
			        grade_analytics: analytics.rank
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