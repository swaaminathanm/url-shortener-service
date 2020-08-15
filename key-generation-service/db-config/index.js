const Postgrator = require("postgrator");
const path = require("path");

require('dotenv').config();

const postgrator = new Postgrator({
  migrationDirectory: path.join(__dirname, "/migrations"),
  schemaTable: "schemaversion",
  driver: "pg",
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

postgrator
  .migrate('001')
  .then((appliedMigrations) => console.log(appliedMigrations))
  .catch((error) => {
    console.log(error)
    console.log(error.appliedMigrations)
  })

