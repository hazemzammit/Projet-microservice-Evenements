const http= require('http')
const express =require('express')
const testRouter= require('./routes/test')
const userRouter= require('./routes/userRoutes')
const experienceRouter= require('./routes/experienceRoutes')



const app=express()
const mongo=require('mongoose')
const dbconnection=require('./config/db.json')
mongo.connect(dbconnection.url)
.then(console.log("database connecte"))
.catch((err) =>{console.log(err)})

app.use(express.json());
app.use('/test', testRouter);
app.use('/user', userRouter);
app.use('/experience', experienceRouter);

const server = http.createServer(app);
server.listen(3000, () => {
  console.log("Server running on port 3000");
});