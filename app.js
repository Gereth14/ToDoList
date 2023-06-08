//jshint esversion:6
require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyparser = require("body-parser");
const { MongoClient } = require("mongodb");
const PORT = 3000;

const app = express();
app.set('view engine', 'ejs');
app.use(bodyparser.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Database and collection initialisation
const uri = `mongodb+srv://${process.env.user}:${process.env.password}@mycluster.kquwbl3.mongodb.net/`;
const client = new MongoClient(uri);
const db = client.db("dbToDoList");

let page = "";

let allItems = [];
let Collections = [];

app.get("/", function(req, res){
    async function DisplayCollections(){
        try{
            await client.connect();
            Collections = await db.listCollections().toArray();
            res.render("home", {Lists: Collections});
        }finally{
            await client.close();
        }
    }
    DisplayCollections();
})

app.get("/typeoflist/:list", function(req,res){
    async function LoadList(ListName){
        try{
            await client.connect();
            const coll = db.collection(ListName);
            const cursor = coll.find();
            allItems = [];
            await cursor.forEach(function(item){
                allItems.push(item);
            });
            res.render("list", {Tasks: allItems, ListTitle: ListName, Lists: Collections});
        }finally{
            await client.close();
        }
    }
    page = req.params.list;
    LoadList(page);
    
});

app.post("/typeoflist/:list", function(req, res){
    async function InsertItem(collection){
        try{
            await client.connect();
            const coll = db.collection(collection);
            const Item = {
                name : req.body.NewTask
            };
            await coll.insertOne(Item);
            res.redirect("/typeoflist/" + collection);
        }finally{
            await client.close();
        }
    }
    InsertItem(req.params.list);
});

app.post("/remove", function(req, res){
    let Task = [];
    req.body.checked.forEach(function(check){
        Task.push(allItems[parseInt(check)]);
    });
    console.log(Task);
    async function DeleteTask(collection){
        try{
            await client.connect();
            const coll = db.collection(collection);
            for(let i = 0; i < Task.length; i++){
                let result = await coll.deleteOne(Task[i]);
            }
            res.redirect("/typeoflist/" + page);
        }finally{
            await client.close();
        }
    }
    DeleteTask(page)
});

app.post("/addList", function(req, res){
    async function addList(collection){
        try{
            await client.connect();
            await db.createCollection(collection, function(err, response){
                if(err) throw err;
                console.log("collection created!");
            });
            res.redirect("/");
        }finally{
            await client.close();
        }
        
    }
    addList(req.body.NewList);
});

app.listen(process.env.PORT || PORT, function(){
    console.log(`SERVER: http://LocalHost:${PORT}`);
});