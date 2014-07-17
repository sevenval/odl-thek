odl-thek
========

a managment software for your own ODL.

needs node.js & mongodb

### ENV vars (e.g. local .env file)
```
NODE_ENV=DEVELOPMENT|PRODUCTION

# Mongodb url with database name
MONGODB_URL=mongodb://localhost/odlthek

SESSION_COOKIE_SECRET=***SECRET***

DATE_TIME_FORMAT="YYYY-MM-DD HH:mm"

GITHUB_CLIENT_ID=***
GITHUB_CLIENT_SECRET=***
GITHUB_CALLBACK=http://example.com/users/auth/github/callback

GOOGLE_CLIENT_ID=***
GOOGLE_CLIENT_SECRET=***
GOOGLE_CALLBACK=http://example.com/users/auth/google/callback
GOOGLE_HOSTED_DOMAIN=company.com

// Default transport is sendmail
#MAIL_TRANSPORT=SMPT
#MAIL_SERVICE=Gmail
#MAIL_USERNAME=
#MAIL_PASSWORD=
// Recipient address for system mails
MAIL_RECIPIENT=odlthek@company.com
MAIL_FROM='Sevenval Odlthek <no-reply@odlthek.com>'
```
