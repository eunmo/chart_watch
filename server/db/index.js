(function() {
  'use strict';

  var fs = require('fs');
  var path = require('path');
  var mysql = require('mysql');
  var dbconfig = require('../../db.json');
  var Promise = require('bluebird');

  var pool = mysql.createPool({
    connectionLimit: 100, //important
    host: dbconfig.host,
    user: dbconfig.user,
    password: dbconfig.password,
    database: dbconfig.database,
    debug: false,
    timezone: 'UTC+0',
    multipleStatements: true
  });

  var db = { pool: pool };

  db.handleQuery = function(query, callback) {
    db.pool.query(query, function(error, results, fields) {
      if (error) {
        return reject(error);
      }
      callback(results);
    });
  };

  db.jsonQuery = function(query, res) {
    db.handleQuery(query, function(rows) {
      res.json(rows);
    });
  };

  db.promisifyQuery = function(query) {
    return new Promise(function(resolve, reject) {
      db.pool.query(query, function(error, results, fields) {
        if (error) {
          return reject(error);
        }
        resolve(results);
      });
    });
  };

  fs.readdirSync(__dirname)
    .filter(function(file) {
      return file.indexOf('.') !== 0 && file !== 'index.js';
    })
    .forEach(function(file) {
      require(path.join(__dirname, file))(db);
    });

  module.exports = db;
})();
