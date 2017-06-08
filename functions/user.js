'use strict';

/**
 * Módulo que retorna as informações do usuário para a aplicação cliente
 *
 * @author Luiz Guilherme Pitta
 */

const db = require('../models/Connection');

/**
 * Módulo para assertivas
 */
const chai = require('chai'); 
const assert = chai.assert;   

/**
 * @return Retorna o usuário do servidor.
 */
exports.getProfile = () => 
	
	new Promise((resolve,reject) => {

		let user;

		const cypher = "MATCH (p:Profile) "
					+"RETURN p ";

		db.cypher({
		    query: cypher,
		    lean: true
		}, (err, results) =>{

			try{
				assert.notExists(err, 'Sem erro!');
			}catch(err){
				console.log(err.message);
			}

			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else{
		    	try{
					assert.isDefined(results, 'Vetor Existe!');
				}catch(err){
					console.log(err.message);
				}

		    	results.forEach(function (obj) {
		            let p = obj['p'];
		            user = p;
		        });

		        try{
					assert.exists(user, 'Usuário Existe!');
				}catch(err){
					console.log(err.message);
				}

				resolve({ status: 201, user: user });
		    }
		    
		});

	});