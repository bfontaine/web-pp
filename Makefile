# Web-pp Makefile

.DEFAULT: all
.PHONY: all deploy populate run

VENV=venv
BINUTILS=$(VENV)/bin

all: run

deps: $(VENV)
	$(BINUTILS)/pip install -qr requirements.txt

deploy:
	git push

populate: deps
	$(BINUTILS)/python scheduler.py

run: deps
	CLOSURE_COMPRESSOR_OPTIMIZATION=ADVANCED_OPTIMIZATIONS \
	$(BINUTILS)/gunicorn app:app

$(VENV):
	virtualenv $@
