# Candidate Takehome Exercise
This is a simple backend engineer take-home test to help assess candidate skills and practices.  We appreciate your interest in Voodoo and have created this exercise as a tool to learn more about how you practice your craft in a realistic environment.  This is a test of your coding ability, but more importantly it is also a test of your overall practices.

If you are a seasoned Node.js developer, the coding portion of this exercise should take no more than 1-2 hours to complete.  Depending on your level of familiarity with Node.js, Express, and Sequelize, it may not be possible to finish in 2 hours, but you should not spend more than 2 hours.  

We value your time, and you should too.  If you reach the 2 hour mark, save your progress and we can discuss what you were able to accomplish. 

The theory portions of this test are more open-ended.  It is up to you how much time you spend addressing these questions.  We recommend spending less than 1 hour.  


For the record, we are not testing to see how much free time you have, so there will be no extra credit for monumental time investments.  We are looking for concise, clear answers that demonstrate domain expertise.

# Project Overview
This project is a simple game database and consists of 2 components.  

The first component is a VueJS UI that communicates with an API and renders data in a simple browser-based UI.

The second component is an Express-based API server that queries and delivers data from an SQLite data source, using the Sequelize ORM.

This code is not necessarily representative of what you would find in a Voodoo production-ready codebase.  However, this type of stack is in regular use at Voodoo.

# Project Setup
You will need to have Node.js, NPM, and git installed locally.  You should not need anything else.

To get started, initialize a local git repo by going into the root of this project and running `git init`.  Then run `git add .` to add all of the relevant files.  Then `git commit` to complete the repo setup.  You will send us this repo as your final product.
  
Next, in a terminal, run `npm install` from the project root to initialize your dependencies.

Finally, to start the application, navigate to the project root in a terminal window and execute `npm start`

You should now be able to navigate to http://localhost:3000 and view the UI.

You should also be able to communicate with the API at http://localhost:3000/api/games

If you get an error like this when trying to build the project: `ERROR: Please install sqlite3 package manually` you should run `npm rebuild` from the project root.

# Practical Assignments
Pretend for a moment that you have been hired to work at Voodoo.  You have grabbed your first tickets to work on an internal game database application. 

#### FEATURE A: Add Search to Game Database
The main users of the Game Database have requested that we add a search feature that will allow them to search by name and/or by platform.  The front end team has already created UI for these features and all that remains is for the API to implement the expected interface.  The new UI can be seen at `/search.html`

The new UI sends 2 parameters via POST to a non-existent path on the API, `/api/games/search`

The parameters that are sent are `name` and `platform` and the expected behavior is to return results that match the platform and match or partially match the name string.  If no search has been specified, then the results should include everything (just like it does now).

Once the new API method is in place, we can move `search.html` to `index.html` and remove `search.html` from the repo.

#### FEATURE B: Populate your database with the top 100 apps
Add a populate button that calls a new route `/api/games/populate`. This route should populate your database with the top 100 games in the App Store and Google Play Store.
To do this, our data team have put in place 2 files at your disposal in an S3 bucket in JSON format:

- https://interview-marketing-eng-dev.s3.eu-west-1.amazonaws.com/android.top100.json
- https://interview-marketing-eng-dev.s3.eu-west-1.amazonaws.com/ios.top100.json

# Theory Assignments
You should complete these only after you have completed the practical assignments.

The business goal of the game database is to provide an internal service to get data for all apps from all app stores.  
Many other applications at Voodoo will use consume this API.

#### Question 1:
We are planning to put this project in production. According to you, what are the missing pieces to make this project production ready? 
Please elaborate an action plan.

#### Reponse 1:

Tout d'abord, au niveau architecture, je choisirais soit une clean archi;, soit une archi hexagonale. 

L'idée est de séparer :
-  l'infrastructure (intéraction avec l'exterieur, les librairie, repertoire bdd, les routes express, etc...) afin de ne pas dépendre d'une librairie dans tout le projet.
- Le domaine pour gérer la logique métier en pure Node.js (Entity, Model, Services...)
- Et les use-cases en pur Node.js aussi.

En utilisant cette architecture nous pouvons ajouter des tests unitaires qui permettent de tester de manière efficace nos use-case ainsi que nos services dans le domaine (il faut mocker les services de l'infra). Pour le moment nous n'avons que des tests d'intégration qui couvre les end-points. On peut se faire plaisir avec des tests de performances.

On peut ajouter un CI/CD pour rejouer les lint, build, tests unitaires, etc... lors d'une PR.

Il serait très sympathique d'avoir plusieurs environnements :
- Dev qui permet au dev de tester et tout casser
- Staging une branche ISO à la branche
- Prod bah la prod 

On pousse sur dev pour vérifier que tout fonctionne si nous sommes satisfait on fait une release sur staging. Si dans le meilleur des mondes staging tourne parfaitement alors on release vers la prod

#### Question 2:
Let's pretend our data team is now delivering new files every day into the S3 bucket, and our service needs to ingest those files
every day through the populate API. Could you describe a suitable solution to automate this? Feel free to propose architectural changes.

#### Reponse 2:

Nous avons plusieurs solutions à ce sujet.

Nous pourrions modifier notre route pour qu'elle devienne une requête POST prenant en body un tableau d'URL de fichiers dans le bucket. Nous stockerions également les URL des fichiers déjà importés. (Il y a déjà une impossibilité de doublon de game sur la route grâce à la comparaison de l'app_id)

Nous pourrions créer une notification S3 à chaque ajout de fichier, laquelle déclencherait une lambda qui appellerait ensuite notre route POST /games/populate avec, en body, un tableau des URL des fichiers ajoutés au bucket.

Nous pourrions également mettre en place un CRON directement sur l'API, qui, chaque nuit à une heure précise, interrogerait le bucket AWS S3 pour récupérer les URL des fichiers. Nous comparerions alors ces URL avec celles déjà enregistrées chez nous, et celles qui n'existent pas encore seraient ajoutées via une requête API ou appel du service si dans le mono-repo.

