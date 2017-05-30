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

function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

exports.getSensorAlgorithm = (lat, lng, category) => 
	
	new Promise((resolve,reject) => {

		let sensors =[];
		let connect_chosen;
		let sensor_chosen;
		let high_rank = -1.0;

		const cypher = "MATCH (you:Profile) "
					+"MATCH (cn:Conection)-[:IS_NEAR]->(s:Sensor)-[:BELONGS_TO]->(c:Category {title: {category}}) "
					+"MATCH (s)-[sr:IS_IN]->(g:Group), (cn)-[cnr:IS_IN]->(g2:Group) "
					+"WHERE (sr.price + cnr.price) <= you.budget "
					+"RETURN cn, s, sr, cnr ORDER BY cn.title";

		db.cypher({
		    query: cypher,
		    params: {
	            category: category											
		    },
		    lean: true
		}, (err, results) =>{
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else{
		    	let i, j;

		    	if(results.length > 0){

			    	for(i=0;i<results.length;i++){
			    		let j = i;
			    		let obj = results[i];
			    		let obj_next = results[j];
			    		let cn = obj['cn'];
			    		let cnr = obj['cnr'];

			    		cn.rank = parseFloat(cnr.sum)/parseFloat(cnr.qty);
			            cn.price = cnr.price;

			    		let cn_next = obj_next['cn'];

			    		cn.array = [];
		
			    		while(cn.title == cn_next.title){
			    			let s = obj_next['s'];
			    			let sr = obj_next['sr'];
			    			s.rank = parseFloat(sr.sum)/parseFloat(sr.qty);
			            	s.price = sr.price;
			            	cn.array.push(s);

							j++;
							if(j < results.length){
								obj_next = results[j];
								cn_next = obj_next['cn'];
							}
							else{
								cn_next = String(-2);
							}
						}
						i=j-1;

						if(getDistanceFromLatLonInKm(lat, lng, cn.lat, cn.lng) < 1.5){
							cn.array.sort(function(a,b) {  
							    if (a.rank < b.rank)
				                    return 1;
				                else if (a.rank > b.rank)
				                    return -1;
				                else if (a.price < b.price)
				                    return 1;
				                else if (a.price > b.price)
				                	return -1;
				                else
				                	return 0;
							});
			            	sensors.push(cn);
						}
			    	}

			    	sensors.sort(function(a,b) {  
					    if (a.rank < b.rank)
		                    return 1;
		                else if (a.rank > b.rank)
		                    return -1;
		                else if (a.sgnl_net < b.sgnl_net)
		                    return 1;
		                else if (a.sgnl_net > b.sgnl_net)
		                    return -1;
		                else if (a.batery < b.batery)
		                    return 1;
		                else if (a.batery > b.batery)
		                	return -1;
		                else if (a.price < b.price)
		                    return 1;
		                else if (a.price > b.price)
		                	return -1;
		                else
		                	return 0;
					});

			    	if(sensors.length > 0){
						connect_chosen = sensors[0];
						let sensors_final = [];
						const high_rank = connect_chosen.array[0].rank;
						console.log(high_rank);

						connect_chosen.array.forEach(function (obj) {
				            if(obj.rank == high_rank)
				            	sensors_final.push(obj);
				        });

				        if(sensors_final.length > 1){
				        	const position = randomIntFromInterval(0, (sensors_final.length-1));
				        	sensor_chosen = sensors_final[position];
			       		}else
			        		sensor_chosen = sensors_final[0];
			    	}

			    	console.log(connect_chosen);
			    	console.log(sensor_chosen);

					resolve({ status: 201, sensor: sensor_chosen });
				}else{
					resolve({ status: 201, sensor: sensor_chosen });
				}
		    }
		    
		});

	});