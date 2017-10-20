'use strict';
/**
 * Module that does returns the sensors that are close to the user
 *
 * @author Luiz Guilherme Pitta
 */

const db = require('../models/Connection');

/**
 * Assertive module
 */
const chai = require('chai'); 
const assert = chai.assert; 

 /**
  * @param lat1 latitude point 1.
  * @param lon1 longitude point 1.
  * @param lat2 point 2 latitude.
  * @param lon2 longitude point 2.
  * @return Returns the distance between two points
 */
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

/**
 * @param deg grau.
 * @return Returns the conversion of degrees to radians
 */
function deg2rad(deg) {
  return deg * (Math.PI/180);
}

/**
 * @return Returns the services information.
 */
exports.getServices = (lat, lng, radius) => 
	
	new Promise((resolve,reject) => {

		let categories =[];

		const cypher = "MATCH (cn:Connection) WHERE cn.signal >= 3 AND cn.batery >= 30 "
				+ "WITH sin(radians(cn.lat-({lat}))/2)*sin(radians(cn.lat-({lat}))/2) + "
				+ "sin(radians(cn.lng-({lng}))/2)*sin(radians(cn.lng-({lng}))/2)* "
				+ "cos(radians({lat}))*cos(radians(cn.lat)) as d, cn "

				+ "WITH 6371*2*atan2(sqrt(d), sqrt(1-d)) as da, cn "

				+ "WHERE da < {radius}  WITH cn "
				+ "OPTIONAL MATCH (cn)-[r:IS_CONNECTED_TO]->(c:Category) "
				+ "WHERE r.num_sensors > 0 "

				+ "RETURN DISTINCT c.title";	

		db.cypher({
		    query: cypher,
		    params: {
	            lat: lat,
	            lng: lng,
	            radius: radius											
		    },
		    lean: true
		}, (err, results) =>{
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else{

		    	results.forEach(function (obj) {
		            const c = obj['c.title'];
		            categories.push(c);
		            
		        });

				resolve({ status: 201, categories: categories });
		    }
		    
		});

	});