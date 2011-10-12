#!/usr/bin/env python

import mozrunner

class FennecProfile(mozrunner.FirefoxProfile):
    def __init__(self, binary=None, profile=None, addons=None, preferences=None):
        prefs = {'browser.firstrun.show.uidiscovery' : False,
                 'browser.dom.window.dump.enabled' : True}
        prefs.update(preferences or {})
        super(FennecProfile, self).__init__(binary, profile, addons, prefs)

class FennecRunner(mozrunner.FirefoxRunner):
    app_name = 'Firefox'
    profile_class = FennecProfile

    @property
    def names(self):
        return ['firefox', 'fennec']

class FennecCLI(mozrunner.CLI):
    runner_class = FennecRunner
    profile_class = FennecProfile

    def __init__(self):
        self.parser_options = {
            ("--app-arg",): dict(
                dest='appArgs', action='append', default=[],
                help='provides an argument to the test application'),
            ("--tablet", ): dict(dest="tabletUI", action="store_true",
                                 default=False, help="Use tablet UI")}
        self.parser_options.update(mozrunner.CLI.parser_options)
        super(FennecCLI, self).__init__()
    
    def create_runner(self):
        runner = super(FennecCLI, self).create_runner()
        runner.cmdargs.extend(self.options.appArgs)
        return runner

    def get_profile(self, binary=None, profile=None, addons=None,
                    preferences=None):
        if self.options.tabletUI:
            prefs = {'browser.ui.layout.tablet' : -1}
        else:
            prefs = {'browser.ui.layout.tablet' : 0}
        prefs.update(preferences or {})
        return super(FennecCLI, self).get_profile(binary, profile, addons, prefs)

if __name__ == "__main__":
    FennecCLI().run()
