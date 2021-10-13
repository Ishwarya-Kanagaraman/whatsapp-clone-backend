// importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";
//app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1264365",
    key: "19f336857a437260e742",
    secret: "f6d52015736450e9b5ae",
    cluster: "eu",
    useTLS: true
  });

// middleware
app.use(express.json())
app.use(cors())

// app.use((req,res,next)=>{
//     res.setHeader("Access-Control-Allow-Origin","*");
//     res.setHeader("Access-Control-Allow-Headers","*");
//     next();
// })
// DB config
const url =
  "mongodb+srv://admin:89sbKyfCDm556Bpc@whatsapp-cluster.bsp7n.mongodb.net/whatsappdb?retryWrites=true&w=majority";
mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.once("open", () => {
    console.log("MongoDB is connected yeah!!");

const msgCollection=db.collection('messagecontents')
const changeStream=msgCollection.watch();

changeStream.on('change',(change)=>{
    console.log("A change occoured",change);

    if(change.operationType==='insert'){
        const messageDetails=change.fullDocument;
        pusher.trigger('messages','inserted',
        {
            name:messageDetails.name,
            message:messageDetails.message,
            timestamp:messageDetails.timestamp,
            received:messageDetails.received
        }
      );
    }else{
        console.log('Error triggering Pusher')
    }
   });
});
//api routes
app.get("/", (req, res) => {
  res.status(200).send("Hello world");
});

app.get("/messages/sync",(req,res)=>{
    Messages.find((err,data)=>{
        if(err){
            res.status(500).send(err)
        }else{
            res.status(200).send(data);
        }
    })
})
app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;
  Messages.create(dbMessage, (err, data) => {
    if (err) {
      // 500 internal server error
      res.status(500).send(err);
    } else {
      // 201 created ok
      res.status(201).send(data);
    }
  });
});


//listen
app.listen(port, () => console.log(`listening on local host :${port}`));
