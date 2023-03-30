import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import database from './db/connect.js';
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose';
import nodemailer from 'nodemailer'
import bcrypt from 'bcrypt'
import { MongoClient } from 'mongodb'

dotenv.config();
const app = express();
const PORT = process.env.PORT;
const MONGO_URL = process.env.MONGO_URL;
const client = new MongoClient(MONGO_URL);
await client.connect();
app.use(express.urlencoded());
app.use(express.json());
app.use(cors());
database();

app.get("/", function (request, response) {
  response.send("hello World😊😊😊");
});

app.get("/", cors(), (request, response) => {

});



//Signup Model
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true
  },
  email: {
    type: String,
    require: true,
    unique: true
  },
  password: {
    type: String,
    require: true
  },
})
const User = new mongoose.model("User", userSchema)


app.post("/signup", async (request, response) => {

  const { name, email, password } = request.body;

  console.log(request.body);
  try {
    const emailexist = await User.findOne({ email: email })
    if (emailexist) {
      return response.status(400).json("Email alredy Exist")
    }
    const hash = await bcrypt.hash(password, 10)

    const user = new User({
      name: request.body.name,
      email: request.body.email,
      password: hash
    });

    const data = await user.save();
    response.json(data);
  } catch (err) {
    response.status(400).json(err)
  }
})


app.post("/login", async (request, response) => {

  try {
    const userData = await User.findOne({ email: request.body.email })
    if (!userData) {
      return response.status(400).json("email not Exist");
    }

    const validpwd = await bcrypt.compare(request.body.password, userData.password);

    if (!validpwd) {
      return response.status(400).json("Invalid credentials");
    }

    const userToken = jwt.sign({ email: userData.email }, process.env.SECRECT_KEY);

    response.header('auth', userToken).json(userToken)
  } catch (err) {
    response.status(400).json(err)
  }
})


app.post("/email", async function (request, response) {
  const { email, subject, message, numberofemail } = request.body;

  //Message template
  const msgtemplate = `<div>
      <h3>From: ${email}</h3>
      <img src='https://wallpaperaccess.com/full/2579667.jpg' alt='email-image' width="250" height="350"/>
      <h1>${message}</h1>
      </div>`

  const userdata = numberofemail;

  try {
    
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      secure: false,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });
    for (let i = 0; i < userdata; i++) {

      let info = await transporter.sendMail({
        from: process.env.EMAIL, // sender address
        to: email, // list of receivers
        subject: subject, // Subject line
        text: message, // plain text body
        html: msgtemplate, // html body
      });
      console.log("Message sent: %s", info.messageId);
    }

    transporter.sendMail(info, (error, info) => {
      if (error) {
        console.log("Error", error)
      } else {
        console.log("Email sent" + info.response);
        response.status(201), json({ status: 201, info })
      }
    })

  } catch (error) {
    response.status(201).json({ status: 401, error })
  }

});



app.listen(PORT, () => console.log(`The server started in: ${PORT} ✨✨`));


