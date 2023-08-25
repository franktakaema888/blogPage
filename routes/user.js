const express = require("express");
const router = express.Router();
const assert = require("assert");

/** ------------------------------------------------------------------------------------------------------------------------------------------*/

// Middleware to check if the user is authenticated as an author
function isAuthenticated(req, res, next) {
	if (req.session && req.session.login_username) 
	{
		return next();
	} else {
		// The user is not authenticated as an author, redirect to login page
		res.redirect("/user/login");
	}
}

/** 
 * AUTHOR HOME PAGE 
 * http://localhost:3000/user/author-home
 * 
 * Displays published and draft articles
 * Users can also create a new article in this page
*/
router.get("/author-home",isAuthenticated, authorHomePage);

/** 
 * READER HOME PAGE 
 * http://localhost:3000/user/reader-home
 * 
 * Displays list of published articles to the page
 * 
*/
router.get("/reader-home", renderReaderHomePage);

/** 
 * READER ARTICLES PAGE 
 * http://localhost:3000/user/read-more/:id
 * 
 * Displays the individual selected articles 
 * Comments section displayed for each individual article
 * Like button to increment the number of likes in the data base
*/
router.get("/read-more/:id", renderReaderArticlePage);

/** 
 * CREATE NEW ARTICLES 
 * http://localhost:3000/user/new
 * 
 * A Form to input data to be inserted into the database
 * */
router.get("/new", isAuthenticated, renderNewArticlePage);
router.post("/new", createNewArticle);

/** 
 * DELETE BUTTON FUNCTION 
 * 
 * The button is located in author home page
 * Deletes published and draft articles
*/
router.delete("/delete/:id", deleteArticle);

/** 
 * PUBLISH BUTTON FUNCTION 
 * 
 * The button is located in author home page
 * Publishes articles from the draft section to published section
*/
router.post('/publish/:id', publishArticle);

/** 
 * EDIT BUTTON FUNCTION 
 * http://localhost:3000/user/edit/:id
 * 
 * The button is located in author home page
 * This button renders the edit page allowing the user to edit articles in the draft section
*/
router.get("/edit/:id", isAuthenticated, renderEditPage);
router.post("/edit/:id", updateArticle);

/** 
 * SETTINGS PAGE
 * http://localhost:3000/user/settings
 * 
 * Renders the settings page/form allows the user to edit the blog title, sub-title and author name
 * */
router.get("/settings", isAuthenticated, renderSettingsPage);
router.post("/settings", updateSettings);

/** 
 * LIKE BUTTON 
 * 
 * This button is found in the article reader articles page
 * Increments the like count in the databse eve rytime it's pressed
 * */
router.post("/like-button/:id", likeArticle);
/** 
 * COMMENTS SECTION 
 * 
 * This button is found in the article reader articles page
 * Allows the user to leave comments in the individual articles
 * */
router.post("/comments/:id", addComment);
/** 
 * LOGIN PAGE, LOGOUT BUTTON
 *  
 * Renders Login Page, Login form will be provided
 * validate login function check if the session key, username and password matches before authentication
 * logout post terminates the session and redirects the user back to the login page
 * */
router.get("/login", renderLoginPage);
router.post('/login', validateLogin);
router.use(isAuthenticated);
router.post("/logout",logout);
/** ------------------------------------------------------------------------------------------------------------------------------------------*/
///////////////////////////////////////////// FUNCTION DEFINITIONS ///////////////////////////////////////////

/** AUTHOR HOME PAGE */
function authorHomePage(req, res, next) {
	let responseData = {};

	// Query articleRecords 
	global.db.all("SELECT * FROM articleRecords ORDER BY createdAt DESC ,published DESC, modified DESC", 
	function (err, rows) {
		if (err) {
			next(err); // send the error to the error handler
		} else {
			// filter function to seperate rows in the database that have published or not 
			const publishedArticles = rows.filter((article) => article.published);
			const draftArticles = rows.filter((article) => !article.published);
			responseData.publishedArticles = publishedArticles;
			responseData.draftArticles = draftArticles;

			queryBlogRecords();
		}
	});

	// Query blogRecords for the Blog Headings
	function queryBlogRecords() {
		global.db.all("SELECT * FROM blogRecords", 
		function (err, rows) {
			if (err) {
				next(err);
			} else {
				// selects first row from blogRecords 
				responseData.header = rows[0]; 
				//passing image URL through
				responseData.backgroundImage = "/photos/ghibli_bg.jpeg"; 

				// renders the author home page with data from two tables
				res.render("author-home", responseData);
			}
		});
	}
}

