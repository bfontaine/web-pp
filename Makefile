# Web-pp Makefile

.DEFAULT: all
.PHONY: all deploy populate run sprites

VENV=venv
BINUTILS=$(VENV)/bin

all: run

deploy: stylecheck
	git push

populate: deps
	$(BINUTILS)/python scheduler.py

run: deps sprites
	CLOSURE_COMPRESSOR_OPTIMIZATION=ADVANCED_OPTIMIZATIONS \
	$(BINUTILS)/gunicorn app:app

# setup

deps: $(VENV)
	$(BINUTILS)/pip install -qr requirements.txt

$(VENV):
	virtualenv $@


# development

sprites: static/icons.png

static/icons.png: static/icons/*.png
	$(BINUTILS)/glue -qf --namespace i --sprite-namespace '' \
		static/icons static
	@# don't fail if we don't have optipng/pngcrush
	which optipng >/dev/null && optipng -o2 -quiet -strip all $@ || exit 0
	which pngcrush >/dev/null && pngcrush -brute -ow -q $@ || exit 0

stylecheck: *.py deps
	$(BINUTILS)/pep8 *.py pp/*.py
