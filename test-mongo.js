const mongoose = require('mongoose');

const uri = "mongodb+srv://seamkhan336_db_user:6qhg3rcJY8N4MP0L@medicare-connect.q4e4pot.mongodb.net/medicare";

mongoose.connect(uri)
  .then(() => {
    console.log("SUCCESS: Connected to MongoDB!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("ERROR:", err.message);
    process.exit(1);
  });
