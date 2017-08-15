require('dotenv').config();
var restify = require('restify');
var restifyPlugins = require('restify-plugins');
var bunyan = require('bunyan');
var errs = require('restify-errors');
var handlers = require('wrappedHandlers');

var server = restify.createServer({
	log: bunyan.createLogger({
		name: 'tilybot-webservice',
		level: 'debug'
	})
});

server.use(restifyPlugins.bodyParser());
server.use(restifyPlugins.requestLogger());

//	Attaches all the wrapped action handlers to the endpoint, as well as final handler for undefined actions
server.post('/apiai/fulfillment', handlers, (req, res, next) => {
	req.log.warn('Unsupported action or no action supplied');
	res.send({
		followupEvent: {
			name: 'SERVER_ERROR',
			data: {
				error: new errs.NotImplementedError('req_id=' + req.id())
			}
		},
		contextOut: [
			{
				name: 'eventTriggered',
				lifespan: 1
			}
		]
	});
	return next(false);
});

server.listen(process.env.PORT, () => {
	console.log("tilybot-webservice started on port " + process.env.PORT);
});