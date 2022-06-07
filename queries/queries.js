const { Pool } = require('pg');
const parse = require('pg-connection-string').parse;

const pool = new Pool(parse(process.env.DATABASE_URL));

// === Queries are below ===

const uploadMovement = (req, res, next) => {
  const {user_id, title, thumbnail, keyframes, steps} = req.body;

  const query = {
    text: `
    INSERT INTO movements (user_id, title, thumbnail, keyframes, steps)
      VALUES ($1, $2, $3, $4, $5) RETURNING *;
    `,
    values: [user_id, title, thumbnail, keyframes, steps]
  };

  pool.query(query, (error, results) => {
    if (error) {
      throw error;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.send();
  });
};

const getSingleMovement = (req, res, next) => {
  const movement_id = req.params.id;
  
  const query = {
    text: `
    Select 
      movements.movement_id,
      movements.user_id,
      movers.username,
      movements.title,
      movements.thumbnail,
      movements.steps,
      movements.keyframes
    FROM
      movements
    INNER JOIN movers ON movements.user_id = movers.user_id
    WHERE movements.movement_id = $1;
    `,
    values: [movement_id]
  };

  pool.query(query, (error, results) => {
    if (error) {
      res.send(400, 'Request could not be processed.');
    }
    res.send(results.rows);
  });
}

const saveVidToLibrary = (req, res, next) => {
  const {user_id, movement_id} = req.body;

  const query = {
    text:`
    INSERT INTO mover_movement (user_id, movement_id)
      VALUES ($1, $2) RETURNING *;
    `,
    values: [user_id, movement_id]
  };

  pool.query(query, (error, results) => {
    if (error) {
      throw error;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.send();
  })
};

const removeVidFromLibrary = (req, res, next) => {
  const {user_id, movement_id} = req.headers;

  const query = {
    text:`
    DELETE FROM mover_movement
      WHERE user_id = $1 AND movement_id = $2
    `,
    values: [user_id, movement_id]
  };

  pool.query(query, (error, results) => {
    if (error) {
      throw error;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.send();
  });
}

const getAllMovements = (req, res, next) => {
  const query = {
    text: `
    Select 
      movements.movement_id,
      movements.user_id,
      movers.username,
      movements.title,
      movements.thumbnail,
      movements.steps
    FROM
      movements
    INNER JOIN movers ON movements.user_id = movers.user_id
	  LEFT JOIN mover_movement ON mover_movement.movement_id = movements.movement_id
	  WHERE mover_movement.movement_id IS NULL AND mover_movement.user_id = 1;
	
    `
  };

  pool.query(query, (error, results) => {
    if (error) {
      res.send(400, 'Request could not be processed.');
    }
    res.send(results.rows);
  });
};

const getSavedMovements = (req, res, next) => {
  const { user_id } = req.user.rows[0];

  const query = {
    text: `
    Select
      mover_movement.movement_id,
      movements.user_id,
      movements.title,
      movements.thumbnail,
      movers.username,
      movements.steps
    FROM mover_movement
      Inner Join movements
        ON movements.movement_id = mover_movement.movement_id
      Inner Join movers
        ON movers.user_id = movements.user_id
      WHERE mover_movement.user_id = $1
    `,
    values: [user_id]
  };

  pool.query(query, (error, results) => {
    if (error) {
      res.send(400, 'Request could not be processed.');
    }
    res.send(results.rows);
  });
};


async function setUpTables(request, response) {
  
  const createUserTable = `
    CREATE TABLE IF NOT EXISTS "movers" (
      user_id integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      email varchar,
      username varchar,
      password varchar,
      saved_vids jsonb
    );`
  ;

  const createUserMovementJunction =`
    CREATE TABLE IF NOT EXISTS "mover_movement" (
      user_id integer REFERENCES "movers"(user_id),
      movement_id integer REFERENCES "movements"(movement_id),
      CONSTRAINT mover_movement_pkey PRIMARY KEY (user_id, movement_id)
  );`
;

  // const populateUserTable = `
  //     INSERT INTO "movers" (email, username, password)
  //       VALUES ('dio@example.com', 'dio', 'password') RETURNING *;
  //     `
  // ;

  const createMovementTable = `
    CREATE TABLE IF NOT EXISTS "movements" (
      movement_id integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      user_id integer,
      title varchar,
      thumbnail varchar,
      keyframes jsonb,
      steps jsonb
    );`
  ;
  
  await pool.query(createUserTable).catch((err) => {
    console.log(err);
  });

  await pool.query(createMovementTable).catch((err, res) => {
    console.log(err);
  });

  await pool.query(createUserMovementJunction).catch((err) => {
    console.log(err);
  });


  response.send('Populated!')

};

module.exports = {
  pool,
  uploadMovement,
  getAllMovements,
  setUpTables,
  saveVidToLibrary,
  getSavedMovements,
  getSingleMovement,
  removeVidFromLibrary
}