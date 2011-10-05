RDF = install.rdf

CONTENT_SOURCES = $(shell ls content/*.js)

SOURCES = \
	bootstrap.js \
	$(RDF) \
	$(CONTENT_SOURCES)

APP_NAME := \
	${shell sed -n 's/.*<em:id>\([^<]*\)@.*<\/em:id>.*/\1/p' < $(RDF)}
APP_VERSION := \
	${shell sed -n 's/.*<em:version>\([^<]*\)<\/em:version>.*/\1/p' < $(RDF)}

FIREFOX_PATH = $(shell which fennec)
#FIREFOX_EXTRA_OPTIONS = --app-arg="-jsconsole"
FIREFOX_EXTRA_OPTIONS =

XPI_FILE := $(APP_NAME)-$(APP_VERSION).xpi

ADB = /opt/android/android-sdk-linux_x86/platform-tools/adb
ANDROID_PKG = org.mozilla.fennec_eitan
ANDROID_LAUNCER = ./android_launcher.py --adb $(ADB) --pkg-name $(ANDROID_PKG)

TIMESTAMP = ${shell date -u +"%Y%m%d%H%M"}
SNAPSHOT = $(APP_NAME)-snapshot-$(TIMESTAMP).xpi

$(XPI_FILE): $(SOURCES)
	zip $@ $^

all: $(XPI_FILE)

clean:
	rm $(XPI_FILE)

snapshot: $(XPI_FILE)
	@echo Creating snapshot: $(SNAPSHOT)
	@cp $(XPI_FILE) $(SNAPSHOT)

run: $(XPI_FILE)
	mozmill --addons=$< --show-errors -b $(FIREFOX_PATH) --app-arg="$(FIREFOX_EXTRA_OPTIONS)"

install-android: $(SOURCES)
	$(ANDROID_LAUNCER) command chmod 755 /data
	$(ANDROID_LAUNCER) mkdirs /data/local/talktome/content
	$(ADB) push $(RDF) /data/local/talktome
	$(ADB) push bootstrap.js /data/local/talktome
	for fname in $(CONTENT_SOURCES); do \
		$(ADB) push $$fname /data/local/talktome/content; \
	done

run-android: install-android
	$(ANDROID_LAUNCER) kill
	$(ANDROID_LAUNCER) start

