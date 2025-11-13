const jwt = require('jsonwebtoken');

// module.exports = (...roles) => {
//   return (req,res,next)=>{
//     try{
//       const header = req.headers.authorization || '';
//       const token = header.startsWith('Bearer ') ? header.slice(7) : null;
//       if(!token) return res.status(401).json({success:false, message:'Missing token'});
//       const payload = jwt.verify(token, process.env.JWT_SECRET);
//       if(roles.length && !roles.includes(payload.role)){
//         return res.status(403).json({success:false, message:'Forbidden'});
//       }
//       req.user = payload;
//       console.log('Auth payload=', payload);
//       next();// ผ่าน ทุกด่าน       
//     }catch(e){
//       e.status = e.name === 'JsonWebTokenError' ? 401 : 500;
//       next(e);
//     }
//   }
// }
// auth.js (เฉพาะช่วง debug)


module.exports = (...roles) => {
  return (req, res, next) => {
    try {
      const header = req.headers.authorization || '';

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
      }

      const token = header.startsWith('Bearer ') ? header.slice(7) : null;
      if (!token) {
        return res.status(401).json({ success: false, message: 'Missing token' });
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);

      if (roles.length && !roles.includes(payload.role)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      req.user = payload;
      return next();
    } catch (e) {
      e.status = e.name === 'JsonWebTokenError' ? 401 : 500;
      next(e);
    }
  };
};
