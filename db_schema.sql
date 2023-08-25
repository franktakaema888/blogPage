
PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

CREATE TABLE
    IF NOT EXISTS blogUsers (
        blog_user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        blog_user_name TEXT NOT NULL
    );

CREATE TABLE
    IF NOT EXISTS blogRecords (
        blog_title TEXT NOT NULL,
        blog_sub_title TEXT NOT NULL,
        blog_author TEXT NOT NULL,
        blog_user_id INT,
        --the user that the record belongs to
        FOREIGN KEY (blog_user_id) REFERENCES blogUsers(blog_user_id)
    );

CREATE TABLE
    IF NOT EXISTS articleRecords (
        article_id INTEGER PRIMARY KEY AUTOINCREMENT,
        article_title TEXT NOT NULL,
        article_sub_title TEXT NOT NULL,
        author_name TEXT NOT NULL,
        article_content TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        published DATETIME,
        modified DATETIME,
        likes INTEGER DEFAULT 0,
        blog_user_id INT,
        --the user that the record belongs to
        FOREIGN KEY (blog_user_id) REFERENCES blogUsers(blog_user_id)
    );

CREATE TABLE
    IF NOT EXISTS articleComments (
        comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
        article_id INT,
        comment_text TEXT NOT NULL,
        date_created datetime default current_timestamp,
        blog_user_id INT,
        --the user that the record belongs to
        FOREIGN KEY (blog_user_id) REFERENCES blogUsers(blog_user_id)
    );

CREATE TABLE users_login (
  login_id INTEGER PRIMARY KEY AUTOINCREMENT,
  login_username TEXT NOT NULL UNIQUE,
  login_password TEXT NOT NULL
);

INSERT INTO users_login ("login_username", "login_password") VALUES ("author", "password");

INSERT INTO blogUsers ("blog_user_name") VALUES ("Mark Cheong");

INSERT INTO
    blogRecords (
        "blog_title",
        "blog_sub_title",
        "blog_author",
        "blog_user_id"
    )
VALUES (
        "AMAZING BLOG",
        "The first step",
        "Mark Cheong",
        1
    );

COMMIT;