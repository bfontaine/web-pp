# -*- coding: UTF-8 -*-

import os
from pp.store import redis
from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('main.html')

@app.route('/people.json')
def people_json():
    return redis.get('people.json')
