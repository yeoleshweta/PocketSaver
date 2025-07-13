const { Pool } = require('pg');

const pool = new Pool({
  user: 'pocketsaver',          // Same as POSTGRES_USER in docker-compose.yml
  host: 'db',                   // Service name of the DB container in Docker
  database: 'pocketsaver',      // Same as POSTGRES_DB
  password: 'pocketsaver',      // Same as POSTGRES_PASSWORD
  port: 5432                    // Postgres default port inside Docker
});

module.exports = pool;