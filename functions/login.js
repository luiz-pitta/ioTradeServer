'use strict';
/**
 * Módulo que faz retorna os sensores que estão próximos ao usuário
 *
 * @author Luiz Guilherme Pitta
 */

const db = require('../models/Connection');

/**
 * @return Retorna as informações dos serviços.
 */
exports.loginMobileHub = (name) => 
	
	new Promise((resolve,reject) => {


		db.cypher({
		    query: 'MATCH (o:Owner {name:{name}}) RETURN o ',
		    params: {
	            name: name											
		    },
		    lean: true
		}, (err, results) =>{
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else{

		    	if(results.length == 0){
		    		db.cypher({
					    query: 'MERGE (o:Owner {name:{name}}) RETURN o ',
					    params: {
				            name: name											
					    },
					    lean: true
					}, (err, results) =>{
						if (err) 
					    	reject({ status: 500, message: 'Internal Server Error !' });
					    else
							resolve({ status: 201, message: 'WORKED' });
					});
		    	}else
		    		resolve({ status: 201, message: 'WORKED' });
		    }
		    
		});

	});