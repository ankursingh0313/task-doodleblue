const jwt = require('jsonwebtoken');
function authunticateRoute(req, res, next) {
    const auth_header = req.headers['authorization'];
    const token = auth_header?auth_header.split(' ')[1]:null;
    if (token == null) {
        res.status = 403;
        res.send("Aunauthorized access, please loginn before");
    } else {
        jwt.verify(token, process.env.JWT_SECRET_KEY, (err, data)=>{
            if (err) {
                res.status = 403;
                res.send("Aunauthorized access, please loginn before");
            } else {
                req.data = data;
                next();
            }
        })
    }
}

module.exports = {
    authunticateRoute
}