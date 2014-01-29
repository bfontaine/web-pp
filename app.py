# -*- coding: UTF-8 -*-

import os
from pp.store import redis
from flask import Flask, Response, render_template, request

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('main.html')

@app.route('/json')
def people_json():
    resp = redis.get('people.json') or '[]'
    return Response(resp, 200, mimetype='application/json')

@app.route('/click', methods=['POST'])
def user_feedback():
    if request.method == 'POST':
        query  = request.form['query']
        result = request.form['key']

        if len(query) > 32:
            return 'too large'

        redis.hincrby(query, result)
        redis.expire(query, 518400) # 6 days
        return 'ok'
