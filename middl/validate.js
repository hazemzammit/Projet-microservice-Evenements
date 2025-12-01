const yup=require('yup');


const validate= async(req,res,next)=>{
    try{    
        const schema=yup.object().shape({
            username:yup.string().matches(/^[A-Z][a-z]/).required(),
            email:yup.string().email().matches(/[A-Za-z0-9]+@esprit.tn$/).required(),
            cin:yup.number().required()
        })
        console.log('body'+req.body);
 await schema.validate(req.body);
    next();
    
    } catch(err){
        console.log(err);
        res.send(err);
    }


}
module.exports={validate};   