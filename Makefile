RDF = install.rdf
# APP_NAME := ${shell perl -ne 'm/<em:id>(.*?)@.*?<\/em:id>/ && print $1' < $(RDF)}

SOURCES = \
	$(RDF) \
	bootstrap.js \
	content/main.js \
	content/content.js

APP_NAME := \
	${shell sed -n 's/.*<em:id>\([^<]*\)@.*<\/em:id>.*/\1/p' < $(RDF)}
APP_VERSION := \
	${shell sed -n 's/.*<em:version>\([^<]*\)<\/em:version>.*/\1/p' < $(RDF)}

FIREFOX_PATH = $(shell which firefox)

XPI_FILE := $(APP_NAME)-$(APP_VERSION).xpi

$(XPI_FILE): $(SOURCES)
	zip $@ $^

all: $(XPI_FILE)

clean:
	rm $(XPI_FILE)

run: $(XPI_FILE)
	mozmill --addons=$< -b $(FIREFOX_PATH) --app-arg="-jsconsole"