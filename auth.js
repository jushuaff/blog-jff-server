const jwt = require("jsonwebtoken");

require('dotenv').config()

module.exports.createAccessToken = (user) => {
	const data = {
		id: user._id,
		email : user.email,
		isAdmin : user.isAdmin
	}
	return jwt.sign(data, process.env.JWT_SECRET_KEY, {});

}

//[SECTION] Token Verification

module.exports.verify = (req, res, next) => {
	console.log(req.headers.authorization)

	let token = req.headers.authorization
	if(!token || !token.startsWith('Bearer ')){
		return res.status(401).send({ auth: "Failed. No Token"})
	} else {
		console.log(token);
		token = token.slice(7, token.length)
		console.log(token)

		jwt.verify(token, process.env.JWT_SECRET_KEY, { algorithms: ['HS256'] }, function(err, decodedToken){

			if (err){
				return res.status(404).send({
					auth: "Failed",
					message: err.message
				})
			} else {
				console.log("result from verify method:")
				console.log(decodedToken);
				//if our token is verified  to be correct, then we will update the request and add the user's decoded token details
				req.user = decodedToken

				//it passes details of the request and response to the next function/middleware
				next()
			}
		})
	}
}

module.exports.verifyAdmin = (req, res, next) => {
	//Checks if the owner of the token is an admin
	if(req.user.isAdmin){
		next()
	} else {
		return res.status(403).send({
			auth: "Failed",
			message: "Action Forbidden"
		})
	}
}

//[SECTION] Error Handler
module.exports.errorHandler = (err, req, res, next) => {
	//Logging the error
	console.error(err)

	const statusCode = err.status || 500;
	const errorMessage = err.message || 'Internal Server Error';
	res.status(statusCode).json({
	//Sends a standardized error response
		error: {
			message: errorMessage,
			errorCode: err.code || 'SERVER_ERROR',
			details: err.details || null
		}
	});
};

//[SECTION] Middleware is to check id the user is authenticated
module.exports.isLoggedIn = (req, res, next) =>{
	if(req.user){
		next();
	}else{
		res.sendStatus(401);
	}
}