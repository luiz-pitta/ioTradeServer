'use strict';

const auth = require('basic-auth');
const jwt = require('jsonwebtoken');
const schedule = require('node-schedule');

const sensor_price = require('./functions/sensor_price');
const get_user = require('./functions/user');
const get_services = require('./functions/services');
const update_user_budget = require('./functions/update_budget_user');
const update_sensor_information = require('./functions/update_sensor_information');

const config = require('./config/config.json');
const db = require('./models/Connection');

module.exports = router => {

	router.get('/', (req, res) => res.end('IoTrade!'));

	router.post('/update_user_budget', (req, res) => {

		const price = req.body.price;

		update_user_budget.updateUserBudget(price)

		.then(result => res.json({ message: result.message }))

		.catch(err => res.status(err.status).json({ message: err.message }));
		
	});

	router.post('/update_sensor_information', (req, res) => {

		const price = req.body.price;
		const title = req.body.title;
		const category = req.body.category;
		const category_new = req.body.category_new;

		update_sensor_information.updateSensorInformation(title, price, category, category_new)

		.then(result => res.json({ message: result.message }))

		.catch(err => res.status(err.status).json({ message: err.message }));
		
	});

	router.get('/tags', (req,res) => {

			sensor_price.getSensorPriceInformation()

			.then(result => res.json(result.return))

			.catch(err => res.status(err.status).json({ message: err.message }));
	});


	router.get('/get_sensor_price_information', (req,res) => {

		sensor_price.getSensorPriceInformation()

		.then(result => res.json({ sensorPriceArray: result.sensorPriceArray }))

		.catch(err => res.status(err.status).json({ message: err.message }));
	});

	router.post('/get_services_information', (req,res) => {

		const lat = req.body.lat;
		const lng = req.body.lng;

		get_services.getServices(lat, lng)

		.then(result => res.json({ services: result.services }))

		.catch(err => res.status(err.status).json({ message: err.message }));
	});

	router.post('/get_services_information_filter', (req,res) => {

		const lat = req.body.lat;
		const lng = req.body.lng;

		const query = req.body.category;
		const price_start = req.body.from;
		const price_end = req.body.to;

		console.log(query + " " + from + " " + to + " " + lat);


		get_services.getServicesFilter(lat, lng, query, price_start, price_end)

		.then(result => res.json({ services: result.services }))

		.catch(err => res.status(err.status).json({ message: err.message }));
	});

	router.get('/get_user', (req,res) => {

		get_user.getProfile()

		.then(result => res.json({ user: result.user }))

		.catch(err => res.status(err.status).json({ message: err.message }));
	});

	function checkToken(req) {

		const token = req.headers['x-access-token'];

		if (token) {

			try {

  				var decoded = jwt.verify(token, config.secret);

  				return decoded.message === req.params.id;

			} catch(err) {

				return false;
			}

		} else {

			return false;
		}
	}
}