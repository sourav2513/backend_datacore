const jwt = require('jsonwebtoken');
const {User, Token} = require("../model")

const config = process.env;

// const verifyToken = (req, res, next) => {
//   const token =
//     req.body.token ||
//     req.query.token ||
//     req.params.token ||
//     req.headers['x-access-token'];

//   if (!token) {
//     return res.status(403).send('A token is required for authentication');
//   }
//   try {
//     const decoded = jwt.verify(token, config.TOKEN_KEY);
//     req.user = decoded;
//   } catch (err) {
//     return res.status(401).send({ verify: false });
//   }
//   return next();
// };


module.exports.verifyToken = async (req, res, next) => {
  try {
      let token;
      if (req.headers.authorization)
          token = req.headers.authorization;
      const payload = jwt.verify(token, config.jwt.secret);
      const tokenDoc = await Token.findOne({ user: payload.sub, type: tokenTypes.REFRESH }).populate("user");
      req.user = tokenDoc.user;
      next();
  } catch (error) {
      res.status(httpStatus.UNAUTHORIZED).json({ success: false, message: "Invalid or expired token" });
  }
};

// module.exports = verifyToken;
