# Web-pp Makefile

.DEFAULT: all
.PHONY: all deploy populate run

INITSHELL=source venv/bin/activate

all: deploy

deploy:
	git push

populate:
	$(INITSHELL); \
	\python scheduler.py

run:
	$(INITSHELL); \
	CLOSURE_COMPRESSOR_OPTIMIZATION=ADVANCED_OPTIMIZATIONS \
	gunicorn app:app
