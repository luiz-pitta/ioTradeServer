'use strict';

/**
 * Módulo que faz o roteamento das solicitações para os determinados submodulos correspondentes
 *
 * @author Luiz Guilherme Pitta
 */

/**
 * Variáveis externas (bibliotecas)
 */
const auth = require('basic-auth');
const jwt = require('jsonwebtoken');
const schedule = require('node-schedule');
const chai = require('chai'); 
const assert = chai.assert;   

/**
 * Variáveis da aplicação
 */
const sensor_price = require('./functions/sensor_price');
const get_user = require('./functions/user');
const get_services = require('./functions/services');
const update_user_budget = require('./functions/update_budget_user');
const update_sensor_information = require('./functions/update_sensor_information');
const get_sensor_matchmaking = require('./functions/sensor');

const config = require('./config/config.json');
const db = require('./models/Connection');

try{
	asset('a'==='b', 'foo is not bar');
}catch(err){
	console.log(err.message);
}
 

module.exports = router => {

	router.get('/', (req, res) => res.end('IoTrade!'));

	/**
     * @return Retorna uma mensagem que tudo ocorreu certo na atualização dos dados.
     */
	router.post('/update_user_budget', (req, res) => {

		const price = req.body.price;

		update_user_budget.updateUserBudget(price)

		.then(result => res.json({ message: result.message }))

		.catch(err => res.status(err.status).json({ message: err.message }));
		
	});

	/**
     * @return Retorna uma mensagem que tudo ocorreu certo na atualização dos dados.
     */
	router.post('/update_sensor_information', (req, res) => {

		const price = req.body.price;
		const title = req.body.title;
		const category = req.body.category;
		const category_new = req.body.category_new;

		update_sensor_information.updateSensorInformation(title, price, category, category_new)

		.then(result => res.json({ message: result.message }))

		.catch(err => res.status(err.status).json({ message: err.message }));
		
	});

	/**
     * @return Retorna uma mensagem que tudo ocorreu certo na atualização dos dados.
     */
	router.post('/update_sensor_rating', (req, res) => {

		const sensor = req.body.sensor;
		const connect = req.body.connect;
		const analytics = req.body.analytics;

		update_sensor_information.updateSensorRating(sensor, connect, analytics)

		.then(result => res.json({ message: result.message }))

		.catch(err => res.status(err.status).json({ message: err.message }));
		
	});

	/**
     * @return Retorna as informações dos sensores.
     */
	router.get('/get_sensor_price_information', (req,res) => {

		sensor_price.getSensorPriceInformation()

		.then(result => res.json({ sensorPriceArray: result.sensorPriceArray }))

		.catch(err => res.status(err.status).json({ message: err.message }));
	});

	/**
     * @return Retorna as informações dos serviços.
     */
	router.post('/get_services_information', (req,res) => {

		const lat = req.body.lat;
		const lng = req.body.lng;

		get_services.getServices(lat, lng)

		.then(result => res.json({ categories: result.categories }))

		.catch(err => res.status(err.status).json({ message: err.message }));
	});

	/**
     * @return Retorna os serviços sem analytics do algoritmo de matchmaking.
     */
	router.post('/get_sensor_matchmaking', (req,res) => {

		const lat = req.body.lat;
		const lng = req.body.lng;

		const category = req.body.service;

		get_sensor_matchmaking.getSensorAlgorithm(lat, lng, category)

		.then(result => res.json({ sensor: result.sensor, connect: result.connect }))

		.catch(err => res.status(err.status).json({ message: err.message }));
	});

	/**
     * @return Retorna os serviços com analytics do algoritmo de matchmaking.
     */
	router.post('/get_sensor_matchmaking_analytics', (req,res) => {

		const lat = req.body.lat;
		const lng = req.body.lng;

		const category = req.body.service;

		get_sensor_matchmaking.getSensorAlgorithmAnalytics(lat, lng, category)

		.then(result => res.json({ sensor: result.sensor, connect: result.connect, analytics:result.analytics }))

		.catch(err => res.status(err.status).json({ message: err.message }));
	});

	/**
     * @return Retorna o usuário do servidor.
     */
	router.get('/get_user', (req,res) => {

		get_user.getProfile()

		.then(result => res.json({ user: result.user }))

		.catch(err => res.status(err.status).json({ message: err.message }));
	});
}