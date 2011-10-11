RDF = install.rdf

CONTENT_SOURCES = $(shell ls content/*.js)
MEDIA_FILES = $(shell ls media/*.wav)

SOURCES = \
	bootstrap.js \
	$(RDF) \
	$(CONTENT_SOURCES) \
	$(MEDIA_FILES)

APP_NAME := \
	${shell sed -n 's/.*<em:id>\([^<]*\)@.*<\/em:id>.*/\1/p' < $(RDF)}
APP_VERSION := \
	${shell sed -n 's/.*<em:version>\([^<]*\)<\/em:version>.*/\1/p' < $(RDF)}

FENNEC_RUNNER = ./fennec_runner.py
FENNEC_PATH = $(shell which fennec)
#FENNEC_EXTRA_OPTIONS = --app-arg="-jsconsole"
FENNEC_EXTRA_OPTIONS =

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
	$(FENNEC_RUNNER) --addons=$< -b $(FENNEC_PATH) \
		--app-arg="$(FENNEC_EXTRA_OPTIONS)"

install-android: $(SOURCES)
	$(ANDROID_LAUNCER) command chmod 755 /data
	$(ANDROID_LAUNCER) mkdirs /data/local/talktome/content
	$(ANDROID_LAUNCER) mkdirs /data/local/talktome/media
	$(ADB) push $(RDF) /data/local/talktome
	$(ADB) push bootstrap.js /data/local/talktome
	for fname in $(CONTENT_SOURCES); do \
		$(ADB) push $$fname /data/local/talktome/content; \
	done
	for fname in $(MEDIA_FILES); do \
		$(ADB) push $$fname /data/local/talktome/media; \
	done

run-android: install-android
	$(ANDROID_LAUNCER) kill
	$(ANDROID_LAUNCER) start

