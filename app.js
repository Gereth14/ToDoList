// TODO: Find out if i can get users Decrypted password to transfer them to a newly made user.
// TODO: Implement Google login/signup function

require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyparser = require("body-parser");
const { MongoClient } = require("mongodb");
const scripts = require("./public/script/scripts")
var mongoose = require("mongoose");
var encrypt = require("mongoose-encryption");
const nodemailer= require("nodemailer");
const PORT = 3000;

const app = express();
app.set('view engine', 'ejs');
app.use(bodyparser.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(__dirname + '/node_modules/bootstrap/dist'));

// Database and collection initialisation
const uri = `mongodb+srv://${process.env.user}:${process.env.password}@mycluster.kquwbl3.mongodb.net/`;
const client = new MongoClient(uri);
const db = client.db("dbToDoList");
const coll = db.collection("Account");

let page = ""; // To Tell which list page the user is in
let Lists; // Store the Lists the user has
let UserEmail = ""; // Get which user is logged in
let Tasks; // Store the tasks of each list the user has



// Mongoose encryption
mongoose.set("strictQuery", false);
mongoose.connect(`mongodb+srv://${process.env.user}:${process.env.password}@mycluster.kquwbl3.mongodb.net/dbToDoList`);
var userSchema = new mongoose.Schema({
    Email: String,
    Name: String,
    Password: String,
    Lists: Array,
    Status: String,
    ConfirmationCode: {
        type: String,
        unique: true,
    },
});

const transport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.email,
        pass: process.env.emailpass,
    },
});

var secret = process.env.secret;
userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["Password"]} );
var User = mongoose.model('Account', userSchema, 'Account');

app.get("/", function(req, res){
    res.render("about");
});

app.get("/confirm/:confirmationCode", function(req, res){
    async function Confirmation(){
        await User.findOneAndUpdate({ConfirmationCode: req.params.confirmationCode}, {Status: "Active"});
        res.render("confirmation");
    }
    Confirmation();
});

app.get("/SignUp", function(req, res){
    res.render("SignUp", {EmailInUse: ""});
});

app.post("/SignUp", function(req, res){
    async function SignUp(){
        try{
            req.body.ErrorLabel = "testing";
            const characters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
            let token = "";
            for(let i = 0; i < 25; i++){
                token += characters[Math.floor(Math.random() * characters.length)];
            }
            let ContinueCreation = "";
            User.find({Email: req.body.Email}, function(err, docs){
                ContinueCreation = scripts.ConfirmAccountCreation(docs, req.body.Email);
                if(ContinueCreation == "True"){
                    var newUser = new User({
                        Email: req.body.Email,
                        Name: req.body.Name,
                        Password: req.body.Password,
                        Lists: Lists,
                        Status: "Pending",
                        ConfirmationCode: token,
                    });
                    const subject = "Confirmation Eamil";
                    const message = "Thank you for signing up. Please click on the link to confirm your email!";
                    const link = "confirm";
                    scripts.sendConfirmationEmail(req.body.Name, req.body.Email, token, transport, process.env.email, subject, message, link);
                    newUser.save();
                    res.render("ConfirmEmail", {Message: "Please confirm your email address in your inbox!"});
                }else{
                    res.render("SignUp", {EmailInUse: "Email Already Exists!"});
                }
            });
        }catch(err){
            console.log(err);
        }
    }
    SignUp();
});

app.get("/login", function(req, res){
    res.render("login", {ErrorMessage: ""});
});

app.post("/login", function(req, res){
    User.find({Email: req.body.Email}, function(err, docs){
        if(err){
            console.log(err);
        }else{
            UserEmail = scripts.ValidateUser(docs, req.body.Email, req.body.Password);
            if(UserEmail != ""){
                let confirmedEmail = scripts.ConfirmedEmail(docs)
                if(confirmedEmail == "true"){
                    req.body.Email = "";
                    req.body.password = "";
                    res.redirect("/home");
                }else{
                    res.render("login", {ErrorMessage: "Please confirm your email address in your inbox!"})
                    console.log("Email not confirmed");
                }
                
            }else{
                res.render("login", {ErrorMessage: "Incorrect Email or Password"});
            }
        }
    });
});

app.get("/logout", function(req, res){
    page = "";
    Lists;
    UserEmail = "";
    Tasks;
    res.render("about")
});

app.get("/ForgetPassword", function(req, res){
    res.render("ForgetPassword", {ErrorMessage: ""});
});

app.post("/ForgetPassword", function(req, res){
    User.find({Email: req.body.Email}, function(err, docs){
        let ContinueCreation = scripts.ConfirmAccountCreation(docs, req.body.Email);
        if(ContinueCreation == "False"){
            docs.forEach(function(doc){
                const subject = "Change Password";
                const message = "Please click on the link below to change your password!";
                const link = "ChangePassword";
                scripts.sendConfirmationEmail(doc.Name, req.body.Email, doc.ConfirmationCode, transport, process.env.email, subject, message, link);
                res.render("ConfirmEmail", {Message: "Pleas click the link in your email inbox to change your password!"});
            });
        }else{
            res.render("ForgetPassword", {ErrorMessage: "Email does not exist!"});
        }
        
    });
});

