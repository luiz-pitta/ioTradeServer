'use strict';

const auth = require('basic-auth');
const jwt = require('jsonwebtoken');
const schedule = require('node-schedule');
const cloudinary = require('cloudinary');

const register = require('./functions/register');
const activity = require('./functions/addActivity');
const reminder = require('./functions/addReminder');
const flag = require('./functions/addFlag');
const login = require('./functions/login');
const loginFacebook = require('./functions/loginFacebook');
const profile = require('./functions/profile');
const tags = require('./functions/tags');
const icons = require('./functions/icons');
const appInfo = require('./functions/appInfo');
const bgFeed = require('./functions/bgFeed');
const bgProfile = require('./functions/bgProfile');
const interest = require('./functions/interest');
const people = require('./functions/users');
const send_friend_request = require('./functions/requestFriend');
const visualize_friend_request = require('./functions/visualizeFriendRequest');
const visualize_invite_request = require('./functions/visualizeInviteRequest');
const search = require('./functions/search');
const retrieve_friend_request = require('./functions/retrieveFriendRequest');
const update_friend_request = require('./functions/updateFriendRequest');
const cancel_friend_request = require('./functions/cancelFriendRequest');
const feed = require('./functions/feed');
const get_invite_request = require('./functions/retrieveInviteRequest');
const update_invite_request = require('./functions/updateInviteRequest');
const retrieve_past_activities = require('./functions/pastActivities');
const get_flag_reminder = require('./functions/flag_reminder');
const get_act = require('./functions/activity');
const get_profile_main = require('./functions/profile_main');
const get_activity_day = require('./functions/retrieveActivityDay');
const plans = require('./functions/plans');
const friendsPlans = require('./functions/friendsPlans');
const compare = require('./functions/compare');
const password = require('./functions/password');
const updateAboutPerson = require('./functions/updateAboutPerson');
const deleteActivity = require('./functions/deleteActivity');
const favorite = require('./functions/favorite');
const block_friend = require('./functions/block_friend');
const block_friends_list = require('./functions/block_friends_list');
const delete_friend = require('./functions/delete_friend');
const feed_filter = require('./functions/feed_filter');
const search_filter = require('./functions/search_filter');
const set_location = require('./functions/set_location');
const set_notification = require('./functions/set_notification');
const set_privacy = require('./functions/privacy');
const delete_account = require('./functions/deleteAccount');
const get_blocked_users = require('./functions/get_block_users');
const editReminder = require('./functions/editReminder');
const editFlag = require('./functions/editFlag');
const editActivity = require('./functions/editActivity');
const update_email = require('./functions/update_email');
const setPushNotification = require('./functions/setPushNotification');
const deletePushNotification = require('./functions/deletePushNotification');
const getGoogle = require('./functions/getImportedGoogle');
const importFromGoogle = require('./functions/importFromGoogle');
const set_adm = require('./functions/setAdm');
const add_new_guest = require('./functions/addNewGuest');

const config = require('./config/config.json');
const firebase = require('./models/Firebase');
const db = require('./models/Connection');

const topic = "Tymo";


//cloudinary.api.resources(function(results){
//	const result = results['resources'];
//	result.forEach( (obj) => {
//    	console.log(obj.secure_url);
//    });
//},{ type: 'upload', prefix: 'activity_icons/', max_results:500 });


let rule_refresh_connected_devices = new schedule.RecurrenceRule();
rule_refresh_connected_devices.month = [5,11]; //5 -> Junho / 11 -> Dez
rule_refresh_connected_devices.date = 1; 
rule_refresh_connected_devices.hour = 12; 
rule_refresh_connected_devices.minute = 0;

const job_refresh_connected_devices = schedule.scheduleJob(rule_refresh_connected_devices, function(){

	const dt = new Date();
	dt.setMonth(dt.getMonth() - 6);

	const dt_mili = dt.getTime();

	const cypher = "MATCH (p:Profile)-[:LOGGED_DEVICE]->(d:Device) "
				+"WHERE d.last_login_date_time <= {last_login_date_time} "
				+"DETACH DELETE d ";

	db.cypher({
	    query: cypher,
	    params: {
            last_login_date_time: dt_mili
		},
	    lean: true
	}, (err, results) =>{
		if (err) 
	    	console.log("Erro ao apagar os dispositvos com > 6 meses de inatividade!");
	});

});


let rule_friday = new schedule.RecurrenceRule();
rule_friday.dayOfWeek = 5; //5 -> Friday
rule_friday.hour = 21; // 3h pra frente por causa do fuso
rule_friday.minute = 0;

