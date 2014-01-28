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
    resp = redis.get('people.json') or '[]'
    return Response(response=resp, status=200, mimetype='application/json')
