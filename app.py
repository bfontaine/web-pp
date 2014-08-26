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
js = Bundle('js/angular.min.js',
            'js/mousetrap.js',
            'js/wMousetrap.js',
            'js/app.js',
            # closure_js is too aggressive for our angular app, it renames
            # every Angular identifier (e.g. .controller, .config, .module). We
            # fallback on the simpler yui_js
            filters=(IIFE, 'yui_js'), output='pp.js')
assets.register('js_all', js)

js = Bundle('js/text.js',
            filters=(IIFE, 'closure_js'), output='t.js')
assets.register('js_articles', js)

# - CSS
css = Bundle('css/normalize.css', 'css/icons.css', 'css/app.css',
             filters=('cssmin',), output='pp.css')
assets.register('css_all', css)


@cache.cached(timeout=60)  # 1 minute
@app.route('/')
def index():
    html = render_template('main.html')
    return html_minify(html)


@cache.cached(timeout=86400)  # 24 hours
@app.route('/about')
def about():
    html = render_template('about.html')
    return html_minify(html)


@cache.cached(timeout=7200)  # 2 hours
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
