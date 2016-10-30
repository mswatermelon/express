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

rtAPI.get("/users", function(req, res) {
  if (users){
    res.json(users);
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
  let user = users.findByParam('id', req.body.id);

  if (user){
    res.json(user);
  }
  else {
    res.send(401, "User not found");
  }
});

rtAPI.put("/users/:id", function(req, res) {
  let id = req.body.id || users.length + 1,
      name = req.body.name,
      score = req.body.score,
      user = users.findByParam('id', req.body.id);

  if (user){
    user.id = id;
    user.name = name;
    user.score = score;
    res.json(user);
  }
  else {
    res.send(401, "User not found");
  }
});

rtAPI.delete("/users/:id", function(req, res) {
  let id = req.body.id || users.length + 1,
      name = req.body.name,
      score = req.body.score,
      user = users.findByParam('id', req.body.id, 'index');

  if (user){
    users.splice(user, 1);
    res.send(200, "User deleted");
  }
  else {
    res.send(401, "User not found");
  }
});

app.use("/api/rt", rtAPI);

let RPC = {
  get: (params, callback) => {
    let result = {jsonrpc: 2.0, result: []};

    if (users){
      result['result'] = users
      callback(null, result);
    }
    else {
      callback({code: 401, message: "Users not found"});
    }
  },
  add: (params, callback) => {
    let id = params.id || users.length + 1,
        name = params.name,
        score = params.score,
        user, result = {jsonrpc: 2.0, result: []};

    try {
      if (users.findByParam('id', id)) {
        callback({code: 401, message: "User already exist"});
      }
      user = new User(id, name, score);
      users.push(user);

      result['result'] = user;
      callback(null, result);
    }
    catch (e){
      callback({code: 500, message: "User not created"});
    }
  },
  user: (params, callback) => {
    let user = users.findByParam('id', params.id),
        result = {jsonrpc: 2.0, result: []};

    if (user){
        result['result'] = user;
        callback(null, result);
    }
    else {
      callback({code: 401, message: "User not found"});
    }
  },
  update: (params, callback) => {
    let id = params.id || users.length + 1,
        name = params.name,
        score = params.score,
        user = users.findByParam('id', params.id),
        result = {jsonrpc: 2.0, result: []};

    if (user){
      user.id = id;
      user.name = name;
      user.score = score;
      result['result'] = user;
      callback(null, result);
    }
    else {
      callback({code: 401, message: "User not found"});
    }
  },
  delete: (params, callback) => {
    let id = params.id || users.length + 1,
        name = params.name,
        score = params.score,
        user = users.findByParam('id', params.id, 'index'),
        result = {jsonrpc: 2.0, result: []};

    if (user){
      users.splice(user, 1);
      result["result"] = user;
      callback(null, result);
    }
    else {
      callback({code: 401, message: "User not found"});
    }
  },
}

app.post("/rpc", function(req, res) {
  if (!('jsonrpc' in req.body)) {
    res.json({jsonrpc: 2.0, error: {
      code: 401,
      message: "Need jsonrpc version"
     }});
  }
  if (!('method' in req.body)) {
    res.json({jsonrpc: 2.0, error: {
      code: 401,
      message: "Need method version"
     }});
  }

  const method = RPC[req.body.method];

  method(req.body.params, function(error, result) {
    if (error) res.json({jsonrpc: 2.0, error: error});
    res.json(result);
  });
});

app.listen(1337);
