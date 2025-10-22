const dotenv = require('dotenv');
dotenv.config();
const app = require('./app');

const PORT = process.env.PORT || 7000;

app.listen(PORT, ()=>{
  console.log(`API running on http://localhost:${PORT}`);
});