/** CREATE NEW ARTICLES - RENDERS NEW ARTICLE PAGE */
function renderNewArticlePage(req, res) {
	res.render("articles/new");
}
/** CREATE NEW ARTICLES - POST FORM ENTRY INTO DATABASE */
function createNewArticle(req, res, next) {
	let article_title = req.body.article_title;
	let article_sub_title = req.body.article_sub_title;
	let author_name = req.body.author_name;
	let article_content = req.body.article_content;
	let createdAt = new Date();

	global.db.run(
	"INSERT INTO articleRecords (article_title,article_sub_title,author_name,article_content,createdAt,likes,blog_user_id) VALUES( ?, ?, ?, ?, ?, ?, ? );",
	[article_title, article_sub_title, author_name, article_content, createdAt.toLocaleString("en-GB"), 0, 1],
	function (err) {
		if (err) {
			next(err); //send the error on to the error handler
		} else {
			res.redirect("/user/author-home");
		}
	});
}

/** DELETE BUTTON FUNCTION */
function deleteArticle(req, res, next) {
	const articleId = req.params.id;

	global.db.run(
	"DELETE FROM articleRecords WHERE article_id = ?;",
	[articleId],
	function (err) {
		if (err) {
			next(err); //send the error to the error handler
		} else {
			res.redirect("/user/author-home");
		}
	});
}

/** PUBLISH BUTTON FUNCTION */
function publishArticle(req, res, next) {
  let articleId = req.params.id;
  let publishDate = new Date();

	// Updates the published column in the database
	// This would affected if the article is shown in the published section or not
	global.db.run(
	"UPDATE articleRecords SET published = ? WHERE article_id = ?",
	[publishDate.toLocaleString("en-GB"), articleId],
	function (err) {
		if (err) {
			next(err); //send the error to the error handler
		} else {
			res.redirect("/user/author-home");
		}
	});
}

/** RENDERS SETTINGS PAGE */
function renderSettingsPage(req, res) {
	global.db.all("SELECT * FROM blogRecords", 
	function (err, rows) {
		if (err) {
			next(err); // send the error to the error handler
		} else {
			const header = rows[0];
			res.render("articles/author-settings", { header });
		}
	});
}
/** SETTINGS PAGE FORM ENTRY - POST FORM ENTRY INTO DATABASE */
function updateSettings(req, res, next) {
	let blog_title = req.body.blog_title;
	let blog_sub_title = req.body.blog_sub_title;
	let blog_author = req.body.blog_author;

	// Update the blogRecords in the database
	global.db.run(
	"UPDATE blogRecords SET blog_title = ?, blog_sub_title = ?, blog_author = ?",
	[blog_title, blog_sub_title, blog_author],
	function (err) {
		if (err) {
			next(err); //send the error to the error handler
		} else {
			res.redirect("/user/author-home");
		}
	});
}
/** RENDERS EDIT PAGE  */
function renderEditPage(req, res) {
	let articleId = req.params.id;

	// selects the article based on their id
	global.db.all("SELECT * FROM articleRecords WHERE article_id = ?", 
	[articleId], 
	function (err, rows) {
		if (err) {
			next(err); // send the error to the error handler
		} else {
			//renders the edits page form
			res.render("articles/author-edit", { articles: rows });
		}
	});
}
/** EDIT PAGE FORM ENTRY - POST FORM ENTRY INTO DATABASE */
function updateArticle(req, res, next) {
	let articleId = req.params.id;
	let article_title = req.body.article_title;
	let article_sub_title = req.body.article_sub_title;
	let article_content = req.body.article_content;
	let modified = new Date();

	// Update the article in the database
	global.db.run(
	"UPDATE articleRecords SET article_title = ?, article_sub_title = ?, article_content = ?, modified = ? WHERE article_id = ?",
	[article_title, article_sub_title, article_content, modified.toLocaleString("en-GB"), articleId],
	function (err) {
		if (err) {
			next(err); //send the error to the error handler
		} else {
			res.redirect("/user/author-home");
		}
	});
}

