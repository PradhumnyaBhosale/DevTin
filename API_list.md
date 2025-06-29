#AUTH ROUTES

POST /signup
POST /login
POST /logout

#PROFILE ROUTES

GET/profile/view
PATCH/profile/edit
PATCH/profile/password

#CONNECTION ROUTES

POST/request/send/interested/:userID
POST/request/send/ignored/:userID
POST/request/review/accepted/:requestID
POST/request/review/rejected/:requestID

#USER ROUTES
 
GET/connections
GET/request/received
GET/feed

