# pp (Web version)

**web-pp** is a Web version of [alfred-pp][alfred-pp]. Check it [online][w].

[alfred-pp]: https://github.com/bfontaine/alfred-pp
[w]: https://p7pp.herokuapp.com/

## Installing

Requirements:

* Python 2.7 (with virtualenv)
* Java (to minify JS/CSS/HTML)
* Redis

```sh
# create a local environment
virtualenv venv --distribute
source venv/bin/activate

# install dependencies
pip install -r requirements.txt
```

Note: I use Redis because Heroku doesn’t support file storage. You can modify
the code to use a static file and remove the Redis dependency if you prefer.

## Running

Make sure you started `reddit-server`. Run the scheduler once to fetch people
data:

```sh
python2 scheduler.py
```

Then run the app:

```sh
make run
```

And open your browser at `localhost:8000`.