/** RENDERS READER HOME PAGE */
function renderReaderHomePage(req, res) {
	let readerData = {};

	// Query the articleRecords for published articles
	global.db.all("SELECT * FROM articleRecords ORDER BY createdAt DESC ,published DESC, modified DESC", 
	function (err, rows) {
		if (err) {
			next(err); // send the error to the error handler
		} else {
			// displays the published articles in the readers section
			const publishedArticles = rows.filter((article) => article.published);
			readerData.publishedArticles = publishedArticles;

			queryBlogRecords();
		}
	});

	function queryBlogRecords() {
		global.db.all("SELECT * FROM blogRecords", 
		function (err, rows) {
			if (err) {
				next(err);
			} else {
				// checking if user is logged in to display the logout button
				const isLoggedIn = req.session && req.session.login_username;
				// selects first row for blog records
				readerData.header = rows[0];
				//passing image URL through
				readerData.backgroundImage = "/photos/ghibli_bg.jpeg";
				readerData.isLoggedIn = isLoggedIn;
				
				res.render("reader-home", readerData);
			}
		});
	}
}

/** RENDER READER ARTICLE PAGE */
function renderReaderArticlePage(req, res) {
	let articleId = req.params.id;
	let commentData = {};

	global.db.all("SELECT * FROM articleRecords WHERE article_id = ?", 
	[articleId], 
	function (err, rows) {
		if (err) {
			next(err); // send the error to the error handler
		} else {
			// selects the article records to be displayed on the article page
			commentData.articles = rows;
			queryPublishedArticles();
		}
	});

	function queryPublishedArticles() {
		global.db.all("SELECT * FROM articleComments ORDER BY date_created DESC", 
		function (err, rows) {
			if (err) {
				next(err); // send the error to the error handler
			} else {
				// selects data for the comments section
				commentData.comments = rows;

				global.db.all("SELECT * FROM blogRecords", 
				function (err, rows) {
					if (err) {
					next(err);
					} else {
						// checking if user is logged in to display the logout button
						const isLoggedIn = req.session && req.session.login_username;
						// selects the data for the comments section blog heading
						commentData.header = rows[0];
						//passing the image URL through
						commentData.backgroundImage = "/photos/ghibli_bg.jpeg"; 
						commentData.isLoggedIn = isLoggedIn;

						res.render("reader-article", commentData);
					}
				});
			}
		});
	}
}

/** LIKE BUTTON FUNCTION */
function likeArticle(req, res, next) {
	const articleId = req.params.id;
	let likes = req.body.likes;

	// Updates the numbers of likes for each article 
	global.db.run(
	"UPDATE articleRecords SET likes = ? WHERE article_id = ?",
	[likes, articleId],
	function (err) {
		if (err) {
			next(err);
		} else {
			res.redirect("/user/read-more/" + articleId);
		}
	});
}

/** ADD COMMENTS FUNCTION */
function addComment(req, res, next) {
	let commentId = req.params.id;
	let comment_text = req.body.comment_text;
	let modified = new Date();

	global.db.run(
	"INSERT INTO articleComments (article_id, comment_text, date_created, blog_user_id) VALUES( ?, ?, ?, ? );",
	[commentId, comment_text, modified.toLocaleString("en-GB"), 1],
	function (err) {
		if (err) {
			next(err); //send the error to the error handler
		} else {
			res.redirect("/user/read-more/" + commentId);
		}
	});
}

/** LOG IN FUNCTION */

function renderLoginPage(req, res, next) {
	// If the user is not authenticated, render the login page
	let pass_error = false;
	if (req.session && req.session.login_username) {
		// If the user is authenticated, redirect to the author home page
		res.redirect("/user/author-home");
	} else { 
		res.render("login", {pass_error});
	}
}
function validateLogin(req, res, next){
	// Insert Login Code Here

	let username = req.body.login_username;
	let password = req.body.login_password;
	global.db.all("SELECT * FROM users_login WHERE login_username = ? AND login_password = ?", 
	[username, password],
	function (err, rows) {
		if (err) {
			next(err);
		} else if (rows.length == 0) {
			pass_error = true;

			res.render("login", {pass_error});		
		} else {
			pass_error = false;
			// Store the user's ID or any relevant data in the session
			req.session.login_username = username;
			// Redirect to the author home page after successful login
			res.redirect("/user/author-home"); 
		}
		
	});
}
/** LOGOUT ROUTE */
function logout(req, res){
	// Destroy the session and log out the user
	req.session.destroy();
	res.redirect("/user/login");
}

/**-------------------------------------------------------------------------------------------------------------------------------- */
module.exports = router;