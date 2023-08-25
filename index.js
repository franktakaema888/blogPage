const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const app = express();
const port = 3000;
const sqlite3 = require("sqlite3").verbose();

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

/**---------------------------------------------------------------- */
// LOG IN FUNCTION
app.use(cookieParser());
// Initialise and configure express-sessions
app.use(
	session({
		secret: 'secret_key',
		resave: false,
		saveUninitialized: false,
}));
/**---------------------------------------------------------------- */
 
//items in the global namespace are accessible throught out the node application
global.db = new sqlite3.Database("./database.db", function (err) {
	if (err) {
		console.error(err);
		process.exit(1); //Bail out we can't connect to the DB
	} else {
		console.log("Database connected");
		global.db.run("PRAGMA foreign_keys=ON"); //This tells SQLite to pay attention to foreign key constraints
	}
});

const userRoutes = require("./routes/user");

//set the app to use ejs for rendering
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  	res.redirect("/user/reader-home"); 
});

//this adds all the userRoutes to the app under the path /user
app.use("/user", userRoutes); 
// allows the usage of static files. CSS and Images
app.use("/photos",express.static("assets")); 
app.use(express.static("css"));

// Middleware for error handling
app.use((err, req, res, next) => {
	console.error(err);
	res.status(500).send("Internal Server Error");
});

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});
