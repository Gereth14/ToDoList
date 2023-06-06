//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyparser = require("body-parser");
const date = require(__dirname + "/date.js");
const { MongoClient } = require("mongodb");
const PORT = 3000;

const app = express();
app.set('view engine', 'ejs');
app.use(bodyparser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(express.json());

// Database and collection initialisation
const uri = `mongodb+srv://${process.env.user}:${process.env.password}@mycluster.kquwbl3.mongodb.net/`;
const client = new MongoClient(uri);

let page = "";

let allItems = [];
let WorkItems = [];

app.get("/", function(req, res){
    let day = date.getDay();
    async function DisplayItem(){
        try{
            allItems = [];
            await client.connect();
            const db = client.db("dbToDoList");
            const coll = db.collection("ToDoList");
            const cursor = coll.find();
            await cursor.forEach(function(item){
                allItems.push(item);
            });
            res.render("list", {ListTitle: "Today", Tasks: allItems});
        }catch(err){
            console.log(err);
        }
        finally{
            await client.close();
        }
    }
    DisplayItem();
    
});

app.get("/:TypeOfList", function(req, res){
    if(req.params.TypeOfList.toLowerCase() == "work"){
        page = "work";
        async function DisplayWork(){
            try{
                WorkItems = [];
                await client.connect();
                const db = client.db("dbToDoList");
                const coll = db.collection("WorkToDoList");
                const cursor = coll.find();
                await cursor.forEach(function(item){
                    WorkItems.push(item);
                });
                res.render("list", {ListTitle: "Work", Tasks: WorkItems});
            }catch(err){
                console.log(err);
            }
            finally{
                await client.close();
            }
        }
        DisplayWork();
    }
});

app.post("/TypeOfList", function(req, res){
    if(page == "work"){
        async function InsertWork(){
            try{
                await client.connect();
                const db = client.db("dbToDoList");
                const coll = db.collection("WorkToDoList");
                const Item = {
                    name: req.body.NewTask
                };
                await coll.insertOne(Item);
                res.redirect("/work");
            }catch(err){
                console.log(err);
            }
            finally{
                await client.close();
            }
        }
        InsertWork();
    }else{
        async function InsertDaily(){
            try{
                await client.connect();
                const db = client.db("dbToDoList");
                const coll = db.collection("ToDoList");
                const Item = {
                    name: req.body.NewTask
                };
                await coll.insertOne(Item);
                res.redirect("/");
            }catch(err){
                console.log(err);
            }
            finally{
                await client.close();
            }
        }
        InsertDaily();
    }
});

app.post("/remove", function(req,res){
    if(page == "work"){
        let Task = [];
        req.body.checked.forEach(function(check){
            Task.push(allItems[parseInt(check)]);
        });

        async function deleteWork(){
            try{
                await client.connect();
                const db = client.db("dbToDoList");
                const coll = db.collection("WorkToDoList");
                for(let i = 0; i < Task.length; i++){
                    await coll.deleteOne(Task[i]);
                }
            }catch(err){
                if(err){
                    console.log(err);
                }
            }finally{
                await client.close();
            }
        }
        deleteWork();
    }else{
        let Task = [];
        req.body.checked.forEach(function(check){
            Task.push(allItems[parseInt(check)]);
        });

        async function deleteToday(){
            try{
                await client.connect();
                const db = client.db("dbToDoList");
                const coll = db.collection("ToDoList");
                for(let i = 0; i < Task.length; i++){
                    await coll.deleteOne(Task[i]);
                }
            }catch(err){
                if(err){
                    console.log(err);
                }
            }finally{
                await client.close();
            }
        }
        deleteToday();
    }
});

app.listen(process.env.PORT || PORT, function(){
    console.log(`SERVER: http://LocalHost:${PORT}`);
});