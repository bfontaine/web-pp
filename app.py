# -*- coding: UTF-8 -*-

import os
from pp.store import redis
from flask import Flask, Response, render_template, request
from flask.ext.assets import Environment, Bundle
from htmlmin.minify import html_minify

def iife(_in, out, **kw):
    """
    'iife' filter for webassets. It wraps a JS bundle in an IIFE, thus
    preventing global leaks.
    """
    out.write(';!function(){')
    out.write(_in.read())
    out.write('}();')

app = Flask(__name__)

## assets
assets = Environment(app)
js = Bundle('mustache.min.js', 'mousetrap.js', 'fuse.js', 'pp.js', \
        filters=(iife, 'closure_js'), output='pp.min.js')
assets.register('js_all', js)

css = Bundle('pp.css', 'normalize.css', \
        filters=('cssmin',), output='pp.min.css')
assets.register('css_all', css)

@app.route('/')
def index():
    html = render_template('main.html')
    return html_minify(html)

@app.route('/json')
def people_json():
    resp = redis.get('people.json') or '[]'
    return Response(resp, 200, mimetype='application/json')

@app.route('/click', methods=['POST'])
def user_feedback():
    query  = request.form['query']
    result = request.form['key']

    if len(query) > 32:
        return 'too large'

    redis.hincrby(query, result)
    redis.expire(query, 518400) # 6 days
    return 'ok'
