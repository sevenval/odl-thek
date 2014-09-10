ODLTHEK
========
A management software for your own open device library.

## Setup
**Prerequisites**

Download and install http://nodejs.org and http://www.mongodb.org. Run MongoDB as a daemon or make sure MongoDB is running before continuing.

**Installation**
```sh
$ git clone https://github.com/sevenval/odl-thek
$ cd odl-thek
$ npm install
```

**Create .env file (see below) or set environment variables manually**
```
NODE_ENV=DEVELOPMENT
MONGODB_URL=mongodb://localhost/odlthek
SESSION_COOKIE_SECRET=<keyboard cat>
DATE_TIME_FORMAT="YYYY-MM-DD HH:mm"

; OAUTH Github
GITHUB_CLIENT_ID=<ID>
GITHUB_CLIENT_SECRET=<SECRET>
GITHUB_CALLBACK=<HOSTNAME>/users/auth/github/callback

; OAUTH Google
GOOGLE_CLIENT_ID=<ID>
GOOGLE_CLIENT_SECRET=<SECRET>
GOOGLE_CALLBACK=<HOSTNAME>/users/auth/google/callback
GOOGLE_HOSTED_DOMAIN=example.com

; AWS S3 for media storage
AWS_ACCESS_KEY_ID=<ID>
AWS_SECRET_ACCESS_KEY=<SECRET>
AWS_MEDIA_BUCKET=<MEDIA-BUCKET>

; Mails settings
MAIL_TRANSPORT=SMTP
MAIL_SERVICE=Gmail
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_RECIPIENT=<email for system mails>
MAIL_FROM='Sevenval Odlthek <some@mail.com>'
```

**Start**
```sh
$ node app.js
```
Open http://127.0.0.1:3000

