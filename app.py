# -*- coding: UTF-8 -*-

import os
from pp.store import redis
from flask import Flask, Response, render_template, request
from flask.ext.assets import Environment, Bundle
from flask.ext.misaka import Misaka
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
Misaka(app)

## assets
assets = Environment(app)

### JS
js = Bundle('mustache.min.js', 'mousetrap.js', 'pp.js', \
        filters=(iife, 'closure_js'), output='pp.min.js')
assets.register('js_all', js)

js = Bundle('text.js', \
        filters=(iife, 'closure_js'), output='a.min.js')
assets.register('js_articles', js)

### CSS
css = Bundle('normalize.css', 'pp.css', \
        filters=('cssmin',), output='pp.min.css')
assets.register('css_all', css)

@app.route('/')
def index():
    html = render_template('main.html')
    return html_minify(html)

@app.route('/about')
def about():
    html = render_template('about.html')
    return html_minify(html)

@app.route('/json')
def people_json():
    resp = redis.get('people.json') or '[]'
    return Response(resp, 200, mimetype='application/json')