let Email = "";
let OldConfirmationCode = "";
app.get("/ChangePassword/:ConfirmationCode", function(req, res){
    User.find({ConfirmationCode: req.params.ConfirmationCode}, function(err, docs){
        docs.forEach(function(doc){
            if(doc.ConfirmationCode == req.params.ConfirmationCode){
                Email = doc.Email;
                OldConfirmationCode = req.params.ConfirmationCode;
            }
        });
        res.render("ChangePassword", {Email: Email, Message: ""});
    });
    
})

app.post("/ChangePassword", function(req, res){
    async function ChangePassword(){
        const characters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let newConfirmationCode = "";
        for(let i = 0; i < 25; i++){
            newConfirmationCode += characters[Math.floor(Math.random() * characters.length)];
        }
        User.find({Email: Email}, function(err, docs){
            let AccountnonExistant = scripts.ConfirmAccountCreation(docs, Email);
            if(AccountnonExistant == "False"){
                docs.forEach(function(doc){
                    var newUser = new User({
                        Email: doc.Email,
                        Name: doc.Name,
                        Password: req.body.Password,
                        Lists: doc.Lists,
                        Status:"Active",
                        ConfirmationCode: newConfirmationCode,
                    });
                    const subject = "Password Change";
                    const message = "Password has beem successfully changed!";
                    const link = "login";
                    //scripts.sendConfirmationEmail(req.body.Name, req.body.Email, "", transport, process.env.email, subject, message, link);
                    newUser.save();
                    
                }); 
            }else{
                console.log("error");
            }
            
        });
    }
    async function DeleteOne(){
        await User.deleteOne({ConfirmationCode: OldConfirmationCode});
        res.redirect("/login");
    }
    ChangePassword();
    DeleteOne();
});

app.get("/home", function(req, res){
    async function DisplayLists(){
        try{
            await client.connect();
            const cursor = coll.find({Email: UserEmail });
            let i = [];
            await cursor.forEach(function(q){
                i.push(q);
            });
            i.forEach(function(list){
                Lists = list.Lists
            });
        }finally{
            res.render("home", {Lists : Lists, Message: ""});
        }
    }
    DisplayLists();
});

app.get("/Lists/:list", function(req,res){
    async function LoadList(){
        try{
           page = req.params.list; // specifcy which page the list page is in
           Tasks = scripts.AddTaskIntoList(Lists, Tasks, req.params.list);
        }finally{
            res.render("list", {ListTitle: req.params.list, Tasks : Tasks, Lists : Lists});
        }
    }
    LoadList();
});


app.post("/Lists/:list", function(req, res){
    async function InsertItem(){
        try{
            Tasks.push(req.body.NewTask);
            await coll.updateOne({Email: UserEmail, "Lists.name": page}, {$set: {"Lists.$.tasks": Tasks}});
        }finally{
            res.redirect("/Lists/" + page);
        }
    }
    InsertItem();
});

app.post("/remove", function(req, res){
    Tasks = scripts.removeItem(req.body.task, Tasks);
    async function DeleteTask(){
        try{
            await coll.updateOne({Email: UserEmail, "Lists.name": page}, {$set: {"Lists.$.tasks": Tasks}});
        }finally{
            res.redirect("/Lists/" + page);
        }
    }
    DeleteTask();
});

app.post("/DeleteItem", function(req, res){
    Tasks = scripts.deleteItem(req.body.task, Tasks);
    async function DeleteItem(){
        try{
            await coll.updateOne({Email: UserEmail, "Lists.name": page}, {$set: {"Lists.$.tasks": Tasks}});
        }finally{
            res.redirect("Lists/" + page);
        }
    }
    DeleteItem();
});

app.post("/addList", function(req, res){
    
    async function AddList(){
        try{
            let ListExists = scripts.CheckListExist(Lists, req.body.NewList);
            if(ListExists == "False"){
                let list = [];
                await coll.updateOne({Email: UserEmail}, {$push: {Lists:{name: req.body.NewList, tasks: list}}});
                const cursor = coll.find({Email: UserEmail });
                let i = [];
                await cursor.forEach(function(q){
                    i.push(q);
                });
                i.forEach(function(list){
                    Lists = list.Lists
                });
                res.render("home", {Lists : Lists, Message: ""});
            }else{
                res.render("home", {Lists : Lists, Message: "List already exist!"});
            }
            
        }catch(err){
            console.log(err);
            res.redirect("/home");
        }
    }
   AddList();
});

app.get("/renameList", function(req, res){
    res.render("rename", {ListTitle: page});
});

app.post("/renameList", function(req, res){
    async function renameList(){
        try{
            await coll.updateOne({Email: UserEmail, "Lists.name": page}, {$set: {"Lists.$.name": req.body.Name}});
        }finally{
            res.redirect("/home");
        }
    }
    renameList();
});

app.post("/DeleteList", function(req, res){
    async function DeleteList(){
        try{
            await coll.updateOne({Email: UserEmail}, {$pull: {Lists: {name: page}}}, false, true,);
        }finally{
            res.redirect("/home");
        }
    }
    DeleteList();
});

app.listen(process.env.PORT || PORT, function(){
    console.log(`SERVER: http://LocalHost:${PORT}/login`);
});