'use strict';

const auth = require('basic-auth');
const jwt = require('jsonwebtoken');
const schedule = require('node-schedule');

const sensor_price = require('./functions/register');

const config = require('./config/config.json');
const db = require('./models/Connection');

module.exports = router => {

	router.get('/', (req, res) => res.end('IoTrade!'));

	router.post('/set_push_notification', (req, res) => {

		sensor_price.getSensorPriceInformation()

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

		.then(result => res.json({ sensorPrice: result.sensorPrice }))

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