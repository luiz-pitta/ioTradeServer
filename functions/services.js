'use strict';

const db = require('../models/Connection');

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2-lat1);  // deg2rad below
  const dLon = deg2rad(lon2-lon1); 
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

exports.getServices = (lat, lng) => 
	
	new Promise((resolve,reject) => {

		let categories =[];

		const cypher = "MATCH (cn:Conection)-[:IS_NEAR]->(s:Sensor)-[:BELONGS_TO]->(c:Category) "
					+"RETURN cn, c ";

		db.cypher({
		    query: cypher,
		    lean: true
		}, (err, results) =>{
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else{
		    	results.forEach(function (obj) {
		            const p = obj['cn'];
		            const c = obj['c'];

		            if(getDistanceFromLatLonInKm(lat, lng, p.lat, p.lng) < 1.5 && categories.indexOf(c.title) == -1)
		            	categories.push(c.title);
		            
		        });

				resolve({ status: 201, categories: categories });
		    }
		    
		});

	});