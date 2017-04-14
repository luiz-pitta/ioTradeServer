'use strict';

const db = require('../models/Connection');

exports.getAppInfo = () => 
	
	new Promise((resolve,reject) => {

		var result  = [];

		db.cypher({
		    query: 'MATCH (n:AppInfo) RETURN n',
		    lean: true
		}, (err, results) =>{
			if (err) {
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    }

		    if (!results) {
		        reject({ status: 404, message: 'Não existem App Info :(' });
		    } else {
		        results.forEach( (obj) => {
		            const appInfo = obj['n'];
		            result.push(appInfo);
		        });
		        resolve({ status: 200, return: result }); 
		    }

		});
		
	});