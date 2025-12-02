const User = require('../models/user'); 

async  function add (req, res) {
    try{
        const user= new User(req.body)
         user.save();
        res.status(200).send(user);
        
        } catch(err){
            res.send(err);
        }}

async function show(req, res)  {
    try{
        const user= await User.find()
        res.send(user);

    } catch(err){
        res.send(err);
    }
}

 async function showbyid(req, res) {
    try{
        const user= await User.findById(req.params.id)
        res.send(user);

    } catch(err){
        res.send(err);
    }
}

async function showbyusername(req, res) {
    try{
        const user= await User.findOne({username: req.params.username})
        res.send(user);

    } catch(err){
        res.send(err);
    }
}
async function update(req, res) {
    try{
        const user= await User.findByIdAndUpdate(req.params.id, req.body, {new:true})
        res.status(200).send(user);
        
        } catch(err){
            res.send(err);
        }
    }

async function deleteuser(req, res) {
    try{
        const user= await User.findByIdAndDelete(req.params.id)
        res.status(200).send("user deleted");
        
        } catch(err){
            res.send(err);
        }
    }
module.exports = {add,show,showbyid,showbyusername,update,deleteuser};


