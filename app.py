# -*- coding: UTF-8 -*-

from pp.store import redis
from pp.search import search_url
from flask import Flask, Response, render_template, request, redirect, abort
from flask.ext.assets import Environment, Bundle
from flask.ext.misaka import Misaka
from flask.ext.cache import Cache
from htmlmin.minify import html_minify
from webassets_iife import IIFE

app = Flask(__name__)

# markdown
Misaka(app)

# caching
app.config['CACHE_TYPE'] = 'simple'
cache = Cache(app)

# assets
assets = Environment(app)

# - JS
js = Bundle('angular.min.js', 'mousetrap.js', 'wMousetrap.js', 'pp.js',
            # closure_js is too aggressive for our angular app, it renames
            # every Angular identifier (e.g. .controller, .config, .module). We
            # fallback on the simpler yui_js
            filters=(IIFE, 'yui_js'), output='pp.min.js')
assets.register('js_all', js)

js = Bundle('text.js',
            filters=(IIFE, 'closure_js'), output='a.min.js')
assets.register('js_articles', js)

# - CSS
css = Bundle('normalize.css', 'icons.css', 'pp.css',
             filters=('cssmin',), output='pp.min.css')
assets.register('css_all', css)


@cache.cached(timeout=60)  # 1 minute
@app.route('/')
def index():
    html = render_template('main.html')
    return html_minify(html)


@cache.cached(timeout=43200)  # 12 hours
@app.route('/about')
def about():
    html = render_template('about.html')
    return html_minify(html)


@cache.cached(timeout=3600)  # 1 hour
@app.route('/json')
def people_json():
    resp = redis.get('people.json') or '[]'
    return Response(resp, 200, mimetype='application/json')


@app.route('/search/url')
def search():
    """
    server-side URL search
    """
    url = search_url(request.args['q'])
    if url:
        return redirect(url, code=303)  # 303 = See Other
    abort(404)
