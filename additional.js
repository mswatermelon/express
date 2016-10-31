'use strict';

const express = require("express");
const bodyParser = require('body-parser');
const app = express();
const rtAPI = express.Router();
const rpcAPI = express.Router();

class User {
  constructor (id, name, score){
    this.id = id;
    this.name = name;
    this.score = score;
  }
  toString(){
    return {
      id: this.id,
      name: this.name,
      score: this.score
    };
  }
}

class Users extends Array {
  constructor(...users){
    super(...users);
  }
  findByParam(param, val){
    let fItem, fIndex;

    this.forEach(function(item, index){
      if (item[param] == val) {
        fItem = item;
        fIndex = index;
      }
    });

    if(arguments.length == 3) return fIndex;
    return fItem;
  }
}

let users = new Users();
users.push(new User(1, 'User1', 15));
users.push(new User(2, 'User2', 40));
users.push(new User(3, 'User3', 23));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({"extended": true}));

let setLimit = (arr, offset, limit) => {
  return arr.slice(
    offset,
    offset + limit
  );
};

let setFields = (arr, fields) => {
  let newArr = new Users();

  arr.forEach((item) => {
    let newItem = {};

    for (let param of fields){
      newItem[param] = item[param];
    }

    newArr.push(newItem);
  });

  return newArr;
};

rtAPI.get("/users", function(req, res) {
  let newUsers = users;

  if('limit' in req.query && 'offset' in req.query){
    newUsers = setLimit(newUsers, parseInt(req.query.offset), parseInt(req.query.limit));
  }
  if('fields' in req.query){
    let fields = req.query.fields.split(',');
    newUsers = setFields(newUsers, fields);
  }

  if (newUsers){
    res.json(newUsers);
  }
  else {
    res.send(401, "Users not found");
  }
});

rtAPI.post("/users", function(req, res) {
  let id = req.body.id || users.length + 1,
      name = req.body.name,
      score = req.body.score,
      user;

  try {
    if (users.findByParam('id', id)) {
      res.send(401, "User already exist");
    }
    user = new User(id, name, score);
    users.push(user);
    res.json(user);
  }
  catch (e){
    res.send(500, "User not created");
  }
});

rtAPI.get("/users/:id", function(req, res) {
  let user = users.findByParam('id', req.params.id);

  if (user){
    res.json(user);
  }
  else {
    res.send(401, "User not found");
  }
});

rtAPI.put("/users/:id", function(req, res) {
  let id = req.params.id,
      name = req.body.name,
      score = req.body.score,
      user = users.findByParam('id', id);

  if (user){
    user.name = name;
    user.score = score;
    res.json(user);
  }
  else {
    res.send(401, "User not found");
  }
});

rtAPI.delete("/users/:id", function(req, res) {
  let id = req.params.id,
      user = users.findByParam('id', id, 'index');

  if (user){
    users.splice(user, 1);
    res.send(200, "User deleted");
  }
  else {
    res.send(401, "User not found");
  }
});

rtAPI.delete("/users", function(req, res) {
  if (users){
    users.splice(0, users.length);
  }
  else {
    res.send(401, "Users not found");
  }
});

app.use("/api/rt", rtAPI);
app.listen(1337);