const job_friday = schedule.scheduleJob(rule_friday, function(){

	const payload = {
	  data: {
	    type: "friday"
	  }
	};

	firebase.messaging().sendToTopic(topic, payload)
		.then(function(response) {
		})
		.catch(function(error) {
		});

});

let rule_saturday = new schedule.RecurrenceRule();
rule_saturday.dayOfWeek = 6; //6 -> Saturday
rule_saturday.hour = 23;
rule_saturday.minute = 0;

const job_saturday = schedule.scheduleJob(rule_saturday, function(){

	const payload = {
	  data: {
	    type: "saturday"
	  }
	};

	firebase.messaging().sendToTopic(topic, payload)
		.then(function(response) {
		})
		.catch(function(error) {
		});

});

let rule_sunday = new schedule.RecurrenceRule();
rule_sunday.dayOfWeek = 1; //0 -> Sunday
rule_sunday.hour = 1;
rule_sunday.minute = 0;

const job_sunday = schedule.scheduleJob(rule_sunday, function(){

	const payload = {
	  data: {
	    type: "sunday"
	  }
	};

	firebase.messaging().sendToTopic(topic, payload)
		.then(function(response) {
		})
		.catch(function(error) {
		});

});


module.exports = router => {

	router.get('/', (req, res) => res.end('Tymo !'));

	router.post('/set_push_notification', (req, res) => {

		const email = req.body.email;
		const name_device = req.body.name_device;
		const id_device = req.body.id_device;
		const token = req.body.token;

		setPushNotification.setPushNotification(email, name_device, id_device, token)

		.then(result => res.json({ message: result.message }))

		.catch(err => res.status(err.status).json({ message: err.message }));
		
	});

	router.post('/delete_push_notification', (req, res) => {

		const email = req.body.email;
		const id_device = req.body.id_device;

		deletePushNotification.deletePushNotification(email,id_device)

		.then(result => res.json({ message: result.message }))

		.catch(err => res.status(err.status).json({ message: err.message }));
		
	});

	router.post('/users', (req, res) => {

		const name = req.body.name;
		const id_facebook = req.body.id_facebook;
		const email = req.body.email;
		const privacy = req.body.privacy;
		const description = req.body.description;
		const password = req.body.password;

		const day_born = req.body.day_born;
		const month_born = req.body.month_born;
		const year_born = req.body.year_born;

		const gender = req.body.gender;
		const photo = req.body.photo;
		const lives_in = req.body.lives_in;
		const url = req.body.url;
		const works_at = req.body.works_at;
		const studied_at = req.body.studied_at;
		const facebook_messenger_link = req.body.facebook_messenger_link;
		const interest = req.body.interest;
		const from_facebook = req.body.from_facebook;

		const location_gps = req.body.location_gps;
		const notifications = req.body.notifications;
		const facebook_messenger_enable = req.body.facebook_messenger_enable;

		if (!name || !email || !password || !name.trim() || !email.trim() || !password.trim()) {

			res.status(400).json({message: 'Invalid Request !'});

		} else {

			register.registerUser(name,email,password,day_born,month_born,year_born,gender,photo,
				lives_in,privacy,url,works_at,studied_at,facebook_messenger_link, description, 
				interest, from_facebook,location_gps,notifications,facebook_messenger_enable, id_facebook)

			.then(result => {

				res.setHeader('Location', '/users/'+email);
				res.status(result.status).json({ message: result.message })
			})

			.catch(err => res.status(err.status).json({ message: err.message }));
		}
	});

	router.post('/set_privacy', (req, res) => {

		const email = req.body.email;
		const privacy = req.body.privacy;

		set_privacy.setPrivacySettings(email,privacy)

		.then(result => res.json(result.return))

		.catch(err => res.status(err.status).json({ message: err.message }));
		
	});

	router.post('/set_notification', (req, res) => {

		const email = req.body.email;
		const notifications = req.body.notifications;

		set_notification.setNotificationSettings(email,notifications)

		.then(result => res.json(result.return))

		.catch(err => res.status(err.status).json({ message: err.message }));
		
	});

	router.post('/set_location', (req, res) => {

		const email = req.body.email;
		const location_gps = req.body.location_gps;

		set_location.setLocationSettings(email,location_gps)

		.then(result => res.json(result.return))

		.catch(err => res.status(err.status).json({ message: err.message }));
		
	});

	router.post('/update_email', (req, res) => {

		const email_new = req.body.name;
		const email = req.body.email;

		update_email.updateEmail(email, email_new)

		.then(result => {

			res.status(result.status).json({ user: result.user});
		})

		.catch(err => res.status(err.status).json({ message: err.message }));
		
	});

	router.post('/users_update', (req, res) => {

		const name = req.body.name;
		const email = req.body.email;
		const description = req.body.description;
		const photo = req.body.photo;
		const lives_in = req.body.lives_in;
		const url = req.body.url;
		const works_at = req.body.works_at;
		const studied_at = req.body.studied_at;
		const facebook_messenger_enable = req.body.facebook_messenger_enable;
		const modify_facebook_name = req.body.modify_facebook_name;
		const modify_facebook_photo = req.body.modify_facebook_photo;

		updateAboutPerson.updateAboutPerson(name,email,photo,lives_in,url,works_at,studied_at, description, facebook_messenger_enable, modify_facebook_name, modify_facebook_photo)

		.then(result => {

			res.setHeader('Location', '/users_update/'+email);
			res.status(result.status).json({ message: result.message })
		})

		.catch(err => res.status(err.status).json({ message: err.message }));
		
	});

	router.post('/import_from_google', (req, res) => {

		importFromGoogle.registerActivityGoogle(req.body)

		.then(result => {

			res.status(result.status).json({ message: result.message })
		})

		.catch(err => res.status(err.status).json({ message: err.message }));
		
	});

	router.post('/activities', (req, res) => {

		const creator = req.body.creator;

		const title = req.body.title;
		const description = req.body.description;
		const location = req.body.location;
		const invitation_type = req.body.invitation_type;

		const day_start = req.body.day_start;
		const month_start = req.body.month_start;
		const year_start = req.body.year_start;

		const day_end = req.body.day_end;
		const month_end = req.body.month_end;
		const year_end = req.body.year_end;

		const minute_start = req.body.minute_start;
		const hour_start = req.body.hour_start;

		const minute_end = req.body.minute_end;
		const hour_end = req.body.hour_end;

		const repeat_type = req.body.repeat_type;
		const repeat_qty = req.body.repeat_qty;

		const day_list_start = req.body.day_list_start;
		const month_list_start = req.body.month_list_start;
		const year_list_start = req.body.year_list_start;
		const day_list_end = req.body.day_list_end;
		const month_list_end = req.body.month_list_end;
		const year_list_end = req.body.year_list_end;

		const cube_color = req.body.cube_color;
		const cube_color_upper = req.body.cube_color_upper;
		const cube_icon = req.body.cube_icon;

		const whatsapp_group_link = req.body.whatsapp_group_link;
		const visibility = req.body.visibility;

		const tags = req.body.tags;
		const v_guest = req.body.guest;
		const v_adms = req.body.adms;

		const lat = req.body.lat;
		const lng = req.body.lng;

		if (!title || !title.trim()) {

			res.status(400).json({message: 'Invalid Request !'});

		} else {

			activity.registerActivity(creator,v_guest, v_adms, title,description,location,invitation_type,day_start,
				month_start,year_start,day_end,month_end,year_end,minute_start,hour_start,minute_end,hour_end,repeat_type,
				repeat_qty,cube_color,cube_color_upper, cube_icon,whatsapp_group_link, tags, visibility, lat, lng,
				day_list_start,month_list_start,year_list_start,day_list_end,month_list_end,year_list_end)

			.then(result => {

				//res.setHeader('Location', '/activities/'+title);
				res.status(result.status).json({ message: result.message, activityServer: result.activityServer })
			})

			.catch(err => res.status(err.status).json({ message: err.message }));
		}
	});

	router.post('/reminders', (req, res) => {

		const creator = req.body.creator;

		const title = req.body.title;

		const day_start = req.body.day_start;
		const month_start = req.body.month_start;
		const year_start = req.body.year_start;

		const minute_start = req.body.minute_start;
		const hour_start = req.body.hour_start;

		const repeat_type = req.body.repeat_type;
		const repeat_qty = req.body.repeat_qty;

		const day_list_start = req.body.day_list_start;
		const month_list_start = req.body.month_list_start;
		const year_list_start = req.body.year_list_start;

		if (!title || !title.trim()) {

			res.status(400).json({message: 'Invalid Request !'});

		} else {

			reminder.registerReminder(title,day_start,month_start,year_start,minute_start,hour_start,repeat_type,repeat_qty, creator,
				day_list_start,month_list_start,year_list_start)

			.then(result => {

				//res.setHeader('Location', '/activities/'+title);
				res.status(result.status).json({ message: result.message, reminderServer:result.reminderServer })
			})

			.catch(err => res.status(err.status).json({ message: err.message }));
		}
	});

	router.post('/flags', (req, res) => {

		const creator = req.body.creator;

		const title = req.body.title;

		const day_start = req.body.day_start;
		const month_start = req.body.month_start;
		const year_start = req.body.year_start;

		const type = req.body.type;

		const day_end = req.body.day_end;
		const month_end = req.body.month_end;
		const year_end = req.body.year_end;

		const minute_start = req.body.minute_start;
		const hour_start = req.body.hour_start;

		const minute_end = req.body.minute_end;
		const hour_end = req.body.hour_end;

		const repeat_type = req.body.repeat_type;
		const repeat_qty = req.body.repeat_qty;

		const day_list_start = req.body.day_list_start;
		const month_list_start = req.body.month_list_start;
		const year_list_start = req.body.year_list_start;
		const day_list_end = req.body.day_list_end;
		const month_list_end = req.body.month_list_end;
		const year_list_end = req.body.year_list_end;

		const v_guest = req.body.guest;

		const toAll = req.body.toAll;

		if (!title || !title.trim()) {

			res.status(400).json({message: 'Invalid Request !'});

		} else {

			flag.registerFlag(creator, v_guest, type,title,day_start,month_start,year_start,day_end,
				month_end,year_end,minute_start,hour_start,minute_end,hour_end,repeat_type,repeat_qty, toAll,
				day_list_start,month_list_start,year_list_start,day_list_end,month_list_end,year_list_end)
			
			.then(result => {

				//res.setHeader('Location', '/activities/'+title);
				res.status(result.status).json({ message: result.message, flag:result.flag })
			})

			.catch(err => res.status(err.status).json({ message: err.message }));
		}
	});

	router.post('/authenticate', (req, res) => {

		const credentials = auth(req);

		if (!credentials) {

			res.status(400).json({ message: 'Invalid Request !' });

		} else {

			login.loginUser(credentials.name, credentials.pass)

			.then(result => {

				//const token = jwt.sign(result, config.secret, { expiresIn: 1440 });
			
				res.status(result.status).json({ user: result.user});

			})

			.catch(err => res.status(err.status).json({ message: err.message }));
		}
	});

	router.get('/tags', (req,res) => {

			tags.getTags()

			.then(result => res.json(result.return))

			.catch(err => res.status(err.status).json({ message: err.message }));
	});

	router.get('/icons', (req,res) => {

			icons.getIcons()

			.then(result => res.json(result.return))

			.catch(err => res.status(err.status).json({ message: err.message }));
	});

	router.get('/appInfo', (req,res) => {

			appInfo.getAppInfo()

			.then(result => res.json(result.return))

			.catch(err => res.status(err.status).json({ message: err.message }));
	});

	router.get('/bgFeed', (req,res) => {

			bgFeed.getBgFeed()

			.then(result => res.json(result.return))

			.catch(err => res.status(err.status).json({ message: err.message }));
	});

	router.get('/bgProfile', (req,res) => {

			bgProfile.getBgProfile()

			.then(result => res.json(result.return))

			.catch(err => res.status(err.status).json({ message: err.message }));
	});

	router.get('/interest', (req,res) => {

			interest.getInterest()

			.then(result => res.json(result.return))

			.catch(err => res.status(err.status).json({ message: err.message }));
	});

	router.post('/get_invite_request/:id', (req,res) => {

			const day = req.body.day;
			const month = req.body.month;
			const year = req.body.year;
			const minute = req.body.minute;
			const hour = req.body.hour;

			get_invite_request.getInviteRequest(req.params.id, day, month, year, minute, hour)

			.then(result => res.json({ my_commit_flag:result.my_commit_flag, my_commit_act: result.my_commit_act, whats_going_act:result.whats_going_act, whats_going_flag: result.whats_going_flag }))

			.catch(err => res.status(err.status).json({ message: err.message }));
	});

	router.get('/get_blocked_users/:id', (req,res) => {

		const email = req.params.id;

		get_blocked_users.getBlockedUsers(email)

		.then(result => res.json(result.return))

		.catch(err => res.status(err.status).json({ message: err.message }));
	});

	router.get('/get_friends/:id', (req,res) => {

		const email = req.params.id;

		people.getUsers(email)

		.then(result => res.json(result.return))

		.catch(err => res.status(err.status).json({ message: err.message }));
	});

	router.get('/get_imported_google/:id', (req,res) => {

		const email = req.params.id;

		getGoogle.getImportedGoogle(email)

		.then(result => res.json({ whats_going_act: result.whats_going_act, icon:result.icon }))

		.catch(err => res.status(err.status).json({ message: err.message }));
	});

	router.get('/get_friends_request/:id', (req,res) => {

		const email = req.params.id;

		retrieve_friend_request.getFriendRequest(email)

		.then(result => res.json({ people : result.return, adms: result.result_notification}))

		.catch(err => res.status(err.status).json({ message: err.message }));
	});

	router.post('/get_past_activities/:id', (req,res) => {

		const email = req.params.id;
		const month = req.body.month;
		const year = req.body.year;

		retrieve_past_activities.getPastActivities(email, month, year)

		.then(result => res.json(result.return))

		.catch(err => res.status(err.status).json({ message: err.message }));
	});

	router.get('/users/:id', (req,res) => {

			profile.getProfile(req.params.id)

			.then(result => res.json(result.return))

			.catch(err => res.status(err.status).json({ message: err.message }));
	});

	router.post('/delete_account/:id', (req,res) => {

			delete_account.deleteAccount(req.params.id)

			.then(result => res.status(result.status).json({ message: result.message }))

			.catch(err => res.status(err.status).json({ message: err.message }));
	});

	router.post('/friend_request/:id', (req,res) => {

		const email_friend = req.params.id;
		const email = req.body.email;

		send_friend_request.sendFriendRequest(email, email_friend)

		.then(result => res.status(result.status).json({ message: result.message }))

		.catch(err => res.status(err.status).json({ message: err.message }));

	});

	router.post('/visualize_friend_request/:id', (req,res) => {

		const email = req.params.id;

		visualize_friend_request.visualizeFriendRequest(email)

		.then(result => res.status(result.status).json({ message: result.message }))

		.catch(err => res.status(err.status).json({ message: err.message }));

	});

	router.post('/visualize_invite_request/:id', (req,res) => {

		const email = req.params.id;

		visualize_invite_request.visualizeInviteRequest(email)

		.then(result => res.status(result.status).json({ message: result.message }))

		.catch(err => res.status(err.status).json({ message: err.message }));

	});

	router.post('/favorite_friend/:id', (req,res) => {

		const email_friend = req.params.id;
		const email = req.body.email;
		const type = req.body.privacy;

		favorite.favoritePerson(email, email_friend, type)

		.then(result => res.status(result.status).json({ message: result.message }))

		.catch(err => res.status(err.status).json({ message: err.message }));

	});

	router.post('/delete_friend/:id', (req,res) => {

		const email_friend = req.params.id;
		const email = req.body.email;
		const type = req.body.privacy;

		delete_friend.deletePerson(email, email_friend)

		.then(result => res.status(result.status).json({ message: result.message }))

		.catch(err => res.status(err.status).json({ message: err.message }));

	});

	router.post('/block_friend/:id', (req,res) => {

		const email_friend = req.params.id;
		const email = req.body.email;
		const type = req.body.privacy;

		block_friend.blockPerson(email, email_friend, type)

		.then(result => res.status(result.status).json({ message: result.message }))

		.catch(err => res.status(err.status).json({ message: err.message }));

	});

	router.post('/block_friends_list/:id', (req,res) => {

		const email = req.params.id;
		const emails = req.body.emails;

		block_friends_list.blockPeople(email, emails)

		.then(result => res.status(result.status).json({ message: result.message }))

		.catch(err => res.status(err.status).json({ message: err.message }));

	});

	router.post('/feed_filter/:id', (req,res) => {

		const email = req.params.id;
		
		const day_start = req.body.day_start;
		const month_start = req.body.month_start;
		const year_start = req.body.year_start;

		const day_end = req.body.day_end;
		const month_end = req.body.month_end;
		const year_end = req.body.year_end;

		const minute_start = req.body.minute_start;
		const hour_start = req.body.hour_start;

		const minute_end = req.body.minute_end;
		const hour_end = req.body.hour_end;

		const tags = req.body.tags;
		const friends = req.body.friends;

		const popularity = req.body.popularity;

		feed_filter.getFeedFilter(email,popularity,day_start,month_start,year_start,
			day_end,month_end,year_end,minute_start,hour_start,minute_end,hour_end,tags,friends)

		.then(result => res.json({ message: result.message, whats_going_act: result.whats_going_act, whats_going_flag: result.whats_going_flag }) )

		.catch(err => res.status(err.status).json({ message: err.message }));

	});

	router.post('/search_filter/:id', (req,res) => {

		const email = req.params.id;
		
		const day_start = req.body.day_start;
		const month_start = req.body.month_start;
		const year_start = req.body.year_start;

		const day_end = req.body.day_end;
		const month_end = req.body.month_end;
		const year_end = req.body.year_end;

		const minute_start = req.body.minute_start;
		const hour_start = req.body.hour_start;

		const minute_end = req.body.minute_end;
		const hour_end = req.body.hour_end;

		const tags = req.body.tags;
		const friends = req.body.friends;

		const popularity = req.body.popularity;

		const query = req.body.query;

		search_filter.getSearchFilter(email,query,popularity,day_start,month_start,year_start,
			day_end,month_end,year_end,minute_start,hour_start,minute_end,hour_end,tags,friends)

		.then(result => res.json({ message: result.message, 
			whats_going_act: result.whats_going_act, 
			whats_going_flag: result.whats_going_flag, 
			my_commit_act: result.my_commit_act, 
			my_commit_flag: result.my_commit_flag, 
			my_commit_reminder: result.my_commit_reminder, 
			people: result.people }) )

		.catch(err => res.status(err.status).json({ message: err.message }));

	});

	router.post('/feed/:id', (req,res) => {

		const email = req.params.id;
		const day = req.body.day;
		const month = req.body.month;
		const year = req.body.year;
		const minute = req.body.minute;
		const hour = req.body.hour;
		const id_device = req.body.id_device;

		feed.getFeedActivities(email, day, month, year, minute, hour, id_device)

		.then(result => res.json({ message: result.message, whats_going_act: result.whats_going_act, whats_going_flag: result.whats_going_flag }) )

		.catch(err => res.status(err.status).json({ message: err.message }));

	});

	router.get('/get_flag_reminder/:id', (req,res) => {

		const id = req.params.id;

		get_flag_reminder.getFlagReminder(id, "")

		.then(result => res.json({ message: 'Funcionou', people: result.people, user: result.user, whats_going_flag: result.whats_going_flag, my_commit_reminder: result.my_commit_reminder }) )

		.catch(err => res.status(err.status).json({ message: err.message }));

	});

	router.post('/get_flag2/:id', (req,res) => {

		const id = req.params.id;
		const order = req.body.id;
		const email = req.body.creator;

		get_flag_reminder.getFlagReminder(id, email)

		.then(result => res.json({ message: order, people: result.people, user: result.user, whats_going_flag: result.whats_going_flag, my_commit_reminder: result.my_commit_reminder }) )

		.catch(err => res.status(err.status).json({ message: err.message }));

	});

	router.post('/get_activity_day/', (req,res) => {

		const email = req.body.email;
		const day = req.body.day;
		const month = req.body.month;
		const year = req.body.year;

		get_activity_day.getAtivityOfTheDay(email, day, month, year)

		.then(result => res.json({ message: 'Funcionou', my_commit_flag: result.my_commit_flag, my_commit_act: result.my_commit_act, my_commit_reminder: result.my_commit_reminder }) )

		.catch(err => res.status(err.status).json({ message: err.message }));

	});

	router.post('/get_profile_main/', (req,res) => {

		const email = req.body.email;
		const day = req.body.day;
		const month = req.body.month;
		const year = req.body.year;
		const minute_start = req.body.minute_start;
		const hour_start = req.body.hour_start;

		get_profile_main.getProfileInfoFragment(email, day, month, year, minute_start, hour_start)

		.then(result => res.json({ message: 'Funcionou', 
			user: result.user, 
			my_commit_act: result.my_commit_act, 
			my_commit_flag: result.my_commit_flag, 
			my_commit_reminder: result.my_commit_reminder,
			n_friend_request: result.n_friend_request, 
			n_all_request_act: result.n_all_request_act,
			n_all_request_flag: result.n_all_request_flag }) )

		.catch(err => res.status(err.status).json({ message: err.message }));

	});




	router.post('/edit_activity/:id', (req,res) => {

		const id = req.params.id;

		const title = req.body.title;
		const description = req.body.description;
		const location = req.body.location;
		const invitation_type = req.body.invitation_type;

		const day_start = req.body.day_start;
		const month_start = req.body.month_start;
		const year_start = req.body.year_start;
		const day_end = req.body.day_end;
		const month_end = req.body.month_end;
		const year_end = req.body.year_end;

		const minute_start = req.body.minute_start;
		const hour_start = req.body.hour_start;
		const minute_end = req.body.minute_end;
		const hour_end = req.body.hour_end;

		const cube_color = req.body.cube_color;
		const cube_color_upper = req.body.cube_color_upper;
		const cube_icon = req.body.cube_icon;

		const lat = req.body.lat;
		const lng = req.body.lng;
		const whatsapp_group_link = req.body.whatsapp_group_link;

		const repeat_type = req.body.repeat_type;
		const repeat_qty = req.body.repeat_qty;

		const day_list_start = req.body.day_list_start;
		const month_list_start = req.body.month_list_start;
		const year_list_start = req.body.year_list_start;
		const day_list_end = req.body.day_list_end;
		const month_list_end = req.body.month_list_end;
		const year_list_end = req.body.year_list_end;

		const tags = req.body.tags;

		const disconnect = req.body.id;

		editActivity.updateActivity(id,title,description,location,invitation_type,day_start,month_start,year_start,
							day_end,month_end,year_end,minute_start,hour_start,minute_end,hour_end,cube_color, tags, 
							cube_color_upper,cube_icon,lat,lng,whatsapp_group_link, repeat_type, repeat_qty, disconnect,
							day_list_start, month_list_start, year_list_start, day_list_end, month_list_end, year_list_end)

		.then(result => res.json({ message: result.message }) )

		.catch(err => res.status(err.status).json({ message: err.message }));

	});

	router.post('/edit_flag/:id', (req,res) => {

		const id = req.params.id;

		const title = req.body.title;

		const repeat_type = req.body.repeat_type;

		editFlag.updateFlag(id,title, repeat_type)

		.then(result => res.json({ message: result.message }) )

		.catch(err => res.status(err.status).json({ message: err.message }));

	});

	router.post('/edit_reminder/:id', (req,res) => {

		const id = req.params.id;
		const title = req.body.title;

		const day_start = req.body.day_start;
		const month_start = req.body.month_start;
		const year_start = req.body.year_start;

		const minute_start = req.body.minute_start;
		const hour_start = req.body.hour_start;

		const repeat_type = req.body.repeat_type;
		const repeat_qty = req.body.repeat_qty;

		const day_list_start = req.body.day_list_start;
		const month_list_start = req.body.month_list_start;
		const year_list_start = req.body.year_list_start;

		const disconnect = req.body.visibility;

		editReminder.updateReminder(id,title,day_start,month_start,year_start,minute_start,hour_start, repeat_type, repeat_qty, day_list_start, month_list_start, year_list_start, disconnect)

		.then(result => res.json({ message: result.message }) )

		.catch(err => res.status(err.status).json({ message: err.message }));

	});




	router.get('/get_act/:id', (req,res) => {

		const id = req.params.id;

		get_act.getActivity(id, "")

		.then(result => res.json({ message: 'Funcionou', people: result.people, tags: result.tags, user: result.user, adms: result.adms, whats_going_act: result.whats_going_act }) )

		.catch(err => res.status(err.status).json({ message: err.message }));

	});

	router.post('/get_act2/:id', (req,res) => {

		const id = req.params.id;
		const order = req.body.id;
		const email = req.body.creator;

		get_act.getActivity(id, email)

		.then(result => res.json({ message: order, people: result.people, tags: result.tags, user: result.user, adms: result.adms, whats_going_act: result.whats_going_act }) )

		.catch(err => res.status(err.status).json({ message: err.message }));

	});

	router.post('/authenticateFacebook/', (req,res) => {

		const email = req.body.email;
		const id_facebook = req.body.id_facebook;
		const name = req.body.name;

		const day_born = req.body.day_born;
		const month_born = req.body.month_born;
		const year_born = req.body.year_born;

		const lives_in = req.body.lives_in;
		const gender = req.body.gender;
		const photo = req.body.photo;

		loginFacebook.loginUserFacebook(email, id_facebook, name, day_born, month_born, year_born, lives_in, gender, photo)

		.then(result => res.status(result.status).json({ user: result.user }) )

		.catch(err => res.status(err.status).json({ message: err.message }));

	});

	router.post('/search', (req,res) => {

		const email = req.body.email;
		const query = req.body.query;
		const day = req.body.day;
		const month = req.body.month;
		const year = req.body.year;

		search.getSearchResults(email, day, month, year, query)

		.then(result => res.json({ message: result.message, 
			whats_going_act: result.whats_going_act, 
			whats_going_flag: result.whats_going_flag, 
			my_commit_act: result.my_commit_act, 
			my_commit_flag: result.my_commit_flag, 
			my_commit_reminder: result.my_commit_reminder, 
			people: result.people }) )

		.catch(err => res.status(err.status).json({ message: err.message }));

	});

	router.post('/cancel_friend_request', (req,res) => {

		const email = req.body.email;
		const email_friend = req.body.email_friend;

		cancel_friend_request.cancelFriendRequest(email, email_friend)

		.then(result => res.status(result.status).json({ message: result.message }) )

		.catch(err => res.status(err.status).json({ message: err.message }));

	});

	router.post('/update_friend_request', (req,res) => {

		const email = req.body.email;
		const email_friend = req.body.email_friend;
		const status = req.body.status;

		update_friend_request.updateFriendRequest(email, email_friend, status)

		.then(result => res.status(result.status).json({ message: result.message }) )

		.catch(err => res.status(err.status).json({ message: err.message }));

	});

	router.post('/delete_activity/:id', (req,res) => {

		const id = req.params.id;
		const delete_commitment = req.body.id;
		const type = req.body.visibility;

		deleteActivity.deleteActivity(id, delete_commitment, type)

		.then(result => res.status(result.status).json({ message: result.message }) )

		.catch(err => res.status(err.status).json({ message: err.message }));

	});

	router.post('/update_invite_request', (req,res) => {

		const email = req.body.email;
		const id_act = req.body.id_act;
		const status = req.body.status;
		const type = req.body.type;

		update_invite_request.updateInviteRequest(email, id_act, status, type)

		.then(result => res.status(result.status).json({ message: result.message }) )

		.catch(err => res.status(err.status).json({ message: err.message }));

	});

	router.post('/set_adm_activity', (req,res) => {

		const email = req.body.email;
		const id_act = req.body.id_act;
		const type = req.body.type;

		set_adm.setAdm(email, id_act, type)

		.then(result => res.status(result.status).json({ message: result.message }) )

		.catch(err => res.status(err.status).json({ message: err.message }));

	});

	router.post('/add_new_guest', (req,res) => {

		const creator = req.body.creator;
		const id_act = req.body.id;
		const v_guest = req.body.guest;
		const type = req.body.visibility;

		add_new_guest.addNewGuest(creator, v_guest, id_act, type)

		.then(result => res.status(result.status).json({ message: result.message }) )

		.catch(err => res.status(err.status).json({ message: err.message }));

	});

	router.post('/friends_plans', (req,res) => {

		const email = req.body.email;
		const emails = req.body.emails;
		const d1 = req.body.d1;
		const d1f = req.body.d1f;
		const d2 = req.body.d2;
		const m = req.body.m;
		const a = req.body.a;
		const m2 = req.body.m2;
		const a2 = req.body.a2;

		friendsPlans.getFriendsPlans(email, d1, d1f, d2, m, a, m2, a2, emails[0])

		.then(result => res.status(result.status).json({ message: 'Funcionou', my_commit_flag: result.my_commit_flag, my_commit_act: result.my_commit_act, user : result.user }) )

		.catch(err => res.status(err.status).json({ message: err.message }));

	});

	router.post('/plans', (req,res) => {

		const email = req.body.email;
		const emails = req.body.emails;
		const d1 = req.body.d1;
		const d1f = req.body.d1f;
		const d2 = req.body.d2;
		const m = req.body.m;
		const a = req.body.a;
		const m2 = req.body.m2;
		const a2 = req.body.a2;
		const id_device = req.body.id_device;

		plans.getPlans(email, d1, d1f, d2, m, a, m2, a2, emails[0], id_device)

		.then(result => res.status(result.status).json({ message: 'Funcionou', my_commit_flag: result.my_commit_flag, my_commit_act: result.my_commit_act, my_commit_reminder: result.my_commit_reminder, user : result.user, people : result.people }) )

		.catch(err => res.status(err.status).json({ message: err.message }));

	});

	router.post('/compare', (req,res) => {

		const emails = req.body.emails;
		const d1 = req.body.d1;
		const d1f = req.body.d1f;
		const d2 = req.body.d2;
		const m = req.body.m;
		const a = req.body.a;
		const m2 = req.body.m2;
		const a2 = req.body.a2;

		compare.getCompare(emails, d1, d1f, d2, m, a, m2, a2)

		.then(result => res.status(result.status).json({ message: 'Funcionou', my_commit_flag: result.my_commit_flag, my_commit_act: result.my_commit_act, user: result.user }) )

		.catch(err => res.status(err.status).json({ message: err.message }));

	});

	router.post('/users/:id/password', (req,res) => {

		const email = req.params.id;
		const token = req.body.token;
		const newPassword = req.body.password;

		if (!token || !newPassword || !token.trim() || !newPassword.trim()) {

			password.resetPasswordInit(email)

			.then(result => res.status(result.status).json({ message: result.message }))

			.catch(err => res.status(err.status).json({ message: err.message }));

		} else {

			password.resetPasswordFinish(email, token, newPassword)

			.then(result => res.status(result.status).json({ message: result.message }))

			.catch(err => res.status(err.status).json({ message: err.message }));
		}
	});

	router.post('/change_password/', (req,res) => {

		const oldPassword = req.body.password;
		const newPassword = req.body.newPassword;

		if (!oldPassword || !newPassword || !oldPassword.trim() || !newPassword.trim()) {

			res.status(400).json({ message: 'Invalid Request !' });

		} else {

			password.changePassword(req.body.email, oldPassword, newPassword)

			.then(result => res.status(result.status).json({ message: result.message }))

			.catch(err => res.status(err.status).json({ message: err.message }));

		}
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