'use strict';
/**
 * Módulo que faz a atualização do dado de orçamento de um usuário
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
 * @return Retorna uma mensagem que tudo ocorreu certo na atualização dos dados.
 */
exports.updateUserBudget = (price) => 
	
	new Promise((resolve,reject) => {

		let user;

		const cypher = "MATCH (p:Profile) "
					+"SET p.budget = {price} ";

		db.cypher({
		    query: cypher,
		    params: {
		        price: price
		    },
		    lean: true
		}, (err, results) =>{

			try{
				assert.notExists(err, 'Sem erro!');
			}catch(err){
				console.log(err.message);
			}

			try{
					assert.isDefined(results, 'Resultado Retornado!');
				}catch(err){
					console.log(err.message);
				}

			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else
		    	resolve({ status: 201, message: 'OK!' });
		    
		});

	});