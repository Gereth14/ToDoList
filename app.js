//jshint esversion:6
require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyparser = require("body-parser");
const { MongoClient } = require("mongodb");
const rootdir = require('./')
const PORT = 3000;

const app = express();
app.set('view engine', 'ejs');
app.use(bodyparser.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
//app.use(express.static(path.join(__dirname, "sass")));
app.use(express.static(__dirname + '/node_modules/bootstrap/dist'));

// Database and collection initialisation
const uri = `mongodb+srv://${process.env.user}:${process.env.password}@mycluster.kquwbl3.mongodb.net/`;
const client = new MongoClient(uri);
const db = client.db("dbToDoList");
const coll = db.collection("Lists");

let page = "";
let Lists = [];

app.get("/", function(req, res){
    async function DisplayLists(){
        try{
            await client.connect();
            const cursor = coll.find();
            Lists = [];
            await cursor.forEach(function(list){
                Lists.push(list);
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
            let query = {name : req.params.list};
            const cursor = await coll.find(query).toArray();
            Tasks = [];
            await cursor.forEach(function(task){
                for(let i = 0; i < task.Tasks.length; i++){
                    Tasks.push(task.Tasks[i]);
                }
            });
            
        }finally{
            res.render("list", {ListTitle: req.params.list, Tasks : Tasks, Lists : Lists});
        }
    }
    page = req.params.list;
    LoadList();
});


app.post("/Lists/:list", function(req, res){
    async function InsertItem(list){
        try{
            await coll.updateOne({name: page}, {$push: {Tasks: req.body.NewTask}})
        }finally{
            res.redirect("/Lists/" + page);
        }
    }
    InsertItem(req.params.list);
});

app.post("/remove", function(req, res){
    let task = [];
    req.body.task.forEach(function(tasks){
        task.push(tasks);
    });
    async function DeleteTask(){
        try{
            for(let i = 0; i < task.length; i++){
                await coll.updateOne({name: page}, {$pull: {Tasks: task[i]}});
            }
        }finally{
            res.redirect("/Lists/" + page);
        }
    }
    DeleteTask();
});

app.post("/DeleteItem", function(req, res){
    async function DeleteItem(){
        try{
            await coll.updateOne({name: page}, {$pull: {Tasks: req.body.task}});
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
            await coll.insertOne({name: req.body.NewList, Tasks: list});
        }finally{
            res.redirect("/");
        }
    }
    AddList();
});

app.get("/renameList", function(req, res){
    res.render("rename", {ListTitle: page});
});

app.post("/renameList", function(req, res){
    // TODO: rename colection
    async function renameList(){
        try{
            await coll.updateOne({name: page}, {$set: {name: req.body.Name}});
        }finally{
            res.redirect("/");
        }
    }
    renameList();
});

app.post("/DeleteList", function(req, res){
    async function DeleteList(){
        try{
            await coll.deleteOne({name: page});
        }finally{
            res.redirect("/");
        }
    }
    DeleteList();
});

app.listen(process.env.PORT || PORT, function(){
    console.log(`SERVER: http://LocalHost:${PORT}`);
});