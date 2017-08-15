## Contents

- [Filesystem Structure](#filesystem-structure)
- [Adding a New Webhook Handler](#adding-a-new-webhook-handler)
	- [Action Handlers](#action-handlers)
	- [Api.Ai Intents](#apiai-intents)
- [Helpers](#helpers)
- [Messages](#messages)
- [Authentication](#authentication)


## Filesystem Structure

	/node_modules		// third-party packages
	/src
	  /node_modules		// project modules
	    /actionHandlers	// handlers for each action from Api.Ai
	    /helpers		// reusable functions for the project
	    api.js		// exports the object for making HTTP requests to the tilr database
	    wrappedHandlers.js	// wraps the action handlers and exports them as a list
	  index.js
	.env			// environment variables file


## Adding a New Webhook Handler

To add a new webhook handler, create an intent on Api.Ai, a corresponding action handler in `/src/node_modules/actionHandlers`, then import and add it to the list of exports in `/src/node_modules/wrappedHandlers.js`.


### Action Handlers

An action handler should have:

- An action name `action`, which corresponds to the action name defined in the Api.Ai intent
- A `handler` function (may be sync or async) which takes in `req`, `res`, and `next` parameters and performs the action handling. You do not need to call `next()` to move to the next handler in the chain as each action handler will be wrapped to do this already. You do not need to do error handling as this is handled in the handler wrapper. HTTP and REST errors will be handled explicitly, and other general errors will yield a `500 InternalServerError`.

Export the action handler as an object containing `action` and `handler` keys with their corresponding values.


### Api.Ai Intents

The pattern our intents typically follow is an event-driven or user-request-driven intent that asks the user a question, a followup intent that captures the user's response, and then two followup intents to that one which handle confirmation of the response's accuracy. The *yes* intent will usually include the action to be performed and send the actual webhook request (toggle it manually at the bottom), while the *no* intent will usually loop back to the response intent again (manually add an "out" context to match the required "in" context for the response intent and close the loop).

	- question
		- response
			- yes -> send webhook
			- no -> back to response


## Helpers

### getContext(contextName, contexts)

Pass the context's name, as well as a list of contexts from the Api.Ai result via `req.body.result.contexts` into `getContext` to get the corresponding context object back. It will return `undefined` if the context does not exist.


### getTilybotPayload(messages)

Pass in the list of fulfillment messages from the Api.Ai result via `req.body.result.fulfillment.messages` to get the tilybot payload object. Note that an intent that uses webhooks to hook into this web service **MUST** provide a tilybot payload of form:

	{
		"tilybot": {
			"messages": [],	// required; contains message objects that should be logged and displayed by the front-end client
			"skills": [],	// optional; if included then the front-end client should add each skill as an action to the front of the action queue
			"next": true	// optional; informs the front-end client that to fall back on the action queue for the next action
		}
	}


## Messages

Each message object in the tilybot payload should have a `type` entry and corresponding additional entries according to the type:


### text

Indicates a basic text message. Should have a `body` entry that contains the body of the message as a string.


### buttons-stack

Indicates a set of buttons arranged vertically (in a stack). Should have an `options` entry that contains a list of objects, each one having a `value` and `label` entry corresponding to that option's internal submitted value and external displayed value, respectively.


### buttons-row

Indicates a set of buttons arranged horizontally (in a row). Should have an `options` entry that contains a list of objects, each one having a `value` and `label` entry corresponding to that option's internal submitted value and external displayed value, respectively.


### checkbox

Indicates a set of checkbox options arranged vertically. Should have an `options` entry that contains a list of objects, each one having a `value` and `label` entry corresponding to that option's internal submitted value and external displayed value, respectively. A submit button should also be added by the front-end client to submit the selected value(s).


### error

Indicates that an error has occurred on the tilybot webservice. The handler wrapper should already take care of catching and handling errors on the webservice end. The client should expect messages of type `error` to have a `body` entry just like `text`-type messages. The type is differentiated from `text` solely for the purposes of potential alternate interpretations/handling by clients (ex. the included error details could be logged, etc.).


## Authentication

Most tilr database requests will need user credentials as authentication. As such, the user's `id`, `email`, and `token` should be passed from the front-end client to Api.Ai (and by extension to this web service through the webhooks) by adding a context called `creds` as follows:

	{
		"name": "creds",
		"parameters": {
			"id": "abcd123",
			"email": "mysteryman@tilr.com",
			"token": "xyz456"
		}
	}

All of this information can be obtained when the user logs in. You can then utilize the helper function `getContext` to get the `creds` context for the required information when making requests to the tilr database. Refer to the [apiary](http://docs.tilr.apiary.io/) page for documentation on each request's requirements.