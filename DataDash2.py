from flask import Flask
from flask import render_template
from pymongo import MongoClient
import json
import os

app = Flask(__name__)

# MONGODB_HOST = 'localhost'
# MONGODB_PORT = 27017
# DBS_NAME = 'donorsUSA'
COLLECTION_NAME = 'projects'

MONGO_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
DBS_NAME = os.getenv('MONGO_DB_NAME', 'donorsUSA')


@app.route("/")
def index():
    """
    A Flask view to serve the main dashboard page.
    """
    return render_template("index.html")


@app.route("/donorsUS/projects")
def donor_projects():
    """
    A Flask view to serve the project data from
    MongoDB in JSON format.
    """

    # A constant that defines the record fields that we wish to retrieve.
    FIELDS = {
        '_id': False, 'funding_status': True, 'school_state': True,
        'resource_type': True, 'poverty_level': True,
        'date_posted': True, 'total_donations': True
    }

    # Open a connection to MongoDB using a with statement such that the
    # connection will be closed as soon as we exit the with statement

    # with MongoClient(MONGODB_HOST, MONGODB_PORT) as conn:  # local
    with MongoClient(MONGO_URI) as conn:                     # production
        # Define which collection we wish to access
        collection = conn[DBS_NAME][COLLECTION_NAME]
        # Retrieve a result set only with the fields defined in FIELDS
        # and limit the the results to 55000

        # from 2002-09-13 to 2006-04-04
        projects = collection.find(projection=FIELDS).sort('date_posted', 1).limit(20000)
        # Convert projects to a list in a JSON object and return the JSON data
        return json.dumps(list(projects))


if __name__ == "__main__":
    app.run()


# for project 2:
# pull the data from the populations website http://statisticstimes.com/population/countries-by-population.php
# convert table to csv , maybe theres a CI module on that (beautiful soup?)
# reconcile the country names in this table and the literacy table
# add both tables to database and join tables on table1.name == table2.name
# can do this^ in mongo? else use SQL. can use SQL to dump the data to the website in json?
# SQLAlchemy??? (also does it come with url parse?)? also is there a unit on SQL and flask?
# do i need to convert it to mongodb style syntax for d3 to work? is there an sql way?
