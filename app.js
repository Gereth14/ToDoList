//jshint esversion:6
require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyparser = require("body-parser");
const { MongoClient } = require("mongodb");
const scripts = require("./public/script/scripts")
var mongoose = require("mongoose");
var encrypt = require("mongoose-encryption");
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

let page = "";
let Lists;
let UserEmail = "";
let Tasks;


// Mongoose encryption
mongoose.connect(`mongodb+srv://${process.env.user}:${process.env.password}@mycluster.kquwbl3.mongodb.net/dbToDoList`);
var userSchema = new mongoose.Schema({
    Email: String,
    Password: String,
    Lists: Array,
});

var secret = process.env.secret;
userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["Password"], decryptPostSave: false } );
var User = mongoose.model('Account', userSchema, 'Account');

app.get("/", function(req, res){
    res.render("about");
})

app.get("/SignUp", function(req, res){
    res.render("SignUp");
});

app.post("/SignUp", function(req, res){
    async function SignUp(){
        try{
            var newUser = new User({
                Email: req.body.Email,
                Password: req.body.Password,
                Lists: Lists,
            });
            await newUser.save();
        }finally{
            res.redirect("/login");
        }
    }
    SignUp();
});

app.get("/login", function(req, res){
    res.render("login");
});

app.post("/login", function(req, res){
    User.find({Email: req.body.Email}, function(err, docs){
        if(err){
            console.log(err);
        }else{
            UserEmail = scripts.ValidateUser(docs, req.body.Email, req.body.Password, UserEmail);
            if(UserEmail != ""){
                res.redirect("/home");
            }else{
                res.redirect("/login");
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
            res.render("home", {Lists : Lists});
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
            let list = [];
            await coll.updateOne({Email: UserEmail}, {$push: {Lists:{name: req.body.NewList, tasks: list}}});
        }finally{
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
    console.log(`SERVER: http://LocalHost:${PORT}`);
});