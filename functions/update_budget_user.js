'use strict';
/**
 * Module that updates a user's budget data
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
 * @return Returns a message that everything went right in updating the data.
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