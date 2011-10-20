RDF = install.rdf

CONTENT_SOURCES = $(shell ls content/*.js)
MEDIA_FILES = $(shell ls media/*.wav)
LOCALE_FILES = $(shell ls locale/*/*.properties)
DOC_FILES = $(shell find doc -name '*' -a \! -name '*~' -a -type f)

SOURCES = \
	bootstrap.js \
	$(RDF) \
	$(CONTENT_SOURCES) \
	$(MEDIA_FILES) \
	$(LOCALE_FILES) \
	$(DOC_FILES)

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
	$(FENNEC_RUNNER) -b $(FENNEC_PATH) \
		--addons=$< \
		--app-arg="$(FENNEC_EXTRA_OPTIONS)"

run-no-addon:  $(XPI_FILE)
	$(FENNEC_RUNNER) -b $(FENNEC_PATH) \
		--app-arg="$(FENNEC_EXTRA_OPTIONS)"

install-android: $(XPI_FILE)
	$(ANDROID_LAUNCER) command chmod 755 /data
	$(ANDROID_LAUNCER) mkdirs /data/local/talktome
	$(ADB) push $< /data/local/talktome
	$(ANDROID_LAUNCER) command cd /data/local/talktome\; unzip \\-o $<
	$(ANDROID_LAUNCER) command cd /data/local/talktome\; rm $<

run-android: install-android
	$(ANDROID_LAUNCER) kill
	$(ANDROID_LAUNCER) start

