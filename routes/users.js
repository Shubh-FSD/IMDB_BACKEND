var express = require("express");
var router = express.Router();
const { mongoose, usersModel } = require("../dbSchema");
const { mongodb, dbName, dbUrl,MongoClient } = require("../dbConfig");
const {
  hashPassowrd,
  hashCompare,
  createToken,
  jwtDecode,
  validate,
  authenticate
} = require("../auth");
mongoose.connect(dbUrl);
var nodemailer = require('nodemailer');
const { render } = require("jade");
const { token } = require("morgan");
const client = new MongoClient(dbUrl)

let emailStorage=[];
let emailStorageAdmin =[];

router.post("/signup", async (req, res) => {
  try {
   
    let user = await usersModel.find({ email: req.body.email });
   
    if (user.length) {
      res.send({
        statusCode: 400,
        message: "User Already Exists",
      });
    } else {
      let hashedPassword = await hashPassowrd(req.body.password);
      req.body.password = hashedPassword;
      let newUser = await usersModel.create(req.body);
    
      res.send({
        statusCode: 200,
        message: "Sign Up Successfull",
      });
    }
  } catch (error) {
    console.log(error);
    res.send({ statusCode: 404, message: "Internal Server Error", error });
  }
});

router.post("/signin", async (req, res) => {
  try {
    let user = await usersModel.find({ email: req.body.email });
    emailStorage.push(req.body.email)
        
    if (user.length) {
      let hash = await hashCompare(req.body.password, user[0].password);

      if (hash) {
        // let token = await createToken(user[0].email, user[0].role);
        let token = await createToken(user[0].email, user[0].role, user[0].batch);

        res.send({ statusCode: 200, message: "Sign-in successfull!!!", token });
      } 
      else res.send({ statusCode: 400, message: "Invalid Credentials" });
      

    } 
    else res.send({ statusCode: 400, message: "User does not exists" });
  } catch (error) {
    console.log(error);
    res.send({ statusCode: 400, message: "Internal Server Error", error });
  }
});


router.post('/reset-password', async(req,res)=>{
  //verify the email exist and create a JWT and send the pwd reset link to that persons email
  await client.connect();
  try{
    const db = client.db(dbName);
    let user = await db.collection("users").findOne({email:req.body.email});
    // console.log(user)

    if(user){
      // console.log(user)
        let token = await createToken({email:user.email, role :user.role});
        // console.log(token)
      let userUpdate=await db.collection("users").updateOne({email:user.email},{$set:{token:token}});
      // console.log(userUpdate)
      res.json({
        message:"sent"
      })
    var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "1999shubhamjoshi@gmail.com",
          pass: "kqpbptbxvdetxvpr",
        },
      });

      var mailOptions = {
        from: "1999shubhamjoshi@gmail.com",
        to:  user.email,
        subject: "Password Reset",
        text: "That was easy!",
        html: `<div>
       <h2>Hello ${user.email}</h2>
       <p>We've recieved a request to reset the password for your account associated with your email.
       You can reset your password by clicking the link below</p>
       <a href=https://imdb-backend-jqps.onrender.com/users/update-password/${token}> Reset Password</a>
       <p><b>Note:</b>The link expires 15 minutes from now</p>
      </div>`,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
    }
    else{
      res.json({
        message:"Invalid User"
      })
    }
  }
  catch(error){
    console.log(error);
        res.sendStatus(400);
  }
  finally{
    client.close();
  }
})

router.get('/update-password/:token', async(req,res,next)=>{
 const {token} =req.params
  try{
    res.render("update-password")}
  catch(error)
  { console.log(error);
    res.sendStatus(500);}
})


router.post('/update-password/:token', async(req,res,next)=>{
  const {token} =req.params;
  // console.log("Toks",token)
  const{password, password2} =req.body
  // console.log(password2,password)

// get the new password and change the password in the db. The email should be decoded from the jwt sent from front end
  await client.connect();
  const mail = await authenticate(token);//authenticating the token and decoding the email address
  // console.log(mail)
const email =mail.email
console.log(email)
  if(email || password === password2){
    try {
      const db = client.db(dbName);
      let user = await db.collection("users").findOne({email:email});
      // console.log(user)
      if(user && user.token===token){
        
          const hash = await hashPassowrd(password);
          let doc = await db.collection("users").updateOne({email:email},{$set:{password:hash,token:""}})//change the pwd in db and delete the token
          
          res.json({
            message:"Password Updated Successfully"
          })
        }
      else{
        res.json({
          message:"Link Invalid"
        })
      }
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  }
  else{
    res.json({
      message:"Link Expired"
    })
  }
  })

    router.get('/getRole/:email',async(req,res)=>{
      const { email } = req.params;
          await client.connect();
    try{
      const db = client.db(dbName);
      let user = await db.collection("users").findOne({email:email});
      // console.log(user)
      let roleVerify =user.role
      console.log(roleVerify)
      res.send({
        statusCode:200,
        dataRole:roleVerify
      })
    }
    catch(error){
      console.log(error);
        res.sendStatus(500);
    }
  })

  router.get('/getEmailData',async(req,res)=>{

  try {
    let users = await usersModel.find({role: "Student"})
    res.send({
      statusCode:200,
      dataEmail:users
    })
} catch (error) {
console.log(error);
res.send({ statusCode: 401, message: "Internal Server Error", error });
}
 })



module.exports = router;
