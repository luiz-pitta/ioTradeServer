'use strict';

const db = require('../models/Connection');

exports.getTags = () => 
	
	new Promise((resolve,reject) => {

		let result  = [];
		const tags = ['Google Agenda','Facebook'];

		db.cypher({
		    query: 'MATCH (n:Tag) WHERE NOT n.title IN {tags} RETURN n ORDER BY n.title',
		    params: {
		        tags: tags
		    },
		    lean: true
		}, (err, results) =>{
			if (err) {
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    }

		    if (!results) {
		        reject({ status: 404, message: 'Não existem tags :(' });
		    } else {
		        results.forEach( (obj) => {
		            var tag = obj['n'];
		            result.push(tag);
		        });
		        resolve({ status: 200, return: result }); 
		    }

		});
		
	});