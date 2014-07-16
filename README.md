odl-thek
========

a managment software for your own ODL.

needs node.js & mongodb

Sample .env file:
```
NODE_ENV=DEVELOPMENT

# Mongodb url with database name
MONGODB_URL=mongodb://localhost/odlthek

SESSION_COOKIE_SECRET=00c282c815f5336757e1953af53b37ec

DATE_TIME_FORMAT="YYYY-MM-DD HH:mm"

GITHUB_CLIENT_ID=aa8e3665f93ee81d67fc
GITHUB_CLIENT_SECRET=224c80c352126f65f26b1e7fd4092d015caf9b87
GITHUB_CALLBACK='http://127.0.0.1:3000/users/auth/github/callback

GOOGLE_CLIENT_ID=1011998292679-n8capudopv0mnt8pcfgd0jumltmdbjtr.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=z7Dn4iTx7Hzjlm8-9FA9SSMB
GOOGLE_CALLBACK=http://127.0.0.1:3000/users/auth/google/callback
GOOGLE_HOSTED_DOMAIN=sevenval.com

// Default transport is sendmail
#MAIL_TRANSPORT=SMPT
#MAIL_SERVICE=Gmail
#MAIL_USERNAME=
#MAIL_PASSWORD=
// Recipient address for system mails
MAIL_RECIPIENT=joachim.feldmann@sevenval.com
MAIL_FROM='Sevenval Odlthek <no-reply@odlthek.com>'
```
