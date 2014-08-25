# pp (Web version)

**web-pp** is a Web version of [alfred-pp][alfred-pp]. Check it [online][w].

It does exactly the same thing: type a few letters of a Paris Diderot CS
teacher’s name, and it’ll suggest you a few names. Press enter to go on their
Web page. Use up and down arrows to change the selected teacher.

![screenshot](https://raw.github.com/bfontaine/web-pp/master/static/screenshot.png)

[alfred-pp]: https://github.com/bfontaine/alfred-pp
[w]: https://p7pp.herokuapp.com/

## Installing

Requirements:

* Python 2.7 (with virtualenv)
* Java (to minify JS/CSS/HTML)
* Redis

```sh
# install dependencies
make deps
```

Note: I use Redis because Heroku doesn’t support file storage. You can modify
the code to use a static file and remove the Redis dependency if you prefer.

## Running

Make sure you started `reddit-server`. Run the scheduler once to fetch people
data:

```sh
venv/bin/python scheduler.py
```

Then run the app:

```sh
make run
```

And open your browser at `localhost:8000`. You’ll have to wait a few seconds
the first time because the JS/CSS/HTML code has to be minified.
